import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { supabase } from '@/supabaseClient';
import { validateCartItem, sanitizeForDatabase } from '@/lib/validation';
import { SecureStorage } from '@/lib/security';

// Interface for coupon validation response
interface CouponValidationResult {
  valid: boolean;
  amount: number;
  message?: string;
}

// Function to verify coupon with server
async function verifyCouponWithServer(code: string, requestedAmount: number): Promise<CouponValidationResult> {
  try {
    // Verify the coupon code with the server
    const { data, error } = await supabase
      .from('coupons')
      .select('id, code, discount_value, discount_type, is_active, max_uses, remaining_uses')
      .eq('code', code)
      .limit(1)
      .maybeSingle();

    // Handle database errors
    if (error) {
      console.error('Supabase request failed', error);
      return {
        valid: false,
        amount: 0,
        message: 'Failed to validate coupon'
      };
    }

    // If no coupon found
    if (!data) {
      return {
        valid: false,
        amount: 0,
        message: 'Invalid coupon code'
      };
    }

    // Check if coupon is active
    if (!data.is_active) {
      return {
        valid: false,
        amount: 0,
        message: 'This coupon has expired'
      };
    }

    // Check usage limits
    if (data.max_uses && data.remaining_uses <= 0) {
      return {
        valid: false,
        amount: 0,
        message: 'This coupon has reached its usage limit'
      };
    }

    // Calculate the actual discount amount based on type
    const discountAmount = data.discount_type === 'percentage'
      ? (requestedAmount * data.discount_value / 100)
      : data.discount_value;

    // Return the validated discount amount from the server
    return {
      valid: true,
      amount: discountAmount,
      message: 'Coupon applied successfully'
    };
  } catch (err) {
    console.error('Error validating coupon:', err);
    return {
      valid: false,
      amount: 0,
      message: 'An error occurred while validating the coupon'
    };
  }
}

// Utility functions
const validatePrice = (price: number): boolean => {
  return !isNaN(price) && price >= 0 && price <= 1000000;
};

const validateQuantity = (quantity: number): boolean => {
  return !isNaN(quantity) && quantity > 0 && quantity <= 100;
};

const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Validate coupon code - only allow alphanumeric characters, hyphens, and underscores
// with a length between 3 and 20 characters
const validateCouponCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;

  // Trim the code and check length (3-20 characters)
  const trimmedCode = code.trim();
  if (trimmedCode.length < 3 || trimmedCode.length > 20) return false;

  // Only allow alphanumeric characters, hyphens, and underscores
  const couponRegex = /^[a-zA-Z0-9_-]+$/;
  return couponRegex.test(trimmedCode);
};

// Sanitize a string to prevent XSS attacks
const sanitizeString = (str: string): string => {
  if (!str || typeof str !== 'string') return '';

  // Replace potentially dangerous characters
  return str
    .replace(/[<>&"'`]/g, (match) => {
      switch (match) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '`': return '&#x60;';
        default: return match;
      }
    })
    .trim();
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  quantity: number;
  image_url: string;
  image?: string;
  category?: string;
  category_id?: string;
  description?: string;
  stock_quantity?: number;
};

export type CartStore = {
  items: CartItem[];
  couponDiscount: number;
  couponCode: string | null;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  getItemCount: () => number;
  getTotal: () => number;
  calculateSubtotal: () => number;
  updateCouponDiscount: (amount: number, code: string) => void;
};

const toastOptions = { duration: 3000, dismissible: true };

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      couponDiscount: 0,
      couponCode: null,

      addItem: (item) => {
        // ✅ SECURE: Validate required fields first
        if (!item) {
          console.error('Cart item validation failed: Item is null or undefined');
          toast.error('Cannot add empty item to cart', toastOptions);
          return;
        }

        if (!item.id) {
          console.error('Cart item validation failed: Missing product ID', item);
          toast.error('Invalid item: Missing product ID', toastOptions);
          return;
        }

        if (!item.name) {
          console.error('Cart item validation failed: Missing product name', item);
          toast.error('Invalid item: Missing product name', toastOptions);
          return;
        }

        if (typeof item.price !== 'number' || item.price <= 0) {
          console.error('Cart item validation failed: Invalid price', item);
          toast.error('Invalid item: Invalid price', toastOptions);
          return;
        }

        // ✅ SECURE: Validate input with Zod schema
        const validation = validateCartItem({
          id: String(item.id).trim(),
          name: String(item.name).trim(),
          price: Number(item.price),
          quantity: Number(item.quantity) || 1,
        });

        if (!validation.success) {
          const errors = validation.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
          console.error('Cart item validation failed:', errors, item);
          toast.error(`Invalid item: ${errors}`, toastOptions);
          return;
        }

        // Sanitize the validated data
        const sanitizedItem = sanitizeForDatabase(validation.data);

        const currentItems = get().items;
        const existingItem = currentItems.find(i => i.id === item.id);
        const quantityToAdd = item.quantity || 1;

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantityToAdd;

          if (!validateQuantity(newQuantity)) {
            toast.error('Maximum quantity limit reached', toastOptions);
            return;
          }

          set({
            items: currentItems.map(i =>
              i.id === item.id
                ? { ...i, quantity: newQuantity }
                : i
            )
          });

          // Only show toast for single item additions to avoid spam
          if (quantityToAdd === 1) {
            toast.success(`Added another ${item.name} to your cart!`, toastOptions);
          }
        } else {
          if (!validateQuantity(quantityToAdd)) {
            toast.error('Invalid quantity', toastOptions);
            return;
          }

          set({
            items: [...currentItems, {
              ...item,
              quantity: quantityToAdd,
              image: item.image || (Array.isArray(item.image_url) ? item.image_url[0] : item.image_url)
            }]
          });

          // Only show toast for single item additions to avoid spam
          if (quantityToAdd === 1) {
            toast.success(`${item.name} added to your cart!`, toastOptions);
          }
        }
      },

      removeItem: (id: string) => {
        if (!id) {
          console.error('Missing item ID');
          return;
        }
        // For IDs that look like UUIDs, validate them
        if (id.includes('-') && !isValidUUID(id)) {
          console.error('Invalid UUID format');
          return;
        }

        const currentItems = get().items;
        const itemToRemove = currentItems.find(i => i.id === id);

        if (itemToRemove) {
          // Update the items array immediately to ensure UI updates
          set({ items: currentItems.filter(i => i.id !== id) });

          // If cart is now empty, also reset coupon discount
          const updatedItems = currentItems.filter(i => i.id !== id);
          if (updatedItems.length === 0 && get().couponDiscount > 0) {
            set({
              couponDiscount: 0,
              couponCode: null
            });
          }

          toast.info(`${itemToRemove.name} removed from your box`, toastOptions);
        }
      },

      updateQuantity: (id: string, quantity: number) => {
        if (!id) {
          console.error('Missing item ID');
          return;
        }
        // For IDs that look like UUIDs, validate them
        if (id.includes('-') && !isValidUUID(id)) {
          console.error('Invalid UUID format');
          return;
        }
        if (!validateQuantity(quantity) && quantity !== 0) {
          console.error('Invalid quantity');
          return;
        }

        const currentItems = get().items;

        if (quantity <= 0) {
          const itemToRemove = currentItems.find(i => i.id === id);
          if (itemToRemove) {
            // Update the items array immediately to ensure UI updates
            set({ items: currentItems.filter(i => i.id !== id) });

            // If cart is now empty, also reset coupon discount
            const updatedItems = currentItems.filter(i => i.id !== id);
            if (updatedItems.length === 0 && get().couponDiscount > 0) {
              set({
                couponDiscount: 0,
                couponCode: null
              });
            }

            toast.info(`${itemToRemove.name} removed from your box`, toastOptions);
          }
        } else {
          set({
            items: currentItems.map(i =>
              i.id === id ? { ...i, quantity } : i
            )
          });
        }
      },

      updateItemQuantity: (id: string, quantity: number) => {
        if (!id) {
          console.error('Missing item ID');
          return;
        }
        // For IDs that look like UUIDs, validate them
        if (id.includes('-') && !isValidUUID(id)) {
          console.error('Invalid UUID format');
          return;
        }
        if (!validateQuantity(quantity)) {
          console.error('Invalid quantity');
          return;
        }
        get().updateQuantity(id, quantity);
      },

      clearCart: () => {
        set({
          items: [],
          couponDiscount: 0,
          couponCode: null
        });
        toast.info("Your box is now empty", toastOptions);
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotal: () => {
        return get().items.reduce((total, item) => {
          if (!validatePrice(item.price) || !validateQuantity(item.quantity)) {
            console.error('Invalid item data');
            return total;
          }
          return total + (item.price * item.quantity);
        }, 0);
      },

      calculateSubtotal: () => {
        return get().getTotal();
      },

      updateCouponDiscount: (amount: number, code: string) => {
        // Validate the discount amount
        if (!validatePrice(amount)) {
          console.error('Invalid discount amount');
          return;
        }

        // Validate and sanitize the coupon code
        if (!validateCouponCode(code)) {
          console.error('Invalid coupon code format');
          return;
        }

        // Sanitize the coupon code to prevent XSS
        const sanitizedCode = sanitizeString(code);

        // Get the current subtotal for percentage calculations
        const currentSubtotal = get().calculateSubtotal();

        // Verify with server before applying discount
        verifyCouponWithServer(sanitizedCode, currentSubtotal)
          .then(validationResult => {
            if (validationResult.valid) {
              // Only apply the discount if the server confirms it's valid
              set({
                couponDiscount: validationResult.amount,
                couponCode: sanitizedCode
              });
              toast.success(validationResult.message || 'Coupon applied successfully', toastOptions);
            } else {
              // Show error message from server
              toast.error(validationResult.message || 'Invalid coupon code', toastOptions);
            }
          })
          .catch(error => {
            console.error('Error validating coupon:', error);
            toast.error('Failed to validate coupon', toastOptions);
          });
      }
    }),
    {
      name: 'nitebite-cart',
      storage: {
        getItem: (name) => {
          try {
            const value = sessionStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            sessionStorage.setItem(name, JSON.stringify(value));
          } catch {
            console.error('Error storing cart data');
          }
        },
        removeItem: (name) => {
          try {
            sessionStorage.removeItem(name);
          } catch {
            console.error('Error removing cart data');
          }
        },
      },
    }
  )
);