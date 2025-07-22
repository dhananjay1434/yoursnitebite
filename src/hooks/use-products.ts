
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabaseClient';
import { Product } from '@/components/ProductCard';
import { useEffect } from 'react';

// Utility to check if a string is a valid UUID
const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

export function useProducts(categoryFilter?: string) {
  const { data, refetch } = useQuery<Product[]>({
    queryKey: ['products', categoryFilter],
    queryFn: async () => {
      let query;
      
      if (categoryFilter) {
        if (isValidUUID(categoryFilter)) {
          // Use category_id filtering if valid UUID
          query = supabase
            .from('products')
            .select('*')
            .eq('category_id', categoryFilter);
        } else {
          // Otherwise, assume it's a category name and join categories
          query = supabase
            .from('products')
            .select('*, categories!inner(*)')
            .eq('categories.name', categoryFilter);
        }
      } else {
        // No filtering applied
        query = supabase.from('products').select('*');
      }
      
      const { data, error } = await query;
      if (error) {
        throw error;
      }
      
      // Normalize image_url so it's always an array and handle field mapping
      return (data || []).map((product: any) => ({
        ...product,
        // Map item_name to name if it exists (handle database field mismatch)
        name: product.name || product.item_name || `Product ${product.id}`,
        image_url: product.image_url
          ? (Array.isArray(product.image_url)
              ? product.image_url
              : [product.image_url])
          : [],
        // Ensure original_price is always present
        original_price: product.original_price || product.price,
      })) as Product[];
    },
  });

  // Set up real-time subscription for stock updates
  useEffect(() => {
    const subscription = supabase
      .channel('stock_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: 'stock_quantity=neq.stock_quantity'
        },
        () => {
          // Refetch products when stock changes
          refetch();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [refetch]);

  return { data: data || [], isLoading: !data };
}

export function useFeaturedProducts() {
  const { data, refetch } = useQuery<Product[]>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .limit(10);
      
      if (error) {
        throw error;
      }
      
      // Normalize image_url so it's always an array and handle field mapping
      return (data || []).map((product: any) => ({
        ...product,
        // Map item_name to name if it exists (handle database field mismatch)
        name: product.name || product.item_name || `Product ${product.id}`,
        image_url: product.image_url
          ? (Array.isArray(product.image_url)
              ? product.image_url
              : [product.image_url])
          : [],
        // Ensure original_price is always present
        original_price: product.original_price || product.price,
      })) as Product[];
    },
  });

  // Set up real-time subscription for featured products stock updates
  useEffect(() => {
    const subscription = supabase
      .channel('featured_stock_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: 'is_featured=eq.true'
        },
        () => {
          // Refetch featured products when stock changes
          refetch();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [refetch]);

  return { data: data || [], isLoading: !data };
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      return data || [];
    }
  });
}
