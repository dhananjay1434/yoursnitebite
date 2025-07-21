
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ProductItem from './ProductItem';
import { Product } from '@/components/ProductCard';

interface ProductsListProps {
  products: Product[];
  title?: string;
  isSearching?: boolean;
}

const ProductsList: React.FC<ProductsListProps> = ({ 
  products, 
  title, 
  isSearching = false 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto px-3 py-4"
    >
      <h2 className="text-xl font-semibold mb-4 text-nitebite-highlight">
        {title || 'Products'}
      </h2>
      
      {products.length === 0 && (
        <div className="text-center py-10">
          <p className="text-nitebite-text-muted">
            {isSearching ? 'No products found matching your search' : 'No products available in this category'}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Change AnimatePresence from mode="wait" to avoid warnings with multiple children */}
        <AnimatePresence>
          {products.map((product, index) => (
            <ProductItem 
              key={product.id} 
              product={product} 
              index={index} 
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ProductsList;
