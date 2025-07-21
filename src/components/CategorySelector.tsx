
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { getCategoryIcon } from './products/utils';

interface Category {
  id: string;
  name: string;
}

const categories: Category[] = [
  { id: 'chips', name: 'Chips' },
  { id: 'drinks', name: 'Drinks' },
  { id: 'coffee', name: 'Coffee' },
  { id: 'chocolate', name: 'Chocolate' },
  { id: 'biscuits', name: 'Biscuits' },
];

const CategorySelector: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('chips');
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Navigate to products page with the selected category
    navigate(`/products?category=${categoryId}`);
  };

  return (
    <div id="category-section" className="py-12 md:py-20 bg-gradient-to-b from-nitebite-dark to-nitebite-dark-accent">
      <div className="page-container">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 animate-fade-in text-gradient-accent">
            Browse Categories
          </h2>
          <p className="text-nitebite-text-muted max-w-2xl mx-auto text-sm md:text-base animate-fade-in" 
             style={{ animationDelay: '100ms' }}>
            Find your midnight cravings from our curated collection
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={{
                ...category,
                icon: getCategoryIcon(category.id)
              }}
              isSelected={selectedCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface CategoryCardProps {
  category: Category & { icon: string };
  isSelected: boolean;
  onClick: () => void;
  delay: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, isSelected, onClick, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.5 }}
      onClick={onClick}
      className={cn(
        "relative p-5 md:p-7 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden touch-manipulation group",
        isSelected
          ? "glassmorphic-card shadow-glow border-nitebite-accent border-2"
          : "bg-nitebite-dark/70 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:translate-y-[-5px]"
      )}
    >
      <div className="text-center">
        <span className="text-4xl md:text-5xl mb-3 md:mb-4 block transition-transform duration-300 group-hover:scale-110">
          {category.icon}
        </span>
        <h3 className={cn(
          "text-sm md:text-base font-medium transition-colors duration-300",
          isSelected ? "text-nitebite-highlight" : "text-nitebite-text group-hover:text-nitebite-highlight"
        )}>
          {category.name}
        </h3>
      </div>
      
      {isSelected && (
        <motion.div
          layoutId="selectedCategory"
          className="absolute inset-0 bg-nitebite-accent/10 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
};

export default CategorySelector;
