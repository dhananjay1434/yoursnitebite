/*
  # Update Coupon Usage Handling
  
  1. Changes
    - Add CHECK constraint to remaining_uses column
    - Update trigger function to properly handle remaining_uses
    - Add better error handling for coupon usage
    
  2. Security
    - Ensure remaining_uses cannot go below 0
    - Maintain data integrity during updates
*/

-- Add CHECK constraint to remaining_uses
ALTER TABLE coupons 
  DROP CONSTRAINT IF EXISTS remaining_uses_check,
  ADD CONSTRAINT remaining_uses_check 
    CHECK (remaining_uses >= 0);

-- Update the coupon usage trigger function with better handling
CREATE OR REPLACE FUNCTION update_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease remaining uses with check
  UPDATE coupons
  SET 
    remaining_uses = GREATEST(remaining_uses - 1, 0),
    is_active = CASE 
      WHEN remaining_uses <= 1 THEN false  -- Will become 0 after decrease
      ELSE is_active 
    END,
    updated_at = now()
  WHERE id = NEW.coupon_id
  AND remaining_uses > 0;  -- Only update if uses remain
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No remaining uses for coupon';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;