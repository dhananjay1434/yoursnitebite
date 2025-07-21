/*
  # Atomic Stock Management - Critical Security Fix
  
  This migration fixes race conditions in stock management by implementing:
  1. Atomic stock validation and updates
  2. Proper constraints to prevent overselling
  3. Transactional order processing
  4. Stock reservation system
  
  CRITICAL: This fixes the overselling vulnerability identified in the security audit.
*/

-- Drop existing problematic triggers
DROP TRIGGER IF EXISTS update_stock_after_order ON orders;
DROP TRIGGER IF EXISTS update_vibe_box_stock_after_order ON orders;

-- Create atomic stock validation and update function
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
      
      -- Check stock availability
      IF v_current_stock < (v_item.value->>'quantity')::integer THEN
        v_failed_items := v_failed_items || jsonb_build_object(
          'product_id', v_item.value->>'product_id',
          'name', v_item.value->>'name',
          'requested', (v_item.value->>'quantity')::integer,
          'available', v_current_stock,
          'reason', CASE 
            WHEN v_current_stock = 0 THEN 'Out of stock'
            ELSE 'Insufficient stock - only ' || v_current_stock || ' available'
          END
        );
      END IF;
    END LOOP;
    
    -- If any items failed validation, rollback and return failure
    IF jsonb_array_length(v_failed_items) > 0 THEN
      RETURN QUERY SELECT 
        false,
        null::uuid,
        'Stock validation failed for ' || jsonb_array_length(v_failed_items) || ' items',
        v_failed_items;
      RETURN;
    END IF;
    
    -- All items validated, now atomically update stock and create order
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      -- Atomically decrement stock
      UPDATE products
      SET 
        stock_quantity = stock_quantity - (v_item.value->>'quantity')::integer,
        updated_at = now()
      WHERE id = (v_item.value->>'product_id')::uuid
      AND stock_quantity >= (v_item.value->>'quantity')::integer; -- Double-check constraint
      
      -- Verify the update was successful
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock update failed for product %', v_item.value->>'product_id';
      END IF;
    END LOOP;
    
    -- Create the order
    INSERT INTO orders (user_id, amount, items, phone_number, hostel_number, room_number, email, customer_name, payment_method, payment_status, coupon_discount)
    VALUES (
      p_user_id,
      (p_order_data->>'amount')::decimal,
      p_items,
      p_order_data->>'phone_number',
      p_order_data->>'hostel_number',
      p_order_data->>'room_number',
      p_order_data->>'email',
      p_order_data->>'customer_name',
      p_order_data->>'payment_method',
      COALESCE(p_order_data->>'payment_status', 'pending'),
      COALESCE((p_order_data->>'coupon_discount')::decimal, 0)
    )
    RETURNING id INTO v_order_id;
    
    -- Success
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

-- Add stock constraints to prevent negative stock
ALTER TABLE products 
ADD CONSTRAINT products_stock_non_negative 
CHECK (stock_quantity >= 0);

-- Add similar constraint for vibe_boxes if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vibe_boxes') THEN
    ALTER TABLE vibe_boxes 
    ADD CONSTRAINT vibe_boxes_stock_non_negative 
    CHECK (stock_quantity >= 0);
  END IF;
END $$;

-- Create function for stock reservation (optional advanced feature)
CREATE OR REPLACE FUNCTION reserve_stock(
  p_items jsonb,
  p_reservation_minutes integer DEFAULT 10
)
RETURNS TABLE (
  success boolean,
  reservation_id uuid,
  expires_at timestamptz,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_id uuid := gen_random_uuid();
  v_expires_at timestamptz := now() + (p_reservation_minutes || ' minutes')::interval;
  v_item record;
BEGIN
  -- Create reservations table if it doesn't exist
  CREATE TABLE IF NOT EXISTS stock_reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES products(id),
    quantity integer NOT NULL,
    reserved_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'expired'))
  );
  
  -- Reserve stock for each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO stock_reservations (id, product_id, quantity, expires_at)
    VALUES (
      v_reservation_id,
      (v_item.value->>'product_id')::uuid,
      (v_item.value->>'quantity')::integer,
      v_expires_at
    );
  END LOOP;
  
  RETURN QUERY SELECT 
    true,
    v_reservation_id,
    v_expires_at,
    'Stock reserved successfully';
END;
$$;

-- Create index for better performance on stock queries
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION process_order_with_atomic_stock TO authenticated, anon;
GRANT EXECUTE ON FUNCTION reserve_stock TO authenticated, anon;
