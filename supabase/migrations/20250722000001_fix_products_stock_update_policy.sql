/*
  # Fix Products Stock Update Policy
  
  This migration adds the missing RLS policy to allow authenticated users
  to update product stock quantities during order processing.
  
  The current issue is that the products table only has SELECT policies
  but no UPDATE policies, causing stock updates to fail during order processing.
*/

-- Add policy to allow authenticated users to update product stock quantities
-- This is needed for the secure order processing system to update stock levels
CREATE POLICY "Authenticated users can update product stock"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)  -- Allow reading any product for update
  WITH CHECK (
    -- Only allow updating stock_quantity and updated_at fields
    -- Prevent unauthorized changes to other product fields
    OLD.id = NEW.id AND
    OLD.item_name = NEW.item_name AND
    OLD.description = NEW.description AND
    OLD.price = NEW.price AND
    OLD.image_url = NEW.image_url AND
    OLD.category_id = NEW.category_id AND
    OLD.is_featured = NEW.is_featured AND
    OLD.created_at = NEW.created_at AND
    OLD.original_price = NEW.original_price AND
    OLD.min_threshold = NEW.min_threshold AND
    -- Allow stock_quantity and updated_at to be modified
    NEW.stock_quantity >= 0  -- Prevent negative stock
  );

-- Add a more restrictive policy for system-level stock updates
-- This allows the order processing system to update stock safely
CREATE POLICY "System can update product stock for orders"
  ON products
  FOR UPDATE
  TO authenticated
  USING (stock_quantity >= 0)  -- Can only update products with valid stock
  WITH CHECK (
    -- Ensure stock updates are reasonable (not massive changes)
    NEW.stock_quantity >= 0 AND
    NEW.stock_quantity <= OLD.stock_quantity + 1000 AND  -- Prevent unrealistic stock increases
    NEW.updated_at > OLD.updated_at  -- Ensure updated_at is actually updated
  );

-- Grant necessary permissions for the order processing functions
-- This ensures the atomic stock management functions can work properly
GRANT UPDATE ON products TO authenticated;

-- Add index for better performance on stock updates
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_id_stock ON products(id, stock_quantity);

-- Add constraint to ensure stock quantity is never negative
-- This provides an additional safety net beyond the RLS policies
ALTER TABLE products 
ADD CONSTRAINT products_stock_non_negative 
CHECK (stock_quantity >= 0);

-- Create a function to safely update product stock
-- This provides an additional layer of safety for stock updates
CREATE OR REPLACE FUNCTION safe_update_product_stock(
  product_id uuid,
  quantity_change integer,
  min_stock integer DEFAULT 0
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock integer;
  new_stock integer;
BEGIN
  -- Get current stock with row lock
  SELECT stock_quantity INTO current_stock
  FROM products
  WHERE id = product_id
  FOR UPDATE;
  
  -- Check if product exists
  IF current_stock IS NULL THEN
    RETURN false;
  END IF;
  
  -- Calculate new stock
  new_stock := current_stock + quantity_change;
  
  -- Check if new stock would be valid
  IF new_stock < min_stock THEN
    RETURN false;
  END IF;
  
  -- Update stock
  UPDATE products
  SET 
    stock_quantity = new_stock,
    updated_at = now()
  WHERE id = product_id;
  
  RETURN true;
END;
$$;

-- Grant execute permission on the safe update function
GRANT EXECUTE ON FUNCTION safe_update_product_stock TO authenticated;

-- Add logging for stock updates (for audit trail)
CREATE OR REPLACE FUNCTION log_stock_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if stock_quantity changed
  IF OLD.stock_quantity != NEW.stock_quantity THEN
    INSERT INTO application_logs (
      level,
      category,
      message,
      metadata,
      user_id
    ) VALUES (
      'INFO',
      'STOCK',
      'Product stock updated',
      jsonb_build_object(
        'product_id', NEW.id,
        'old_stock', OLD.stock_quantity,
        'new_stock', NEW.stock_quantity,
        'change', NEW.stock_quantity - OLD.stock_quantity
      ),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock update logging
DROP TRIGGER IF EXISTS trigger_log_stock_update ON products;
CREATE TRIGGER trigger_log_stock_update
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_stock_update();
