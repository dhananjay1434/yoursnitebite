import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ShoppingCart, Star, Clock, Award, TrendingUp, Shield, Truck, Gift, Eye } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

// Helper: percent discount
const calcDiscount = (orig, disc) => (orig > disc ? Math.round(((orig - disc) / orig) * 100) : 0);
// Background themes per ID
const themes = {
  '4e839c64-0f7d-45e4-a64a-e9bcef656b88': 'from-purple-900 to-purple-700',
  '51da77f7-88bc-419a-9bea-a897a8304b40': 'from-green-900 to-green-700',
  '6363e876-8eee-4104-803d-b7bb098565a0': 'from-blue-900 to-blue-700',
  '9dc7c9dc-0a52-4da8-b815-f15e7b34f2e9': 'from-orange-900 to-orange-700',
};

export default function CuratedBoxes() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase
      .from('vibe_boxes')
      .select('id, name, tagline, price, original_price, image_url, items')
      .order('created_at', { ascending: true })
      .then(({ data, error: e }) => {
        if (e) setError(e.message);
        else setBoxes(data);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <div className="py-16 text-center text-white">Loading...</div>;
  if (error)
    return <div className="py-16 text-center text-red-400">Error: {error}</div>;

  return (
    <section className="section-spacing bg-gradient-to-b from-nitebite-midnight to-nitebite-dark-accent/30 w-full relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-nitebite-purple/5 to-transparent"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-nitebite-purple/5 blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-nitebite-yellow/5 blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.header
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-12 bg-nitebite-purple/50"></div>
            <span className="text-nitebite-yellow font-medium uppercase text-sm tracking-wider">Premium Selection</span>
            <div className="h-px w-12 bg-nitebite-purple/50"></div>
          </div>

          <h2 className="section-title text-balance">
            Curated Boxes on Demand
          </h2>
          <p className="section-subtitle text-balance">
            Pre-packed boxes for every late-night scenario, delivered straight to your door.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-8">
            <div className="flex items-center gap-2 text-white/80">
              <Shield className="w-5 h-5 text-nitebite-yellow" />
              <span className="text-sm">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Truck className="w-5 h-5 text-nitebite-yellow" />
              <span className="text-sm">Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Gift className="w-5 h-5 text-nitebite-yellow" />
              <span className="text-sm">Premium Packaging</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Star className="w-5 h-5 text-nitebite-yellow" />
              <span className="text-sm">Top Rated Products</span>
            </div>
          </div>
        </motion.header>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {boxes.map((box) => {
            const discount = calcDiscount(box.original_price, box.price);
            const bg = themes[box.id] || 'from-purple-900 to-purple-700';
            return (
              <motion.div
                key={box.id}
                variants={{
                  hidden: { y: 50, opacity: 0 },
                  visible: { y: 0, opacity: 1 },
                  whileHover: { y: -5 },
                }}
                className="flex flex-col h-full"
              >
                <Card
                  className={`bg-gradient-to-b ${bg} rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col overflow-hidden`}
                >
                  <div className="relative">
                    <img
                      src={box.image_url}
                      alt={box.name}
                      className="w-full h-48 sm:h-56 md:h-64 object-cover"
                    />
                    {discount > 0 && (
                      <span className="absolute top-4 right-4 bg-nitebite-accent text-black text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                        -{discount}%
                      </span>
                    )}
                  </div>

                  <CardHeader className="p-5 pt-3">
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl text-white truncate">
                      {box.name}
                    </CardTitle>
                    <CardDescription className="text-white/90 text-sm sm:text-base mt-1">
                      {box.tagline}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 p-5 bg-nitebite-dark-accent/50">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="items">
                        <AccordionTrigger className="flex justify-between items-center text-nitebite-yellow py-3 text-base sm:text-lg font-medium">
                          <span>What's Inside?</span>
                          <ChevronRight className="w-5 h-5" />
                        </AccordionTrigger>
                        <AccordionContent className="max-h-48 overflow-y-auto scroll-py-2">
                          <ul className="space-y-2">
                            {box.items.map((item, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <span className="text-2xl">{item.image}</span>
                                <div className="flex-1">
                                  <p className="text-white font-medium text-sm truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-white/60 text-xs truncate">
                                    {item.desc}
                                  </p>
                                </div>
                                <p className="text-nitebite-highlight font-semibold text-sm">
                                  ₹{item.price}
                                </p>
                              </li>
                            ))}
                            <div className="mt-3 pt-2 border-t border-white/25 flex justify-between items-center">
                              <p className="text-white/70 text-xs line-through">
                                ₹{box.original_price}
                              </p>
                              <p className="text-nitebite-yellow font-bold">
                                ₹{box.price}
                              </p>
                            </div>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>

                  <CardFooter className="p-5 space-y-3 flex flex-col">
                    <Button asChild className="w-full py-4 bg-gradient-to-r from-nitebite-yellow to-nitebite-accent text-black font-semibold text-base sm:text-lg flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
                      <Link to={`/snack-boxes?vibe=${box.id}`}>
                        <ShoppingCart className="w-5 h-5" /> Add to Cart
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full py-3 text-white border-white/30 hover:border-white flex justify-center items-center text-sm sm:text-base gap-2"
                    >
                      <Link to={`/snack-boxes?vibe=${box.id}`}>
                        <Eye className="w-4 h-4" /> View Details
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-nitebite-yellow via-nitebite-accent to-nitebite-yellow opacity-70 blur-lg rounded-full"></div>
            <Button
              size="lg"
              className="relative px-8 py-6 bg-gradient-to-r from-nitebite-yellow to-nitebite-accent text-black font-semibold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <Link to="/snack-boxes" className="flex items-center gap-2">
                Explore All Boxes <ChevronRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-white/60 text-sm">
            Free delivery on orders above ₹199
          </p>
        </motion.div>
      </div>
    </section>
  );
}
