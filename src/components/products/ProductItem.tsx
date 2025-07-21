
import React from 'react';
import { Button } from '@/components/ui/button';
import { Product } from '@/components/ProductCard';
import { useCartStore } from '@/store/cartStore';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface ProductItemProps {
  product: Product;
  index: number;
}

const ProductItem: React.FC<ProductItemProps> = ({ product, index }) => {
  const addItem = useCartStore(state => state.addItem);
  
  const handleAddToCart = async () => {
    // Check stock availability first
    const { data: currentProduct } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', product.id)
      .single();

    if (!currentProduct || currentProduct.stock_quantity <= 0) {
      toast.error('Sorry, this item is out of stock');
      return;
    }

    // Ensure we're passing the first image URL as a string
    const imageUrl = Array.isArray(product.image_url) 
      ? product.image_url[0] 
      : product.image_url;

    // Create product data to match CartItem type
    const productForCart = {
      id: product.id,
      name: product.name,
      price: product.price,
      original_price: product.original_price,
      image_url: imageUrl,
      image: imageUrl,
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <div className="bg-nitebite-dark-accent/30 rounded-lg overflow-hidden border border-white/5 h-full flex flex-col">
        <div className="relative pt-[90%] md:pt-[80%]">
          <img 
            src={Array.isArray(product.image_url) ? product.image_url[0] : product.image_url}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Discount badge */}
          {discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-nitebite-accent text-white text-xs px-2 py-1 rounded-md font-bold">
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
        
        <div className="p-2 flex-1 flex flex-col">
          <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.name}</h3>
          
          <div className="mt-auto flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-nitebite-highlight font-semibold">₹{product.price.toFixed(2)}</span>
              {discountPercentage > 0 && (
                <span className="text-nitebite-text-muted text-xs line-through">
                  ₹{product.original_price.toFixed(2)}
                </span>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className={`h-8 border-green-500 text-green-500 hover:bg-green-500/10 min-w-[60px] px-2 truncate ${
                product.stock_quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0}
            >
              {product.stock_quantity <= 0 ? 'OUT OF STOCK' : 'ADD'}
            </Button>

            {/* Stock Status */}
            {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
              <p className="text-xs text-amber-400">
                Only {product.stock_quantity} left in stock
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductItem;
