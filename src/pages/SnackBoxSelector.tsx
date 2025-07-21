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
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { supabase } from '@/supabaseClient';

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

const SnackBoxSelector: React.FC = () => {
  const { addItem } = useCartStore();
  const [boxes, setBoxes] = useState<VibeBox[]>([]);
  const [selectedBox, setSelectedBox] = useState<VibeBox | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch boxes from Supabase on mount
  useEffect(() => {
    const fetchBoxes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from<VibeBox>('vibe_boxes')
        .select('id, name, tagline, price, original_price, image_url, items')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase fetch error:', error.message);
        setError(error.message);
      } else if (data) {
        // Map JSON fields if needed
        setBoxes(
          data.map((b) => ({
            ...b,
            image_url: b.image_url,
            items: b.items || [],
            highlights: b.items?.map((it) => it.image) || [],
          }))
        );
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
      image_url: box.image_url,
      description: box.tagline,
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

  if (error) {
    return (
      <div className="py-16 bg-nitebite-midnight text-center text-red-400">
        Error loading snack boxes: {error}
      </div>
    );
  }

  return (
    <>
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
