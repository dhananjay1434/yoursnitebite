import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Info } from 'lucide-react';

// Define TypeScript interface for category data
interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  link: string;
  products?: number;
}

const categories: Category[] = [
  {
    id: 'chips',
    name: 'Chips & Crisps',
    description: 'Crunchy snacks for movie nights',
    icon: '🍟',
    color: 'from-orange-600 to-orange-800',
    link: '/products?category=chips',
    products: 24
  },
  {
    id: 'chocolates',
    name: 'Chocolates',
    description: 'Sweet treats for your cravings',
    icon: '🍫',
    color: 'from-amber-700 to-amber-900',
    link: '/products?category=chocolates',
    products: 18
  },
  {
    id: 'drinks',
    name: 'Energy Drinks',
    description: 'Stay awake and energized',
    icon: '🥤',
    color: 'from-blue-600 to-blue-800',
    link: '/products?category=drinks',
    products: 15
  },
  {
    id: 'instant',
    name: 'Instant Meals',
    description: 'Quick and filling options',
    icon: '🍜',
    color: 'from-red-600 to-red-800',
    link: '/products?category=instant',
    products: 12
  }
];

const FeaturedCategories: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="section-spacing bg-gradient-to-b from-nitebite-dark-accent/30 to-nitebite-midnight w-full relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-b from-nitebite-yellow/5 to-transparent"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-nitebite-yellow/5 blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-nitebite-purple/5 blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 md:mb-0">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-nitebite-yellow/50"></div>
              <span className="text-nitebite-yellow font-medium uppercase text-xs tracking-wider">Shop By Category</span>
            </div>
            <h2 className="section-title mb-2">
              Browse Categories
            </h2>
            <p className="text-white/70 max-w-2xl text-base sm:text-lg">
              Explore our wide range of late-night essentials
            </p>
          </div>
          <Button
            variant="outline"
            className="text-nitebite-yellow border-nitebite-yellow/30 hover:bg-nitebite-yellow/10 rounded-full py-2.5 px-5"
            asChild
          >
            <Link to="/products" className="flex items-center gap-2">
              View All Categories <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
              transition={{ duration: 0.6, delay: isLoaded ? index * 0.1 : 0 }}
              className="relative overflow-hidden rounded-xl h-full"
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
            >
              <Link to={category.link} className="block h-full">
                <div
                  className={`bg-gradient-to-br ${category.color} h-full p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col relative overflow-hidden group ${
                    hoveredCategory === category.id ? 'ring-2 ring-white/30' : ''
                  }`}
                >
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform translate-x-8 -translate-y-8 group-hover:translate-x-6 group-hover:-translate-y-6 transition-transform duration-700"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/20 rounded-full blur-xl transform -translate-x-8 translate-y-8 group-hover:-translate-x-6 group-hover:translate-y-6 transition-transform duration-700"></div>

                  {/* Product count badge */}
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white">
                    {category.products} products
                  </div>

                  <div className="flex flex-col h-full relative z-10">
                    <div className="flex items-center justify-center h-20 sm:h-24 mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-md transform scale-75 group-hover:scale-100 transition-transform duration-500"></div>
                        <span className="text-5xl sm:text-6xl relative transform group-hover:scale-110 transition-transform duration-500">{category.icon}</span>
                      </div>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 min-h-[2rem] sm:min-h-[2.5rem] group-hover:text-white/90 transition-colors duration-300">{category.name}</h3>
                    <p className="text-white/70 text-sm sm:text-base mb-6 flex-grow min-h-[3rem] group-hover:text-white/80 transition-colors duration-300">{category.description}</p>
                    <div className="mt-auto pt-3 border-t border-white/10 group-hover:border-white/20 transition-colors duration-300">
                      <span className="inline-flex items-center text-white font-medium text-sm sm:text-base group-hover:translate-x-1 transition-transform duration-300">
                        Explore <ArrowRight className="w-4 h-4 ml-2 group-hover:ml-3 transition-all duration-300" />
                      </span>
                    </div>
                  </div>

                  {/* Quick view overlay - appears on mobile tap */}
                  <AnimatePresence>
                    {selectedCategory === category.id && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/90 backdrop-blur-sm flex flex-col justify-center items-center p-6 z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h4 className="text-xl font-bold text-white mb-2">{category.name}</h4>
                        <p className="text-white/80 text-center mb-4">{category.description}</p>
                        <Button
                          className="bg-white text-black hover:bg-white/90 font-medium rounded-full"
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = category.link;
                          }}
                        >
                          View All {category.products} Products
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
