import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import PaymentOptions from './PaymentOptions';
import { supabase } from '@/lib/supabase';
import {
  processOrderSecurely,
  validateOrderData,
  recordCouponUsage,
  updateUserProfile,
  validatePricesSecurely,
  PriceValidationResult
} from '@/services/secureOrderProcessing';
import SecureCheckout from '@/components/SecureCheckout';

const SecureOrderDetails = () => {
  const navigate = useNavigate();
  const { items, calculateSubtotal, clearCart, couponDiscount, couponCode } = useCartStore();

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [hostelNumber, setHostelNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr'|'cod'>('qr');
  const [priceValidation, setPriceValidation] = useState<PriceValidationResult | null>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/products');
    }
  }, [items.length, navigate]);

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setEmail(profile.email || '');
          setCustomerName(profile.full_name || '');
          setWhatsappNumber(profile.phone_number || '');
        }
      }
    };
    loadUserProfile();
  }, []);

  // Calculate totals
  const subtotal = calculateSubtotal();
  const freeDeliveryThreshold = 149;
  const remainingForFreeDelivery = subtotal < freeDeliveryThreshold ? freeDeliveryThreshold - subtotal : 0;
  const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : (subtotal > 0 ? 10 : 0);
  const convenienceFee = subtotal > 0 ? 6 : 0;
  const totalBeforeDiscount = subtotal + deliveryFee + convenienceFee;
  const appliedDiscount = (subtotal > 0 && couponDiscount) ? Math.min(couponDiscount, subtotal) : 0;
  const total = Math.max(0, totalBeforeDiscount - appliedDiscount);

  const hostelOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      // 1. Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to place an order');
        navigate('/login');
        return;
      }

      // 2. ✅ SECURE: Validate prices server-side first
      if (!priceValidation || !priceValidation.success) {
        toast.error('Please wait for price validation to complete');
        setIsProcessing(false);
        return;
      }

      // 3. Prepare order data with server-validated total
      const orderData = {
        amount: priceValidation.total, // Use server-calculated total
        phone_number: whatsappNumber,
        hostel_number: hostelNumber,
        room_number: roomNumber,
        email,
        customer_name: customerName,
        payment_method: paymentMethod,
        payment_status: 'pending',
        coupon_discount: priceValidation.coupon_discount, // Use server-calculated discount
      };

      // 4. Validate order data
      const validation = validateOrderData(orderData, items);
      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        setIsProcessing(false);
        return;
      }

      // 5. ✅ SECURE: Process order with atomic stock management and price validation
      const result = await processOrderSecurely(user.id, orderData, items);

      if (!result.success) {
        if (result.failed_items && result.failed_items.length > 0) {
          // Show specific stock issues
          result.failed_items.forEach(item => {
            toast.error(`${item.name}: ${item.reason}`);
          });
        } else {
          toast.error(result.message);
        }
        setIsProcessing(false);
        return;
      }

      // 5. Record coupon usage if applicable
      if (couponDiscount && couponDiscount > 0 && result.order_id) {
        const appliedCouponCode = useCartStore.getState().couponCode || 'FIRSTBIT';
        await recordCouponUsage(appliedCouponCode, user.id, result.order_id);
      }

      // 6. Update user profile
      await updateUserProfile(user.id, {
        phone_number: whatsappNumber,
        email,
        full_name: customerName,
      });

      // 7. Clear cart and reset all cart-related state
      clearCart();

      // Double-check that coupon discount is reset to 0
      if (useCartStore.getState().couponDiscount !== 0) {
        useCartStore.getState().updateCouponDiscount(0, '');
      }

      toast.success('Order placed successfully!');
      navigate('/account');

    } catch (err) {
      console.error('Error placing order:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen bg-nitebite-midnight"
    >
      <Navbar transparent={false} />

      <div className="page-container py-6 pt-20 sm:pt-24 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="glassmorphic-ghost-button text-nitebite-text hover:text-nitebite-yellow transition-all duration-300 w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-nitebite-yellow animate-glow-pulse-yellow" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gradient">
                Secure Checkout
              </h1>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="glassmorphic-card p-6 sm:p-8 rounded-2xl hover:shadow-glow transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-nitebite-yellow/20 flex items-center justify-center">
                    <span className="text-nitebite-yellow font-bold text-sm">1</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-nitebite-purple">
                    Customer Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="sm:col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-nitebite-text mb-2">
                      Full Name *
                    </label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your full name"
                      className="bg-nitebite-midnight/50 border-nitebite-purple/30 focus:border-nitebite-yellow focus:ring-nitebite-yellow/20 text-nitebite-text placeholder:text-nitebite-text-muted transition-all duration-300"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-nitebite-text mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="bg-nitebite-midnight/50 border-nitebite-purple/30 focus:border-nitebite-yellow focus:ring-nitebite-yellow/20 text-nitebite-text placeholder:text-nitebite-text-muted transition-all duration-300"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-nitebite-text mb-2">
                      WhatsApp Number *
                    </label>
                    <Input
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="Enter your WhatsApp number"
                      className="bg-nitebite-midnight/50 border-nitebite-purple/30 focus:border-nitebite-yellow focus:ring-nitebite-yellow/20 text-nitebite-text placeholder:text-nitebite-text-muted transition-all duration-300"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-nitebite-text mb-2">
                      Hostel Number *
                    </label>
                    <Select value={hostelNumber} onValueChange={setHostelNumber}>
                      <SelectTrigger className="bg-nitebite-midnight/50 border-nitebite-purple/30 focus:border-nitebite-yellow focus:ring-nitebite-yellow/20 text-nitebite-text">
                        <SelectValue placeholder="Select hostel" />
                      </SelectTrigger>
                      <SelectContent className="bg-nitebite-midnight border-nitebite-purple/30">
                        {hostelOptions.map((hostel) => (
                          <SelectItem key={hostel} value={hostel} className="text-nitebite-text hover:bg-nitebite-purple/20">
                            Hostel {hostel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-nitebite-text mb-2">
                      Room Number *
                    </label>
                    <Input
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="Enter your room number"
                      className="bg-nitebite-midnight/50 border-nitebite-purple/30 focus:border-nitebite-yellow focus:ring-nitebite-yellow/20 text-nitebite-text placeholder:text-nitebite-text-muted transition-all duration-300"
                      required
                    />
                  </div>
                </div>
              </motion.div>

              {/* Payment Options */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="glassmorphic-card p-6 sm:p-8 rounded-2xl hover:shadow-glow transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-nitebite-yellow/20 flex items-center justify-center">
                    <span className="text-nitebite-yellow font-bold text-sm">2</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-nitebite-purple">
                    Payment Method
                  </h2>
                </div>

                <PaymentOptions
                  selectedMethod={paymentMethod}
                  onMethodChange={setPaymentMethod}
                  totalAmount={total}
                />
              </motion.div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="sticky top-24"
              >
                <div className="glassmorphic-card p-6 sm:p-8 rounded-2xl hover:shadow-glow transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-nitebite-yellow/20 flex items-center justify-center">
                      <span className="text-nitebite-yellow font-bold text-sm">3</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-nitebite-purple">
                      Order Summary
                    </h2>
                  </div>

                  <SecureCheckout
                    onPriceValidated={setPriceValidation}
                    couponCode={couponCode || undefined}
                  />

                  {/* Security Badge */}
                  <div className="mt-6 p-4 bg-nitebite-green/10 border border-nitebite-green/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-nitebite-green" />
                      <span className="text-sm font-medium text-nitebite-green">Secure Checkout</span>
                    </div>
                    <p className="text-xs text-nitebite-text-muted">
                      Your payment and personal information are protected with bank-level security.
                    </p>
                  </div>

                  {/* Price Validation Status */}
                  {!priceValidation && (
                    <div className="mt-4 p-4 bg-nitebite-yellow/10 border border-nitebite-yellow/20 rounded-xl animate-pulse">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-nitebite-yellow border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-nitebite-yellow text-sm font-medium">
                          Validating prices securely...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Sticky Checkout Button */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-nitebite-midnight/95 backdrop-blur-xl border-t border-nitebite-purple/20 z-40"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Payment Info */}
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-nitebite-text-muted mb-1">
                    {paymentMethod === 'cod'
                      ? '💰 Cash on Delivery - Pay when your order arrives'
                      : '📱 UPI Payment - Scan QR code to complete payment'}
                  </p>
                  {priceValidation?.success && (
                    <p className="text-sm font-medium text-nitebite-yellow">
                      Total: ₹{priceValidation.total.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Checkout Button */}
                <Button
                  className="w-full sm:w-auto min-w-[200px] glassmorphic-button text-nitebite-midnight py-4 px-8 text-base font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-3 group shadow-yellow-glow hover:shadow-glow-pulse-yellow disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCheckout}
                  disabled={isProcessing || !priceValidation?.success}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-nitebite-midnight border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : !priceValidation?.success ? (
                    <>
                      <Shield className="w-5 h-5 animate-pulse" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <span>Place Order</span>
                      <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default SecureOrderDetails;
