import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartTotals } from '@/types/cart';
import type { Product } from '@/types/product';
import type { CustomizationSelections } from '@/types/customization';

interface CartStore {
  // State
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (
    product: Product,
    selections: CustomizationSelections,
    unitPrice: number,
    weight: number,
    weightUnit: string
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setOpen: (isOpen: boolean) => void;

  // Computed
  getTotals: () => CartTotals;
  getItemCount: () => number;
}

/**
 * Generate a unique ID for cart items
 */
function generateItemId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, selections, unitPrice, weight, weightUnit) => {
        const newItem: CartItem = {
          id: generateItemId(),
          product,
          quantity: 1,
          selections,
          unitPrice,
          weight,
          weightUnit,
          addedAt: new Date().toISOString(),
        };

        set((state) => ({
          items: [...state.items, newItem],
        }));
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      setOpen: (isOpen) => {
        set({ isOpen });
      },

      getTotals: () => {
        const { items } = get();
        return {
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
          ),
          totalWeight: items.reduce(
            (sum, item) => sum + item.weight * item.quantity,
            0
          ),
        };
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'bcflame-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
