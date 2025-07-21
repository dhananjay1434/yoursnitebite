/*
  # Create Products Schema

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `icon` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (decimal)
      - `image_url` (text)
      - `category_id` (uuid, references categories)
      - `is_featured` (boolean)
      - `stock_quantity` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Anyone can read categories and products
      - Only authenticated admins can modify data
*/

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal NOT NULL,
  image_url text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  is_featured boolean DEFAULT false,
  stock_quantity integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

-- Create policies for products
CREATE POLICY "Anyone can read products"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- Create indexes
CREATE INDEX products_category_id_idx ON products(category_id);
CREATE INDEX products_is_featured_idx ON products(is_featured);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert initial categories
INSERT INTO categories (name, icon) VALUES
  ('chips', '🍟'),
  ('drinks', '🥤'),
  ('coffee', '☕'),
  ('chocolate', '🍫'),
  ('biscuits', '🍪');

-- Insert sample products
INSERT INTO products (name, description, price, image_url, category_id, is_featured, stock_quantity)
SELECT
  'Doritos Nacho Cheese',
  'Bold nacho cheese flavored tortilla chips for your late night snacking',
  2.99,
  'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?q=80&w=1000',
  c.id,
  true,
  100
FROM categories c
WHERE c.name = 'chips'
UNION ALL
SELECT
  'Monster Energy Drink',
  'Energy drink to keep you going through those late nights',
  3.49,
  'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?q=80&w=1000',
  c.id,
  true,
  150
FROM categories c
WHERE c.name = 'drinks'
UNION ALL
SELECT
  'Starbucks Cold Brew',
  'Smooth, delicious cold brew coffee to satisfy your caffeine cravings',
  4.99,
  'https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?q=80&w=1000',
  c.id,
  true,
  80
FROM categories c
WHERE c.name = 'coffee';