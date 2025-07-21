/*
  # Update Coupon Validation Function
  
  1. Changes
    - Add check for number of coupon uses against max_uses
    - Improve validation logic and error messages
    - Add better type safety
    
  2. Security
    - Maintain existing security model
    - Ensure proper validation of coupon usage
*/

-- Update the coupon validation function with usage count check
CREATE OR REPLACE FUNCTION validate_and_apply_coupon(
  p_coupon_code text,
  p_user_id uuid,
  p_order_amount decimal
)
RETURNS TABLE (
  is_valid boolean,
  message text,
  discount_amount decimal
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon record;
  v_has_used boolean;
  v_usage_count integer;
BEGIN
  -- Check if coupon exists and is valid
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = p_coupon_code
    AND is_active = true
    AND remaining_uses > 0
    AND (expires_at IS NULL OR expires_at > now())
    AND starts_at <= now();

  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid or expired coupon', 0::decimal;
    RETURN;
  END IF;

  -- Check minimum order amount
  IF p_order_amount < v_coupon.min_order_amount THEN
    RETURN QUERY SELECT false, 
      format('Order amount must be at least ₹%s', v_coupon.min_order_amount::text),
      0::decimal;
    RETURN;
  END IF;

  -- Check if user has already used this coupon
  SELECT EXISTS (
    SELECT 1 FROM coupon_usage
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id
  ) INTO v_has_used;

  IF v_has_used THEN
    RETURN QUERY SELECT false, 'You have already used this coupon', 0::decimal;
    RETURN;
  END IF;

  -- Check total usage count against max_uses
  SELECT COUNT(*) INTO v_usage_count
  FROM coupon_usage
  WHERE coupon_id = v_coupon.id;

  IF v_usage_count >= v_coupon.max_uses THEN
    RETURN QUERY SELECT false, 'This coupon has reached its maximum usage limit', 0::decimal;
    RETURN;
  END IF;

  -- Calculate discount amount
  RETURN QUERY SELECT 
    true,
    'Coupon applied successfully',
    CASE 
      WHEN v_coupon.discount_type = 'percentage' 
      THEN ROUND((p_order_amount * v_coupon.discount_value / 100)::numeric, 2)
      ELSE v_coupon.discount_value
    END;
END;
$$;