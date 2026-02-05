// Wishlist Context using Zustand
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WishlistItemType, ArtListingType } from '@/types';

interface WishlistState {
  items: WishlistItemType[];
  isOpen: boolean;
  
  // Actions
  openWishlist: () => void;
  closeWishlist: () => void;
  toggleWishlist: () => void;
  addItem: (artwork: ArtListingType) => void;
  removeItem: (artListingId: string) => void;
  toggleItem: (artwork: ArtListingType) => void;
  clearWishlist: () => void;
  
  // Computed
  getItemCount: () => number;
  isInWishlist: (artListingId: string) => boolean;
}

// Create the store with persistence
const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openWishlist: () => set({ isOpen: true }),
      closeWishlist: () => set({ isOpen: false }),
      toggleWishlist: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (artwork) => {
        const items = get().items;
        const exists = items.some((item) => item.artListingId === artwork.id);

        if (!exists) {
          const newItem: WishlistItemType = {
            id: `wishlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            wishlistId: 'local',
            artListingId: artwork.id,
            artListing: artwork,
            createdAt: new Date(),
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (artListingId) => {
        set((state) => ({
          items: state.items.filter((item) => item.artListingId !== artListingId),
        }));
      },

      toggleItem: (artwork) => {
        const items = get().items;
        const exists = items.some((item) => item.artListingId === artwork.id);

        if (exists) {
          set({
            items: items.filter((item) => item.artListingId !== artwork.id),
          });
        } else {
          const newItem: WishlistItemType = {
            id: `wishlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            wishlistId: 'local',
            artListingId: artwork.id,
            artListing: artwork,
            createdAt: new Date(),
          };
          set({ items: [...items, newItem] });
        }
      },

      clearWishlist: () => set({ items: [] }),

      getItemCount: () => get().items.length,

      isInWishlist: (artListingId) => {
        return get().items.some((item) => item.artListingId === artListingId);
      },
    }),
    {
      name: 'artafrik-wishlist',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Export a hook for using wishlist in components
// Using individual selectors to avoid "not a function" errors
export function useWishlist() {
  const items = useWishlistStore((state) => state.items);
  const isOpen = useWishlistStore((state) => state.isOpen);
  const itemCount = useWishlistStore((state) => state.getItemCount());
  const openWishlist = useWishlistStore((state) => state.openWishlist);
  const closeWishlist = useWishlistStore((state) => state.closeWishlist);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const addItem = useWishlistStore((state) => state.addItem);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);

  return {
    items,
    isOpen,
    itemCount,
    openWishlist,
    closeWishlist,
    toggleWishlist,
    addItem,
    removeItem,
    toggleItem,
    clearWishlist,
    isInWishlist,
  };
}

// Export the store for advanced use cases
export { useWishlistStore };
export type { WishlistState };

