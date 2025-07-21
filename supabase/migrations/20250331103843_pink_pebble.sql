/*
  # Add Coupon Discount Column to Orders Table
  
  1. Changes
    - Add coupon_discount column to orders table
    - Set default value to 0
    - Add NOT NULL constraint
    
  2. Notes
    - Column stores the discount amount applied by coupons
    - Amount is in Indian Rupees (INR)
*/

-- Add coupon_discount column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS coupon_discount decimal NOT NULL DEFAULT 0;

-- Add comment to clarify the column's purpose
COMMENT ON COLUMN orders.coupon_discount IS 'Discount amount applied from coupons in Indian Rupees (INR)';