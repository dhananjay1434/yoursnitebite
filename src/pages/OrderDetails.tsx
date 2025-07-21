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
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr'|'cod'>('qr');

  // Redirect if cart is empty and pre-fill contact details
  useEffect(() => {
    if (items.length === 0) {
      navigate('/checkout');
      return;
    }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to place an order');
        navigate('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number, email, full_name')
        .eq('user_id', user.id)
        .single();
      if (profile) {
        setWhatsappNumber(profile.phone_number ?? '');
        setEmail(profile.email ?? '');
        setCustomerName(profile.full_name ?? '');
      }
    })();
  }, [items.length, navigate]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fees & totals
  const subtotal = calculateSubtotal();
  const freeDeliveryThreshold = 149;
  const remainingForFreeDelivery =
    subtotal < freeDeliveryThreshold
      ? freeDeliveryThreshold - subtotal
      : 0;
  const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : (subtotal > 0 ? 10 : 0);
  const convenienceFee = subtotal > 0 ? 6 : 0;
  const totalBeforeDiscount = subtotal + deliveryFee + convenienceFee;
  // Only apply discount if subtotal is greater than 0 and less than or equal to the discount
  const appliedDiscount = (subtotal > 0 && couponDiscount) ? Math.min(couponDiscount, subtotal) : 0;
  const total = Math.max(0, totalBeforeDiscount - appliedDiscount);

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

    // 2. Fetch stock levels for cart items
    const itemIds = items.map((i) => i.id);
    const { data: stocks, error: stockError } = await supabase
      .from('products')
      .select('id, stock_quantity')
      .in('id', itemIds);
    if (stockError) {
      console.error('Failed to fetch stock levels:', stockError);
      toast.error('Could not verify stock. Please try again.');
      setIsProcessing(false);
      return;
    }

    // 3. Client‑side stock validation
    for (const item of items) {
      const prod = stocks?.find((p) => p.id === item.id);
      if (!prod || prod.stock_quantity < item.quantity) {
        toast.error(`Insufficient stock for “${item.name}”`);
        setIsProcessing(false);
        return;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to place an order');
        navigate('/login');
        return;
      }

      // 4. Prepare order payload
      const orderData = {
        user_id: user.id,
        amount: total,
        items: items.map((item) => ({
          product_id: item.id,     // matches your trigger’s JSON parsing
          name:       item.name,
          price:      item.price,
          quantity:   item.quantity,
        })),
        phone_number:    whatsappNumber,
        hostel_number:   hostelNumber,
        room_number:     roomNumber,
        email,
        customer_name:   customerName,
        payment_method:  paymentMethod,
        payment_status:  'pending',
        coupon_discount: couponDiscount
          ? Math.min(couponDiscount, subtotal)
          : 0,
      };

      // 🔍 Debug: see exact payload
      console.log('🔍 ORDER PAYLOAD:', JSON.stringify(orderData, null, 2));

      // 5. Insert order (backend trigger will decrement stock)
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();
      if (error) {
        // Handle server‑side stock exception
        if (error.message.includes('Insufficient stock')) {
          toast.error('Not enough stock for one of the items.');
        } else {
          toast.error('Failed to place order. Please try again.');
        }
        throw error;
      }

      // 6. Record coupon usage
      if (couponDiscount && couponDiscount > 0) {
        // Get the coupon code from the cart store
        const appliedCouponCode = useCartStore.getState().couponCode || 'FIRSTBIT';

        // Try to find the coupon in the database
        const { data: couponData, error: couponError } = await supabase
          .from('coupons')
          .select('id')
          .eq('code', appliedCouponCode)
          .single();
        if (!couponError && couponData) {
          await supabase.from('coupon_usage').insert([
            {
              coupon_id: couponData.id,
              user_id:   user.id,
              order_id:  data.id,
            },
          ]);
        }
      }

      // 7. Update user profile
      await supabase.from('profiles').upsert({
        user_id:      user.id,
        phone_number: whatsappNumber,
        email,
        full_name:    customerName,
      });

      // Clear cart and reset all cart-related state including coupon discount
      clearCart();

      // Double-check that coupon discount is reset to 0
      if (useCartStore.getState().couponDiscount !== 0) {
        useCartStore.getState().updateCouponDiscount(0, '');
      }

      toast.success('Order placed successfully!');
      navigate('/account');
    } catch (err) {
      console.error('Error placing order:', err);
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
                  className="bg-nitebite-dark-accent/50 border-white/10 text-nitebite-text w-full focus:ring-nitebite-accent"
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
                  placeholder="Enter your email address"
                  className="bg-nitebite-dark-accent/50 border-white/10 text-nitebite-text w-full focus:ring-nitebite-accent"
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
                  className="bg-nitebite-dark-accent/50 border-white/10 text-nitebite-text w-full focus:ring-nitebite-accent"
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
                  <SelectTrigger className="bg-nitebite-dark-accent/50 border-white/10 text-nitebite-text w-full focus:ring-nitebite-accent">
                    <SelectValue placeholder="Select your hostel" />
                  </SelectTrigger>
                  <SelectContent className="bg-nitebite-dark-accent border-white/10 text-nitebite-text">
                    {hostelOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        Hostel {opt}
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
                  className="bg-nitebite-dark-accent/50 border-white/10 text-nitebite-text w-full focus:ring-nitebite-accent"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="glassmorphic-card p-4 md:p-6 rounded-2xl mb-8">
            <h2 className="text-xl font-medium text-nitebite-highlight mb-4">
              Order Summary
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-nitebite-text">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-nitebite-text">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? (
                  <span className="text-green-400">Free!</span>
                ) : (
                  `₹${deliveryFee.toFixed(2)}`
                )}</span>
              </div>

              <div className="flex justify-between text-nitebite-text">
                <span>Convenience Fee</span>
                <span>₹{convenienceFee.toFixed(2)}</span>
              </div>

              {appliedDiscount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-₹{appliedDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-white/10 my-2 pt-2"></div>

              <div className="flex justify-between font-medium text-nitebite-highlight">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <PaymentOptions
            selectedMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            totalAmount={total}
          />
        </div>
      </main>

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
    </motion.div>
  );
};

export default OrderDetails;
