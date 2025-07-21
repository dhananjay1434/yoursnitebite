
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { useProducts, useCategories } from '@/hooks/use-products';
import ProductsHeader from '@/components/products/ProductsHeader';
import CategoriesSidebar from '@/components/products/CategoriesSidebar';
import ProductsList from '@/components/products/ProductsList';
import PromoBanner from '@/components/PromoBanner';
import type { Product } from '@/components/ProductCard';

const Products = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryFromUrl = queryParams.get('category');
  const searchFromUrl = queryParams.get('search');

  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryFromUrl || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchFromUrl || ''
  );
  const navigate = useNavigate();
  const itemCount = useCartStore((state) => state.getItemCount());

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: productsData = [], isLoading: productsLoading } = useProducts(selectedCategory);

  // Watch for URL changes to update selected category and search query
  useEffect(() => {
    // Update category if present in URL
    if (categoryFromUrl && categories.some(cat => cat.id === categoryFromUrl)) {
      setSelectedCategory(categoryFromUrl);
    }

    // Update search query if present in URL
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [categoryFromUrl, searchFromUrl, location.search, categories]);

  // Filter products based on search query
  const filteredProducts = searchQuery
    ? productsData.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : productsData;

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery(''); // Clear search when changing category

    // Update URL to reflect category change
    const newUrl = `/products?category=${categoryId}`;
    navigate(newUrl, { replace: true });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Update URL to reflect search query
    if (query.trim()) {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }
      params.set('search', query);
      navigate(`/products?${params.toString()}`, { replace: true });
    } else if (selectedCategory) {
      // If search is cleared but category is selected, keep category in URL
      navigate(`/products?category=${selectedCategory}`, { replace: true });
    } else {
      // If both search and category are cleared, remove all params
      navigate('/products', { replace: true });
    }
  };

  // Get the title for the product list
  const listTitle = searchQuery
    ? `Search results for "${searchQuery}"`
    : selectedCategory
    ? categories.find(c => c.id === selectedCategory)?.name || 'Products'
    : 'All Products';

  if (categoriesLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-nitebite-midnight flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-nitebite-purple rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  // Make sure we have original_price for all products
  const products: Product[] = filteredProducts.map(product => ({
    ...product,
    original_price: product.original_price || product.price // Ensure original_price is always present
  }));

  return (
    <div className="flex flex-col min-h-screen bg-nitebite-midnight">
      <PromoBanner />
      <ProductsHeader
        onSearch={handleSearch}
        initialSearchQuery={searchQuery}
      />

      <div className="flex-1 flex overflow-hidden">
        <CategoriesSidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />

        <ProductsList
          products={products}
          title={listTitle}
          isSearching={!!searchQuery}
        />
      </div>

      {/* Sticky "Add to Box" button for mobile */}
      <div className="fixed bottom-5 right-5 z-40 md:hidden">
        <Button
          onClick={() => navigate('/checkout')}
          className="glassmorphic-button rounded-full w-14 h-14 flex items-center justify-center shadow-yellow-glow"
          aria-label="Go to cart"
        >
          <ShoppingBag className="h-6 w-6" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-nitebite-midnight text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Products;
