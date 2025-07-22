-- ✅ RATE LIMITING: Create missing rate limiting functions
-- This migration creates the rate limiting functions that are being called by the frontend

-- Create rate_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint ON rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);

-- ✅ RATE LIMITING: Core rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer DEFAULT 100,
  p_window_minutes integer DEFAULT 60,
  p_block_minutes integer DEFAULT 15
)
RETURNS TABLE (
  allowed boolean,
  current_count integer,
  reset_time timestamptz,
  blocked_until timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_current_count integer := 0;
  v_blocked_until timestamptz;
BEGIN
  -- Calculate current window
  v_window_start := date_trunc('minute', now()) - 
    (EXTRACT(minute FROM now())::integer % p_window_minutes) * interval '1 minute';
  v_window_end := v_window_start + (p_window_minutes * interval '1 minute');
  
  -- Check if there's an existing record for this window
  SELECT request_count INTO v_current_count
  FROM rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start = v_window_start;
  
  -- If no record exists, this is the first request
  IF v_current_count IS NULL THEN
    INSERT INTO rate_limits (identifier, endpoint, request_count, window_start, window_end)
    VALUES (p_identifier, p_endpoint, 1, v_window_start, v_window_end);
    
    RETURN QUERY SELECT 
      true,
      1,
      v_window_end,
      null::timestamptz;
    RETURN;
  END IF;
  
  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    v_blocked_until := v_window_end + (p_block_minutes * interval '1 minute');
    
    RETURN QUERY SELECT 
      false,
      v_current_count,
      v_window_end,
      v_blocked_until;
    RETURN;
  END IF;
  
  -- Increment counter
  UPDATE rate_limits 
  SET request_count = request_count + 1,
      updated_at = now()
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start = v_window_start;
  
  RETURN QUERY SELECT 
    true,
    v_current_count + 1,
    v_window_end,
    null::timestamptz;
END;
$$;

-- ✅ RATE LIMITING: Order creation rate limiting (stricter)
CREATE OR REPLACE FUNCTION check_order_rate_limit(p_user_id uuid)
RETURNS TABLE (
  allowed boolean,
  current_count integer,
  reset_time timestamptz,
  blocked_until timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM check_rate_limit(
    p_user_id::text,
    'order_creation',
    5,  -- Max 5 orders per hour
    60, -- 60 minute window
    30  -- Block for 30 minutes if exceeded
  );
END;
$$;

-- ✅ RATE LIMITING: Login attempt rate limiting
CREATE OR REPLACE FUNCTION check_login_rate_limit(p_identifier text)
RETURNS TABLE (
  allowed boolean,
  current_count integer,
  reset_time timestamptz,
  blocked_until timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM check_rate_limit(
    p_identifier,
    'login_attempt',
    10, -- Max 10 login attempts per 15 minutes
    15, -- 15 minute window
    60  -- Block for 60 minutes if exceeded
  );
END;
$$;

-- ✅ RATE LIMITING: Coupon validation rate limiting
CREATE OR REPLACE FUNCTION check_coupon_rate_limit(p_user_id uuid)
RETURNS TABLE (
  allowed boolean,
  current_count integer,
  reset_time timestamptz,
  blocked_until timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM check_rate_limit(
    p_user_id::text,
    'coupon_validation',
    20, -- Max 20 coupon checks per hour
    60, -- 60 minute window
    15  -- Block for 15 minutes if exceeded
  );
END;
$$;

-- ✅ SECURITY: IP-based blocking for suspicious activity
CREATE TABLE IF NOT EXISTS ip_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  reason text NOT NULL,
  blocked_until timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create index for IP blocks
CREATE INDEX IF NOT EXISTS idx_ip_blocks_ip_address ON ip_blocks(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_blocks_blocked_until ON ip_blocks(blocked_until);

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip_address inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_blocked boolean := false;
BEGIN
  SELECT true INTO v_blocked
  FROM ip_blocks
  WHERE ip_address = p_ip_address
    AND blocked_until > now()
  LIMIT 1;
  
  RETURN COALESCE(v_blocked, false);
END;
$$;

-- ✅ SECURITY: Suspicious activity detection
CREATE TABLE IF NOT EXISTS suspicious_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL,
  identifier text NOT NULL, -- IP, user ID, etc.
  details jsonb,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index for suspicious activities
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_identifier ON suspicious_activities(identifier);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_created_at ON suspicious_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_severity ON suspicious_activities(severity);

-- Function to log suspicious activity
CREATE OR REPLACE FUNCTION log_suspicious_activity(
  p_activity_type text,
  p_identifier text,
  p_details jsonb DEFAULT NULL,
  p_severity text DEFAULT 'medium'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO suspicious_activities (
    activity_type,
    identifier,
    details,
    severity
  ) VALUES (
    p_activity_type,
    p_identifier,
    p_details,
    p_severity
  );
END;
$$;

-- ✅ CLEANUP: Function to clean up old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete rate limit entries older than 24 hours
  DELETE FROM rate_limits 
  WHERE window_end < now() - interval '24 hours';
  
  -- Delete expired IP blocks
  DELETE FROM ip_blocks 
  WHERE blocked_until < now();
  
  -- Delete old suspicious activities (keep for 30 days)
  DELETE FROM suspicious_activities 
  WHERE created_at < now() - interval '30 days' AND resolved = true;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_order_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_login_rate_limit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_coupon_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION is_ip_blocked TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_suspicious_activity TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_rate_limits TO authenticated;

-- Enable RLS on tables
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Users can view their own rate limits" ON rate_limits;
CREATE POLICY "Users can view their own rate limits"
  ON rate_limits
  FOR SELECT
  TO authenticated
  USING (identifier = auth.uid()::text);

DROP POLICY IF EXISTS "Admins can manage IP blocks" ON ip_blocks;
CREATE POLICY "Admins can manage IP blocks"
  ON ip_blocks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND email LIKE '%@admin.%'
    )
  );

DROP POLICY IF EXISTS "Admins can view suspicious activities" ON suspicious_activities;
CREATE POLICY "Admins can view suspicious activities"
  ON suspicious_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND email LIKE '%@admin.%'
    )
  );
