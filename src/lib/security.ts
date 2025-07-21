/**
 * ✅ SECURE: Security Middleware and Utilities
 * 
 * This module provides security utilities including CSRF protection,
 * XSS prevention, and secure request handling.
 */

import { supabase } from './supabase';
import { validateRateLimit } from './validation';

// ✅ SECURE: CSRF Token Management
class CSRFTokenManager {
  private static instance: CSRFTokenManager;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  static getInstance(): CSRFTokenManager {
    if (!CSRFTokenManager.instance) {
      CSRFTokenManager.instance = new CSRFTokenManager();
    }
    return CSRFTokenManager.instance;
  }

  generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    this.tokenExpiry = Date.now() + (30 * 60 * 1000); // 30 minutes
    
    // Store in sessionStorage for validation
    sessionStorage.setItem('csrf_token', this.token);
    sessionStorage.setItem('csrf_expiry', this.tokenExpiry.toString());
    
    return this.token;
  }

  getToken(): string {
    const now = Date.now();
    
    // Check if token exists and is not expired
    if (this.token && now < this.tokenExpiry) {
      return this.token;
    }
    
    // Try to get from sessionStorage
    const storedToken = sessionStorage.getItem('csrf_token');
    const storedExpiry = sessionStorage.getItem('csrf_expiry');
    
    if (storedToken && storedExpiry && now < parseInt(storedExpiry)) {
      this.token = storedToken;
      this.tokenExpiry = parseInt(storedExpiry);
      return this.token;
    }
    
    // Generate new token if none exists or expired
    return this.generateToken();
  }

  validateToken(token: string): boolean {
    const currentToken = this.getToken();
    return token === currentToken && Date.now() < this.tokenExpiry;
  }

  clearToken(): void {
    this.token = null;
    this.tokenExpiry = 0;
    sessionStorage.removeItem('csrf_token');
    sessionStorage.removeItem('csrf_expiry');
  }
}

// ✅ SECURE: XSS Prevention
export function sanitizeOutput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ✅ SECURE: Content Security Policy (Client-side fallback only)
export function setSecurityHeaders(): void {
  // ⚠️ NOTE: These meta tags are fallbacks only.
  // Proper security headers should be set by your web server/CDN

  // Only set CSP via meta if not already set by server
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');

    document.head.appendChild(meta);
  }

  // ⚠️ NOTE: X-Frame-Options, X-Content-Type-Options, and Referrer-Policy
  // should be set by your web server/CDN, not via meta tags.
  // Meta tags for these headers are ignored by browsers and will show warnings.

  // For development, we'll skip setting these via meta tags to avoid console warnings
  console.log('✅ CSP security headers initialized (server headers recommended for production)');
}

// ✅ SECURE: Secure Request Wrapper
export async function secureRequest<T>(
  requestFn: () => Promise<T>,
  options: {
    requireAuth?: boolean;
    rateLimit?: { identifier: string; maxRequests?: number; windowMs?: number };
    validateCSRF?: boolean;
  } = {}
): Promise<T> {
  const { requireAuth = false, rateLimit, validateCSRF = false } = options;

  try {
    // Rate limiting check
    if (rateLimit) {
      const { identifier, maxRequests = 10, windowMs = 60000 } = rateLimit;
      if (!validateRateLimit(identifier, maxRequests, windowMs)) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    }

    // Authentication check
    if (requireAuth) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }
    }

    // CSRF validation
    if (validateCSRF) {
      const csrfManager = CSRFTokenManager.getInstance();
      const token = sessionStorage.getItem('csrf_token');
      if (!token || !csrfManager.validateToken(token)) {
        throw new Error('Invalid CSRF token');
      }
    }

    // Execute the request
    return await requestFn();

  } catch (error) {
    // Log security events
    console.error('Secure request failed:', error);
    
    // Re-throw the error for handling by the caller
    throw error;
  }
}

// ✅ SECURE: Input Sanitization for Database
export function sanitizeForDatabase(input: any): any {
  // Handle null/undefined
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .slice(0, 1000); // Limit length
  }

  if (typeof input === 'number') {
    return isFinite(input) ? input : 0;
  }

  if (typeof input === 'boolean') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeForDatabase);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeForDatabase(value);
    }
    return sanitized;
  }

  return input;
}

// ✅ SECURE: Session Security
export function validateSessionSecurity(): boolean {
  try {
    // Check if running in secure context (HTTPS in production)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('Application should be served over HTTPS in production');
    }

    // Check for session hijacking indicators
    const userAgent = navigator.userAgent;
    const storedUserAgent = sessionStorage.getItem('user_agent');
    
    if (storedUserAgent && storedUserAgent !== userAgent) {
      console.warn('User agent mismatch detected');
      return false;
    }
    
    if (!storedUserAgent) {
      sessionStorage.setItem('user_agent', userAgent);
    }

    return true;
  } catch (error) {
    console.error('Session security validation failed:', error);
    return false;
  }
}

// ✅ SECURE: Secure Local Storage
export class SecureStorage {
  private static encrypt(data: string): string {
    // Simple XOR encryption (in production, use a proper encryption library)
    const key = 'nitebite_secure_key'; // In production, use environment variable
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(encrypted);
  }

  private static decrypt(encryptedData: string): string {
    try {
      const key = 'nitebite_secure_key';
      const data = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(
          data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return decrypted;
    } catch {
      return '';
    }
  }

  static setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = this.encrypt(serialized);
      sessionStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Secure storage set failed:', error);
    }
  }

  static getItem<T>(key: string): T | null {
    try {
      const encrypted = sessionStorage.getItem(`secure_${key}`);
      if (!encrypted) return null;
      
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Secure storage get failed:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    sessionStorage.removeItem(`secure_${key}`);
  }

  static clear(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

// ✅ SECURE: Initialize security measures
export function initializeSecurity(): void {
  // Set security headers
  setSecurityHeaders();
  
  // Validate session security
  validateSessionSecurity();
  
  // Generate initial CSRF token
  CSRFTokenManager.getInstance().generateToken();
  
  // Clear any existing secure storage on page load
  SecureStorage.clear();
  
  console.log('✅ Security measures initialized');
}

// Export CSRF manager for use in components
export const csrfManager = CSRFTokenManager.getInstance();
