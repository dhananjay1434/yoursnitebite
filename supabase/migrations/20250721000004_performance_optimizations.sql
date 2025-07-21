/*
  # Database Performance Optimizations
  
  This migration adds critical indexes, optimizes queries, and implements
  performance improvements for production scalability.
*/

-- ✅ PERFORMANCE: Add critical indexes for frequently queried columns

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status ON orders(user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_amount ON orders(amount);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_category_featured ON products(category_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock_active ON products(stock_quantity) WHERE stock_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_description_search ON products USING gin(to_tsvector('english', description));

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);

-- Coupons table indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code_active ON coupons(code, is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_active_remaining ON coupons(is_active, remaining_uses) WHERE is_active = true;

-- Coupon usage indexes
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_coupon ON coupon_usage(user_id, coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order ON coupon_usage(order_id);

-- Vibe boxes indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vibe_boxes') THEN
    CREATE INDEX IF NOT EXISTS idx_vibe_boxes_stock ON vibe_boxes(stock_quantity) WHERE stock_quantity > 0;
    CREATE INDEX IF NOT EXISTS idx_vibe_boxes_price ON vibe_boxes(price);
  END IF;
END $$;

-- ✅ PERFORMANCE: Optimize frequently used queries with materialized views

-- Create materialized view for product catalog with category info
CREATE MATERIALIZED VIEW IF NOT EXISTS product_catalog AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.image_url,
  p.is_featured,
  p.stock_quantity,
  p.created_at,
  p.updated_at,
  c.name as category_name,
  c.icon as category_icon,
  c.id as category_id,
  CASE 
    WHEN p.stock_quantity > 0 THEN 'in_stock'
    WHEN p.stock_quantity = 0 THEN 'out_of_stock'
    ELSE 'discontinued'
  END as stock_status
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.stock_quantity >= 0;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_catalog_id ON product_catalog(id);
CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON product_catalog(category_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_product_catalog_stock_status ON product_catalog(stock_status);

-- Create function to refresh product catalog
CREATE OR REPLACE FUNCTION refresh_product_catalog()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_catalog;
END;
$$;

-- Create trigger to refresh materialized view when products change
CREATE OR REPLACE FUNCTION trigger_refresh_product_catalog()
RETURNS TRIGGER AS $$
BEGIN
  -- Use pg_notify to trigger async refresh
  PERFORM pg_notify('refresh_product_catalog', '');
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for product catalog refresh
DROP TRIGGER IF EXISTS trigger_products_refresh_catalog ON products;
CREATE TRIGGER trigger_products_refresh_catalog
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_product_catalog();

DROP TRIGGER IF EXISTS trigger_categories_refresh_catalog ON categories;
CREATE TRIGGER trigger_categories_refresh_catalog
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_product_catalog();

-- ✅ PERFORMANCE: Create optimized functions for common queries

-- Fast product search function
CREATE OR REPLACE FUNCTION search_products(
  search_term text DEFAULT NULL,
  category_filter uuid DEFAULT NULL,
  min_price decimal DEFAULT NULL,
  max_price decimal DEFAULT NULL,
  in_stock_only boolean DEFAULT true,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price decimal,
  image_url text,
  is_featured boolean,
  stock_quantity integer,
  category_name text,
  category_icon text,
  stock_status text
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.name,
    pc.description,
    pc.price,
    pc.image_url,
    pc.is_featured,
    pc.stock_quantity,
    pc.category_name,
    pc.category_icon,
    pc.stock_status
  FROM product_catalog pc
  WHERE 
    (search_term IS NULL OR 
     pc.name ILIKE '%' || search_term || '%' OR 
     pc.description ILIKE '%' || search_term || '%')
    AND (category_filter IS NULL OR pc.category_id = category_filter)
    AND (min_price IS NULL OR pc.price >= min_price)
    AND (max_price IS NULL OR pc.price <= max_price)
    AND (NOT in_stock_only OR pc.stock_status = 'in_stock')
  ORDER BY 
    pc.is_featured DESC,
    pc.name ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Fast user order history function
CREATE OR REPLACE FUNCTION get_user_orders(
  user_uuid uuid,
  limit_count integer DEFAULT 10,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  amount decimal,
  items jsonb,
  phone_number text,
  hostel_number text,
  room_number text,
  payment_method text,
  payment_status text,
  created_at timestamptz,
  item_count integer,
  total_quantity integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.amount,
    o.items,
    o.phone_number,
    o.hostel_number,
    o.room_number,
    o.payment_method,
    o.payment_status,
    o.created_at,
    jsonb_array_length(o.items) as item_count,
    (
      SELECT SUM((item->>'quantity')::integer)
      FROM jsonb_array_elements(o.items) as item
    )::integer as total_quantity
  FROM orders o
  WHERE o.user_id = user_uuid
  ORDER BY o.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- ✅ PERFORMANCE: Add table partitioning for large tables (orders)

-- Create partitioned orders table for better performance with large datasets
-- Note: This would require data migration in production
/*
-- Example of how to implement partitioning (commented out for safety)
CREATE TABLE orders_partitioned (
  LIKE orders INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE orders_2024_01 PARTITION OF orders_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE orders_2024_02 PARTITION OF orders_partitioned
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- Add more partitions as needed
*/

-- ✅ PERFORMANCE: Add database statistics and monitoring

-- Create table for query performance monitoring
CREATE TABLE IF NOT EXISTS query_performance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_name text NOT NULL,
  execution_time_ms integer NOT NULL,
  rows_affected integer,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on performance log
ALTER TABLE query_performance_log ENABLE ROW LEVEL SECURITY;

-- Create policy for performance log
CREATE POLICY "System can insert performance logs"
  ON query_performance_log
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Function to log query performance
CREATE OR REPLACE FUNCTION log_query_performance(
  p_query_name text,
  p_execution_time_ms integer,
  p_rows_affected integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO query_performance_log (
    query_name, 
    execution_time_ms, 
    rows_affected, 
    user_id
  )
  VALUES (
    p_query_name, 
    p_execution_time_ms, 
    p_rows_affected, 
    auth.uid()
  );
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the main query if logging fails
  NULL;
END;
$$;

-- ✅ PERFORMANCE: Optimize existing functions

-- Update the stock management function for better performance
CREATE OR REPLACE FUNCTION process_order_with_atomic_stock(
  p_user_id uuid,
  p_order_data jsonb,
  p_items jsonb
)
RETURNS TABLE (
  success boolean,
  order_id uuid,
  message text,
  failed_items jsonb,
  calculated_total decimal
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_time timestamptz := clock_timestamp();
  v_order_id uuid;
  v_item record;
  v_current_stock integer;
  v_failed_items jsonb := '[]'::jsonb;
  v_product_exists boolean;
  v_price_validation record;
  v_client_total decimal;
  v_execution_time integer;
BEGIN
  -- Start transaction with explicit isolation level
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  
  BEGIN
    -- 1. Validate prices server-side
    SELECT * INTO v_price_validation
    FROM calculate_order_total_secure(
      p_items, 
      p_order_data->>'coupon_code'
    );
    
    IF NOT v_price_validation.success THEN
      RETURN QUERY SELECT 
        false,
        null::uuid,
        'Price validation failed: ' || v_price_validation.message,
        '[]'::jsonb,
        0::decimal;
      RETURN;
    END IF;
    
    -- 2. Compare client-provided total with server-calculated total
    v_client_total := (p_order_data->>'amount')::decimal;
    IF ABS(v_client_total - v_price_validation.total) > 0.01 THEN
      RETURN QUERY SELECT 
        false,
        null::uuid,
        'Price mismatch detected. Please refresh and try again.',
        '[]'::jsonb,
        v_price_validation.total;
      RETURN;
    END IF;
    
    -- 3. Batch validate stock for all items (more efficient)
    WITH item_validation AS (
      SELECT 
        (item.value->>'product_id')::uuid as product_id,
        item.value->>'name' as item_name,
        (item.value->>'quantity')::integer as requested_quantity,
        p.stock_quantity as available_quantity,
        CASE 
          WHEN p.id IS NULL THEN 'Product not found'
          WHEN p.stock_quantity < (item.value->>'quantity')::integer THEN 
            CASE 
              WHEN p.stock_quantity = 0 THEN 'Out of stock'
              ELSE 'Insufficient stock - only ' || p.stock_quantity || ' available'
            END
          ELSE NULL
        END as error_reason
      FROM jsonb_array_elements(p_items) as item
      LEFT JOIN products p ON p.id = (item.value->>'product_id')::uuid
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'product_id', product_id,
        'name', item_name,
        'requested', requested_quantity,
        'available', available_quantity,
        'reason', error_reason
      )
    ) INTO v_failed_items
    FROM item_validation
    WHERE error_reason IS NOT NULL;
    
    -- If any items failed validation, rollback and return failure
    IF v_failed_items IS NOT NULL AND jsonb_array_length(v_failed_items) > 0 THEN
      RETURN QUERY SELECT 
        false,
        null::uuid,
        'Stock validation failed for ' || jsonb_array_length(v_failed_items) || ' items',
        v_failed_items,
        v_price_validation.total;
      RETURN;
    END IF;
    
    -- 4. Atomically update stock for all items
    UPDATE products
    SET 
      stock_quantity = stock_quantity - subquery.quantity_to_deduct,
      updated_at = now()
    FROM (
      SELECT 
        (item.value->>'product_id')::uuid as product_id,
        (item.value->>'quantity')::integer as quantity_to_deduct
      FROM jsonb_array_elements(p_items) as item
    ) as subquery
    WHERE products.id = subquery.product_id
    AND products.stock_quantity >= subquery.quantity_to_deduct;
    
    -- 5. Create the order with server-validated total
    INSERT INTO orders (
      user_id, 
      amount, 
      items, 
      phone_number, 
      hostel_number, 
      room_number, 
      email, 
      customer_name, 
      payment_method, 
      payment_status, 
      coupon_discount
    )
    VALUES (
      p_user_id,
      v_price_validation.total,
      p_items,
      p_order_data->>'phone_number',
      p_order_data->>'hostel_number',
      p_order_data->>'room_number',
      p_order_data->>'email',
      p_order_data->>'customer_name',
      p_order_data->>'payment_method',
      COALESCE(p_order_data->>'payment_status', 'pending'),
      v_price_validation.coupon_discount
    )
    RETURNING id INTO v_order_id;
    
    -- Log performance
    v_execution_time := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::integer;
    PERFORM log_query_performance('process_order_with_atomic_stock', v_execution_time, 1);
    
    -- Success
    RETURN QUERY SELECT 
      true,
      v_order_id,
      'Order processed successfully',
      '[]'::jsonb,
      v_price_validation.total;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log performance even on failure
    v_execution_time := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::integer;
    PERFORM log_query_performance('process_order_with_atomic_stock_failed', v_execution_time, 0);
    
    -- Rollback happens automatically
    RETURN QUERY SELECT 
      false,
      null::uuid,
      'Order processing failed: ' || SQLERRM,
      '[]'::jsonb,
      0::decimal;
  END;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_products TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_orders TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_product_catalog TO authenticated;
GRANT EXECUTE ON FUNCTION log_query_performance TO authenticated, anon;

-- ✅ LOGGING: Create application logging tables and functions

-- Application logs table
CREATE TABLE IF NOT EXISTS application_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  category text NOT NULL,
  message text NOT NULL,
  details jsonb,
  user_id uuid REFERENCES auth.users(id),
  session_id text,
  request_id text,
  user_agent text,
  ip_address inet,
  stack_trace text,
  created_at timestamptz DEFAULT now()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration integer NOT NULL, -- in milliseconds
  category text NOT NULL,
  details jsonb,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on logging tables
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for logging tables
CREATE POLICY "System can insert application logs"
  ON application_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "System can insert performance metrics"
  ON performance_metrics
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Admins can read logs (adjust condition based on your admin identification)
CREATE POLICY "Admins can read application logs"
  ON application_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND email LIKE '%@admin.%'
    )
  );

-- Function to log application events
CREATE OR REPLACE FUNCTION log_application_event(
  p_level text,
  p_category text,
  p_message text,
  p_details text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_request_id text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_stack_trace text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO application_logs (
    level,
    category,
    message,
    details,
    user_id,
    session_id,
    request_id,
    user_agent,
    stack_trace
  )
  VALUES (
    p_level,
    p_category,
    p_message,
    CASE WHEN p_details IS NOT NULL THEN p_details::jsonb ELSE NULL END,
    COALESCE(p_user_id, auth.uid()),
    p_session_id,
    p_request_id,
    p_user_agent,
    p_stack_trace
  );
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the main operation if logging fails
  NULL;
END;
$$;

-- Function to log performance metrics
CREATE OR REPLACE FUNCTION log_performance_metric(
  p_name text,
  p_duration integer,
  p_category text,
  p_details text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO performance_metrics (
    name,
    duration,
    category,
    details,
    user_id
  )
  VALUES (
    p_name,
    p_duration,
    p_category,
    CASE WHEN p_details IS NOT NULL THEN p_details::jsonb ELSE NULL END,
    auth.uid()
  );
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the main operation if logging fails
  NULL;
END;
$$;

-- Create indexes for logging tables
CREATE INDEX IF NOT EXISTS idx_application_logs_level_created ON application_logs(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_logs_category_created ON application_logs(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_logs_user_created ON application_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_created ON performance_metrics(name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_category_created ON performance_metrics(category, created_at DESC);

-- Grant permissions for logging functions
GRANT EXECUTE ON FUNCTION log_application_event TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_performance_metric TO authenticated, anon;

-- Initial refresh of materialized view
SELECT refresh_product_catalog();
