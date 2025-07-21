
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CheckoutItems from '@/components/CheckoutItems';
import OrderSummary from '@/components/OrderSummary';
import BackToTop from '@/components/BackToTop';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

const Checkout = () => {
  const navigate = useNavigate();
  // Use a simple selector to get the item count
  const itemCount = useCartStore(state => state.getItemCount());
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-nitebite-dark"
    >
      <Navbar transparent={false} />
      <main className="pt-24 pb-16">
        <div className="page-container">
          {/* Updated Back Button to go to Snack Box Selector */}
          <Link to="/snack-boxes" className="inline-flex items-center gap-2 text-nitebite-text-muted hover:text-nitebite-purple transition-colors mb-6 glassmorphic-ghost-button py-2 px-4 rounded-full">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold text-nitebite-highlight mb-8">
            Your Box
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CheckoutItems />
            </div>
            <div className="lg:col-span-1">
              <OrderSummary />
            </div>
          </div>
        </div>
      </main>
      <BackToTop />
      <Footer />
    </motion.div>
  );
};

export default Checkout;
