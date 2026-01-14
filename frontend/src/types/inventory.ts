/**
 * Inventory content type TypeScript definitions
 * Based on the Strapi Inventory schema
 */

import type { Product } from './product';

export interface InventoryAttributes {
  product: {
    data: Product;
  };
  quantity_in_stock: number;
  unit: 'lb';
  reorder_point: number;
  reorder_quantity: number;
  location?: string;
  batch_number?: string;
  expiration_date?: string;
  notes?: string;
  last_restocked_at?: string;
  last_restocked_by?: {
    data: {
      id: number;
      attributes: {
        firstname: string;
        lastname: string;
        email: string;
      };
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: number;
  attributes: InventoryAttributes;
}

export interface InventoryResponse {
  data: Inventory[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface SingleInventoryResponse {
  data: Inventory;
  meta: {};
}
