
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number;
  image_url: string | string[];
  image?: string;
  category?: string;
  category_id?: string;
  description?: string;
  stock_quantity: number;
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
  const addItem = useCartStore(state => state.addItem);
  
  const handleAddToCart = () => {
    if (product.stock_quantity <= 0) {
      toast.error('Sorry, this item is out of stock');
      return;
    }

    // Create product data to match CartItem type
    const productForCart = {
      id: product.id,
      name: product.name,
      price: product.price,
      original_price: product.original_price,
      image_url: typeof product.image_url === 'string' ? product.image_url : product.image_url[0],
      image: typeof product.image_url === 'string' ? product.image_url : product.image_url[0],
      category: product.category || '',
      category_id: product.category_id || '',
      description: product.description || '',
      stock_quantity: product.stock_quantity
    };
    
    addItem(productForCart);
    toast.success(`Added ${product.name} to box`);
  };

  // Calculate discount percentage
  const discountPercentage = product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ 
        scale: 1.03,
        transition: { duration: 0.3 }
      }}
      className="glassmorphic-card rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-glow group touch-manipulation"
    >
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={typeof product.image_url === 'string' ? product.image_url : product.image_url[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          width="300"
          height="300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-nitebite-dark/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-nitebite-accent text-white text-xs font-bold px-2 py-1 rounded-md">
            {discountPercentage}% OFF
          </div>
        )}

        {/* Out of Stock Badge */}
        {product.stock_quantity <= 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
            Out of Stock
          </div>
        )}
      </div>
      
      <div className="p-3 md:p-4">
        <h3 className="font-medium text-nitebite-highlight mb-1 truncate text-sm md:text-base">
          {product.name}
        </h3>
        <p className="text-nitebite-text-muted text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-nitebite-highlight font-semibold text-sm md:text-base">
              ₹{product.price.toFixed(2)}
            </span>
            {discountPercentage > 0 && (
              <span className="text-nitebite-text-muted text-xs line-through">
                ₹{product.original_price.toFixed(2)}
              </span>
            )}
          </div>
          <Button 
            size="sm" 
            className={`glassmorphic-button rounded-full h-8 w-8 p-0 flex items-center justify-center shadow-glow-sm ${
              product.stock_quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleAddToCart}
            disabled={product.stock_quantity <= 0}
            aria-label={product.stock_quantity <= 0 ? "Out of Stock" : "Add to Box"}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Stock Status */}
        {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
          <p className="text-xs text-amber-400 mt-2">
            Only {product.stock_quantity} left in stock
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
