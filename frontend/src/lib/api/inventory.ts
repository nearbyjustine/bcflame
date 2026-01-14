import { strapiApi } from './strapi';
import type { InventoryResponse, SingleInventoryResponse } from '@/types/inventory';

export interface GetInventoryParams {
  page?: number;
  pageSize?: number;
  productId?: number;
  belowReorderPoint?: boolean;
}

/**
 * Fetch inventory items from Strapi with optional filtering and pagination
 */
export async function getInventory(params?: GetInventoryParams): Promise<InventoryResponse> {
  const {
    page = 1,
    pageSize = 25,
    productId,
    belowReorderPoint,
  } = params || {};

  const filters: any = {};

  if (productId) {
    filters.product = { id: { $eq: productId } };
  }

  if (belowReorderPoint) {
    // Filter where quantity_in_stock <= reorder_point
    // Note: This requires custom filtering logic in Strapi or frontend post-processing
  }

  const queryParams = new URLSearchParams({
    'pagination[page]': page.toString(),
    'pagination[pageSize]': pageSize.toString(),
    'populate': 'product,last_restocked_by',
  });

  if (Object.keys(filters).length > 0) {
    queryParams.append('filters', JSON.stringify(filters));
  }

  const response = await strapiApi.get<InventoryResponse>(`/api/inventories?${queryParams}`);
  return response.data;
}

/**
 * Get a single inventory item by ID
 */
export async function getInventoryItem(id: number): Promise<SingleInventoryResponse> {
  const response = await strapiApi.get<SingleInventoryResponse>(
    `/api/inventories/${id}?populate=product,last_restocked_by`
  );
  return response.data;
}

/**
 * Create a new inventory item
 */
export async function createInventoryItem(data: {
  product: number;
  quantity_in_stock: number;
  unit?: 'lb';
  reorder_point?: number;
  reorder_quantity?: number;
  location?: string;
  batch_number?: string;
  expiration_date?: string;
  notes?: string;
}): Promise<SingleInventoryResponse> {
  const response = await strapiApi.post<SingleInventoryResponse>('/api/inventories', {
    data,
  });
  return response.data;
}

/**
 * Update an existing inventory item
 */
export async function updateInventoryItem(
  id: number,
  data: Partial<{
    quantity_in_stock: number;
    unit: 'lb';
    reorder_point: number;
    reorder_quantity: number;
    location: string;
    batch_number: string;
    expiration_date: string;
    notes: string;
    last_restocked_at: string;
  }>
): Promise<SingleInventoryResponse> {
  const response = await strapiApi.put<SingleInventoryResponse>(`/api/inventories/${id}`, {
    data,
  });
  return response.data;
}

/**
 * Delete an inventory item
 */
export async function deleteInventoryItem(id: number): Promise<void> {
  await strapiApi.delete(`/api/inventories/${id}`);
}
