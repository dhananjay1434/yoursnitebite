import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CategoryTrackerProps {
  selectedCategories: string[];
  requiredCategoriesCount: number;
  className?: string;
  total?: number;
  onCheckout?: () => void;
  onSingleProductCheckout?: () => void; // Prop for special category single product checkout
  isCheckoutDisabled?: boolean;
  specialCategoryId?: string; // Special category ID that allows single product checkout
}

const CategoryTracker: React.FC<CategoryTrackerProps> = ({
  selectedCategories,
  requiredCategoriesCount = 2,
  className = "",
  total = 0,
  onCheckout,
  onSingleProductCheckout,
  isCheckoutDisabled = false,
  specialCategoryId = '111c97d8-a40e-4590-adaf-74ed21dba271' // Default to the specified category ID
}) => {
  const validRequiredCount = Math.max(1, requiredCategoriesCount);
  const categoryCount = selectedCategories.length;

  // Check if the special category is selected
  const hasSpecialCategory = selectedCategories.includes(specialCategoryId);

  // Determine the progress text based on category count and special category
  let progressText = '';
  let progressColor = '';

  if (categoryCount === 0) {
    progressText = `📦 Select items from at least ${validRequiredCount} different categories`;
    progressColor = 'text-nitebite-text-muted';
  } else if (hasSpecialCategory && categoryCount === 1) {
    // Special case for the specific category
    progressText = `🎯 Special category selected - Ready to add!`;
    progressColor = 'text-blue-400';
  } else if (categoryCount < validRequiredCount) {
    progressText = `🔄 ${categoryCount} of ${validRequiredCount} required categories selected - Add more items!`;
    progressColor = 'text-yellow-400';
  } else {
    progressText = `✅ ${categoryCount} categories selected - Ready to add!`;
    progressColor = 'text-green-400';
  }

  // Ensure total is a valid number
  const formattedTotal = total >= 0 ? total.toFixed(2) : '0.00';

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className={`fixed bottom-0 left-0 right-0 z-50 bg-nitebite-midnight/95 backdrop-blur-md border-t border-white/10 px-3 sm:px-4 py-4 shadow-lg ${className}`}
    >
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">

          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-nitebite-highlight font-medium text-sm sm:text-base whitespace-nowrap">
                Your Custom Box
              </span>
              <span className="text-nitebite-accent text-sm sm:text-base font-semibold">
                ₹{formattedTotal}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className={`text-xs sm:text-sm ${progressColor} font-medium`}>
                {progressText}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-nitebite-dark/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    categoryCount === 0
                      ? "w-0 bg-nitebite-text-muted/50"
                      : hasSpecialCategory
                        ? "w-full bg-blue-400"
                        : categoryCount < validRequiredCount
                          ? `w-1/2 bg-yellow-400`
                          : "w-full bg-green-400"
                  }`}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Show single product checkout for special category */}
            {hasSpecialCategory && categoryCount === 1 && onSingleProductCheckout && (
              <Button
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm py-3 px-4 sm:px-5 shrink-0 rounded-lg shadow-md"
                onClick={onSingleProductCheckout}
                disabled={isCheckoutDisabled}
                aria-label="Add single product to cart"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add Product to Cart
              </Button>
            )}

            {/*
              IMPORTANT: Single category checkout is completely removed to prevent bypassing the 2-category requirement.
              This was a loophole that allowed users to checkout with just 1 category.
            */}

            {/* Main checkout button */}
            <Button
              className={`w-full sm:w-auto text-white font-medium text-xs sm:text-sm py-3 px-4 sm:px-5 shrink-0 rounded-lg shadow-md transition-all duration-300 ${
                categoryCount >= validRequiredCount || hasSpecialCategory
                  ? "bg-gradient-to-r from-nitebite-yellow to-nitebite-accent text-black hover:opacity-90"
                  : "bg-nitebite-dark-accent/60 hover:bg-nitebite-dark-accent/80"
              }`}
              onClick={onCheckout}
              disabled={isCheckoutDisabled || (categoryCount < validRequiredCount && !hasSpecialCategory)}
              aria-label="Add custom box to cart"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add Custom Box
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryTracker;
