/*
  # Fix Coupon Usage RLS Policies
  
  1. Changes
    - Add proper RLS policies for coupon_usage table
    - Allow authenticated users to insert their own coupon usage records
    - Ensure users can only create records for their own orders
    - Add policy for reading own coupon usage records
    
  2. Security
    - Maintain data integrity
    - Prevent unauthorized access
    - Ensure proper validation of relationships
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own coupon usage" ON coupon_usage;
DROP POLICY IF EXISTS "Users can insert coupon usage records" ON coupon_usage;

-- Create policy for reading own coupon usage records
CREATE POLICY "Users can view their own coupon usage"
  ON coupon_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for inserting coupon usage records
CREATE POLICY "Users can insert coupon usage records"
  ON coupon_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User can only create records for themselves
    auth.uid() = user_id
    -- Verify the order exists and belongs to the user
    AND EXISTS (
      SELECT 1 FROM orders 
      WHERE id = order_id 
      AND user_id = auth.uid()
    )
    -- Verify the coupon exists and is active
    AND EXISTS (
      SELECT 1 FROM coupons 
      WHERE id = coupon_id 
      AND is_active = true 
      AND remaining_uses > 0
      AND (expires_at IS NULL OR expires_at > now())
    )
  );