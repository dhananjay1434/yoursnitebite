/*
  # Add Detailed Products for Each Category
  
  1. Changes
    - Add more products for each category
    - Include detailed descriptions and pricing
    - Set featured status for select items
    
  2. Data
    - Chips category: Various chip brands and flavors
    - Drinks category: Soft drinks, energy drinks, etc.
    - Coffee category: Hot and cold coffee options
    - Chocolate category: Different chocolate bars and snacks
    - Biscuits category: Various cookie and biscuit options
*/

-- First, clear existing products to avoid duplicates
TRUNCATE TABLE products CASCADE;

-- Insert chips products
INSERT INTO products (name, description, price, image_url, category_id, is_featured, stock_quantity)
SELECT
  name,
  description,
  price,
  image_url,
  c.id,
  is_featured,
  stock_quantity
FROM (
  VALUES
    ('Lay''s Classic', 'Crispy potato chips with just the right amount of salt', 2.49, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b', true, 150),
    ('Doritos Nacho Cheese', 'Bold nacho cheese flavored tortilla chips', 2.99, 'https://images.unsplash.com/photo-1613919113640-25732ec5e61f', true, 120),
    ('Pringles Original', 'Original flavor stackable potato crisps', 3.29, 'https://images.unsplash.com/photo-1600952841320-db92ec4047ca', false, 100),
    ('Cheetos Crunchy', 'Crunchy cheese-flavored snacks', 2.99, 'https://images.unsplash.com/photo-1527603361787-409935c9aaa5', false, 80),
    ('Ruffles Sour Cream', 'Ridged potato chips with sour cream and onion flavor', 2.99, 'https://images.unsplash.com/photo-1599629954294-16b94c2b3936', false, 90)
) AS p(name, description, price, image_url, is_featured, stock_quantity)
CROSS JOIN categories c
WHERE c.name = 'chips';

-- Insert drinks products
INSERT INTO products (name, description, price, image_url, category_id, is_featured, stock_quantity)
SELECT
  name,
  description,
  price,
  image_url,
  c.id,
  is_featured,
  stock_quantity
FROM (
  VALUES
    ('Monster Energy', 'Energy drink to keep you going through late nights', 3.49, 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e', true, 200),
    ('Coca-Cola Zero', 'Zero sugar cola with classic taste', 1.99, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97', true, 250),
    ('Red Bull', 'Energy drink that gives you wings', 3.99, 'https://images.unsplash.com/photo-1613577041053-f9f83b2d4165', false, 180),
    ('Mountain Dew', 'Citrus-flavored carbonated soft drink', 1.99, 'https://images.unsplash.com/photo-1624797432677-6f803a98acb3', false, 150),
    ('Sprite', 'Crisp, refreshing lemon-lime soda', 1.99, 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3', false, 160)
) AS p(name, description, price, image_url, is_featured, stock_quantity)
CROSS JOIN categories c
WHERE c.name = 'drinks';

-- Insert coffee products
INSERT INTO products (name, description, price, image_url, category_id, is_featured, stock_quantity)
SELECT
  name,
  description,
  price,
  image_url,
  c.id,
  is_featured,
  stock_quantity
FROM (
  VALUES
    ('Cold Brew Coffee', 'Smooth, delicious cold brew coffee', 4.99, 'https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8', true, 100),
    ('Espresso Shot', 'Quick shot of espresso for immediate boost', 2.99, 'https://images.unsplash.com/photo-1520031607889-97ba0c7190ff', true, 150),
    ('Caramel Macchiato', 'Espresso with steamed milk and caramel', 5.49, 'https://images.unsplash.com/photo-1581996323407-47a7d7c19505', false, 80),
    ('Americano', 'Espresso diluted with hot water', 3.99, 'https://images.unsplash.com/photo-1551030173-122aabc4489c', false, 120),
    ('Latte', 'Espresso with steamed milk and light foam', 4.99, 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f', false, 90)
) AS p(name, description, price, image_url, is_featured, stock_quantity)
CROSS JOIN categories c
WHERE c.name = 'coffee';

-- Insert chocolate products
INSERT INTO products (name, description, price, image_url, category_id, is_featured, stock_quantity)
SELECT
  name,
  description,
  price,
  image_url,
  c.id,
  is_featured,
  stock_quantity
FROM (
  VALUES
    ('Lindt Dark Chocolate', 'Premium dark chocolate with rich flavor', 3.99, 'https://images.unsplash.com/photo-1549007994-cb92caebd54b', true, 100),
    ('Ferrero Rocher', 'Hazelnut chocolate with wafer shell', 5.99, 'https://images.unsplash.com/photo-1548907040-4baa42d10919', true, 80),
    ('KitKat', 'Crispy wafer fingers covered in milk chocolate', 1.79, 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f', false, 150),
    ('Toblerone', 'Swiss chocolate with honey and almond nougat', 4.49, 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e', false, 90),
    ('Snickers', 'Peanuts, caramel and nougat covered in milk chocolate', 1.99, 'https://images.unsplash.com/photo-1527904324834-3bda86da6771', false, 120)
) AS p(name, description, price, image_url, is_featured, stock_quantity)
CROSS JOIN categories c
WHERE c.name = 'chocolate';

-- Insert biscuits products
INSERT INTO products (name, description, price, image_url, category_id, is_featured, stock_quantity)
SELECT
  name,
  description,
  price,
  image_url,
  c.id,
  is_featured,
  stock_quantity
FROM (
  VALUES
    ('Oreo Cookies', 'Classic chocolate sandwich cookies', 2.99, 'https://images.unsplash.com/photo-1590080875580-b6ba70050d59', true, 200),
    ('Digestive Biscuits', 'Whole wheat biscuits perfect with tea', 3.49, 'https://images.unsplash.com/photo-1597733153203-a54d0fbc47de', true, 150),
    ('Chips Ahoy', 'Chocolate chip cookies with real chips', 3.79, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e', false, 180),
    ('Ritz Crackers', 'Buttery round crackers', 3.29, 'https://images.unsplash.com/photo-1590005354167-6da97870c757', false, 160),
    ('Milano Cookies', 'Dark chocolate sandwiched between cookies', 4.49, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35', false, 120)
) AS p(name, description, price, image_url, is_featured, stock_quantity)
CROSS JOIN categories c
WHERE c.name = 'biscuits';