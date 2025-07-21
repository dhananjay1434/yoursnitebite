/**
 * 🔒 Secure Checkout Component
 * 
 * This component implements server-side price validation to prevent
 * client-side price manipulation attacks.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { validatePricesSecurely, PriceValidationResult } from '@/services/secureOrderProcessing';
import { toast } from 'sonner';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

interface SecureCheckoutProps {
  onPriceValidated: (validation: PriceValidationResult) => void;
  couponCode?: string;
}

export const SecureCheckout: React.FC<SecureCheckoutProps> = ({ 
  onPriceValidated, 
  couponCode 
}) => {
  const { items } = useCartStore();
  const [isValidating, setIsValidating] = useState(false);
  const [priceValidation, setPriceValidation] = useState<PriceValidationResult | null>(null);
  const [lastValidationTime, setLastValidationTime] = useState<number>(0);

  // Auto-validate prices when cart changes
  useEffect(() => {
    if (items.length > 0) {
      validatePrices();
    }
  }, [items, couponCode]);

  const validatePrices = async () => {
    if (items.length === 0) return;

    // Prevent too frequent validations (rate limiting)
    const now = Date.now();
    if (now - lastValidationTime < 2000) {
      return;
    }

    setIsValidating(true);
    setLastValidationTime(now);

    try {
      const validation = await validatePricesSecurely(items, couponCode);
      setPriceValidation(validation);
      onPriceValidated(validation);

      if (!validation.success) {
        toast.error(validation.message || 'Price validation failed');
      }
    } catch (error) {
      console.error('Price validation error:', error);
      toast.error('Unable to validate prices. Please try again.');
      setPriceValidation({
        success: false,
        subtotal: 0,
        delivery_fee: 0,
        convenience_fee: 0,
        coupon_discount: 0,
        total: 0,
        message: 'Validation failed'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const formatPrice = (price: number) => `₹${price.toFixed(2)}`;

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 space-y-4"
    >
      {/* Security Badge */}
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <Shield className="w-4 h-4" />
        <span>Secure Price Validation</span>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Order Summary</h3>
        
        {isValidating ? (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Validating prices...</span>
          </div>
        ) : priceValidation ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(priceValidation.subtotal)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>
                {priceValidation.delivery_fee === 0 ? (
                  <span className="text-green-600">FREE</span>
                ) : (
                  formatPrice(priceValidation.delivery_fee)
                )}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Convenience Fee</span>
              <span>{formatPrice(priceValidation.convenience_fee)}</span>
            </div>
            
            {priceValidation.coupon_discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon Discount</span>
                <span>-{formatPrice(priceValidation.coupon_discount)}</span>
              </div>
            )}
            
            <hr className="my-2" />
            
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(priceValidation.total)}</span>
            </div>
            
            {!priceValidation.success && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{priceValidation.message}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">Loading price information...</div>
        )}
      </div>

      {/* Validation Status */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>✅ Prices validated server-side</p>
        <p>✅ Protected against manipulation</p>
        <p>✅ Real-time stock verification</p>
        {priceValidation?.success && (
          <p className="text-green-600">✅ Ready for checkout</p>
        )}
      </div>

      {/* Refresh Button */}
      <Button
        onClick={validatePrices}
        disabled={isValidating}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {isValidating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Validating...
          </>
        ) : (
          'Refresh Prices'
        )}
      </Button>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Security Notice</p>
            <p className="text-blue-700">
              All prices are validated server-side using our secure database to ensure 
              accurate pricing and prevent manipulation.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SecureCheckout;
