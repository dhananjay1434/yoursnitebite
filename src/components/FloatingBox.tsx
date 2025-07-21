// FloatingBox.jsx
import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const FloatingBox: React.FC = () => {
  const { items, calculateSubtotal } = useCartStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<string | null>(null);
  const [prevItemCount, setPrevItemCount] = useState(0);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = calculateSubtotal();

  useEffect(() => {
    if (items.length > 0) {
      setIsVisible(true);
      if (prevItemCount < itemCount && prevItemCount > 0) {
        const newItem = items[items.length - 1]?.name;
        if (newItem) {
          setLastAddedItem(newItem);
          setTimeout(() => setLastAddedItem(null), 2000);
        }
      }
      setPrevItemCount(itemCount);
    } else {
      setIsVisible(false);
      setIsExpanded(false);
      setPrevItemCount(0);
    }
  }, [items, itemCount, prevItemCount]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 left-auto z-40 w-[calc(100%-2rem)] sm:w-11/12 max-w-md"
      >
        <div className="bg-nitebite-dark-accent/90 backdrop-blur-xl border border-nitebite-purple/30 rounded-2xl shadow-glow overflow-hidden">
          {/* Header Bar */}
          <div
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative bg-gradient-to-br from-nitebite-purple to-nitebite-purple/70 p-2 sm:p-3 rounded-full">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-nitebite-yellow text-black font-bold text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-lg"
                >
                  {itemCount}
                </motion.span>
              </div>
              <div>
                <h3 className="text-sm sm:text-lg text-white font-semibold">Your Box</h3>
                {lastAddedItem && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs sm:text-sm text-nitebite-yellow line-clamp-1"
                  >
                    Added: {lastAddedItem}
                  </motion.p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <motion.div
                key={subtotal}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-end"
              >
                <span className="text-xs text-white/60">Subtotal:</span>
                <span className="text-base sm:text-lg text-nitebite-yellow font-bold">
                  ₹{subtotal.toFixed(2)}
                </span>
              </motion.div>
              <Button
                className="bg-gradient-to-r from-nitebite-yellow to-nitebite-accent text-black font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-full text-sm sm:text-base h-auto shadow-lg hover:shadow-xl transition-all duration-300"
                asChild
              >
                <Link to="/checkout">Checkout</Link>
              </Button>
            </div>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-white/10"
              >
                <div className="max-h-48 sm:max-h-60 overflow-y-auto scrollbar-none space-y-3 pt-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between text-sm sm:text-base py-2 hover:bg-white/5 px-2 rounded-lg transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-medium truncate">{item.name}</span>
                          <span className="text-white/60 text-xs">Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2 text-nitebite-yellow font-semibold">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mt-5 sm:mt-6 bg-nitebite-dark h-2.5 sm:h-3 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((subtotal / 199) * 100, 100)}%` }}
                    className="h-full bg-gradient-to-r from-nitebite-yellow to-nitebite-accent rounded-full"
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs sm:text-sm text-white/70">
                    {subtotal < 199
                      ? `Add ₹${(199 - subtotal).toFixed(2)} more for free delivery!`
                      : 'You qualify for free delivery!'}
                  </p>
                  <Link to="/box-builder" className="text-xs sm:text-sm text-nitebite-yellow font-medium hover:underline">
                    Add more items
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingBox;
