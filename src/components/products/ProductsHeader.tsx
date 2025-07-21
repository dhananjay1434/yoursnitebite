
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductsHeaderProps {
  onSearch: (query: string) => void;
  initialSearchQuery?: string;
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({ onSearch, initialSearchQuery = '' }) => {
  const navigate = useNavigate();
  const itemCount = useCartStore(state => state.getItemCount());
  const [isSearchOpen, setIsSearchOpen] = useState(!!initialSearchQuery);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
      onSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-50 glassmorphic-panel px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="glassmorphic-ghost-button rounded-full"
            onClick={() => navigate('/')}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {!isSearchOpen && (
            <div className="flex flex-col">
              <h1 className="text-lg font-bold">Delivery in minutes</h1>
              <p className="text-xs text-nitebite-text-muted flex items-center">
                Your location <span className="ml-1">▼</span>
              </p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              exit={{ opacity: 0, width: 0 }}
              className="absolute left-0 right-0 px-4 flex items-center"
            >
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="glassmorphic-ghost-button rounded-full"
            onClick={toggleSearch}
            aria-label={isSearchOpen ? "Close search" : "Search"}
          >
            {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="glassmorphic-ghost-button rounded-full relative"
            onClick={() => navigate('/checkout')}
            aria-label="Go to cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-nitebite-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default ProductsHeader;
