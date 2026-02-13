import { strapiApi } from './strapi';
import { WEIGHT_UNIT } from '@/lib/utils/units';
import type { Product, ProductsResponse, SingleProductResponse } from '@/types/product';

export interface AdminProductsParams {
  page?: number;
  pageSize?: number;
  category?: 'Indica' | 'Hybrid';
  search?: string;
  status?: 'all' | 'published' | 'draft';
  lowStock?: boolean;
}

export interface ProductInventory {
  id: number;
  attributes: {
    quantity_in_stock: number;
    unit: string;
    reorder_point: number;
    reorder_quantity: number;
    location?: string;
    batch_number?: string;
    expiration_date?: string;
    notes?: string;
    last_restocked_at?: string;
  };
}

export interface ProductWithInventory extends Product {
  inventory?: ProductInventory;
}

export interface CreateProductData {
  name: string;
  sku: string;
  category: 'Indica' | 'Hybrid';
  description: string;
  tagline?: string;
  full_description?: string;
  best_for?: string;
  warning?: string;
  thc_content?: string;
  flavor_profile?: string;
  product_url?: string;
  on_sale?: boolean;
  featured?: boolean;
  sort_order?: number;
  base_price_per_pound?: number;
  pricing_model?: 'per_pound' | 'tiered';
  pricing_unit?: 'per_pound' | 'per_half_pound';
  grade_category?: 'High-end' | 'Mid-end' | 'Low-end';
  sizes_available?: 'Large' | 'Medium' | 'Small';
  customization_enabled?: boolean;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  publishedAt?: string | null;
}

export interface InventoryUpdateData {
  quantity_in_stock?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  location?: string;
  batch_number?: string;
  expiration_date?: string;
  notes?: string;
}

/**
 * Fetch products for admin with inventory data
 */
export async function getAdminProducts(params?: AdminProductsParams): Promise<{
  products: ProductWithInventory[];
  pagination: { page: number; pageSize: number; pageCount: number; total: number };
}> {
  const {
    page = 1,
    pageSize = 25,
    category,
    search,
    status = 'all',
    lowStock = false,
  } = params || {};

  // Build filters
  const filters: Record<string, any> = {};

  if (search) {
    filters.$or = [
      { name: { $containsi: search } },
      { sku: { $containsi: search } },
    ];
  }

  if (category) {
    filters.category = { $eq: category };
  }

  // Fetch products
  const productsResponse = await strapiApi.get<ProductsResponse>('/api/products', {
    params: {
      populate: '*',
      pagination: { page, pageSize },
      ...(Object.keys(filters).length > 0 && { filters }),
      ...(status === 'published' && { publicationState: 'live' }),
      ...(status === 'draft' && { publicationState: 'preview', filters: { ...filters, publishedAt: { $null: true } } }),
      ...(status === 'all' && { publicationState: 'preview' }),
      sort: ['sort_order:asc', 'name:asc'],
    },
  });

  // Fetch inventory for all products
  const productIds = productsResponse.data.data.map((p) => p.id);
  let inventoryMap: Record<number, ProductInventory> = {};

  if (productIds.length > 0) {
    try {
      const inventoryResponse = await strapiApi.get('/api/inventories', {
        params: {
          populate: ['product'],
          filters: {
            product: {
              id: { $in: productIds },
            },
          },
          pagination: { pageSize: 100 },
        },
      });

      inventoryMap = inventoryResponse.data.data.reduce((acc: Record<number, ProductInventory>, inv: any) => {
        const productId = inv.attributes.product?.data?.id;
        if (productId) {
          acc[productId] = inv;
        }
        return acc;
      }, {});
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  }

  // Merge products with inventory
  let products: ProductWithInventory[] = productsResponse.data.data.map((product) => ({
    ...product,
    inventory: inventoryMap[product.id],
  }));

  // Filter by low stock if requested
  if (lowStock) {
    products = products.filter((p) => {
      if (!p.inventory) return true; // No inventory = potentially low stock
      const stock = p.inventory.attributes.quantity_in_stock;
      const reorderPoint = p.inventory.attributes.reorder_point;
      return stock <= reorderPoint;
    });
  }

  return {
    products,
    pagination: productsResponse.data.meta.pagination,
  };
}

/**
 * Get single product with inventory
 */
export async function getAdminProduct(id: number): Promise<ProductWithInventory> {
  const productResponse = await strapiApi.get<SingleProductResponse>(`/api/products/${id}`, {
    params: {
      populate: '*',
      publicationState: 'preview',
    },
  });

  // Fetch inventory
  let inventory: ProductInventory | undefined;
  try {
    const inventoryResponse = await strapiApi.get('/api/inventories', {
      params: {
        populate: ['product'],
        filters: {
          product: {
            id: { $eq: id },
          },
        },
      },
    });

    if (inventoryResponse.data.data.length > 0) {
      inventory = inventoryResponse.data.data[0];
    }
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
  }

  return {
    ...productResponse.data.data,
    inventory,
  };
}

/**
 * Create a new product
 */
export async function createProduct(data: CreateProductData): Promise<Product> {
  const response = await strapiApi.post<SingleProductResponse>('/api/products', {
    data,
  });
  return response.data.data;
}

/**
 * Update a product
 */
export async function updateProduct(id: number, data: UpdateProductData): Promise<Product> {
  const response = await strapiApi.put<SingleProductResponse>(`/api/products/${id}`, {
    data,
  });
  return response.data.data;
}

/**
 * Delete a product
 */
export async function deleteProduct(id: number): Promise<void> {
  await strapiApi.delete(`/api/products/${id}`);
}

/**
 * Publish a product
 */
export async function publishProduct(id: number): Promise<Product> {
  return updateProduct(id, { publishedAt: new Date().toISOString() });
}

/**
 * Unpublish a product (make draft)
 */
export async function unpublishProduct(id: number): Promise<Product> {
  return updateProduct(id, { publishedAt: null });
}

/**
 * Update product inventory
 */
export async function updateProductInventory(
  productId: number,
  data: InventoryUpdateData
): Promise<ProductInventory> {
  // First check if inventory exists for this product
  const existingResponse = await strapiApi.get('/api/inventories', {
    params: {
      filters: {
        product: {
          id: { $eq: productId },
        },
      },
    },
  });

  if (existingResponse.data.data.length > 0) {
    // Update existing inventory
    const inventoryId = existingResponse.data.data[0].id;
    const response = await strapiApi.put(`/api/inventories/${inventoryId}`, {
      data: {
        ...data,
        last_restocked_at: data.quantity_in_stock !== undefined ? new Date().toISOString() : undefined,
      },
    });
    return response.data.data;
  } else {
    // Create new inventory
    const response = await strapiApi.post('/api/inventories', {
      data: {
        product: productId,
        quantity_in_stock: data.quantity_in_stock || 0,
        unit: WEIGHT_UNIT,
        reorder_point: data.reorder_point || 10,
        reorder_quantity: data.reorder_quantity || 50,
        location: data.location,
        batch_number: data.batch_number,
        expiration_date: data.expiration_date,
        notes: data.notes,
        last_restocked_at: new Date().toISOString(),
      },
    });
    return response.data.data;
  }
}

/**
 * Upload product images
 */
export async function uploadProductImages(
  productId: number,
  files: File[],
  field: 'images' | 'bud_images' | 'available_photos' = 'images'
): Promise<Product> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('ref', 'api::product.product');
  formData.append('refId', productId.toString());
  formData.append('field', field);

  await strapiApi.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  // Return updated product
  return getAdminProduct(productId);
}

/**
 * Delete a product image
 */
export async function deleteProductImage(imageId: number): Promise<void> {
  await strapiApi.delete(`/api/upload/files/${imageId}`);
}
