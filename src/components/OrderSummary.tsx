
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import { useCartStore, CartStore, CartItem } from '@/store/cartStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useCoupon } from '@/hooks/use-coupon';
import { calculatePricesOnServer, PriceCalculationResult } from '@/services/priceCalculation';
import { throttledExecution, formatTimeRemaining } from '@/utils/requestThrottling';
import { formatPrice } from '@/lib/validation';

const OrderSummary = () => {
  // We need to access the store without creating a selector function inside the component
  // This is critical to avoid infinite re-renders
  const items = useCartStore((state: CartStore) => state.items);
  const updateCouponDiscount = useCartStore((state: CartStore) => state.updateCouponDiscount);
  const appliedCouponCode = useCartStore((state: CartStore) => state.couponCode);

  // Processing state for the checkout button
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const navigate = useNavigate();
  const { validateCoupon, isValidating } = useCoupon();

  // State for price calculation results from server
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculationResult>({
    subtotal: 0,
    deliveryFee: 0,
    convenienceFee: 0,
    appliedDiscount: 0,
    total: 0,
    freeDeliveryThreshold: 149,
    remainingForFreeDelivery: 149
  });

  // Destructure values from price calculation with safe defaults
  const {
    subtotal = 0,
    freeDeliveryThreshold = 149,
    remainingForFreeDelivery = 149,
    deliveryFee = 0,
    convenienceFee = 0,
    appliedDiscount = 0,
    total = 0
  } = priceCalculation;

  // Effect to fetch price calculations from server
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Get prices from server
        const result = await calculatePricesOnServer(items, appliedCouponCode || undefined);
        setPriceCalculation(result);
      } catch (error) {
        console.error('Failed to calculate prices:', error);
        // If server calculation fails, we could show an error or use fallback
        toast.error('Error calculating prices');
      }
    };

    fetchPrices();
  }, [items, appliedCouponCode]); // Recalculate when items or coupon code changes

  // Function to sanitize input to prevent XSS attacks
  const sanitizeInput = useCallback((input: string): string => {
    if (!input || typeof input !== 'string') return '';

    // Replace potentially dangerous characters
    return input
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
  }, []);

  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const handleApplyCoupon = useCallback(async () => {
    // Reset status messages
    setCouponError(null);
    setCouponSuccess(null);

    // Basic validation before sending to the server
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      toast.error('Please enter a coupon code');
      return;
    }

    // Validate coupon code format (3-20 alphanumeric chars, hyphens, underscores)
    const couponRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!couponRegex.test(couponCode.trim())) {
      setCouponError('Invalid coupon format');
      toast.error('Invalid coupon format');
      return;
    }

    // Validate subtotal
    if (subtotal <= 0) {
      setCouponError('Add items to your cart before applying a coupon');
      toast.error('Add items to your cart before applying a coupon');
      return;
    }

    // Apply throttling to prevent coupon brute force
    await throttledExecution(
      'coupon',
      async () => {
        try {
          // Sanitize the coupon code before sending to server
          const sanitizedCode = sanitizeInput(couponCode.trim());

          // Call the validateCoupon function from the hook
          const discountAmount = await validateCoupon(sanitizedCode, subtotal);

          // Only update if we got a valid discount amount back
          if (discountAmount !== null && typeof discountAmount === 'number') {
            updateCouponDiscount(discountAmount, sanitizedCode as string);
            setCouponCode(''); // Clear the input after successful application
            setCouponSuccess(`Coupon applied! You saved ₹${formatPrice(discountAmount)}`);
          }
          return true;
        } catch (error) {
          console.error('Error applying coupon:', error);
          setCouponError('Failed to apply coupon');
          return false;
        }
      },
      (timeRemaining) => {
        // Handle throttled case
        const errorMsg = `Please wait ${formatTimeRemaining(timeRemaining)} before trying another coupon`;
        setCouponError(errorMsg);
        toast.error(errorMsg);
      }
    );
  }, [couponCode, validateCoupon, subtotal, updateCouponDiscount, sanitizeInput]);

  const handleProceed = useCallback(async () => {
    if (items.length === 0) {
      toast.error("Your box is empty");
      return;
    }

    // Apply throttling to prevent rapid checkout attempts
    setIsProcessing(true);

    await throttledExecution(
      'checkout',
      async () => {
        // Proceed with checkout
        navigate('/order-details');
        return true;
      },
      (timeRemaining) => {
        // Handle throttled case
        toast.error(`Please wait ${formatTimeRemaining(timeRemaining)} before trying again`);
        setIsProcessing(false);
      }
    );

    setIsProcessing(false);
  }, [items.length, navigate]);

  return (
    <div className="glassmorphic-card p-4 md:p-6 rounded-2xl sticky top-24 shadow-glow">
      <h2 className="text-xl font-medium text-nitebite-highlight mb-4">
        Order Summary
      </h2>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-nitebite-text">
          <span>Subtotal</span>
          <span>₹{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-nitebite-text">
          <span>Delivery Fee</span>
          <span>{deliveryFee === 0 ? (
            <span className="text-green-400">Free!</span>
          ) : (
            `₹${formatPrice(deliveryFee)}`
          )}</span>
        </div>

        <div className="flex justify-between text-nitebite-text">
          <span>Convenience Fee</span>
          <span>₹{formatPrice(convenienceFee)}</span>
        </div>

        {appliedDiscount > 0 && (
          <div className="flex justify-between text-green-400">
            <span>Discount</span>
            <span>-₹{formatPrice(appliedDiscount)}</span>
          </div>
        )}

        <div className="border-t border-white/10 my-2 pt-2"></div>

        <div className="flex justify-between font-medium text-nitebite-highlight">
          <span>Total</span>
          <span>₹{formatPrice(total)}</span>
        </div>
      </div>

      {subtotal < freeDeliveryThreshold && subtotal > 0 && (
        <p className="text-sm text-amber-300 text-center mb-4">
          Add just ₹{formatPrice(remainingForFreeDelivery)} more for free delivery!
        </p>
      )}

      {/* Coupon Code Section */}
      <div className="mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter Coupon Code"
            value={couponCode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCouponCode(e.target.value.toUpperCase())}
            className={`bg-nitebite-dark-accent/50 ${couponError ? 'border-red-500' : couponSuccess ? 'border-green-500' : 'border-white/10'}`}
          />
          <Button
            onClick={handleApplyCoupon}
            disabled={isValidating}
            className="glassmorphic-button text-white transition-all duration-300 shadow-glow whitespace-nowrap"
          >
            {isValidating ? 'Applying...' : 'Apply'}
          </Button>
        </div>

        {couponError && (
          <p className="text-red-500 text-xs mt-1">{couponError}</p>
        )}

        {couponSuccess && (
          <p className="text-green-400 text-xs mt-1">{couponSuccess}</p>
        )}
      </div>

      <Button
        className="w-full glassmorphic-button text-white py-6 text-base rounded-full transition-all duration-300 flex items-center justify-center gap-2 group shadow-glow"
        onClick={handleProceed}
        disabled={isProcessing || items.length === 0}
      >
        {isProcessing ? 'Processing...' : 'Proceed to Order Details'}
        <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
      </Button>

      {items.length > 0 && (
        <p className="text-xs text-nitebite-text-muted text-center mt-4">
          Your order will be delivered in minutes.
        </p>
      )}
    </div>
  );
};

export default OrderSummary;
