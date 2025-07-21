import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeaturedProducts } from '@/hooks/use-products';

const FeaturedProducts: React.FC = () => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const { data: products = [], isLoading } = useFeaturedProducts();

  const handleSeeItemsClick = () => {
    navigate('/box-builder');
  };

  useEffect(() => {
    const checkScrollability = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const handleScroll = () => {
      if (scrollContainer) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    let autoScrollInterval: NodeJS.Timeout | null = null;

    const startAutoScroll = () => {
      if (scrollContainerRef.current && !isAutoScrolling) {
        setIsAutoScrolling(true);
        autoScrollInterval = setInterval(() => {
          if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            if (scrollLeft >= scrollWidth - clientWidth - 10) {
              scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
              scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
            }
          }
        }, 5000);
      }
    };

    const stopAutoScroll = () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        setIsAutoScrolling(false);
      }
    };

    const timer = setTimeout(startAutoScroll, 5000);
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('mouseenter', stopAutoScroll);
      scrollContainer.addEventListener('touchstart', stopAutoScroll);
    }

    return () => {
      clearTimeout(timer);
      if (autoScrollInterval) clearInterval(autoScrollInterval);
      if (scrollContainer) {
        scrollContainer.removeEventListener('mouseenter', stopAutoScroll);
        scrollContainer.removeEventListener('touchstart', stopAutoScroll);
      }
    };
  }, [isAutoScrolling]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
      setIsAutoScrolling(false);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
      setIsAutoScrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 sm:py-16 bg-nitebite-dark">
        <div className="page-container">
          <div className="flex justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-nitebite-accent rounded-full animate-spin border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="featured-items" className="py-12 sm:py-16 bg-nitebite-dark">
      <div className="page-container">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 sm:mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 animate-fade-in">Featured Items</h2>
            <p className="text-sm sm:text-base text-nitebite-text-muted max-w-2xl animate-fade-in" style={{ animationDelay: '100ms' }}>
              Our most popular late-night snacks and beverages
            </p>
          </div>
          <Button 
            variant="ghost" 
            className="text-nitebite-accent hover:text-nitebite-accent-light mt-3 md:mt-0 self-start animate-fade-in flex items-center gap-2 group glassmorphic-ghost-button"
            style={{ animationDelay: '200ms' }}
            onClick={handleSeeItemsClick}
          >
            Create a Quick Custom Box
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
        
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-nitebite-dark-accent/80 backdrop-blur-lg border border-white/10 text-nitebite-text shadow-glow transition-all", 
              canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={scrollLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </Button>

          <div 
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-6 overflow-x-auto py-3 sm:py-4 px-1 sm:px-2 scrollbar-none scroll-smooth"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {products.map((product, index) => {
              const imageUrls = typeof product.image_url === 'string' 
                ? [product.image_url]
                : Array.isArray(product.image_url) 
                  ? product.image_url 
                  : ['/placeholder.svg'];

              const imageUrl = imageUrls[0] || '/fallback-image.jpg';

              return (
                <div 
                  key={product.id} 
                  className="min-w-[200px] sm:min-w-[250px] md:min-w-[280px]"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <ProductCard 
                    product={{
                      ...product,
                      image: imageUrl,
                      category: product.category_id || '',
                      original_price: product.original_price || product.price
                    }}
                    index={index} 
                  />
                </div>
              );
            })}
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-nitebite-dark-accent/80 backdrop-blur-lg border border-white/10 text-nitebite-text shadow-glow transition-all", 
              canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={scrollRight}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProducts;
