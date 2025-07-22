import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, ShoppingCart, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import NewNavbar from '@/components/NewNavbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import FloatingBox from '@/components/FloatingBox';
import SnackBoxPreviewModal from '@/components/SnackBoxPreviewModal';
import SEO from '@/components/SEO';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
// import { supabase } from '@/supabaseClient'; // TODO: Re-enable when vibe_boxes schema is fixed

// Types matching the 'vibe_boxes' table schema
interface VibeItem {
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  desc?: string;
}

interface VibeBox {
  id: string;
  name: string;
  tagline: string;
  price: number;
  original_price?: number;
  image_url: string;
  highlights?: string[];
  items: VibeItem[];
}

// Mock data for vibe boxes until database is properly set up
const getMockVibeBoxes = (): VibeBox[] => [
  {
    id: 'vibe-1',
    name: 'Study Session Fuel',
    tagline: 'Perfect snacks for those late-night study marathons',
    price: 299,
    original_price: 349,
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    highlights: ['🍿', '🥤', '🍫'],
    items: [
      { name: 'Popcorn', image: '🍿', price: 50 },
      { name: 'Energy Drink', image: '🥤', price: 80 },
      { name: 'Chocolate Bar', image: '🍫', price: 60 },
      { name: 'Mixed Nuts', image: '🥜', price: 70 },
      { name: 'Cookies', image: '🍪', price: 40 }
    ]
  },
  {
    id: 'vibe-2',
    name: 'Movie Night Special',
    tagline: 'Cinema-style snacks for the perfect movie experience',
    price: 399,
    original_price: 449,
    image_url: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400',
    highlights: ['🍿', '🥤', '🍭'],
    items: [
      { name: 'Caramel Popcorn', image: '🍿', price: 80 },
      { name: 'Cold Drink', image: '🥤', price: 60 },
      { name: 'Candy Mix', image: '🍭', price: 90 },
      { name: 'Nachos', image: '🌮', price: 100 },
      { name: 'Ice Cream', image: '🍦', price: 70 }
    ]
  },
  {
    id: 'vibe-3',
    name: 'Gaming Marathon',
    tagline: 'High-energy snacks to keep you gaming all night',
    price: 349,
    original_price: 399,
    image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
    highlights: ['⚡', '🥤', '🍕'],
    items: [
      { name: 'Energy Bars', image: '⚡', price: 90 },
      { name: 'Sports Drink', image: '🥤', price: 70 },
      { name: 'Mini Pizza', image: '🍕', price: 120 },
      { name: 'Trail Mix', image: '🥜', price: 60 },
      { name: 'Protein Shake', image: '🥛', price: 80 }
    ]
  }
];

const SnackBoxSelector: React.FC = () => {
  const { addItem } = useCartStore();
  const [boxes, setBoxes] = useState<VibeBox[]>([]);
  const [selectedBox, setSelectedBox] = useState<VibeBox | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // const [error, setError] = useState<string | null>(null); // TODO: Re-enable when using real API

  // Fetch boxes from Supabase on mount
  useEffect(() => {
    const fetchBoxes = async () => {
      setLoading(true);

      try {
        // For now, use mock data since vibe_boxes table has schema issues
        // TODO: Fix vibe_boxes table schema and replace with actual Supabase query
        console.log('Loading vibe boxes...');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        setBoxes(getMockVibeBoxes());

        // Future implementation when database is fixed:
        // const { data, error } = await supabase
        //   .from('vibe_boxes')
        //   .select('id, name, tagline, price, original_price, image_url, items')
        //   .order('created_at', { ascending: true });

      } catch (err) {
        console.warn('Error loading vibe boxes:', err);
        setBoxes(getMockVibeBoxes());
      }

      setLoading(false);
    };

    fetchBoxes();
  }, []);

  const handleAddToCart = (box: VibeBox) => {
    addItem({
      id: box.id,
      name: box.name,
      price: box.price,
      original_price: box.original_price || box.price,
      image_url: box.image_url,
      image: box.image_url,
      category: 'Snack Box',
      category_id: 'snack-box',
      description: box.tagline,
      stock_quantity: 100, // Assume snack boxes are always in stock
    });
    toast.success(`${box.name} added to your box!`, { duration: 3000 });
  };

  const openPreviewModal = (box: VibeBox) => {
    setSelectedBox(box);
  };

  if (loading) {
    return (
      <div className="py-16 bg-nitebite-midnight text-center text-white/80">
        Loading snack boxes...
      </div>
    );
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Snack Boxes - Nitebite',
    description: 'Curated snack boxes for every late-night scenario. Find your perfect combination of snacks, beverages, and treats.',
    url: 'https://yoursnitebite.netlify.app/snack-boxes',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: boxes.length,
      itemListElement: boxes.map((box, index) => ({
        '@type': 'Product',
        position: index + 1,
        name: box.name,
        description: box.tagline,
        offers: {
          '@type': 'Offer',
          price: box.price,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
        },
      })),
    },
  };

  return (
    <>
      <SEO
        title="Curated Snack Boxes - Late Night Delivery"
        description="Discover our curated snack boxes perfect for every late-night scenario. Choose from gaming boxes, study boxes, movie night boxes and more. Delivered in 10 minutes."
        schema={schema}
      />
      <NewNavbar transparent={false} />
      <div className="min-h-screen bg-nitebite-midnight pt-20 pb-16">
        <div className="container mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-nitebite-text-muted hover:text-nitebite-purple transition-colors mb-6 glassmorphic-ghost-button py-2 px-4 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-nitebite-accent-light bg-clip-text text-transparent bg-gradient-to-r from-nitebite-purple to-nitebite-accent">
              Find Your Perfect Snack Box
            </h1>
            <p className="mt-3 text-nitebite-text-muted text-lg">
              Curated boxes for every late-night scenario
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12 p-4 md:p-6 rounded-xl border border-nitebite-purple/30 bg-nitebite-dark-accent/40 shadow-glow-sm"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold text-nitebite-highlight mb-2">
                  Didn't like the Snack Boxes?
                </h3>
                <p className="text-nitebite-text-muted">
                  Create your own perfect combination with our custom box builder
                </p>
              </div>
              <Button className="glassmorphic-button px-6 py-6 text-base whitespace-nowrap flex items-center gap-2" asChild>
                <Link to="/box-builder">
                  <ChefHat className="w-5 h-5" /> Prepare Your Own Box
                </Link>
              </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {boxes.map((box) => (
              <motion.div key={box.id} className="flex">
                <Card className="overflow-hidden bg-nitebite-dark-accent/50 border border-white/10 hover:border-white/20 rounded-xl shadow-lg flex flex-col w-full">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={box.image_url}
                      alt={box.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-nitebite-dark/50" />
                  </div>

                  <CardContent className="pt-4 pb-2 flex-grow">
                    <h2 className="text-xl md:text-2xl font-bold text-nitebite-purple mb-1">{box.name}</h2>
                    <p className="text-nitebite-text-muted mb-4">{box.tagline}</p>

                    <div className="flex items-center gap-3 mb-4">
                      {(box.highlights || []).map((icon, idx) => (
                        <span key={idx} className="text-2xl">{icon}</span>
                      ))}
                    </div>

                    <div className="mb-3">
                      <div className="text-xl md:text-2xl font-bold text-nitebite-accent flex justify-between items-center">
                        <span>Box Price:</span>
                        <span>₹{box.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 pb-4 flex flex-col gap-2">
                    <Button
                      className="w-full py-5 bg-gradient-to-r from-nitebite-green to-teal-500 hover:opacity-90 text-white"
                      onClick={() => handleAddToCart(box)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                      onClick={() => openPreviewModal(box)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> What's Inside?
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {selectedBox && (
        <SnackBoxPreviewModal
          box={selectedBox}
          onClose={() => setSelectedBox(null)}
          onAddToCart={() => {
            handleAddToCart(selectedBox);
            setSelectedBox(null);
          }}
        />
      )}

      <FloatingBox />
      <BackToTop />
      <Footer />
    </>
  );
};

export default SnackBoxSelector;
