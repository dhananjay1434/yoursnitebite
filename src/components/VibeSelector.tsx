import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Star, Clock, Award, TrendingUp } from 'lucide-react';

interface VibeBox {
  id: string;
  name: string;
  tagline: string;
  price: number;
  original_price?: number;
  image_url: string;
}

const VibeSelector: React.FC = () => {
  const isMobile = useIsMobile();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [vibeBoxes, setVibeBoxes] = useState<VibeBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVibes = async () => {
      try {
        // For now, use mock data since vibe_boxes table has schema issues
        // TODO: Fix vibe_boxes table schema and replace with actual Supabase query
        console.log('Loading vibe boxes for carousel...');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Use simplified mock data for the carousel
        const mockVibes: VibeBox[] = [
          {
            id: 'vibe-1',
            name: 'Study Session Fuel',
            tagline: 'Perfect snacks for those late-night study marathons',
            price: 299,
            original_price: 349,
            image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400'
          },
          {
            id: 'vibe-2',
            name: 'Movie Night Special',
            tagline: 'Cinema-style snacks for the perfect movie experience',
            price: 399,
            original_price: 449,
            image_url: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400'
          },
          {
            id: 'vibe-3',
            name: 'Gaming Marathon',
            tagline: 'High-energy snacks to keep you gaming all night',
            price: 349,
            original_price: 399,
            image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'
          }
        ];

        setVibeBoxes(mockVibes);

      } catch (err) {
        console.warn('Error loading vibe boxes:', err);
        setError('Failed to load vibe boxes');
      }
      setLoading(false);
    };
    fetchVibes();
  }, []);

  if (loading) return <p className="text-center py-8 text-white/70">Loading vibes...</p>;
  if (error) return <p className="text-center py-8 text-red-500">Error loading vibes: {error}</p>;

  return (
    <div className="py-6 sm:py-8 relative z-10 w-full">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <motion.div
            className="mb-4 sm:mb-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-nitebite-purple">
              Choose Your Vibe
            </h2>
            <p className="text-white/60 text-sm mt-1">Curated boxes for every mood</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button variant="outline" className="text-nitebite-yellow border-nitebite-yellow/30 hover:bg-nitebite-yellow/10" asChild>
              <Link to="/snack-boxes">View All Boxes</Link>
            </Button>
          </motion.div>
        </div>

        <Carousel opts={{ align: 'start', loop: true }} className="relative w-full">
          <CarouselContent className="-ml-4 md:-ml-6 w-full" ref={carouselRef}>
            {vibeBoxes.map((vibe) => {
              const discountPercent = vibe.original_price
                ? Math.round(((vibe.original_price - vibe.price) / vibe.original_price) * 100)
                : 0;

              return (
                <CarouselItem key={vibe.id} className="pl-4 md:pl-6 sm:basis-2/3 md:basis-1/2 lg:basis-1/3">
                  <Card className="overflow-hidden bg-nitebite-midnight border border-nitebite-purple/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                    <div className="relative h-40 sm:h-48 md:h-52 overflow-hidden group">
                      <img
                        src={vibe.image_url}
                        alt={vibe.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {vibe.original_price && (
                        <div className="absolute top-3 left-3 bg-nitebite-accent text-black text-xs sm:text-sm font-bold rounded-full px-3 py-1.5 shadow-lg">
                          -{discountPercent}%
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-nitebite-purple/80 backdrop-blur-sm text-white text-xs rounded-full px-2 py-1 flex items-center gap-1 shadow-lg">
                        <TrendingUp className="w-3 h-3" /> Popular
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <Button className="w-full bg-nitebite-accent/90 hover:bg-nitebite-accent text-black font-medium text-sm py-1" asChild>
                          <Link to={`/snack-boxes?vibe=${vibe.id}`}>Quick View</Link>
                        </Button>
                      </div>
                    </div>
                    <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg sm:text-xl md:text-2xl text-nitebite-purple">
                          {vibe.name}
                        </CardTitle>
                        <div className="flex items-center gap-1 bg-nitebite-dark-accent/50 px-2 py-1 rounded-md">
                          <Star className="w-3.5 h-3.5 text-nitebite-yellow fill-nitebite-yellow" />
                          <span className="text-xs font-medium text-white">4.8</span>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-white/70">
                        {vibe.tagline}
                      </p>
                      <div className="flex items-center gap-1.5 text-white/60 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Delivery in 20-30 min</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 py-2 sm:py-3 grow">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-xl sm:text-2xl md:text-3xl font-bold text-nitebite-yellow">
                          ₹{vibe.price.toFixed(0)}
                        </span>
                        {vibe.original_price && (
                          <span className="text-sm md:text-base line-through text-white/50">
                            ₹{vibe.original_price.toFixed(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Award className="w-3 h-3" /> Best Seller
                        </div>
                        <div className="bg-nitebite-purple/20 text-nitebite-purple text-xs px-2 py-0.5 rounded-full">Limited Stock</div>
                      </div>
                    </CardContent>
                    <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-5 pt-0">
                      <Button className="w-full bg-gradient-to-r from-nitebite-yellow to-nitebite-accent text-black text-sm sm:text-base py-2 sm:py-3 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                        <Link to={`/snack-boxes?vibe=${vibe.id}`}>
                          <ShoppingCart className="w-4 h-4" /> Add to Cart
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {!isMobile && (
            <>
              <CarouselPrevious className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-nitebite-purple/20 text-white hover:bg-nitebite-purple/40 z-10" />
              <CarouselNext className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-nitebite-purple/20 text-white hover:bg-nitebite-purple/40 z-10" />
            </>
          )}
        </Carousel>
      </div>
    </div>
  );
};

export default VibeSelector;
