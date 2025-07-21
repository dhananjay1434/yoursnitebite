import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// ✅ SECURE: Environment variables only, no fallbacks to prevent credential exposure
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

// Create Supabase client with security options
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      // Use secure storage options
      getItem: (key) => {
        try {
          const item = sessionStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        } catch {
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          sessionStorage.setItem(key, JSON.stringify(value));
        } catch {
          console.error('Error storing auth session');
        }
      },
      removeItem: (key) => {
        try {
          sessionStorage.removeItem(key);
        } catch {
          console.error('Error removing auth session');
        }
      },
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'nitebite-web',
    },
  },
});

// Types for orders and cart items
export type Order = {
  id: string;
  user_id: string;
  amount: number;
  items: CartItem[];
  phone_number: string;
  hostel_number: string;
  room_number: string;
  payment_method: 'cod' | 'qr';
  payment_status: 'pending' | 'paid';
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type UserProfile = {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  email: string;
  created_at: string;
  updated_at: string;
};
