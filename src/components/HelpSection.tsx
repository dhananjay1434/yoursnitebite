
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Sparkles, Clock, Box } from 'lucide-react';

const HelpSection = () => {
  return (
    <div className="py-16 sm:py-20 bg-gradient-to-b from-nitebite-midnight to-[#1A1F2C]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-nitebite-purple">How It Works</h2>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
            Choose your preferred way to get your late-night snacks delivered
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="glassmorphic-card p-4 sm:p-6 rounded-xl text-center shadow-glow"
          >
            <div className="mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-nitebite-purple/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-nitebite-purple" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-nitebite-yellow mb-2">Quick Box Selection</h3>
              <p className="text-sm sm:text-base text-white/80 mb-3 sm:mb-4">Browse our curated collection of pre-made snack boxes</p>
              <div className="space-y-2 text-xs sm:text-sm text-white/60 mb-4 sm:mb-6">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-nitebite-yellow" />
                  <span>Expertly curated combinations</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-nitebite-yellow" />
                  <span>Quick delivery in 20-30 minutes</span>
                </div>
              </div>
            </div>
            <Button className="glassmorphic-button w-full text-sm sm:text-base" asChild>
              <Link to="/snack-boxes">Browse Boxes</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="glassmorphic-card p-4 sm:p-6 rounded-xl text-center shadow-glow"
          >
            <div className="mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-nitebite-purple/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Box className="w-6 h-6 sm:w-8 sm:h-8 text-nitebite-purple" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-nitebite-yellow mb-2">Custom Box Builder</h3>
              <p className="text-sm sm:text-base text-white/80 mb-3 sm:mb-4">Create your perfect snack box from scratch</p>
              <div className="space-y-2 text-xs sm:text-sm text-white/60 mb-4 sm:mb-6">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-nitebite-yellow" />
                  <span>Choose from multiple categories</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-nitebite-yellow" />
                  <span>Customize quantities & mix</span>
                </div>
              </div>
            </div>
            <Button className="glassmorphic-button w-full text-sm sm:text-base" asChild>
              <Link to="/box-builder">Build Your Box</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;