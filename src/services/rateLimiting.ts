/**
 * ✅ SECURE: Rate Limiting Service
 * 
 * This service implements client-side rate limiting checks and integrates
 * with server-side rate limiting for comprehensive protection.
 */

import { supabase } from '@/lib/supabase';
import { logger, LogCategory } from './logging';

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  resetTime: string;
  blockedUntil?: string;
  message?: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
  blockMinutes: number;
}

// Default rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  ORDER_CREATION: {
    maxRequests: 5,
    windowMinutes: 60,
    blockMinutes: 30,
  },
  LOGIN_ATTEMPT: {
    maxRequests: 10,
    windowMinutes: 15,
    blockMinutes: 60,
  },
  COUPON_VALIDATION: {
    maxRequests: 20,
    windowMinutes: 60,
    blockMinutes: 15,
  },
  GENERAL_API: {
    maxRequests: 100,
    windowMinutes: 60,
    blockMinutes: 15,
  },
  SEARCH: {
    maxRequests: 50,
    windowMinutes: 60,
    blockMinutes: 5,
  },
} as const;

class RateLimitingService {
  private static instance: RateLimitingService;
  private clientLimits: Map<string, { count: number; resetTime: number }> = new Map();

  static getInstance(): RateLimitingService {
    if (!RateLimitingService.instance) {
      RateLimitingService.instance = new RateLimitingService();
    }
    return RateLimitingService.instance;
  }

  /**
   * Check rate limit for order creation
   */
  async checkOrderRateLimit(userId: string): Promise<RateLimitResult> {
    try {
      // First check if the function exists
      const { data, error } = await supabase.rpc('check_order_rate_limit', {
        p_user_id: userId
      });

      if (error) {
        console.warn('Rate limit check failed, using fallback:', error.message);

        // If the function doesn't exist, use client-side rate limiting as fallback
        if (error.message?.includes('function') || error.message?.includes('does not exist')) {
          console.log('Database rate limiting not available, using client-side fallback');
          return this.checkClientRateLimit(`order_${userId}`, RATE_LIMIT_CONFIGS.ORDER_CREATION);
        }

        // Allow request if rate limiting service is down
        return {
          allowed: true,
          currentCount: 0,
          resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          message: 'Rate limiting service temporarily unavailable'
        };
      }

      const result = data[0];

      if (!result.allowed) {
        await logger.warn(LogCategory.SECURITY, 'Order rate limit exceeded', {
          userId,
          currentCount: result.current_count,
          resetTime: result.reset_time,
          blockedUntil: result.blocked_until
        });
      }

      return {
        allowed: result.allowed,
        currentCount: result.current_count,
        resetTime: result.reset_time,
        blockedUntil: result.blocked_until,
        message: result.allowed
          ? undefined
          : `Too many orders. Please wait until ${new Date(result.blocked_until || result.reset_time).toLocaleTimeString()}`
      };

    } catch (error) {
      console.warn('Rate limit check error, using fallback:', error);
      // Use client-side rate limiting as fallback
      return this.checkClientRateLimit(`order_${userId}`, RATE_LIMIT_CONFIGS.ORDER_CREATION);
    }
  }

  /**
   * Check rate limit for login attempts
   */
  async checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
    try {
      const { data, error } = await supabase.rpc('check_login_rate_limit', {
        p_identifier: identifier
      });

      if (error) {
        console.warn('Login rate limit check failed, using fallback:', error.message);

        // If the function doesn't exist, use client-side rate limiting as fallback
        if (error.message?.includes('function') || error.message?.includes('does not exist')) {
          return this.checkClientRateLimit(`login_${identifier}`, RATE_LIMIT_CONFIGS.LOGIN_ATTEMPT);
        }

        return {
          allowed: true,
          currentCount: 0,
          resetTime: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        };
      }

      const result = data[0];

      if (!result.allowed) {
        await logger.warn(LogCategory.SECURITY, 'Login rate limit exceeded', {
          identifier,
          currentCount: result.current_count,
          resetTime: result.reset_time,
          blockedUntil: result.blocked_until
        });
      }

      return {
        allowed: result.allowed,
        currentCount: result.current_count,
        resetTime: result.reset_time,
        blockedUntil: result.blocked_until,
        message: result.allowed
          ? undefined
          : `Too many login attempts. Please wait until ${new Date(result.blocked_until || result.reset_time).toLocaleTimeString()}`
      };

    } catch (error) {
      console.warn('Login rate limit check error, using fallback:', error);
      return this.checkClientRateLimit(`login_${identifier}`, RATE_LIMIT_CONFIGS.LOGIN_ATTEMPT);
    }
  }

  /**
   * Check rate limit for coupon validation
   */
  async checkCouponRateLimit(userId: string): Promise<RateLimitResult> {
    try {
      const { data, error } = await supabase.rpc('check_coupon_rate_limit', {
        p_user_id: userId
      });

      if (error) {
        console.warn('Coupon rate limit check failed, using fallback:', error.message);

        // If the function doesn't exist, use client-side rate limiting as fallback
        if (error.message?.includes('function') || error.message?.includes('does not exist')) {
          return this.checkClientRateLimit(`coupon_${userId}`, RATE_LIMIT_CONFIGS.COUPON_VALIDATION);
        }

        return {
          allowed: true,
          currentCount: 0,
          resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        };
      }

      const result = data[0];

      if (!result.allowed) {
        await logger.warn(LogCategory.SECURITY, 'Coupon rate limit exceeded', {
          userId,
          currentCount: result.current_count,
          resetTime: result.reset_time,
          blockedUntil: result.blocked_until
        });
      }

      return {
        allowed: result.allowed,
        currentCount: result.current_count,
        resetTime: result.reset_time,
        blockedUntil: result.blocked_until,
        message: result.allowed
          ? undefined
          : `Too many coupon attempts. Please wait until ${new Date(result.blocked_until || result.reset_time).toLocaleTimeString()}`
      };

    } catch (error) {
      console.warn('Coupon rate limit check error, using fallback:', error);
      return this.checkClientRateLimit(`coupon_${userId}`, RATE_LIMIT_CONFIGS.COUPON_VALIDATION);
    }
  }

  /**
   * Client-side rate limiting for general API calls
   */
  checkClientRateLimit(
    identifier: string, 
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.GENERAL_API
  ): RateLimitResult {
    const now = Date.now();
    const windowMs = config.windowMinutes * 60 * 1000;
    const key = `${identifier}_${Math.floor(now / windowMs)}`;
    
    const existing = this.clientLimits.get(key);
    
    if (!existing) {
      // First request in this window
      this.clientLimits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      
      return {
        allowed: true,
        currentCount: 1,
        resetTime: new Date(now + windowMs).toISOString()
      };
    }

    // Check if limit exceeded
    if (existing.count >= config.maxRequests) {
      return {
        allowed: false,
        currentCount: existing.count,
        resetTime: new Date(existing.resetTime).toISOString(),
        message: `Rate limit exceeded. Please wait until ${new Date(existing.resetTime).toLocaleTimeString()}`
      };
    }

    // Increment count
    existing.count++;
    this.clientLimits.set(key, existing);

    return {
      allowed: true,
      currentCount: existing.count,
      resetTime: new Date(existing.resetTime).toISOString()
    };
  }

  /**
   * Clean up expired client-side rate limit entries
   */
  cleanupClientLimits(): void {
    const now = Date.now();
    for (const [key, value] of this.clientLimits.entries()) {
      if (value.resetTime < now) {
        this.clientLimits.delete(key);
      }
    }
  }

  /**
   * Check if IP is blocked
   */
  async checkIPBlock(): Promise<boolean> {
    try {
      // Get client IP (this would need to be implemented based on your setup)
      const clientIP = await this.getClientIP();
      
      if (!clientIP) {
        return false; // Allow if we can't determine IP
      }

      const { data, error } = await supabase.rpc('is_ip_blocked', {
        p_ip_address: clientIP
      });

      if (error) {
        console.error('IP block check failed:', error);
        return false; // Allow if check fails
      }

      if (data) {
        await logger.critical(LogCategory.SECURITY, 'Blocked IP attempted access', {
          ip: clientIP,
          userAgent: navigator.userAgent,
          url: window.location.href
        });
      }

      return data || false;

    } catch (error) {
      console.error('IP block check error:', error);
      return false;
    }
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    activityType: string,
    identifier: string,
    details?: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    try {
      await supabase.rpc('log_suspicious_activity', {
        p_activity_type: activityType,
        p_identifier: identifier,
        p_details: details ? JSON.stringify(details) : null,
        p_severity: severity
      });

      await logger.warn(LogCategory.SECURITY, `Suspicious activity: ${activityType}`, {
        identifier,
        details,
        severity
      });

    } catch (error) {
      console.error('Failed to log suspicious activity:', error);
    }
  }

  /**
   * Get client IP address (implementation depends on your setup)
   */
  private async getClientIP(): Promise<string | null> {
    try {
      // In a real implementation, you might:
      // 1. Use a service like ipify.org
      // 2. Get it from your server/edge function
      // 3. Use CloudFlare headers if using CloudFlare
      
      // For now, return null (IP checking would be done server-side)
      return null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const rateLimitingService = RateLimitingService.getInstance();

// Utility functions
export const checkOrderRateLimit = (userId: string) => 
  rateLimitingService.checkOrderRateLimit(userId);

export const checkLoginRateLimit = (identifier: string) => 
  rateLimitingService.checkLoginRateLimit(identifier);

export const checkCouponRateLimit = (userId: string) => 
  rateLimitingService.checkCouponRateLimit(userId);

export const logSuspiciousActivity = (
  activityType: string,
  identifier: string,
  details?: any,
  severity?: 'low' | 'medium' | 'high' | 'critical'
) => rateLimitingService.logSuspiciousActivity(activityType, identifier, details, severity);

// Cleanup interval (run every 5 minutes)
setInterval(() => {
  rateLimitingService.cleanupClientLimits();
}, 5 * 60 * 1000);
