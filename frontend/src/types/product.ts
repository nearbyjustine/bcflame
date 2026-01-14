/**
 * Product content type TypeScript definitions
 * Based on the Strapi Product schema
 */

export interface ProductPricing {
  id: number;
  weight: string;
  amount: number;
  currency: string;
}

export interface ProductFeature {
  id: number;
  text: string;
}

export interface ProductImage {
  id: number;
  name: string;
  alternativeText?: string;
  caption?: string;
  width: number;
  height: number;
  formats?: {
    thumbnail?: ImageFormat;
    small?: ImageFormat;
    medium?: ImageFormat;
    large?: ImageFormat;
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string;
  provider: string;
  provider_metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ImageFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  url: string;
}

export interface SelectionLimit {
  id: number;
  option_type: 'photos' | 'bud_styles' | 'budStyles' | 'backgrounds' | 'fonts' | 'prebagging';
  min_selections?: number;
  max_selections?: number;
  // Legacy support for old field names
  min?: number;
  max?: number;
}

export interface ProductAttributes {
  name: string;
  sku: string;
  category: 'Indica' | 'Hybrid';
  tagline?: string;
  description: string;
  full_description?: string;
  best_for?: string;
  warning?: string;
  thc_content?: string;
  flavor_profile?: string;
  product_url?: string;
  on_sale: boolean;
  featured: boolean;
  sort_order: number;
  pricing: ProductPricing[];
  base_price_per_pound?: number;
  pricing_model?: 'per_pound' | 'tiered';
  features?: ProductFeature[];
  images?: {
    data: ProductImage[];
  };
  customization_enabled?: boolean;
  available_photos?: {
    data: ProductImage[];
  };
  selection_limits?: SelectionLimit[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Product {
  id: number;
  attributes: ProductAttributes;
}

export interface ProductsResponse {
  data: Product[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface SingleProductResponse {
  data: Product;
  meta: Record<string, any>;
}
