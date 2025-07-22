export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number; // Optional field for discounted products
  image_url: string[]; // Array of image URLs
  category_id: string;
  is_featured: boolean;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number;
  remaining_uses: number;
  min_order_amount: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}