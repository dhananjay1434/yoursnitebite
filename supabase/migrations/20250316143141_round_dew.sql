/*
  # Update Orders Schema to Include Email and Name
  
  1. Changes
    - Add email column to orders table
    - Add customer_name column to orders table
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS customer_name text;