'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItemType, ArtListingType } from '@/types';

interface CartState {
  items: CartItemType[];
  isOpen: boolean;
  
  // Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (artwork: ArtListingType, quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getItem: (artListingId: string) => CartItemType | undefined;
}

// Create the store with persistence
const createCartStore = () =>
  create<CartState>()(
    persist(
      (set, get) => ({
        items: [],
        isOpen: false,

        openCart: () => set({ isOpen: true }),
        closeCart: () => set({ isOpen: false }),
        toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

        addItem: (artwork, quantity = 1) => {
          const items = get().items;
          const existingItem = items.find((item) => item.artListingId === artwork.id);

          if (existingItem) {
            set({
              items: items.map((item) =>
                item.artListingId === artwork.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            });
          } else {
            const newItem: CartItemType = {
              id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              cartId: '',
              artListingId: artwork.id,
              quantity,
              artListing: artwork,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            set({ items: [...items, newItem] });
          }
        },

        removeItem: (cartItemId) => {
          set((state) => ({
            items: state.items.filter((item) => item.id !== cartItemId),
          }));
        },

        updateQuantity: (cartItemId, quantity) => {
          if (quantity <= 0) {
            get().removeItem(cartItemId);
            return;
          }
          set((state) => ({
            items: state.items.map((item) =>
              item.id === cartItemId ? { ...item, quantity } : item
            ),
          }));
        },

        clearCart: () => set({ items: [] }),

        getItemCount: () => {
          return get().items.reduce((total, item) => total + item.quantity, 0);
        },

        getSubtotal: () => {
          return get().items.reduce(
            (total, item) => total + (item.artListing?.price || 0) * item.quantity,
            0
          );
        },

        getItem: (artListingId) => {
          return get().items.find((item) => item.artListingId === artListingId);
        },
      }),
      {
        name: 'artafrik-cart',
        partialize: (state) => ({ items: state.items }),
      }
    )
  );

// Create a singleton store instance
let cartStore: ReturnType<typeof createCartStore> | null = null;

export function getCartStore() {
  if (typeof window === 'undefined') {
    // Server-side: create a new store for each request
    return createCartStore();
  }
  // Client-side: use singleton
  if (!cartStore) {
    cartStore = createCartStore();
  }
  return cartStore;
}

// Custom hook for using cart
export function useCart() {
  const store = getCartStore();
  return {
    items: store((state) => state.items),
    isOpen: store((state) => state.isOpen),
    itemCount: store((state) => state.getItemCount()),
    subtotal: store((state) => state.getSubtotal()),
    openCart: store((state) => state.openCart),
    closeCart: store((state) => state.closeCart),
    toggleCart: store((state) => state.toggleCart),
    addItem: store((state) => state.addItem),
    removeItem: store((state) => state.removeItem),
    updateQuantity: store((state) => state.updateQuantity),
    clearCart: store((state) => state.clearCart),
    getItem: store((state) => state.getItem),
  };
}

// Export the store type for advanced use cases
export type { CartState };

