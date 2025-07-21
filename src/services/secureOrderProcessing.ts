/**
 * Secure Order Processing Service
 * 
 * This service implements atomic stock management and secure order processing
 * to prevent race conditions and overselling vulnerabilities.
 */

import { supabase } from '@/lib/supabase';
import { CartItem, useCartStore } from '@/store/cartStore';
import { checkOrderRateLimit } from './rateLimiting';
import { logger, LogCategory } from './logging';

export interface OrderData {
  amount: number;
  phone_number: string;
  hostel_number: string;
  room_number: string;
  email: string;
  customer_name: string;
  payment_method: 'qr' | 'cod';
  payment_status: string;
  coupon_discount: number;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderResult {
  success: boolean;
  order_id?: string;
  message: string;
  calculated_total?: number;
  failed_items?: Array<{
    product_id: string;
    name: string;
    reason: string;
    requested?: number;
    available?: number;
  }>;
}

export interface PriceValidationResult {
  success: boolean;
  subtotal: number;
  delivery_fee: number;
  convenience_fee: number;
  coupon_discount: number;
  total: number;
  message: string;
}

/**
 * ✅ SECURE: Validate prices server-side to prevent manipulation
 * This function calls the database to calculate prices using actual product data,
 * preventing client-side price manipulation attacks.
 */
export async function validatePricesSecurely(
  cartItems: CartItem[],
  couponCode?: string
): Promise<PriceValidationResult> {
  try {
    // Log price validation attempt for security monitoring
    await logger.info(LogCategory.SECURITY, 'Price validation requested', {
      itemCount: cartItems.length,
      couponCode: couponCode ? 'provided' : 'none',
      clientTotal: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });

    const orderItems = cartItems.map(item => ({
      product_id: item.id,
      name: item.name,
      price: item.price, // This will be ignored by server - using DB prices
      quantity: item.quantity,
    }));

    const { data: result, error } = await supabase.rpc('calculate_order_total_secure' as any, {
      p_items: orderItems,
      p_coupon_code: couponCode || null
    });

    if (error) {
      await logger.error(LogCategory.SECURITY, 'Price validation failed', {
        error: error.message,
        items: orderItems,
        couponCode
      });

      return {
        success: false,
        subtotal: 0,
        delivery_fee: 0,
        convenience_fee: 0,
        coupon_discount: 0,
        total: 0,
        message: 'Failed to validate prices. Please try again.',
      };
    }

    if (!result || !result[0]?.success) {
      await logger.warn(LogCategory.SECURITY, 'Price validation returned failure', {
        result: result?.[0],
        items: orderItems,
        couponCode
      });

      return {
        success: false,
        subtotal: 0,
        delivery_fee: 0,
        convenience_fee: 0,
        coupon_discount: 0,
        total: 0,
        message: result?.[0]?.message || 'Price validation failed',
      };
    }

    // Log successful price validation
    await logger.info(LogCategory.SECURITY, 'Price validation successful', {
      serverTotal: result[0].total,
      couponDiscount: result[0].coupon_discount,
      itemCount: orderItems.length
    });

    return {
      success: true,
      subtotal: result[0].subtotal,
      delivery_fee: result[0].delivery_fee,
      convenience_fee: result[0].convenience_fee,
      coupon_discount: result[0].coupon_discount,
      total: result[0].total,
      message: 'Prices validated successfully',
    };

  } catch (error) {
    console.error('Unexpected error in price validation:', error);
    return {
      success: false,
      subtotal: 0,
      delivery_fee: 0,
      convenience_fee: 0,
      coupon_discount: 0,
      total: 0,
      message: 'An unexpected error occurred during price validation',
    };
  }
}

/**
 * ✅ SECURE: Process order with atomic stock management, price validation, and rate limiting
 * This prevents race conditions, overselling, price manipulation, and abuse
 */
export async function processOrderSecurely(
  userId: string,
  orderData: OrderData,
  cartItems: CartItem[]
): Promise<OrderResult> {
  try {
    // 1. Check rate limiting first
    const rateLimitResult = await checkOrderRateLimit(userId);
    if (!rateLimitResult.allowed) {
      await logger.warn(LogCategory.SECURITY, 'Order rate limit exceeded', {
        userId,
        currentCount: rateLimitResult.currentCount,
        message: rateLimitResult.message
      });

      return {
        success: false,
        message: rateLimitResult.message || 'Too many order attempts. Please wait before trying again.',
      };
    }

    // 2. Convert cart items to order items format
    const orderItems: OrderItem[] = cartItems.map(item => ({
      product_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    // 3. Add coupon code to order data for server validation
    const orderDataWithCoupon = {
      ...orderData,
      coupon_code: useCartStore?.getState?.()?.couponCode || null
    };

    // 4. Log order attempt
    await logger.info(LogCategory.ORDER, 'Order processing started', {
      userId,
      itemCount: orderItems.length,
      totalAmount: orderData.amount
    });

    // 5. Call the atomic stock management function with price validation
    const { data: result, error } = await supabase.rpc('process_order_with_atomic_stock' as any, {
      p_user_id: userId,
      p_order_data: orderDataWithCoupon,
      p_items: orderItems
    });

    if (error) {
      await logger.error(LogCategory.ORDER, 'Order processing database error', {
        userId,
        error: error.message,
        orderData: orderDataWithCoupon
      });

      return {
        success: false,
        message: 'Failed to process order. Please try again.',
      };
    }

    // 6. Check if the atomic operation succeeded
    if (!result || !result[0]?.success) {
      const failedItems = result?.[0]?.failed_items || [];
      const message = result?.[0]?.message || 'Order processing failed';
      const calculatedTotal = result?.[0]?.calculated_total;

      await logger.warn(LogCategory.ORDER, 'Order processing failed', {
        userId,
        message,
        failedItems,
        calculatedTotal
      });

      return {
        success: false,
        message,
        failed_items: failedItems,
        calculated_total: calculatedTotal,
      };
    }

    // 7. Log successful order
    await logger.info(LogCategory.ORDER, 'Order processed successfully', {
      userId,
      orderId: result[0].order_id,
      amount: result[0].calculated_total
    });

    return {
      success: true,
      order_id: result[0].order_id,
      message: 'Order processed successfully',
      calculated_total: result[0].calculated_total,
    };

  } catch (error) {
    await logger.error(LogCategory.ORDER, 'Unexpected error in order processing', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Validate order data before processing
 */
export function validateOrderData(orderData: OrderData, cartItems: CartItem[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Basic validation
  if (!orderData.phone_number || orderData.phone_number.length < 10) {
    errors.push('Please enter a valid phone number');
  }

  if (!orderData.email || !orderData.email.includes('@')) {
    errors.push('Please enter a valid email address');
  }

  if (!orderData.customer_name || orderData.customer_name.trim().length < 2) {
    errors.push('Please enter your full name');
  }

  if (!orderData.hostel_number) {
    errors.push('Please select your hostel number');
  }

  if (!orderData.room_number) {
    errors.push('Please enter your room number');
  }

  if (cartItems.length === 0) {
    errors.push('Your cart is empty');
  }

  if (orderData.amount <= 0) {
    errors.push('Invalid order amount');
  }

  // Validate cart items
  cartItems.forEach(item => {
    if (!item.id || !item.name || item.price <= 0 || item.quantity <= 0) {
      errors.push(`Invalid item: ${item.name || 'Unknown item'}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Record coupon usage after successful order
 */
export async function recordCouponUsage(
  couponCode: string,
  userId: string,
  orderId: string
): Promise<boolean> {
  try {
    // Find the coupon
    const { data: couponData, error: couponError } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', couponCode)
      .single();

    if (couponError || !couponData) {
      console.error('Coupon not found:', couponError);
      return false;
    }

    // Record usage
    const { error: usageError } = await supabase
      .from('coupon_usage')
      .insert([{
        coupon_id: couponData.id,
        user_id: userId,
        order_id: orderId,
      }]);

    if (usageError) {
      console.error('Failed to record coupon usage:', usageError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error recording coupon usage:', error);
    return false;
  }
}

/**
 * Update user profile after successful order
 */
export async function updateUserProfile(
  userId: string,
  profileData: {
    phone_number: string;
    email: string;
    full_name: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        phone_number: profileData.phone_number,
        email: profileData.email,
        full_name: profileData.full_name,
      });

    if (error) {
      console.error('Failed to update user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}
