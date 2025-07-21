/*
  # Update Product Prices from USD to INR
  
  1. Changes
    - Convert all product prices from USD to INR
    - Multiply existing prices by 80 (approximate USD to INR conversion)
    - Round to 2 decimal places for consistency
    
  2. Notes
    - This is a one-time conversion
    - All future prices should be entered in INR
*/

-- Update all product prices by multiplying by 80 (USD to INR conversion)
UPDATE products
SET price = ROUND((price * 80)::numeric, 2);

-- Add a comment to the products table to indicate prices are in INR
COMMENT ON COLUMN products.price IS 'Product price in Indian Rupees (INR)';