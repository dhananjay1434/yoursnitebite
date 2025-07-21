
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

const PromoBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = useIsMobile();

  if (!isVisible) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }} 
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-[#ff5200] text-white relative overflow-hidden z-[60]"
    >
      <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 md:py-3 relative">
        <div className="flex items-center justify-center">
          <p className="text-center font-medium text-sm md:text-base">
            Use code <span className="font-bold">'BITBITE'</span> to get 25% OFF and a FREE GIFT on your first order. (only for first 20 Users)
          </p>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close banner"
        >
          <X size={isMobile ? 16 : 20} />
        </button>
      </div>
    </motion.div>
  );
};

export default PromoBanner;
