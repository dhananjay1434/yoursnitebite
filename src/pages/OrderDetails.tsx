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

const OrderDetails = () => {
  const navigate = useNavigate();
  const { items, calculateSubtotal, clearCart, couponDiscount } = useCartStore();

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [hostelNumber, setHostelNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cod'>('cod');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate totals
  const subtotal = calculateSubtotal();
  const deliveryFee = subtotal >= 149 ? 0 : (subtotal > 0 ? 10 : 0);
  const convenienceFee = subtotal > 0 ? 6 : 0;
  const total = Math.max(0, subtotal + deliveryFee + convenienceFee - (couponDiscount || 0));

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/checkout');
    }
  }, [items.length, navigate]);

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone_number, email, full_name')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            setWhatsappNumber(profile.phone_number || '');
            setEmail(profile.email || user.email || '');
            setCustomerName(profile.full_name || '');
          } else {
            setEmail(user.email || '');
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, []);

  // Hostel options
  const hostelOptions = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString()
  );

  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      // 1. Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to place an order');
        navigate('/login');
        setIsProcessing(false);
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

      // 4. ✅ SECURE: Process order with atomic stock management and fallback processing
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

      // 6. Update user profile with order details
      await updateUserProfile(user.id, {
        phone_number: whatsappNumber,
        email: email,
        full_name: customerName,
      });

      // 7. Clear cart and navigate to success page
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-success/${result.order_id}`);

    } catch (err) {
      console.error('Error placing order:', err);
      toast.error('Failed to place order. Please try again.');
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

      <main className="pt-24 pb-28 md:pb-16">
        <div className="page-container max-w-lg mx-auto">
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="icon"
              className="glassmorphic-ghost-button rounded-full mr-4 sticky top-24"
              onClick={() => navigate('/checkout')}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-nitebite-highlight">
              Order Details
            </h1>
          </div>

          {/* Contact Information */}
          <div className="glassmorphic-card p-4 md:p-6 rounded-2xl mb-8">
            <h2 className="text-xl font-medium text-nitebite-highlight mb-6">
              Contact Information
            </h2>
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-nitebite-text mb-2"
                >
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="glassmorphic-input"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-nitebite-text mb-2"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="glassmorphic-input"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="whatsapp"
                  className="block text-sm font-medium text-nitebite-text mb-2"
                >
                  WhatsApp Number
                </label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Enter your WhatsApp number"
                  className="glassmorphic-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="glassmorphic-card p-4 md:p-6 rounded-2xl mb-8">
            <h2 className="text-xl font-medium text-nitebite-highlight mb-6">
              Delivery Information
            </h2>
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="hostel"
                  className="block text-sm font-medium text-nitebite-text mb-2"
                >
                  Hostel Number
                </label>
                <Select value={hostelNumber} onValueChange={setHostelNumber}>
                  <SelectTrigger className="glassmorphic-input">
                    <SelectValue placeholder="Select your hostel" />
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

              <div>
                <label
                  htmlFor="room"
                  className="block text-sm font-medium text-nitebite-text mb-2"
                >
                  Room Number
                </label>
                <Input
                  id="room"
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Enter your room number"
                  className="glassmorphic-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <PaymentOptions
            selectedMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            totalAmount={total}
          />

          {/* Place Order Button */}
          <Button
            onClick={handleCheckout}
            disabled={isProcessing || !whatsappNumber || !hostelNumber || !roomNumber || !email || !customerName}
            className="w-full glassmorphic-button text-lg py-6 mt-8"
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Order...
              </div>
            ) : (
              <>
                Place Order
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </main>
    </motion.div>
  );
};

export default OrderDetails;
