// Types for the recommendation system

export interface UserPreference {
  id: string;
  userid: string; // Changed from userId to userid to match PostgreSQL column name
  categorypreferences: Record<string, number>; // Changed from camelCase to lowercase
  tagpreferences: Record<string, number>; // Changed from camelCase to lowercase
  viewhistory: string[]; // Changed from camelCase to lowercase
  purchasehistory: string[]; // Changed from camelCase to lowercase
  created_at: string;
  updated_at: string;
}

export interface ScoredProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  image_url: string | string[];
  category_id: string;
  is_featured: boolean;
  stock_quantity: number;
  recommendationScore?: number;
  category?: string;
  tags?: string[];
}

export interface RecommendationOptions {
  // Weights for different factors in the recommendation algorithm
  weights: {
    featured: number;       // Weight for featured products
    categoryPreference: number; // Weight for category preferences
    purchaseHistory: number;    // Weight for purchase history
    viewHistory: number;        // Weight for view history
    stock: number;              // Weight for stock availability
    price: number;              // Weight for price factor
    discount: number;           // Weight for discount factor
  };

  // Maximum number of recommendations to return
  limit: number;
}

// Default recommendation options
export const DEFAULT_RECOMMENDATION_OPTIONS: RecommendationOptions = {
  weights: {
    featured: 5,
    categoryPreference: 2,
    purchaseHistory: 3,
    viewHistory: 2,
    stock: 1,
    price: 1,
    discount: 3
  },
  limit: 8
};
