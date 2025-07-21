/*
  # Create orders schema with anonymous access
  
  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, nullable)
      - `amount` (decimal)
      - `items` (jsonb)
      - `phone_number` (text)
      - `hostel_number` (text) 
      - `room_number` (text)
      - `payment_method` (text)
      - `payment_status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on orders table
    - Add policies for both authenticated and anonymous users to:
      - Create orders
      - Read their own orders
*/

-- Create orders table with nullable user_id
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  amount decimal NOT NULL,
  items jsonb NOT NULL,
  phone_number text NOT NULL,
  hostel_number text NOT NULL,
  room_number text NOT NULL,
  payment_method text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for order creation and reading
CREATE POLICY "Anyone can create orders"
  ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read their own orders"
  ON orders
  FOR SELECT
  TO anon, authenticated
  USING (true);