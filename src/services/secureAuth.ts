/**
 * Secure Authentication Service
 * 
 * This service implements secure authentication practices including
 * token refresh, session validation, and security event logging.
 */

import { supabase } from '@/lib/supabase';

export interface SessionValidationResult {
  isValid: boolean;
  userId?: string;
  expiresAt?: string;
  needsRefresh?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  error: string | null;
}

/**
 * ✅ SECURE: Validate current session with server-side checks
 */
export async function validateSession(): Promise<SessionValidationResult> {
  try {
    const { data: result, error } = await supabase.rpc('validate_user_session');

    if (error) {
      console.error('Session validation error:', error);
      return { isValid: false };
    }

    if (!result || !result[0]?.is_valid) {
      return { isValid: false };
    }

    return {
      isValid: true,
      userId: result[0].user_id,
      expiresAt: result[0].expires_at,
      needsRefresh: result[0].needs_refresh,
    };
  } catch (error) {
    console.error('Unexpected error in session validation:', error);
    return { isValid: false };
  }
}

/**
 * ✅ SECURE: Enhanced login with security logging
 */
export async function secureLogin(email: string, password: string): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    // Log login attempt
    await logSecurityEvent('login_attempt', { email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log failed login
      await logSecurityEvent('login_failed', { 
        email, 
        error: error.message 
      });
      
      return {
        success: false,
        error: error.message,
      };
    }

    if (data.user) {
      // Log successful login
      await logSecurityEvent('login_success', { 
        user_id: data.user.id 
      });

      return {
        success: true,
        user: data.user,
      };
    }

    return {
      success: false,
      error: 'Login failed',
    };
  } catch (error) {
    console.error('Unexpected error in secure login:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * ✅ SECURE: Enhanced logout with cleanup
 */
export async function secureLogout(): Promise<boolean> {
  try {
    // Log logout attempt
    await logSecurityEvent('logout_attempt');

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return false;
    }

    // Clear any sensitive data from localStorage/sessionStorage
    clearSensitiveData();

    // Log successful logout
    await logSecurityEvent('logout_success');

    return true;
  } catch (error) {
    console.error('Unexpected error in secure logout:', error);
    return false;
  }
}

/**
 * ✅ SECURE: Enhanced signup with validation
 */
export async function secureSignup(
  email: string, 
  password: string, 
  fullName: string
): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.message,
      };
    }

    // Log signup attempt
    await logSecurityEvent('signup_attempt', { email });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      // Log failed signup
      await logSecurityEvent('signup_failed', { 
        email, 
        error: error.message 
      });
      
      return {
        success: false,
        error: error.message,
      };
    }

    if (data.user) {
      // Log successful signup
      await logSecurityEvent('signup_success', { 
        user_id: data.user.id 
      });

      return {
        success: true,
        user: data.user,
      };
    }

    return {
      success: false,
      error: 'Signup failed',
    };
  } catch (error) {
    console.error('Unexpected error in secure signup:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Log security events for audit purposes
 */
async function logSecurityEvent(eventType: string, details?: any): Promise<void> {
  try {
    await supabase.rpc('log_security_event', {
      p_event_type: eventType,
      p_details: details ? JSON.stringify(details) : null,
    });
  } catch (error) {
    // Don't throw errors for logging failures
    console.warn('Failed to log security event:', error);
  }
}

/**
 * Clear sensitive data from browser storage
 */
function clearSensitiveData(): void {
  try {
    // Clear cart data
    sessionStorage.removeItem('nitebite-cart');
    
    // Clear any other sensitive data
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('auth') || key.includes('token') || key.includes('session'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (error) {
    console.warn('Error clearing sensitive data:', error);
  }
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password: string): {
  isValid: boolean;
  message: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter',
    };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    };
  }

  return {
    isValid: true,
    message: 'Password is strong',
  };
}

/**
 * ✅ SECURE: Get current user with session validation
 */
export async function getCurrentUserSecurely(): Promise<{
  user: any | null;
  isValid: boolean;
}> {
  try {
    // First check local session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { user: null, isValid: false };
    }

    // Validate session with server
    const validation = await validateSession();
    
    if (!validation.isValid) {
      // Session is invalid, sign out
      await secureLogout();
      return { user: null, isValid: false };
    }

    return { user, isValid: true };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { user: null, isValid: false };
  }
}

/**
 * ✅ SECURE: Refresh authentication token
 */
export async function refreshAuthToken(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Token refresh error:', error);
      await logSecurityEvent('token_refresh_failed', { error: error.message });
      return false;
    }

    if (data.session) {
      await logSecurityEvent('token_refresh_success');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Unexpected error in token refresh:', error);
    return false;
  }
}
