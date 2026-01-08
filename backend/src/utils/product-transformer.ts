/**
 * Product Data Transformation Utilities
 * Helper functions to transform product data from various sources
 */

interface PricingInput {
  [key: string]: {
    amount: number;
    currency: string;
  };
}

interface PricingOutput {
  weight: string;
  amount: number;
  currency: string;
}

interface FeatureOutput {
  label: string;
  icon: string | null;
}

/**
 * Transforms pricing data from scraped format to Strapi component format
 * @param quantityOptions - Array of weight options (e.g., ['7g', '14g', '28g'])
 * @param pricing - Object mapping weights to price data
 * @returns Array of pricing components
 */
export function transformPricing(
  quantityOptions: string[],
  pricing: PricingInput
): PricingOutput[] {
  return quantityOptions.map((weight) => ({
    weight,
    amount: pricing[weight].amount,
    currency: pricing[weight].currency,
  }));
}

/**
 * Transforms feature strings into Strapi component format
 * @param features - Array of feature strings
 * @returns Array of feature components
 */
export function transformFeatures(features: string[]): FeatureOutput[] {
  return features.map((feature) => ({
    label: feature,
    icon: null,
  }));
}

/**
 * Validates that a category is one of the allowed types
 * @param category - Category string to validate
 * @returns boolean indicating if category is valid
 */
export function isValidCategory(category: string): boolean {
  const validCategories = ['Indica', 'Hybrid', 'Sativa'];
  return validCategories.includes(category);
}

/**
 * Sanitizes SKU to ensure it meets requirements
 * - Removes special characters except hyphens and underscores
 * - Converts to uppercase
 * - Limits to 50 characters
 * @param sku - Raw SKU string
 * @returns Sanitized SKU string
 */
export function sanitizeSKU(sku: string): string {
  return sku
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .toUpperCase()
    .substring(0, 50);
}
