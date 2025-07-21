import { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { toast } from 'sonner';

// Validate coupon code - only allow alphanumeric characters, hyphens, and underscores
// with a length between 3 and 20 characters
const validateCouponCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;

  // Trim the code and check length (3-20 characters)
  const trimmedCode = code.trim();
  if (trimmedCode.length < 3 || trimmedCode.length > 20) return false;

  // Only allow alphanumeric characters, hyphens, and underscores
  const couponRegex = /^[a-zA-Z0-9_-]+$/;
  return couponRegex.test(trimmedCode);
};

// Sanitize a string to prevent XSS attacks
const sanitizeString = (str: string): string => {
  if (!str || typeof str !== 'string') return '';

  // Replace potentially dangerous characters
  return str
    .replace(/[<>&"'`]/g, (match) => {
      switch (match) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '`': return '&#x60;';
        default: return match;
      }
    })
    .trim();
};

// Interface for the coupon validation response from the server
interface ValidateCouponResponse {
  valid: boolean;
  message: string;
  discount_amount: number;
  coupon_code: string;
}

export function useCoupon() {
  const [isValidating, setIsValidating] = useState(false);

  const validateCoupon = async (code: string, orderAmount: number) => {
    setIsValidating(true);
    try {
      // Validate coupon code format first
      if (!validateCouponCode(code)) {
        toast.error('Invalid coupon code format');
        return null;
      }

      // Sanitize the coupon code to prevent XSS
      const sanitizedCode = sanitizeString(code);

      // Validate order amount
      if (isNaN(orderAmount) || orderAmount < 0) {
        toast.error('Invalid order amount');
        return null;
      }

      // Rate limiting check - store last attempt timestamp in session storage
      const now = Date.now();
      const lastAttempt = parseInt(sessionStorage.getItem('lastCouponAttempt') || '0');
      if (now - lastAttempt < 2000) { // 2 seconds cooldown
        toast.error('Please wait before trying another coupon');
        return null;
      }
      sessionStorage.setItem('lastCouponAttempt', now.toString());

      // Call our new server-side validation function
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_coupon_code: sanitizedCode,
        p_order_amount: orderAmount
      });

      if (error) {
        console.error('Coupon validation error:', error);
        toast.error('Error validating coupon: ' + (error.message || 'Unknown error'));
        return null;
      }

      // Check if we got a valid response
      if (!data) {
        toast.error('Invalid response from server');
        return null;
      }

      const response = data as ValidateCouponResponse;

      // Show appropriate message based on validation result
      if (!response.valid) {
        toast.error(response.message || 'Invalid coupon');
        return null;
      }

      // Success! Update coupon usage and show message
      try {
        // Update coupon usage in the database
        await supabase.rpc('update_coupon_usage', {
          p_coupon_code: response.coupon_code
        });
      } catch (usageError) {
        console.warn('Failed to update coupon usage:', usageError);
        // Continue even if usage update fails
      }

      // Show success message and return discount amount
      toast.success(response.message || 'Coupon applied successfully');
      return response.discount_amount;

    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error('Failed to validate coupon');
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateCoupon,
    isValidating
  };
}