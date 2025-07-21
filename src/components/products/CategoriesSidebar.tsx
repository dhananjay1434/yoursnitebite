
import React, { useEffect } from 'react';
import CategoryButton from './CategoryButton';
import { motion } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoriesSidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const CategoriesSidebar: React.FC<CategoriesSidebarProps> = ({ 
  categories, 
  selectedCategory, 
  onCategorySelect 
}) => {
  // Force a re-render when selectedCategory changes
  useEffect(() => {
    // This effect ensures the sidebar updates when the selectedCategory changes
  }, [selectedCategory]);
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-20 md:w-24 flex-shrink-0 overflow-y-auto bg-gradient-to-b from-nitebite-dark to-nitebite-dark-accent border-r border-white/5"
    >
      <div className="py-4 flex flex-col items-center gap-4">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <CategoryButton
              category={category}
              isSelected={selectedCategory === category.id}
              onClick={() => onCategorySelect(category.id)}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CategoriesSidebar;
