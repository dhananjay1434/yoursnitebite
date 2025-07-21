/*
  Test Script for Server-Side Price Validation
  
  This script tests the secure price calculation function to ensure
  it prevents client-side price manipulation attacks.
*/

-- Test 1: Basic price calculation
SELECT 'Test 1: Basic price calculation' as test_name;
SELECT * FROM calculate_order_total_secure(
  '[
    {"product_id": "123e4567-e89b-12d3-a456-426614174000", "quantity": 2},
    {"product_id": "123e4567-e89b-12d3-a456-426614174001", "quantity": 1}
  ]'::jsonb,
  NULL
);

-- Test 2: Price calculation with coupon
SELECT 'Test 2: Price calculation with valid coupon' as test_name;
SELECT * FROM calculate_order_total_secure(
  '[
    {"product_id": "123e4567-e89b-12d3-a456-426614174000", "quantity": 2}
  ]'::jsonb,
  'FIRSTBIT'
);

-- Test 3: Price calculation with invalid coupon
SELECT 'Test 3: Price calculation with invalid coupon' as test_name;
SELECT * FROM calculate_order_total_secure(
  '[
    {"product_id": "123e4567-e89b-12d3-a456-426614174000", "quantity": 1}
  ]'::jsonb,
  'INVALID_COUPON'
);

-- Test 4: Price calculation with non-existent product
SELECT 'Test 4: Price calculation with non-existent product' as test_name;
SELECT * FROM calculate_order_total_secure(
  '[
    {"product_id": "00000000-0000-0000-0000-000000000000", "quantity": 1}
  ]'::jsonb,
  NULL
);

-- Test 5: Free delivery threshold test
SELECT 'Test 5: Free delivery threshold test (above ₹149)' as test_name;
SELECT * FROM calculate_order_total_secure(
  '[
    {"product_id": "123e4567-e89b-12d3-a456-426614174000", "quantity": 10}
  ]'::jsonb,
  NULL
);

-- Test 6: Order processing with price validation
SELECT 'Test 6: Order processing with price validation' as test_name;
SELECT * FROM process_order_with_atomic_stock(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  '{
    "amount": 116.00,
    "phone_number": "+91 9876543210",
    "hostel_number": "1",
    "room_number": "101",
    "email": "test@example.com",
    "customer_name": "Test User",
    "payment_method": "cod",
    "payment_status": "pending",
    "coupon_code": null
  }'::jsonb,
  '[
    {"product_id": "123e4567-e89b-12d3-a456-426614174000", "quantity": 1, "name": "Test Product"}
  ]'::jsonb
);

-- Test 7: Price manipulation detection
SELECT 'Test 7: Price manipulation detection (wrong total)' as test_name;
SELECT * FROM process_order_with_atomic_stock(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  '{
    "amount": 1.00,
    "phone_number": "+91 9876543210",
    "hostel_number": "1",
    "room_number": "101",
    "email": "test@example.com",
    "customer_name": "Test User",
    "payment_method": "cod",
    "payment_status": "pending",
    "coupon_code": null
  }'::jsonb,
  '[
    {"product_id": "123e4567-e89b-12d3-a456-426614174000", "quantity": 1, "name": "Test Product"}
  ]'::jsonb
);

-- Test 8: Check if logging functions work
SELECT 'Test 8: Logging function test' as test_name;
SELECT log_application_event(
  'info',
  'test',
  'Price validation test completed',
  '{"test": "successful"}',
  NULL,
  'test-session',
  'test-request',
  'test-user-agent',
  NULL
);

-- Test 9: Check current products for testing
SELECT 'Test 9: Available products for testing' as test_name;
SELECT id, name, price, stock_quantity 
FROM products 
WHERE stock_quantity > 0 
LIMIT 5;

-- Test 10: Check current coupons for testing
SELECT 'Test 10: Available coupons for testing' as test_name;
SELECT code, discount_value, discount_type, is_active, remaining_uses
FROM coupons 
WHERE is_active = true 
AND remaining_uses > 0
LIMIT 5;

-- Performance test: Multiple concurrent price validations
SELECT 'Performance Test: Multiple price validations' as test_name;
SELECT 
  AVG(duration) as avg_duration_ms,
  MIN(duration) as min_duration_ms,
  MAX(duration) as max_duration_ms,
  COUNT(*) as total_tests
FROM (
  SELECT 
    extract(milliseconds from (clock_timestamp() - start_time)) as duration
  FROM (
    SELECT 
      clock_timestamp() as start_time,
      calculate_order_total_secure(
        '[{"product_id": "123e4567-e89b-12d3-a456-426614174000", "quantity": 1}]'::jsonb,
        NULL
      )
    FROM generate_series(1, 10)
  ) t
) perf_test;

-- Security test: SQL injection attempt
SELECT 'Security Test: SQL injection prevention' as test_name;
SELECT * FROM calculate_order_total_secure(
  '[{"product_id": "123e4567-e89b-12d3-a456-426614174000; DROP TABLE products; --", "quantity": 1}]'::jsonb,
  'FIRSTBIT''; DROP TABLE coupons; --'
);

-- Cleanup test data (if any was created)
-- DELETE FROM orders WHERE customer_name = 'Test User';

SELECT 'All price validation tests completed!' as final_message;
