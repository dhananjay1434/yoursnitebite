/*
  # Add Original Price to Products
  
  1. Changes
    - Add original_price column to products table
    - Add CHECK constraint to ensure original_price >= price
    - Add function to calculate discount percentage
    
  2. Notes
    - Prices are in Indian Rupees (INR)
    - Original price must be greater than or equal to current price
*/

-- Add original_price column
ALTER TABLE products
ADD COLUMN original_price decimal;

-- Update existing products to set original_price same as price
UPDATE products
SET original_price = price
WHERE original_price IS NULL;

-- Add NOT NULL constraint after setting default values
ALTER TABLE products
ALTER COLUMN original_price SET NOT NULL;

-- Add CHECK constraint
ALTER TABLE products
ADD CONSTRAINT price_check 
CHECK (original_price >= price);

-- Create function to calculate discount percentage
CREATE OR REPLACE FUNCTION calculate_discount_percentage(original_price decimal, current_price decimal)
RETURNS integer AS $$
BEGIN
  IF original_price IS NULL OR current_price IS NULL OR original_price = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND(((original_price - current_price) / original_price * 100)::numeric);
END;
$$ LANGUAGE plpgsql;