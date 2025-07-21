/*
  # Add Stock Management to Vibe Boxes
  
  1. Changes
    - Add stock_quantity column to vibe_boxes table
    - Add function to check vibe box stock availability
    - Update order processing to handle vibe box stock
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper stock validation
*/

-- Add stock_quantity to vibe_boxes
ALTER TABLE vibe_boxes
ADD COLUMN stock_quantity integer NOT NULL DEFAULT 0;

-- Create function to check vibe box stock
CREATE OR REPLACE FUNCTION check_vibe_box_stock(
  p_box_id uuid,
  p_quantity integer
)
RETURNS TABLE (
  is_available boolean,
  message text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock integer;
BEGIN
  -- Get current stock
  SELECT stock_quantity INTO v_current_stock
  FROM vibe_boxes
  WHERE id = p_box_id;

  IF v_current_stock >= p_quantity THEN
    RETURN QUERY SELECT true, 'Stock available'::text;
  ELSE
    RETURN QUERY SELECT false, 
      CASE 
        WHEN v_current_stock = 0 THEN 'Box is out of stock'
        ELSE 'Only ' || v_current_stock || ' boxes available'
      END::text;
  END IF;
END;
$$;

-- Update stock check function to handle both products and vibe boxes
CREATE OR REPLACE FUNCTION check_stock_availability(
  cart_items jsonb
)
RETURNS TABLE (
  success boolean,
  message text,
  out_of_stock_items jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_record record;
  current_stock integer;
  out_of_stock jsonb := '[]';
  item_name text;
BEGIN
  -- Check each item in cart
  FOR item_record IN SELECT * FROM jsonb_array_elements(cart_items)
  LOOP
    -- Check if it's a vibe box or regular product
    IF EXISTS (
      SELECT 1 FROM vibe_boxes 
      WHERE id = (item_record.value->>'product_id')::uuid
    ) THEN
      -- Check vibe box stock
      SELECT stock_quantity, name INTO current_stock, item_name
      FROM vibe_boxes
      WHERE id = (item_record.value->>'product_id')::uuid;
    ELSE
      -- Check product stock
      SELECT stock_quantity, name INTO current_stock, item_name
      FROM products
      WHERE id = (item_record.value->>'product_id')::uuid;
    END IF;

    IF current_stock < (item_record.value->>'quantity')::integer THEN
      out_of_stock := out_of_stock || jsonb_build_object(
        'id', item_record.value->>'product_id',
        'name', item_name,
        'available', current_stock
      );
    END IF;
  END LOOP;

  IF jsonb_array_length(out_of_stock) > 0 THEN
    RETURN QUERY SELECT 
      false,
      'Some items are out of stock'::text,
      out_of_stock;
  ELSE
    RETURN QUERY SELECT 
      true,
      'All items in stock'::text,
      '[]'::jsonb;
  END IF;
END;
$$;

-- Create trigger function to update vibe box stock
CREATE OR REPLACE FUNCTION update_vibe_box_stock()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
BEGIN
  FOR item_record IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    -- Update vibe box stock if applicable
    UPDATE vibe_boxes
    SET 
      stock_quantity = GREATEST(stock_quantity - (item_record.value->>'quantity')::integer, 0),
      updated_at = now()
    WHERE id = (item_record.value->>'id')::uuid;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vibe box stock updates
CREATE TRIGGER update_vibe_box_stock_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_vibe_box_stock();