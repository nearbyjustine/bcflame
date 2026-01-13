/**
 * Cart type definitions
 */

import type { Product } from './product';
import type { CustomizationSelections } from './customization';

/**
 * A single item in the shopping cart
 */
export interface CartItem {
  /** Unique identifier for this cart item */
  id: string;
  /** The product being ordered */
  product: Product;
  /** Quantity of this product */
  quantity: number;
  /** Customization selections made for this product */
  selections: CustomizationSelections;
  /** Calculated unit price (based on product pricing) */
  unitPrice: number;
  /** Weight of this item in grams */
  weight: number;
  /** Weight unit (typically 'g') */
  weightUnit: string;
  /** Timestamp when item was added */
  addedAt: string;
}

/**
 * Cart state interface
 */
export interface CartState {
  /** Array of items in the cart */
  items: CartItem[];
}

/**
 * Cart computed values
 */
export interface CartTotals {
  /** Total number of items */
  itemCount: number;
  /** Total price of all items */
  totalPrice: number;
  /** Total weight of all items */
  totalWeight: number;
}
