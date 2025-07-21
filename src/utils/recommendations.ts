import { UserPreference, ScoredProduct, RecommendationOptions, DEFAULT_RECOMMENDATION_OPTIONS } from '../types/recommendations';

/**
 * Generate personalized product recommendations based on user preferences
 *
 * @param products - List of products to generate recommendations from
 * @param userPreferences - User preferences data
 * @param options - Recommendation algorithm options
 * @returns Array of products sorted by recommendation score
 */
export function generateRecommendations(
  products: any[],
  userPreferences: UserPreference | null,
  options: Partial<RecommendationOptions> = {}
): ScoredProduct[] {
  // If no products or preferences, return empty array
  if (!products.length || !userPreferences) {
    return [];
  }

  // Merge default options with provided options
  const mergedOptions: RecommendationOptions = {
    ...DEFAULT_RECOMMENDATION_OPTIONS,
    weights: {
      ...DEFAULT_RECOMMENDATION_OPTIONS.weights,
      ...(options.weights || {})
    },
    ...(options.limit ? { limit: options.limit } : {})
  };

  // Calculate scores for each product
  const scoredProducts = products.map(product => {
    let score = 0;
    const { weights } = mergedOptions;

    // 1. Featured products get a boost
    if (product.is_featured) {
      score += weights.featured;
    }

    // 2. Category preferences
    if (userPreferences.categorypreferences &&
        userPreferences.categorypreferences[product.category_id]) {
      score += userPreferences.categorypreferences[product.category_id] * weights.categoryPreference;
    }

    // 3. Purchase history - boost products from categories the user has purchased from
    if (userPreferences.purchasehistory && userPreferences.purchasehistory.length > 0) {
      const purchasedProducts = products.filter(p =>
        userPreferences.purchasehistory.includes(p.id)
      );

      const purchasedCategories = new Set(
        purchasedProducts.map(p => p.category_id)
      );

      if (purchasedCategories.has(product.category_id)) {
        score += weights.purchaseHistory;
      }
    }

    // 4. View history - boost products the user has viewed
    if (userPreferences.viewhistory &&
        userPreferences.viewhistory.includes(product.id)) {
      score += weights.viewHistory;
    }

    // 5. Stock availability - prioritize products with good stock
    if (product.stock_quantity > 10) {
      score += weights.stock;
    }

    // 6. Price factor - slightly boost lower-priced items
    const priceScore = Math.max(0, 1 - (product.price / 200)); // Normalize to 0-1 range
    score += priceScore * weights.price;

    // 7. Discount factor - boost products with discounts
    if (product.original_price > product.price) {
      const discountPercent = (product.original_price - product.price) / product.original_price;
      score += discountPercent * weights.discount;
    }

    return { ...product, recommendationScore: score };
  });

  // Sort by score and limit results
  return scoredProducts
    .sort((a, b) => b.recommendationScore! - a.recommendationScore!)
    .slice(0, mergedOptions.limit);
}

/**
 * Track a product view and update user preferences
 *
 * @param productId - ID of the viewed product
 * @param product - Product data
 * @param userPreferences - Current user preferences
 * @returns Updated user preferences
 */
export function trackProductView(
  productId: string,
  product: any,
  userPreferences: UserPreference
): UserPreference {
  if (!userPreferences) return userPreferences;

  // Update view history
  const updatedViewHistory = [...new Set([...userPreferences.viewhistory, productId])];

  // Update category preferences
  const categoryId = product.category_id;
  const currentCategoryScore = userPreferences.categorypreferences[categoryId] || 0;

  const updatedCategoryPreferences = {
    ...userPreferences.categorypreferences,
    [categoryId]: currentCategoryScore + 0.5 // Increment preference score
  };

  // Return updated preferences
  return {
    ...userPreferences,
    viewhistory: updatedViewHistory,
    categorypreferences: updatedCategoryPreferences,
    updated_at: new Date().toISOString()
  };
}

/**
 * Track a product purchase and update user preferences
 *
 * @param productId - ID of the purchased product
 * @param product - Product data
 * @param userPreferences - Current user preferences
 * @returns Updated user preferences
 */
export function trackProductPurchase(
  productId: string,
  product: any,
  userPreferences: UserPreference
): UserPreference {
  if (!userPreferences) return userPreferences;

  // Update purchase history
  const updatedPurchaseHistory = [...new Set([...userPreferences.purchaseHistory, productId])];

  // Update category preferences with higher weight for purchases
  const categoryId = product.category_id;
  const currentCategoryScore = userPreferences.categoryPreferences[categoryId] || 0;

  const updatedCategoryPreferences = {
    ...userPreferences.categoryPreferences,
    [categoryId]: currentCategoryScore + 1.5 // Higher increment for purchases
  };

  // Return updated preferences
  return {
    ...userPreferences,
    purchaseHistory: updatedPurchaseHistory,
    categoryPreferences: updatedCategoryPreferences,
    updated_at: new Date().toISOString()
  };
}