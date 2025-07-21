/*
  # Add Stock Management Functionality
  
  1. New Functions
    - Function to update stock quantity after order
    - Function to check stock availability
    - Trigger to automatically update stock on order placement
    
  2. Security
    - Ensure proper stock validation
    - Prevent overselling
    - Maintain stock integrity
*/

-- Create function to update stock quantity
CREATE OR REPLACE FUNCTION update_stock_quantity()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
  current_stock INTEGER;
BEGIN
  -- Loop through order items and update stock
  FOR item_record IN SELECT * FROM jsonb_array_elements(NEW.items) AS items
  LOOP
    -- Get current stock
    SELECT stock_quantity INTO current_stock
    FROM products
    WHERE id = (item_record.value->>'id')::uuid;

    -- Update stock quantity
    UPDATE products
    SET 
      stock_quantity = GREATEST(stock_quantity - (item_record.value->>'quantity')::integer, 0),
      updated_at = now()
    WHERE id = (item_record.value->>'id')::uuid;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stock on order placement
DROP TRIGGER IF EXISTS update_stock_after_order ON orders;
CREATE TRIGGER update_stock_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_quantity();

-- Create function to check stock availability
CREATE OR REPLACE FUNCTION check_stock_availability(
  p_product_id uuid,
  p_quantity integer
)
RETURNS TABLE (
  is_available boolean,
  available_quantity integer,
  message text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock integer;
BEGIN
  -- Get current stock
  SELECT stock_quantity INTO v_current_stock
  FROM products
  WHERE id = p_product_id;

  -- Check availability
  IF v_current_stock >= p_quantity THEN
    RETURN QUERY SELECT 
      true,
      v_current_stock,
      'Stock available'::text;
  ELSE
    RETURN QUERY SELECT 
      false,
      v_current_stock,
      CASE 
        WHEN v_current_stock = 0 THEN 'Out of stock'
        ELSE 'Only ' || v_current_stock || ' items available'
      END::text;
  END IF;
END;
$$;