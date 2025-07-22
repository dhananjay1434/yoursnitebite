import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, X } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

interface SnackBoxPreviewModalProps {
  box: {
    id: string;
    name: string;
    tagline: string;
    price: number;
    original_price?: number;
    image_url: string;
    items: { name: string; image: string; price: number; desc?: string }[];
  };
  onClose: () => void;
  onAddToCart: () => void;
}

// Helper to calculate discount percentage
const calculateDiscount = (original: number, discounted: number) =>
  Math.round(((original - discounted) / original) * 100);

const SnackBoxPreviewModal: React.FC<SnackBoxPreviewModalProps> = ({ box, onClose, onAddToCart }) => {
  const { addItem } = useCartStore();

  const handleAdd = () => {
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
    onAddToCart();
  };

  const discountPercent = box.original_price && box.original_price > box.price
    ? calculateDiscount(box.original_price, box.price)
    : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-11/12 max-w-sm sm:max-w-lg mx-auto max-h-[90vh] overflow-auto">
        {/* Header with single close icon */}
        <DialogHeader className="flex items-center justify-between">
          <DialogTitle className="font-semibold text-lg">{box.name}</DialogTitle>
          <DialogClose className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </DialogClose>
        </DialogHeader>

        {/* Image Banner */}
        <div className="w-full h-48 overflow-hidden rounded-lg mb-4">
          <img
            src={box.image_url}
            alt={box.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Tagline */}
        <p className="text-sm text-gray-400 mb-4">{box.tagline}</p>

        {/* Price Section with original price strike-off and discount */}
        <div className="flex items-center gap-2 mb-4">
          {discountPercent > 0 && (
            <span className="text-xs text-gray-500 line-through">
              ₹{box.original_price?.toFixed(2)}
            </span>
          )}
          <span className="text-lg font-bold text-nitebite-highlight">
            ₹{box.price.toFixed(2)}
          </span>
          {discountPercent > 0 && (
            <span className="ml-auto bg-nitebite-accent text-black text-xs font-semibold px-2 py-1 rounded-full">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Items List */}
        <ul className="space-y-2 mb-4">
          {box.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="text-xl">{item.image}</span>
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                {item.desc && <p className="text-xs text-gray-500">{item.desc}</p>}
              </div>
              <span className="font-medium text-nitebite-highlight">
                ₹{item.price.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        {/* Total and Actions */}
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-lg">Total:</span>
          <span className="font-bold text-lg">₹{box.price.toFixed(2)}</span>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 py-2 bg-gradient-to-r from-nitebite-green to-teal-500 text-white"
            onClick={handleAdd}
          >
            <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
          </Button>
          <Button variant="outline" className="flex-1 py-2" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SnackBoxPreviewModal;
