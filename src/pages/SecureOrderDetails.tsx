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
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import PaymentOptions from './PaymentOptions';
import { supabase } from '@/lib/supabase';
import { 
  processOrderSecurely, 
  validateOrderData, 
  recordCouponUsage, 
  updateUserProfile 
} from '@/services/secureOrderProcessing';

const SecureOrderDetails = () => {
  const navigate = useNavigate();
  const { items, calculateSubtotal, clearCart, couponDiscount } = useCartStore();

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [hostelNumber, setHostelNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr'|'cod'>('qr');

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

      // 2. Prepare order data
      const orderData = {
        amount: total,
        phone_number: whatsappNumber,
        hostel_number: hostelNumber,
        room_number: roomNumber,
        email,
        customer_name: customerName,
        payment_method: paymentMethod,
        payment_status: 'pending',
        coupon_discount: couponDiscount ? Math.min(couponDiscount, subtotal) : 0,
      };

      // 3. Validate order data
      const validation = validateOrderData(orderData, items);
      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        setIsProcessing(false);
        return;
      }

      // 4. ✅ SECURE: Process order with atomic stock management
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-nitebite-dark"
    >
      <Navbar transparent={false} />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-nitebite-text-muted hover:text-nitebite-highlight"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-nitebite-highlight">
              Order Details
            </h1>
          </div>

          <div className="space-y-6">
            {/* Customer Information */}
            <div className="glassmorphic-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold text-nitebite-highlight mb-4">
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-nitebite-text mb-2">
                    Full Name *
                  </label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-nitebite-dark-accent/50 border-white/10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-nitebite-text mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-nitebite-dark-accent/50 border-white/10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-nitebite-text mb-2">
                    WhatsApp Number *
                  </label>
                  <Input
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="Enter your WhatsApp number"
                    className="bg-nitebite-dark-accent/50 border-white/10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-nitebite-text mb-2">
                    Hostel Number *
                  </label>
                  <Select value={hostelNumber} onValueChange={setHostelNumber}>
                    <SelectTrigger className="bg-nitebite-dark-accent/50 border-white/10">
                      <SelectValue placeholder="Select hostel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hostelOptions.map((hostel) => (
                        <SelectItem key={hostel} value={hostel}>
                          Hostel {hostel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-nitebite-text mb-2">
                    Room Number *
                  </label>
                  <Input
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="Enter your room number"
                    className="bg-nitebite-dark-accent/50 border-white/10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <PaymentOptions 
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              total={total}
            />

            {/* Order Summary */}
            <div className="glassmorphic-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold text-nitebite-highlight mb-4">
                Order Summary
              </h2>
              <div className="space-y-2 text-nitebite-text">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Convenience Fee</span>
                  <span>₹{convenienceFee.toFixed(2)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-₹{appliedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-nitebite-highlight">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Checkout Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-nitebite-dark/95 backdrop-blur-md border-t border-white/10 z-40">
            <div className="max-w-lg mx-auto">
              <p className="text-xs text-nitebite-text-muted text-center mb-3">
                {paymentMethod === 'cod'
                  ? 'Payment will be collected in cash at the time of delivery'
                  : 'Please complete the payment using the QR code above'}
              </p>
              <Button
                className="w-full glassmorphic-button text-white py-6 text-base rounded-full transition-all duration-300 flex items-center justify-center gap-2 group shadow-glow"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SecureOrderDetails;
