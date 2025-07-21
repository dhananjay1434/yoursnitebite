import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, Search, ThumbsUp, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabaseClient';
import NewNavbar from '@/components/NewNavbar';
import Footer from '@/components/Footer';
import FloatingBox from '@/components/FloatingBox';
import BackToTop from '@/components/BackToTop';
import CategoryTracker from '@/components/CategoryTracker';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';
// Assuming Product type is defined here or imported globally
import { UserPreference, ScoredProduct, Product } from '../types/recommendation';
// Rename imported function to avoid naming collision
import { generateRecommendations, trackProductView as trackViewUtil } from '../utils/recommendations';
import { initUserPreferences, getCurrentUserId } from '../utils/initUserPreferences';

// Define interfaces for fetched data for better type safety
interface Category {
    id: string;
    name: string;
}

// Fetch all fields from products
const fetchProducts = async (): Promise<Product[]> => { // Add return type
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || []; // Ensure array is returned
};

// Fetch category list
const fetchCategories = async (): Promise<Category[]> => { // Add return type
  const { data, error } = await supabase
    .from('categories')
    .select('id, name');
  if (error) throw error;
  return data || []; // Ensure array is returned
};

const BoxBuilder = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [recommendedProducts, setRecommendedProducts] = useState<ScoredProduct[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreference | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const { addItem } = useCartStore();

  // UseQuery with types and error handling
  const { data: products = [], isLoading: prodLoading, error: prodError } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
  const { data: categories = [], isLoading: catLoading, error: catError } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // --- HOOKS MOVED BEFORE CONDITIONAL RETURN ---

  // Debounce search query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Compute selected categories
  const selectedCategories = useMemo(() => {
    return Array.from(
      new Set(
        Object.keys(selectedItems)
          .map(id => products.find((p) => p.id === id)?.category_id)
          .filter((categoryId): categoryId is string => !!categoryId) // Type guard
      )
    );
  }, [selectedItems, products]);

  // Compute total price
  const totalPrice = useMemo(() => {
    return Object.entries(selectedItems).reduce((sum, [id, qty]) => {
      const prod = products.find((p) => p.id === id);
      return sum + (prod ? prod.price * Number(qty) : 0);
    }, 0);
  }, [selectedItems, products]);

  // Filter products based on selected category and search query
  const filteredProducts = useMemo(() => {
    let filtered = selectedCategory
      ? products.filter((p) => p.category_id === selectedCategory)
      : products;

    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
      const searchTerms = lowerCaseQuery.split(' ').filter(term => term.length > 0);

      filtered = filtered.filter((product) => {
        const nameMatch = product.name.toLowerCase().includes(lowerCaseQuery);
        const descriptionMatch = product.description
          ? product.description.toLowerCase().includes(lowerCaseQuery)
          : false;
        const category = categories.find((c) => c.id === product.category_id);
        const categoryMatch = category
          ? category.name.toLowerCase().includes(lowerCaseQuery)
          : false;

        const allTermsMatch = searchTerms.every(term =>
          product.name.toLowerCase().includes(term) ||
          (product.description && product.description.toLowerCase().includes(term)) ||
          (category && category.name.toLowerCase().includes(term))
        );

        return nameMatch || descriptionMatch || categoryMatch || allTermsMatch;
      });
    }
    return filtered;
  }, [products, selectedCategory, debouncedSearchQuery, categories]);

  // --- END OF HOOKS MOVED ---


  // Effect to fetch user preferences
  useEffect(() => {
    const fetchUserPreferences = async () => {
      setLoadingRecommendations(true); // Start loading indicator
      try {
        const userId = await getCurrentUserId();
        const preferences = await initUserPreferences(userId);

        setUserPreferences(preferences ?? { // Provide default if null
          id: `temp-${userId || 'anonymous'}`,
          userid: userId || 'anonymous-user',
          categorypreferences: {},
          tagpreferences: {},
          viewhistory: [],
          purchasehistory: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error in user preferences setup:', err);
        setUserPreferences({ // Fallback
          id: 'temp-anonymous',
          userid: 'anonymous-user',
          categorypreferences: {},
          tagpreferences: {},
          viewhistory: [],
          purchasehistory: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } finally {
        // setLoadingRecommendations will be set to false in the *next* effect
        // Or set it here if the recommendation generation isn't strictly tied to this fetch
        // setLoadingRecommendations(false); // Option 1: Set here
      }
    };
    fetchUserPreferences();
  }, []); // Runs once on mount

  // Effect to generate recommendations
  useEffect(() => {
    // Ensure products have loaded and userPreferences are set
    if (!prodLoading && products.length > 0 && userPreferences) {
       setLoadingRecommendations(true); // Indicate loading specifically for generation
       try {
        const recommendations = generateRecommendations(products, userPreferences);
        setRecommendedProducts(recommendations);
       } catch (error) {
         console.error("Error generating recommendations:", error);
         setRecommendedProducts([]);
       } finally {
         setLoadingRecommendations(false); // Stop loading indicator
       }
    } else if (!prodLoading && products.length === 0) {
        // Handle case where products load but are empty
        setRecommendedProducts([]);
        setLoadingRecommendations(false);
    }
    // Only set loading to false here after generation attempt or if conditions not met
    // else if (!prodLoading && (!userPreferences || products.length === 0)) {
    //     setLoadingRecommendations(false); // Option 2: Set here if prefs/products not ready
    // }

  }, [products, userPreferences, prodLoading]); // Re-run when products, prefs, or loading state change


  // --- useCallback Wrappers for Functions ---

  const adjustItem = useCallback((id: string, inc: boolean) => {
    setSelectedItems((prev) => {
      const curr = prev[id] || 0;
      const product = products.find((p) => p.id === id);
      const maxQty = product?.stock_quantity ?? 0;

      if (inc && curr >= maxQty && product) {
        toast.info(`Only ${maxQty} ${product.name} in stock.`);
        return prev; // Don't change state if trying to exceed stock
      }

      const next = inc ? Math.min(curr + 1, maxQty) : Math.max(0, curr - 1);

      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  }, [products]); // Dependency: products (for stock check)

  const addSelectedItemsToCart = useCallback(() => {
    if (!Object.keys(selectedItems).length) {
      toast.error('Please add items to your box.');
      return 0;
    }

    let itemsAdded = 0;
    Object.entries(selectedItems).forEach(([itemId, quantity]) => {
      const product = products.find((p) => p.id === itemId);
      if (product && quantity > 0) {
         const categoryName = categories.find(c => c.id === product.category_id)?.name ?? 'Unknown'; // Get category name
         addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          original_price: product.original_price,
          image_url: product.image_url,
          category: categoryName, // Use fetched category name
          category_id: product.category_id,
          description: product.description,
          stock_quantity: product.stock_quantity,
          quantity: quantity
        });
        itemsAdded += Number(quantity);
      }
    });

    // Clear selected items only if items were successfully added
    if (itemsAdded > 0) {
        setSelectedItems({});
    }

    return itemsAdded;
  }, [selectedItems, products, categories, addItem]); // Dependencies

  const trackProductView = useCallback(async (productId: string) => {
    if (!userPreferences) {
        console.warn("trackProductView called before userPreferences loaded.");
        return;
    }

    try {
      const viewedProduct = products.find((p) => p.id === productId);
      if (!viewedProduct) return;

      // Use renamed utility function
      const updatedPreferences = trackViewUtil(productId, viewedProduct, userPreferences);

      // Optimistic UI update
      setUserPreferences(updatedPreferences);

      // Update DB asynchronously
      const updateDb = async () => {
          if (userPreferences.id.startsWith('temp-')) {
              const { error: insertError } = await supabase
                  .from('user_preferences')
                  .insert([{
                      userid: userPreferences.userid,
                      viewhistory: updatedPreferences.viewhistory,
                      categorypreferences: updatedPreferences.categorypreferences,
                      tagpreferences: updatedPreferences.tagpreferences,
                      purchasehistory: updatedPreferences.purchasehistory,
                      created_at: updatedPreferences.created_at,
                      updated_at: updatedPreferences.updated_at
                  }]);
              if (insertError) console.error('Error inserting user preferences:', insertError);
              // Optionally fetch the real ID after insert if needed elsewhere
          } else {
              const { error: updateError } = await supabase
                  .from('user_preferences')
                  .update({
                      viewhistory: updatedPreferences.viewhistory,
                      categorypreferences: updatedPreferences.categorypreferences,
                      tagpreferences: updatedPreferences.tagpreferences, // Make sure tags are updated
                      updated_at: updatedPreferences.updated_at
                  })
                  .eq('userid', userPreferences.userid);
              if (updateError) console.error('Error updating user preferences:', updateError);
          }
          // The useEffect watching userPreferences will trigger recommendation regeneration
      };
      updateDb(); // Fire and forget

    } catch (err) {
      console.error('Error tracking product view:', err);
    }
  }, [userPreferences, products]); // Dependencies


  // Define special category ID clearly
  const specialCategoryId = '111c97d8-a40e-4590-adaf-74ed21dba271';

  const handleAddSingleProductCheckout = useCallback(() => {
    const categoryCount = selectedCategories.length; // Use derived state
    const hasSpecialCategory = selectedCategories.includes(specialCategoryId); // Use derived state

    if (!Object.keys(selectedItems).length) {
      toast.error('Please add items to your box.');
      return;
    }
    if (!hasSpecialCategory) {
      toast.error('Special category items not selected.');
      return;
    }
    if (categoryCount !== 1) {
      toast.error('Only special category items can be added with this option.');
      return;
    }

    const hasNonSpecialItems = Object.keys(selectedItems).some(itemId => {
      const product = products.find((p) => p.id === itemId);
      return product && product.category_id !== specialCategoryId;
    });

    if (hasNonSpecialItems) {
      toast.error('Your box contains non-special category items. Please remove them first.');
      return;
    }

    const itemsAdded = addSelectedItemsToCart(); // This now clears selectedItems on success
    if (itemsAdded > 0) {
      toast.success(`${itemsAdded} special items added to your cart!`);
      navigate('/checkout');
    }
  }, [selectedItems, selectedCategories, products, specialCategoryId, addSelectedItemsToCart, navigate]); // Dependencies

  const handleAddBox = useCallback(() => {
    const categoryCount = selectedCategories.length; // Use derived state
    const hasSpecialCategory = selectedCategories.includes(specialCategoryId); // Use derived state
    const hasMinCats = categoryCount >= 2; // Use derived state

    if (!Object.keys(selectedItems).length) {
      toast.error('Please add items to your box.');
      return;
    }

    // Handle special category ONLY if it's the single selected category
    if (hasSpecialCategory && categoryCount === 1) {
      handleAddSingleProductCheckout(); // Delegate
      return;
    }

    // Enforce 2+ categories for regular boxes
    if (!hasMinCats) {
      const neededCategories = 2 - categoryCount;
      toast.error('Please select items from at least 2 different categories.');
      toast.info(`You need items from ${neededCategories} more ${neededCategories === 1 ? 'category' : 'categories'}.`);
      return;
    }

    const itemsAdded = addSelectedItemsToCart(); // This now clears selectedItems on success
    if (itemsAdded > 0) {
      toast.success(`${itemsAdded} items added to your custom box!`);
      navigate('/checkout');
    }
  }, [selectedItems, selectedCategories, specialCategoryId, handleAddSingleProductCheckout, addSelectedItemsToCart, navigate]); // Dependencies


  // --- Loading and Error States ---

  if (prodLoading || catLoading) {
    return (
      <>
        <NewNavbar transparent={false} />
        <div className="min-h-screen bg-nitebite-midnight flex items-center justify-center pt-20">
            <div className="w-16 h-16 border-4 border-nitebite-accent rounded-full animate-spin border-t-transparent"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (prodError || catError) {
    return (
      <>
        <NewNavbar transparent={false} />
        <div className="min-h-screen bg-nitebite-midnight flex flex-col items-center justify-center text-center px-4 pt-20">
           <div className="p-6 bg-nitebite-dark rounded-lg shadow-xl max-w-lg w-full">
              <h2 className="text-2xl font-bold text-red-500 mb-4">Oops! Something went wrong.</h2>
              <p className="text-nitebite-text-muted mb-6">We couldn't load the necessary data. Please check your connection and try again later.</p>
              {(prodError || catError) && ( // Only show error details if they exist
                  <pre className="text-xs text-left bg-black/20 p-3 rounded overflow-auto max-h-40 text-red-300 mb-6">
                     {prodError?.message || catError?.message || 'An unknown error occurred.'}
                  </pre>
              )}
              <Button onClick={() => window.location.reload()} className="bg-nitebite-accent text-black hover:bg-nitebite-accent/90">
                  Reload Page
              </Button>
           </div>
        </div>
        <Footer />
      </>
    );
  }

  // --- Component JSX ---

  // Derive state inside component body after hooks and loading checks
  const categoryCount = selectedCategories.length;
  const hasSpecialCategory = selectedCategories.includes(specialCategoryId);
  const hasMinCats = categoryCount >= 2; // Define hasMinCats here based on current categoryCount

  return (
    <>
      <NewNavbar transparent={false} />
      <div className="min-h-screen bg-nitebite-midnight pt-28 pb-48 sm:pb-32 px-4 w-full"> {/* Increased bottom padding */}

        {/* Back & Search */}
        <div className="flex items-center mb-6 space-x-2 sm:space-x-4">
          <Button variant="ghost" onClick={() => navigate(-1)} aria-label="Go back" className="flex-shrink-0">
            <ArrowLeft size={20} />
          </Button>
          <div className="relative flex-1">
            <input
              type="search" // Use type="search" for better semantics & potential browser features
              placeholder="Search snacks..."
              value={searchQuery}
              className="w-full pl-4 pr-10 py-2 bg-nitebite-dark rounded-full focus:outline-none focus:ring-2 focus:ring-nitebite-accent text-white transition-all text-sm sm:text-base"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              aria-label="Search products"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none p-1 rounded-full hover:bg-nitebite-dark-accent/50 transition-colors"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            ) : (
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col space-y-3 mb-8">
          {/* Scrollable Category Buttons */}
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-nitebite-dark-accent scrollbar-track-nitebite-dark/50">
            <Button
              variant={selectedCategory === null ? 'solid' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              className="min-w-max flex-shrink-0"
              size="sm" // Smaller buttons for horizontal list
            >
              All Categories
            </Button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const isInBox = selectedCategories.includes(cat.id);
              return (
                <Button
                  key={cat.id}
                  variant={isSelected ? 'solid' : 'outline'}
                  onClick={() => setSelectedCategory(cat.id)}
                  size="sm" // Smaller buttons
                  className={`min-w-max relative flex-shrink-0 transition-all duration-200 ${
                    isInBox ? 'border-2 border-nitebite-accent ring-1 ring-nitebite-accent/50' : ''
                  }`}
                >
                  {cat.name}
                  {isInBox && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-nitebite-accent rounded-full border-2 border-nitebite-midnight flex items-center justify-center text-black text-[8px] font-bold">
                      ✓
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Selected Categories Summary */}
          {selectedCategories.length > 0 && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-nitebite-dark/50 backdrop-blur-sm rounded-lg p-2 px-3 text-xs text-white/70 flex items-center flex-wrap gap-y-1 overflow-hidden"
            >
              <span className="mr-2 font-medium whitespace-nowrap">Box Categories:</span>
              <div className="flex flex-wrap gap-1">
                {selectedCategories.map((catId) => {
                  const category = categories.find((c) => c.id === catId);
                  return category ? (
                    <span key={catId} className="bg-nitebite-dark-accent/60 px-2 py-0.5 rounded-full text-white/95 text-[11px] whitespace-nowrap">
                      {category.name}
                    </span>
                  ) : null;
                })}
              </div>
            </motion.div>
          )}
        </div>

         {/* Search results indicator */}
        {debouncedSearchQuery && debouncedSearchQuery.trim() && (
           <motion.div
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: 'auto' }}
             exit={{ opacity: 0, height: 0 }}
             className="mb-6 flex items-center justify-between overflow-hidden"
           >
            <div className="flex items-center">
              <span className="text-white font-medium text-sm sm:text-base">
                {isSearching ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-2 border-nitebite-accent rounded-full animate-spin border-t-transparent mr-2"></div>
                    Searching...
                  </span>
                ) : (
                  <span>
                    Found <span className="text-nitebite-accent font-bold">{filteredProducts.length}</span> results for "{debouncedSearchQuery}"
                  </span>
                )}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="text-xs text-nitebite-accent hover:text-nitebite-accent/80"
            >
              Clear search
            </Button>
          </motion.div>
        )}


        {/* Helper message for category selection */}
        {categoryCount === 1 && selectedCategories.length > 0 && !hasSpecialCategory && (!debouncedSearchQuery || !debouncedSearchQuery.trim()) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-nitebite-accent/10 border border-nitebite-accent/30 rounded-lg p-4 mb-6 text-white"
          >
            <h3 className="font-semibold text-nitebite-accent mb-1">Almost there!</h3>
            <p className="text-sm">
              You need items from at least <span className="font-bold">one more category</span> to create your custom box.
              Look for products with the <span className="bg-nitebite-accent text-black px-1.5 py-0.5 rounded-full text-xs mx-1 inline-flex items-center"><Plus size={10} className="mr-0.5"/> New Category</span> badge.
            </p>
          </motion.div>
        )}

         {/* No Results Message */}
        {filteredProducts.length === 0 && debouncedSearchQuery && debouncedSearchQuery.trim() && !isSearching && (
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-nitebite-dark/60 backdrop-blur-sm rounded-xl p-8 my-8 text-center border border-nitebite-dark-accent/30"
          >
            <div className="text-5xl mb-4">🤷‍♂️</div>
            <h3 className="text-xl font-bold text-white mb-2">No snacks found</h3>
            <p className="text-nitebite-text-muted mb-6">
              We couldn't find anything matching "{debouncedSearchQuery}".
              <br />Maybe try a different search?
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                className="bg-nitebite-accent/10 hover:bg-nitebite-accent/20 border-nitebite-accent/30"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
              <Button
                className="bg-nitebite-accent hover:bg-nitebite-accent/90 text-black"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                View all products
              </Button>
            </div>
          </motion.div>
        )}

        {/* Products Grid - Hide if no results AND searching */}
        {!(filteredProducts.length === 0 && debouncedSearchQuery && debouncedSearchQuery.trim()) && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="bg-nitebite-dark relative overflow-hidden group flex flex-col border border-transparent hover:border-nitebite-dark-accent/50 transition-colors duration-200">
                <CardContent className="p-3 sm:p-4 flex flex-col flex-grow">
                  {/* Badges & Image Container */}
                  <div className="relative mb-2">
                    {/* Badges */}
                    <div className="absolute top-1.5 left-1.5 right-1.5 flex flex-col items-start gap-1 z-10 pointer-events-none">
                        {product.is_featured && (
                           <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold shadow pointer-events-auto">
                               Featured
                           </span>
                        )}
                         {/* Show "New Category" badge if needed (and not the special one implicitly) */}
                        {categoryCount === 1 && !selectedCategories.includes(product.category_id) && product.category_id !== specialCategoryId && (
                           <span className="bg-nitebite-accent text-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] flex items-center font-medium shadow pointer-events-auto">
                               <Plus size={10} className="mr-0.5" />
                               New Category
                           </span>
                        )}
                         {/* Discount Badge */}
                        {product.original_price > product.price && (
                            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold shadow pointer-events-auto">
                                {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                            </span>
                        )}
                    </div>
                    {/* Image */}
                    <img
                       src={product.image_url || '/placeholder.png'} // Added placeholder fallback
                       alt={product.name}
                       className="w-full aspect-[4/3] object-cover rounded-md transition-transform duration-300 group-hover:scale-105 bg-nitebite-dark-accent/20" // Background for loading/missing image
                       loading="lazy"
                       onError={(e) => (e.currentTarget.src = '/placeholder.png')} // Handle broken images
                    />
                 </div>

                  {/* Text Content */}
                  <div className="flex flex-col flex-grow justify-between">
                     <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-2 mb-1">{product.name}</h3>
                        {/* Category Name (Optional) */}
                        {categories.find(c => c.id === product.category_id)?.name && (
                           <p className="text-xs text-nitebite-accent/80 mb-1 line-clamp-1">
                              {categories.find(c => c.id === product.category_id)?.name}
                           </p>
                        )}
                     </div>

                     <div>
                         {/* Pricing */}
                         <div className="mt-1 flex items-baseline space-x-1 sm:space-x-2">
                           <span className="text-base sm:text-lg text-white font-bold">
                             ₹{product.price.toFixed(2)}
                           </span>
                           {product.original_price > product.price && (
                             <span className="text-gray-500 text-xs sm:text-sm line-through">
                               ₹{product.original_price.toFixed(2)}
                             </span>
                           )}
                         </div>

                         {/* Stock */}
                         <p className={`text-xs mt-1 ${product.stock_quantity < 10 && product.stock_quantity > 0 ? 'text-orange-400' : 'text-gray-500'} ${product.stock_quantity <= 0 ? 'text-red-500 font-semibold' : ''}`}>
                           {product.stock_quantity > 0 ? `${product.stock_quantity} left` : 'Out of Stock'}
                         </p>

                         {/* Quantity Controls */}
                         <div className="mt-2 sm:mt-3 h-9 sm:h-10 flex items-center justify-between"> {/* Fixed height container */}
                           {product.stock_quantity > 0 ? (
                              <>
                                 {(!selectedItems[product.id] || selectedItems[product.id] === 0) ? (
                                    // Show "Add" button if quantity is 0
                                    <Button
                                       variant="secondary"
                                       size="sm"
                                       className="w-full bg-gradient-to-r from-nitebite-yellow to-nitebite-accent text-black font-medium hover:opacity-90 text-xs sm:text-sm"
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          adjustItem(product.id, true);
                                          toast.success(`${product.name} added to box!`);
                                          trackProductView(product.id);
                                       }}
                                       title="Add to your box"
                                       disabled={product.stock_quantity <= 0} // Double check disabled state
                                    >
                                       <Plus size={16} className="mr-1"/> Add
                                    </Button>
                                 ) : (
                                    // Show quantity controls if quantity > 0
                                    <div className="flex items-center justify-between w-full">
                                       <Button
                                          variant="outline"
                                          size="icon"
                                          className="w-8 h-8 sm:w-9 sm:h-9 border-nitebite-dark-accent hover:bg-nitebite-dark-accent/50"
                                          onClick={(e) => { e.stopPropagation(); adjustItem(product.id, false); }}
                                          disabled={!selectedItems[product.id] || selectedItems[product.id] === 0}
                                          aria-label={`Decrease quantity of ${product.name}`}
                                       >
                                          <Minus size={14} />
                                       </Button>
                                       <span className="text-white text-sm sm:text-base font-medium w-8 text-center" aria-live="polite">
                                          {selectedItems[product.id]}
                                       </span>
                                       <Button
                                          variant="outline"
                                          size="icon"
                                          className="w-8 h-8 sm:w-9 sm:h-9 border-nitebite-dark-accent hover:bg-nitebite-dark-accent/50"
                                          onClick={(e) => { e.stopPropagation(); adjustItem(product.id, true); }}
                                          disabled={(selectedItems[product.id] || 0) >= product.stock_quantity}
                                          aria-label={`Increase quantity of ${product.name}`}
                                       >
                                          <Plus size={14} />
                                       </Button>
                                    </div>
                                 )}
                              </>
                           ) : (
                               <span className="text-sm text-red-500 font-medium w-full text-center">Out of Stock</span>
                           )}
                         </div>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}


         {/* Empty Box Message - show only when no items selected AND not searching */}
        {Object.keys(selectedItems).length === 0 && (!debouncedSearchQuery || !debouncedSearchQuery.trim()) && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="bg-nitebite-dark/50 backdrop-blur-sm rounded-xl p-6 mt-8 text-center border border-nitebite-accent/20"
           >
            <ShoppingCart size={32} className="mx-auto mb-3 text-nitebite-accent" />
            <h3 className="text-xl font-bold text-white mb-2">Your Custom Box</h3>
            <p className="text-nitebite-text-muted mb-4">Your box is empty. Add some snacks to get started!</p>
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="bg-nitebite-accent/10 hover:bg-nitebite-accent/20 border-nitebite-accent/30"
                onClick={() => {
                    const recs = document.getElementById('recommendations');
                    if (recs) {
                        recs.scrollIntoView({ behavior: 'smooth' });
                    } else {
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }}
              >
                <Sparkles size={16} className="mr-2" />
                {loadingRecommendations || recommendedProducts.length > 0 ? 'Browse Recommendations' : 'Browse Products'}
              </Button>
            </div>
          </motion.div>
        )}


        {/* Recommendations Section */}
        <div id="recommendations" className="mt-12 mb-24 scroll-mt-24"> {/* Added scroll-mt */}
           <div className="flex items-center justify-between mb-4 px-1">
             <h2 className="text-xl font-bold text-white flex items-center">
               <ThumbsUp size={20} className="mr-2 text-nitebite-accent" />
               Recommended For You
             </h2>
             {/* Link to clear search and category filters */}
             <Button
                variant="link"
                onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                className="text-nitebite-accent text-sm"
             >
               View All Products
             </Button>
           </div>

           {loadingRecommendations ? (
             <div className="flex justify-center items-center py-12 bg-nitebite-dark/30 rounded-lg">
               <div className="w-8 h-8 border-4 border-nitebite-accent rounded-full animate-spin border-t-transparent"></div>
               <span className="ml-3 text-white/80">Personalizing recommendations...</span>
             </div>
           ) : recommendedProducts.length === 0 && userPreferences ? (
             <div className="bg-nitebite-dark/50 backdrop-blur-sm rounded-xl p-6 text-center border border-nitebite-dark-accent/20">
                <Sparkles size={24} className="mx-auto mb-3 text-nitebite-accent/70"/>
                <p className="text-white mb-4">We're still learning your tastes! Keep browsing to get personalized recommendations.</p>
                <Button
                    variant="outline"
                    className="bg-nitebite-accent/10 hover:bg-nitebite-accent/20 border-nitebite-accent/30"
                    onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                >
                    Browse All Products
                </Button>
             </div>
           ) : recommendedProducts.length > 0 ? (
                <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-nitebite-dark-accent scrollbar-track-nitebite-dark/50">
                <div className="flex space-x-4" style={{ minWidth: 'max-content' }}>
                    {recommendedProducts.map((recProduct) => (
                    <Card
                        key={`rec-${recProduct.id}`}
                        className="bg-nitebite-dark relative hover:bg-nitebite-dark-accent/20 transition-colors duration-200 border border-transparent hover:border-nitebite-accent/30 cursor-pointer group flex flex-col" // Added flex
                        style={{ width: '200px', flexShrink: 0 }}
                        onClick={() => trackProductView(recProduct.id)} // Track view on card click
                    >
                        <CardContent className="p-3 flex flex-col flex-grow"> {/* Adjusted padding */}
                         {/* Image & Badges */}
                         <div className="relative mb-2">
                            {/* Recommendation Score Badge (Debug) */}
                            {process.env.NODE_ENV === 'development' && recProduct.recommendationScore && (
                                <span className="absolute top-1 right-1 bg-blue-600 text-white px-1.5 py-0.5 rounded text-[9px] z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                                Score: {recProduct.recommendationScore.toFixed(1)}
                                </span>
                            )}
                            {/* Discount Badge */}
                            {recProduct.original_price > recProduct.price && (
                                <span className="absolute top-1 left-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px] font-semibold shadow z-10">
                                    {Math.round(((recProduct.original_price - recProduct.price) / recProduct.original_price) * 100)}% OFF
                                </span>
                            )}
                            <img
                                src={recProduct.image_url || '/placeholder.png'}
                                alt={recProduct.name}
                                className="w-full aspect-[4/3] object-cover rounded-md mb-2 transition-transform duration-300 group-hover:scale-105 bg-nitebite-dark-accent/20"
                                loading="lazy"
                                onError={(e) => (e.currentTarget.src = '/placeholder.png')}
                            />
                         </div>

                         {/* Text Content */}
                         <div className="flex flex-col flex-grow justify-between">
                             <div>
                                <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">{recProduct.name}</h3>
                                {categories.find((c) => c.id === recProduct.category_id)?.name && (
                                    <p className="text-xs text-nitebite-accent/80 mt-1 line-clamp-1">
                                    {categories.find((c) => c.id === recProduct.category_id)?.name}
                                    </p>
                                )}
                             </div>

                             <div>
                                <div className="mt-1 flex items-baseline space-x-1">
                                    <span className="text-base text-white font-bold">
                                    ₹{recProduct.price.toFixed(2)}
                                    </span>
                                    {recProduct.original_price > recProduct.price && (
                                    <span className="text-gray-500 text-xs line-through">
                                        ₹{recProduct.original_price.toFixed(2)}
                                    </span>
                                    )}
                                </div>
                                {/* Stock not usually shown on recommendations, but kept for consistency if desired */}
                                {/* <p className={`text-xs mt-1 ...`}>{...}</p> */}

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full mt-2 bg-gradient-to-r from-nitebite-yellow to-nitebite-accent text-black font-medium hover:opacity-90 text-xs"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        adjustItem(recProduct.id, true);
                                        toast.success(`${recProduct.name} added to box!`);
                                        trackProductView(recProduct.id);
                                    }}
                                    disabled={recProduct.stock_quantity <= 0 || (selectedItems[recProduct.id] || 0) >= recProduct.stock_quantity}
                                >
                                    {recProduct.stock_quantity <= 0 ? 'Out of Stock' : (
                                        <> <Plus size={14} className="mr-1" /> Add to Box </>
                                    )}
                                </Button>
                             </div>
                         </div>
                        </CardContent>
                    </Card>
                    ))}
                </div>
                </div>
           ) : null }

           {/* Recommendation explanation */}
           {recommendedProducts.length > 0 && (
                <div className="mt-6 bg-nitebite-dark/30 backdrop-blur-sm rounded-lg p-3 px-4 text-xs text-white/60 italic">
                    <p>✨ Recommendations are personalized based on your activity.</p>
                </div>
            )}
         </div>

        {/* Category Tracker & Checkout - Fixed at bottom */}
        <CategoryTracker
          selectedCategories={selectedCategories}
          requiredCategoriesCount={2}
          total={totalPrice}
          onCheckout={handleAddBox}
          onSingleProductCheckout={handleAddSingleProductCheckout}
          // Checkout button should be disabled if the box is empty OR if the conditions aren't met (handled inside CategoryTracker potentially, or pass explicitly)
          isCheckoutDisabled={Object.keys(selectedItems).length === 0}
          specialCategoryId={specialCategoryId}
        />

      </div>
      <FloatingBox />
      <BackToTop />
      <Footer />
    </>
  );
};

export default BoxBuilder;