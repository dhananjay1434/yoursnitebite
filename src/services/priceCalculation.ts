import { CartItem } from '@/store/cartStore';
import { supabase } from '@/supabaseClient';

// Interface for price calculation response
export interface PriceCalculationResult {
  subtotal: number;
  deliveryFee: number;
  convenienceFee: number;
  appliedDiscount: number;
  total: number;
  freeDeliveryThreshold: number;
  remainingForFreeDelivery: number;
}

/**
 * ✅ SECURE: Calculate prices on the server side to prevent client-side manipulation
 * @param items Cart items
 * @param couponCode Applied coupon code
 * @returns Promise with calculation result
 */
export async function calculatePricesOnServer(
  items: CartItem[],
  couponCode?: string
): Promise<PriceCalculationResult> {
  try {
    // Import the secure validation function
    const { validatePricesSecurely } = await import('./secureOrderProcessing');

    // Use server-side price validation
    const result = await validatePricesSecurely(items, couponCode);

    if (!result.success) {
      console.warn('Server price validation failed, using fallback:', result.message);
      // Only use fallback if server is unavailable, not for security reasons
      return calculatePricesFallback(items, result.coupon_discount);
    }

    return {
      subtotal: result.subtotal,
      deliveryFee: result.delivery_fee,
      convenienceFee: result.convenience_fee,
      appliedDiscount: result.coupon_discount,
      total: result.total,
      freeDeliveryThreshold: 149,
      remainingForFreeDelivery: Math.max(0, 149 - result.subtotal)
    };

  } catch (err) {
    console.error('Unexpected error in price calculation:', err);
    // Fallback to client-side calculation only if server is completely unavailable
    return calculatePricesFallback(items, 0);
  }
}

/**
 * ⚠️ FALLBACK ONLY: Client-side price calculation
 * WARNING: This should only be used when server is completely unavailable
 * @param items Cart items
 * @param couponDiscount Applied coupon discount
 * @returns Price calculation result
 */
function calculatePricesFallback(
  items: CartItem[],
  couponDiscount: number
): PriceCalculationResult {
  console.warn('🚨 Using client-side price calculation fallback - this should not happen in production!');
  // Calculate subtotal
  const subtotal = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Constants
  const freeDeliveryThreshold = 149;
  const remainingForFreeDelivery = subtotal < freeDeliveryThreshold
    ? freeDeliveryThreshold - subtotal
    : 0;

  // Calculate fees
  const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : (items.length > 0 ? 10 : 0);
  const convenienceFee = subtotal > 0 ? 6 : 0;

  // Apply discount only if subtotal is greater than 0
  const appliedDiscount = (subtotal > 0 && couponDiscount)
    ? Math.min(couponDiscount, subtotal)
    : 0;

  // Calculate total (ensure it's never negative)
  const totalBeforeDiscount = subtotal + deliveryFee + convenienceFee;
  const total = Math.max(0, totalBeforeDiscount - appliedDiscount);

  return {
    subtotal,
    deliveryFee,
    convenienceFee,
    appliedDiscount,
    total,
    freeDeliveryThreshold,
    remainingForFreeDelivery
  };
}