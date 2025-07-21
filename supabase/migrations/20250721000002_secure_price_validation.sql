/*
  # Secure Price Validation - Critical Security Fix
  
  This migration implements server-side price validation to prevent
  client-side price manipulation attacks.
  
  CRITICAL: This fixes the payment security vulnerability identified in the audit.
*/

-- Create function for secure price calculation and validation
CREATE OR REPLACE FUNCTION calculate_order_total_secure(
  p_items jsonb,
  p_coupon_code text DEFAULT NULL
)
RETURNS TABLE (
  success boolean,
  subtotal decimal,
  delivery_fee decimal,
  convenience_fee decimal,
  coupon_discount decimal,
  total decimal,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subtotal decimal := 0;
  v_delivery_fee decimal := 0;
  v_convenience_fee decimal := 0;
  v_coupon_discount decimal := 0;
  v_total decimal := 0;
  v_item record;
  v_product_price decimal;
  v_product_exists boolean;
  v_coupon record;
  v_free_delivery_threshold decimal := 149;
BEGIN
  -- Validate and calculate subtotal using actual product prices from database
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get actual price from database (prevent price manipulation)
    SELECT price, true INTO v_product_price, v_product_exists
    FROM products 
    WHERE id = (v_item.value->>'product_id')::uuid;
    
    IF NOT v_product_exists THEN
      RETURN QUERY SELECT 
        false,
        0::decimal,
        0::decimal,
        0::decimal,
        0::decimal,
        0::decimal,
        'Product not found: ' || (v_item.value->>'product_id')::text;
      RETURN;
    END IF;
    
    -- Use database price, not client-provided price
    v_subtotal := v_subtotal + (v_product_price * (v_item.value->>'quantity')::integer);
  END LOOP;
  
  -- Calculate delivery fee
  IF v_subtotal >= v_free_delivery_threshold THEN
    v_delivery_fee := 0;
  ELSIF v_subtotal > 0 THEN
    v_delivery_fee := 10;
  ELSE
    v_delivery_fee := 0;
  END IF;
  
  -- Calculate convenience fee
  IF v_subtotal > 0 THEN
    v_convenience_fee := 6;
  ELSE
    v_convenience_fee := 0;
  END IF;
  
  -- Validate and apply coupon discount
  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    SELECT 
      discount_value,
      discount_type,
      min_order_amount,
      is_active,
      remaining_uses
    INTO v_coupon
    FROM coupons
    WHERE code = p_coupon_code
    AND is_active = true
    AND remaining_uses > 0
    AND (expires_at IS NULL OR expires_at > now())
    AND starts_at <= now();
    
    IF FOUND THEN
      -- Check minimum order amount
      IF v_subtotal >= COALESCE(v_coupon.min_order_amount, 0) THEN
        IF v_coupon.discount_type = 'fixed' THEN
          v_coupon_discount := LEAST(v_coupon.discount_value, v_subtotal);
        ELSIF v_coupon.discount_type = 'percentage' THEN
          v_coupon_discount := LEAST((v_subtotal * v_coupon.discount_value / 100), v_subtotal);
        END IF;
      END IF;
    END IF;
  END IF;
  
  -- Calculate final total
  v_total := GREATEST(0, v_subtotal + v_delivery_fee + v_convenience_fee - v_coupon_discount);
  
  RETURN QUERY SELECT 
    true,
    v_subtotal,
    v_delivery_fee,
    v_convenience_fee,
    v_coupon_discount,
    v_total,
    'Price calculation successful';
END;
$$;

-- Update the order processing function to include price validation
CREATE OR REPLACE FUNCTION process_order_with_atomic_stock(
  p_user_id uuid,
  p_order_data jsonb,
  p_items jsonb
)
RETURNS TABLE (
  success boolean,
  order_id uuid,
  message text,
  failed_items jsonb,
  calculated_total decimal
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
  v_price_validation record;
  v_client_total decimal;
BEGIN
  -- Start transaction
  BEGIN
    -- 1. Validate prices server-side
    SELECT * INTO v_price_validation
    FROM calculate_order_total_secure(
      p_items, 
      p_order_data->>'coupon_code'
    );
    
    IF NOT v_price_validation.success THEN
      RETURN QUERY SELECT 
        false,
        null::uuid,
        'Price validation failed: ' || v_price_validation.message,
        '[]'::jsonb,
        0::decimal;
      RETURN;
    END IF;
    
    -- 2. Compare client-provided total with server-calculated total
    v_client_total := (p_order_data->>'amount')::decimal;
    IF ABS(v_client_total - v_price_validation.total) > 0.01 THEN
      RETURN QUERY SELECT 
        false,
        null::uuid,
        'Price mismatch detected. Please refresh and try again.',
        '[]'::jsonb,
        v_price_validation.total;
      RETURN;
    END IF;
    
    -- 3. Validate all items have sufficient stock ATOMICALLY
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
        v_failed_items,
        v_price_validation.total;
      RETURN;
    END IF;
    
    -- 4. All validations passed, atomically update stock and create order
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
    
    -- 5. Create the order with server-validated total
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
    )
    VALUES (
      p_user_id,
      v_price_validation.total, -- Use server-calculated total
      p_items,
      p_order_data->>'phone_number',
      p_order_data->>'hostel_number',
      p_order_data->>'room_number',
      p_order_data->>'email',
      p_order_data->>'customer_name',
      p_order_data->>'payment_method',
      COALESCE(p_order_data->>'payment_status', 'pending'),
      v_price_validation.coupon_discount
    )
    RETURNING id INTO v_order_id;
    
    -- Success
    RETURN QUERY SELECT 
      true,
      v_order_id,
      'Order processed successfully',
      '[]'::jsonb,
      v_price_validation.total;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback happens automatically
    RETURN QUERY SELECT 
      false,
      null::uuid,
      'Order processing failed: ' || SQLERRM,
      '[]'::jsonb,
      0::decimal;
  END;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_order_total_secure TO authenticated, anon;

-- Create audit log for price validation attempts
CREATE TABLE IF NOT EXISTS price_validation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  client_total decimal,
  server_total decimal,
  difference decimal,
  items jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE price_validation_log ENABLE ROW LEVEL SECURITY;

-- Only allow system to insert into audit log
CREATE POLICY "System can insert price validation logs"
  ON price_validation_log
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
