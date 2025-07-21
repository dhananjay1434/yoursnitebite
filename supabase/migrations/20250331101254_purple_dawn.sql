/*
  # Create Coupon System Schema
  
  1. New Tables
    - `coupons`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `description` (text)
      - `discount_type` (text) - 'percentage' or 'fixed'
      - `discount_value` (decimal)
      - `max_uses` (integer)
      - `remaining_uses` (integer)
      - `min_order_amount` (decimal)
      - `starts_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `coupon_usage`
      - `id` (uuid, primary key)
      - `coupon_id` (uuid, references coupons)
      - `user_id` (uuid, references auth.users)
      - `order_id` (uuid, references orders)
      - `used_at` (timestamptz)
      
  2. Functions
    - Function to validate and apply coupon
    - Function to update remaining uses
    
  3. Security
    - Enable RLS
    - Add policies for reading and using coupons
*/

-- Create coupons table
CREATE TABLE coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value decimal NOT NULL CHECK (
    (discount_type = 'percentage' AND discount_value BETWEEN 0 AND 100) OR
    (discount_type = 'fixed' AND discount_value >= 0)
  ),
  max_uses integer NOT NULL CHECK (max_uses > 0),
  remaining_uses integer NOT NULL CHECK (remaining_uses >= 0),
  min_order_amount decimal NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT remaining_uses_check CHECK (remaining_uses <= max_uses)
);

-- Create coupon usage table
CREATE TABLE coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  used_at timestamptz DEFAULT now(),
  UNIQUE(coupon_id, user_id, order_id)
);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read active coupons"
  ON coupons
  FOR SELECT
  TO public
  USING (
    is_active = true AND
    remaining_uses > 0 AND
    (expires_at IS NULL OR expires_at > now()) AND
    starts_at <= now()
  );

CREATE POLICY "Users can view their own coupon usage"
  ON coupon_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to validate and apply coupon
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

-- Create function to update coupon usage
CREATE OR REPLACE FUNCTION update_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease remaining uses
  UPDATE coupons
  SET remaining_uses = remaining_uses - 1
  WHERE id = NEW.coupon_id;
  
  -- Deactivate coupon if no uses remaining
  UPDATE coupons
  SET is_active = false
  WHERE id = NEW.coupon_id
    AND remaining_uses = 0;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating coupon usage
CREATE TRIGGER update_coupon_usage_trigger
  AFTER INSERT ON coupon_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_coupon_usage();

-- Insert sample coupon
INSERT INTO coupons (
  code,
  description,
  discount_type,
  discount_value,
  max_uses,
  remaining_uses,
  min_order_amount,
  expires_at
) VALUES (
  'FIRSTBIT',
  'Student discount - 10% off on orders above ₹500',
  'percentage',
  10,
  1,
  1,
  0,
  now() + interval '30 days'
);