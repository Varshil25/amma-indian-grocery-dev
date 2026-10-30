import { create } from "zustand";

interface CartUIState {
  isDrawerOpen: boolean;
  /** Coupon the shopper applied in the cart; checkout re-validates it on the server */
  couponCode: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setCouponCode: (code: string | null) => void;
}

export const useCartUIStore = create<CartUIState>((set) => ({
  isDrawerOpen: false,
  couponCode: null,
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),
  setCouponCode: (couponCode) => set({ couponCode }),
}));
