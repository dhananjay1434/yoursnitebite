-- Create or replace the function to calculate order prices
CREATE OR REPLACE FUNCTION calculate_order_prices(
  p_items jsonb,
  p_coupon_discount decimal DEFAULT 0,
  p_csrf_token text DEFAULT NULL,
  p_is_development boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_subtotal decimal := 0;
  v_delivery_fee decimal := 0;
  v_convenience_fee decimal := 6; -- Fixed convenience fee
  v_free_delivery_threshold decimal := 149;
  v_total decimal := 0;
  v_remaining_for_free_delivery decimal := 0;
  v_applied_discount decimal := 0;
BEGIN
  -- Calculate subtotal from items
  SELECT COALESCE(SUM((value->>'price')::decimal * (value->>'quantity')::integer), 0)
  INTO v_subtotal
  FROM jsonb_array_elements(p_items);

  -- Calculate delivery fee
  IF v_subtotal >= v_free_delivery_threshold THEN
    v_delivery_fee := 0;
  ELSIF jsonb_array_length(p_items) > 0 THEN
    v_delivery_fee := 10;
  END IF;

  -- Calculate remaining amount for free delivery
  IF v_subtotal < v_free_delivery_threshold THEN
    v_remaining_for_free_delivery := v_free_delivery_threshold - v_subtotal;
  END IF;

  -- Apply coupon discount
  IF v_subtotal > 0 AND p_coupon_discount > 0 THEN
    v_applied_discount := LEAST(p_coupon_discount, v_subtotal);
  END IF;

  -- Calculate final total
  v_total := v_subtotal + v_delivery_fee + v_convenience_fee - v_applied_discount;

  -- Return the calculation result
  RETURN jsonb_build_object(
    'subtotal', v_subtotal,
    'deliveryFee', v_delivery_fee,
    'convenienceFee', v_convenience_fee,
    'appliedDiscount', v_applied_discount,
    'total', GREATEST(v_total, 0),
    'freeDeliveryThreshold', v_free_delivery_threshold,
    'remainingForFreeDelivery', v_remaining_for_free_delivery
  );
END;
$$;