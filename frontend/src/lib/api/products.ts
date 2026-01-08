import { strapiApi } from './strapi';
import type { ProductsResponse, SingleProductResponse } from '@/types/product';

export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  category?: 'Indica' | 'Hybrid' | 'Sativa';
  featured?: boolean;
  onSale?: boolean;
}

interface ProductFilters {
  category?: { $eq: 'Indica' | 'Hybrid' | 'Sativa' };
  featured?: { $eq: boolean };
  on_sale?: { $eq: boolean };
}

/**
 * Fetch products from Strapi with optional filtering and pagination
 */
export async function getProducts(params?: GetProductsParams): Promise<ProductsResponse> {
  const { page = 1, pageSize = 25, category, featured, onSale } = params || {};

  // Build filters object
  const filters: ProductFilters = {};

  if (category) {
    filters.category = { $eq: category };
  }

  if (featured !== undefined) {
    filters.featured = { $eq: featured };
  }

  if (onSale !== undefined) {
    filters.on_sale = { $eq: onSale };
  }

  const response = await strapiApi.get<ProductsResponse>('/api/products', {
    params: {
      populate: '*',
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
      populate: '*',
    },
  });

  return response.data;
}
