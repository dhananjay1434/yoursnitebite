/*
  # Enable Real-time Stock Updates
  
  1. Changes
    - Enable real-time for products table
    - Add publication for stock changes
    - Add function to broadcast stock updates
    
  2. Security
    - Maintain existing RLS policies
    - Enable secure real-time updates
*/

-- Enable real-time for products table
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Create function to broadcast stock updates
CREATE OR REPLACE FUNCTION broadcast_stock_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only broadcast if stock quantity changed
  IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity THEN
    -- Construct the payload
    PERFORM pg_notify(
      'stock_updates',
      json_build_object(
        'id', NEW.id,
        'stock_quantity', NEW.stock_quantity,
        'updated_at', NEW.updated_at
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock updates
CREATE TRIGGER broadcast_stock_update_trigger
  AFTER UPDATE OF stock_quantity ON products
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_stock_update();