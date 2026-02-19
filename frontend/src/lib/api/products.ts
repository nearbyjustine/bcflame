import { strapiApi } from './strapi';
import type { ProductsResponse, SingleProductResponse } from '@/types/product';

export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  category?: 'Indica' | 'Hybrid';
  featured?: boolean;
  onSale?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minTHC?: number;
  maxTHC?: number;
}

interface ProductFilters {
  name?: { $containsi: string };
  category?: { $eq: 'Indica' | 'Hybrid' };
  featured?: { $eq: boolean };
  on_sale?: { $eq: boolean };
  pricing?: {
    amount?: {
      $gte?: number;
      $lte?: number;
    };
  };
  thc_content?: {
    $gte?: number;
    $lte?: number;
  };
}

/**
 * Fetch products from Strapi with optional filtering and pagination
 */
export async function getProducts(params?: GetProductsParams): Promise<ProductsResponse> {
  const {
    page = 1,
    pageSize = 25,
    category,
    featured,
    onSale,
    search,
    minPrice,
    maxPrice,
    minTHC,
    maxTHC
  } = params || {};

  // Build filters object
  const filters: ProductFilters = {};

  // Search by product name (case-insensitive)
  if (search) {
    filters.name = { $containsi: search };
  }

  // Category filter
  if (category) {
    filters.category = { $eq: category };
  }

  // Featured filter (only filter if explicitly true)
  if (featured === true) {
    filters.featured = { $eq: true };
  }

  // On Sale filter (only filter if explicitly true)
  if (onSale === true) {
    filters.on_sale = { $eq: true };
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    filters.pricing = {
      amount: {},
    };
    if (minPrice !== undefined) {
      filters.pricing.amount!.$gte = minPrice;
    }
    if (maxPrice !== undefined) {
      filters.pricing.amount!.$lte = maxPrice;
    }
  }

  // THC content range filter
  if (minTHC !== undefined || maxTHC !== undefined) {
    filters.thc_content = {};
    if (minTHC !== undefined) {
      filters.thc_content.$gte = minTHC;
    }
    if (maxTHC !== undefined) {
      filters.thc_content.$lte = maxTHC;
    }
  }

  const response = await strapiApi.get<ProductsResponse>('/api/products', {
    params: {
      populate: 'images,bud_images,pricing,features',
      pagination: {
        page,
        pageSize,
      },
      ...(Object.keys(filters).length > 0 && { filters }),
    },
  });

  return response.data;
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: number): Promise<SingleProductResponse> {
  const response = await strapiApi.get<SingleProductResponse>(`/api/products/${id}`, {
    params: {
      populate: 'images,bud_images,pricing,features,selection_limits',
    },
  });

  return response.data;
}

/**
 * Fetch related products from the same category, excluding the current product
 */
export async function getRelatedProducts(
  productId: number,
  category: 'Indica' | 'Hybrid',
  limit: number = 4
): Promise<ProductsResponse> {
  const response = await getProducts({
    category,
    pageSize: limit + 1, // Fetch extra to account for filtering
  });

  // Filter out the current product client-side
  // (Strapi $ne filter would require adjusting the filters type)
  const filtered = response.data.filter(product => product.id !== productId);

  return {
    ...response,
    data: filtered.slice(0, limit),
  };
}
