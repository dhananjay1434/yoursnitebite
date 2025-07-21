/*
  # API Rate Limiting & Security
  
  This migration implements server-side rate limiting and additional
  security measures to protect against abuse and attacks.
*/

-- ✅ RATE LIMITING: Create rate limiting tables and functions

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP address, user ID, or API key
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  window_end timestamptz NOT NULL,
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint ON rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked_until ON rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- Enable RLS on rate limits table
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for rate limits (system only)
CREATE POLICY "System can manage rate limits"
  ON rate_limits
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

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
  v_current_count integer;
  v_existing_record record;
  v_blocked_until timestamptz;
BEGIN
  -- Calculate current window
  v_window_start := date_trunc('minute', now()) - (EXTRACT(MINUTE FROM now())::integer % p_window_minutes) * interval '1 minute';
  v_window_end := v_window_start + (p_window_minutes || ' minutes')::interval;
  
  -- Check for existing record in current window
  SELECT * INTO v_existing_record
  FROM rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start = v_window_start;
  
  IF FOUND THEN
    -- Check if currently blocked
    IF v_existing_record.blocked_until IS NOT NULL AND v_existing_record.blocked_until > now() THEN
      RETURN QUERY SELECT 
        false,
        v_existing_record.request_count,
        v_existing_record.window_end,
        v_existing_record.blocked_until;
      RETURN;
    END IF;
    
    -- Update existing record
    v_current_count := v_existing_record.request_count + 1;
    
    -- Check if limit exceeded
    IF v_current_count > p_max_requests THEN
      v_blocked_until := now() + (p_block_minutes || ' minutes')::interval;
      
      UPDATE rate_limits
      SET 
        request_count = v_current_count,
        blocked_until = v_blocked_until,
        updated_at = now()
      WHERE id = v_existing_record.id;
      
      RETURN QUERY SELECT 
        false,
        v_current_count,
        v_window_end,
        v_blocked_until;
      RETURN;
    ELSE
      -- Update count
      UPDATE rate_limits
      SET 
        request_count = v_current_count,
        updated_at = now()
      WHERE id = v_existing_record.id;
      
      RETURN QUERY SELECT 
        true,
        v_current_count,
        v_window_end,
        null::timestamptz;
      RETURN;
    END IF;
  ELSE
    -- Create new record
    INSERT INTO rate_limits (
      identifier,
      endpoint,
      request_count,
      window_start,
      window_end
    )
    VALUES (
      p_identifier,
      p_endpoint,
      1,
      v_window_start,
      v_window_end
    );
    
    RETURN QUERY SELECT 
      true,
      1,
      v_window_end,
      null::timestamptz;
    RETURN;
  END IF;
END;
$$;

-- ✅ RATE LIMITING: Endpoint-specific rate limiting functions

-- Order creation rate limiting (stricter)
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

-- Login attempt rate limiting
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

-- Coupon validation rate limiting
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

-- Create indexes for IP blocks
CREATE INDEX IF NOT EXISTS idx_ip_blocks_ip_address ON ip_blocks(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_blocks_blocked_until ON ip_blocks(blocked_until);

-- Enable RLS on IP blocks
ALTER TABLE ip_blocks ENABLE ROW LEVEL SECURITY;

-- Create policy for IP blocks (admin only)
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND email LIKE '%@admin.%'
    )
  );

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

-- Create indexes for suspicious activities
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_type ON suspicious_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_identifier ON suspicious_activities(identifier);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_severity ON suspicious_activities(severity);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_resolved ON suspicious_activities(resolved);

-- Enable RLS on suspicious activities
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;

-- Create policy for suspicious activities (admin only)
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
  )
  VALUES (
    p_activity_type,
    p_identifier,
    p_details,
    p_severity
  );
  
  -- Auto-block for critical activities
  IF p_severity = 'critical' THEN
    INSERT INTO ip_blocks (
      ip_address,
      reason,
      blocked_until,
      created_by
    )
    VALUES (
      p_identifier::inet,
      'Automatic block due to critical suspicious activity: ' || p_activity_type,
      now() + interval '24 hours',
      auth.uid()
    )
    ON CONFLICT DO NOTHING;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the main operation if logging fails
  NULL;
END;
$$;

-- ✅ CLEANUP: Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete records older than 24 hours
  DELETE FROM rate_limits
  WHERE window_end < now() - interval '24 hours';
  
  -- Delete unblocked records older than their window
  DELETE FROM rate_limits
  WHERE blocked_until IS NULL
    AND window_end < now();
END;
$$;

-- ✅ MONITORING: Create view for rate limit monitoring
CREATE OR REPLACE VIEW rate_limit_stats AS
SELECT 
  endpoint,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE blocked_until IS NOT NULL) as blocked_requests,
  AVG(request_count) as avg_requests_per_window,
  MAX(request_count) as max_requests_per_window,
  date_trunc('hour', created_at) as hour
FROM rate_limits
WHERE created_at > now() - interval '24 hours'
GROUP BY endpoint, date_trunc('hour', created_at)
ORDER BY hour DESC, total_requests DESC;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_order_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_login_rate_limit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_coupon_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION is_ip_blocked TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_suspicious_activity TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_rate_limits TO authenticated;

-- Grant view access to admins
GRANT SELECT ON rate_limit_stats TO authenticated;
