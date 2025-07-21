/**
 * ✅ SECURE: Input Validation with Zod
 * 
 * This module provides comprehensive input validation to prevent
 * injection attacks, data corruption, and security vulnerabilities.
 */

import { z } from 'zod';

// ✅ SECURE: User input validation schemas
export const userValidationSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase()
    .trim(),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits')
    .regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number')
    .trim(),
});

// ✅ SECURE: Order validation schemas
export const orderValidationSchema = z.object({
  amount: z
    .number()
    .positive('Order amount must be positive')
    .max(10000, 'Order amount cannot exceed ₹10,000')
    .multipleOf(0.01, 'Invalid amount precision'),
  
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits')
    .regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number')
    .trim(),
  
  hostelNumber: z
    .string()
    .regex(/^[1-9]$|^1[0-2]$/, 'Please select a valid hostel number (1-12)')
    .trim(),
  
  roomNumber: z
    .string()
    .min(1, 'Room number is required')
    .max(10, 'Room number must be less than 10 characters')
    .regex(/^[A-Za-z0-9-]+$/, 'Room number can only contain letters, numbers, and hyphens')
    .trim(),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase()
    .trim(),
  
  customerName: z
    .string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(50, 'Customer name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Customer name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  
  paymentMethod: z
    .enum(['qr', 'cod'], {
      errorMap: () => ({ message: 'Please select a valid payment method' })
    }),
  
  couponDiscount: z
    .number()
    .min(0, 'Coupon discount cannot be negative')
    .max(1000, 'Coupon discount cannot exceed ₹1,000')
    .optional(),
});

// ✅ SECURE: Cart item validation schema
export const cartItemValidationSchema = z.object({
  id: z
    .string()
    .uuid('Invalid product ID format')
    .min(1, 'Product ID is required'),
  
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be less than 100 characters')
    .trim(),
  
  price: z
    .number()
    .positive('Product price must be positive')
    .max(1000, 'Product price cannot exceed ₹1,000')
    .multipleOf(0.01, 'Invalid price precision'),
  
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be positive')
    .max(50, 'Quantity cannot exceed 50 items'),
});

// ✅ SECURE: Coupon validation schema
export const couponValidationSchema = z.object({
  code: z
    .string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(20, 'Coupon code must be less than 20 characters')
    .regex(/^[A-Z0-9]+$/, 'Coupon code can only contain uppercase letters and numbers')
    .trim(),
});

// ✅ SECURE: Search query validation
export const searchValidationSchema = z.object({
  query: z
    .string()
    .max(100, 'Search query must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s'-]+$/, 'Search query contains invalid characters')
    .trim()
    .optional(),
  
  category: z
    .string()
    .uuid('Invalid category ID format')
    .optional(),
  
  sortBy: z
    .enum(['name', 'price', 'created_at'], {
      errorMap: () => ({ message: 'Invalid sort option' })
    })
    .optional(),
  
  sortOrder: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: 'Invalid sort order' })
    })
    .optional(),
});

// ✅ SECURE: Validation helper functions
export function validateUser(data: unknown) {
  return userValidationSchema.safeParse(data);
}

export function validateOrder(data: unknown) {
  return orderValidationSchema.safeParse(data);
}

export function validateCartItem(data: unknown) {
  return cartItemValidationSchema.safeParse(data);
}

export function validateCartItems(items: unknown[]) {
  const results = items.map(item => validateCartItem(item));
  const errors = results
    .filter(result => !result.success)
    .map(result => result.error?.issues)
    .flat();
  
  return {
    success: errors.length === 0,
    errors,
    validItems: results
      .filter(result => result.success)
      .map(result => result.data),
  };
}

export function validateCoupon(data: unknown) {
  return couponValidationSchema.safeParse(data);
}

export function validateSearch(data: unknown) {
  return searchValidationSchema.safeParse(data);
}

// ✅ SECURE: Sanitization functions
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeForDatabase(input: string): string {
  // Remove potential SQL injection patterns
  return input
    .replace(/['"`;\\]/g, '')
    .trim();
}

export function sanitizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except + at the beginning
  return phone.replace(/(?!^\+)[^\d]/g, '');
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// ✅ SECURE: Rate limiting validation
export function validateRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const key = `rate_limit_${identifier}`;
  
  try {
    const stored = sessionStorage.getItem(key);
    const data = stored ? JSON.parse(stored) : { count: 0, resetTime: now + windowMs };
    
    // Reset if window has passed
    if (now > data.resetTime) {
      data.count = 0;
      data.resetTime = now + windowMs;
    }
    
    // Check if limit exceeded
    if (data.count >= maxRequests) {
      return false;
    }
    
    // Increment counter
    data.count++;
    sessionStorage.setItem(key, JSON.stringify(data));
    
    return true;
  } catch (error) {
    console.warn('Rate limiting error:', error);
    return true; // Allow request if rate limiting fails
  }
}

// ✅ SECURE: Content Security Policy helpers
export function validateImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      'your-domain.com', // Replace with your actual domain
      'supabase.co',
      'supabase.com',
    ];
    
    return allowedDomains.some(domain => 
      parsedUrl.hostname === domain || 
      parsedUrl.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export function validateFileUpload(file: File): {
  isValid: boolean;
  error?: string;
} {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 5MB',
    };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only JPEG, PNG, and WebP images are allowed',
    };
  }
  
  return { isValid: true };
}
