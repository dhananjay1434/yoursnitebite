-- Fix for the atomic stock management function
-- Run this in Supabase SQL Editor to resolve the function conflict

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS process_order_with_atomic_stock CASCADE;
DROP FUNCTION IF EXISTS process_order_with_atomic_stock(uuid, jsonb, jsonb) CASCADE;

-- Create the correct atomic stock validation and update function
CREATE OR REPLACE FUNCTION process_order_with_atomic_stock(
  p_user_id uuid,
  p_order_data jsonb,
  p_items jsonb
)
RETURNS TABLE (
  success boolean,
  order_id uuid,
  message text,
  failed_items jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_item record;
  v_current_stock integer;
  v_failed_items jsonb := '[]'::jsonb;
  v_product_exists boolean;
BEGIN
  -- Start transaction
  BEGIN
    -- Validate all items have sufficient stock ATOMICALLY
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      -- Check if product exists and get current stock with row lock
      SELECT stock_quantity, true INTO v_current_stock, v_product_exists
      FROM products 
      WHERE id = (v_item.value->>'product_id')::uuid
      FOR UPDATE; -- This locks the row to prevent concurrent modifications
      
      IF NOT v_product_exists THEN
        v_failed_items := v_failed_items || jsonb_build_object(
          'product_id', v_item.value->>'product_id',
          'name', v_item.value->>'name',
          'reason', 'Product not found'
        );
        CONTINUE;
      END IF;
      
      -- Check if sufficient stock is available
      IF v_current_stock < (v_item.value->>'quantity')::integer THEN
        v_failed_items := v_failed_items || jsonb_build_object(
          'product_id', v_item.value->>'product_id',
          'name', v_item.value->>'name',
          'reason', 'Insufficient stock',
          'available', v_current_stock,
          'requested', (v_item.value->>'quantity')::integer
        );
        CONTINUE;
      END IF;
    END LOOP;
    
    -- If any items failed validation, return failure
    IF jsonb_array_length(v_failed_items) > 0 THEN
      RETURN QUERY SELECT 
        false,
        null::uuid,
        'Some items are out of stock',
        v_failed_items;
      RETURN;
    END IF;
    
    -- All items validated, create the order
    INSERT INTO orders (
      user_id,
      amount,
      items,
      phone_number,
      hostel_number,
      room_number,
      email,
      customer_name,
      payment_method,
      payment_status,
      coupon_discount
    ) VALUES (
      p_user_id,
      (p_order_data->>'amount')::decimal,
      p_items,
      p_order_data->>'phone_number',
      p_order_data->>'hostel_number',
      p_order_data->>'room_number',
      p_order_data->>'email',
      p_order_data->>'customer_name',
      p_order_data->>'payment_method',
      p_order_data->>'payment_status',
      COALESCE((p_order_data->>'coupon_discount')::decimal, 0)
    ) RETURNING id INTO v_order_id;
    
    -- Update stock quantities atomically
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      UPDATE products 
      SET stock_quantity = stock_quantity - (v_item.value->>'quantity')::integer,
          updated_at = now()
      WHERE id = (v_item.value->>'product_id')::uuid;
    END LOOP;
    
    -- Return success
    RETURN QUERY SELECT 
      true,
      v_order_id,
      'Order processed successfully',
      '[]'::jsonb;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback happens automatically
    RETURN QUERY SELECT 
      false,
      null::uuid,
      'Order processing failed: ' || SQLERRM,
      '[]'::jsonb;
  END;
END;
$$;

-- Add policy to allow authenticated users to update product stock
-- This is needed as a backup in case the atomic function doesn't work
DO $$
BEGIN
  -- Try to create the policy, ignore if it already exists
  BEGIN
    CREATE POLICY "Authenticated users can update product stock"
      ON products
      FOR UPDATE
      TO authenticated
      USING (true)  -- Allow reading any product for update
      WITH CHECK (stock_quantity >= 0);  -- Only allow updates that don't make stock negative
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists, that's fine
    NULL;
  END;
END $$;

-- Add stock constraint (only if it doesn't exist)
DO $$
BEGIN
  BEGIN
    ALTER TABLE products 
    ADD CONSTRAINT products_stock_non_negative 
    CHECK (stock_quantity >= 0);
  EXCEPTION WHEN duplicate_object THEN
    -- Constraint already exists, that's fine
    NULL;
  END;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION process_order_with_atomic_stock TO authenticated;
GRANT UPDATE ON products TO authenticated;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_id_stock ON products(id, stock_quantity);

-- Success message
SELECT 'Atomic stock management function created successfully!' as status;
