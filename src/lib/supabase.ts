import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Sanitize input to prevent SQL injection
export const sanitizeInput = (input: string): string => {
  return input.replace(/[^\w\s-]/gi, '').trim();
};

// Validate UUID format
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

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

// Security utility functions
export const validatePhoneNumber = (phone: string): boolean => {
  return /^\+?[\d\s-]{10,}$/.test(phone);
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePrice = (price: number): boolean => {
  return !isNaN(price) && price >= 0 && price <= 1000000;
};

export const validateQuantity = (quantity: number): boolean => {
  return !isNaN(quantity) && quantity > 0 && quantity <= 100;
};

// Rate limiting implementation
const rateLimiter = new Map<string, { count: number; timestamp: number }>();

export const checkRateLimit = (key: string, limit: number = 100, window: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimiter.get(key);

  if (!record) {
    rateLimiter.set(key, { count: 1, timestamp: now });
    return true;
  }

  if (now - record.timestamp > window) {
    record.count = 1;
    record.timestamp = now;
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
};