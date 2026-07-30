import { create } from "zustand";
import { supabase } from "@/services/supabase";
import { getMyCouple } from "@/services/couples";
// Type definition for couple context store state and synchronization actions.
type CoupleState = {
  coupleId: string | null;
  loading: boolean;
  error: string | null;
  fetchCouple: () => Promise<void>;
  reset: () => void;
};
// Global Zustand store for tracking linked couple ID and loading status.
export const useCoupleStore = create<CoupleState>((set) => ({
  coupleId: null,
  loading: true,
  error: null,
  // Synchronizes linked couple ID for the current authenticated session.
  fetchCouple: async () => {
    set({ loading: true, error: null });

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      set({ coupleId: null, loading: false });
      return;
    }

    try {
      const coupleId = await getMyCouple();
      set({ coupleId, loading: false });
    } catch (error) {
      set({
        coupleId: null,
        loading: false,
        error: error instanceof Error ? error.message : "No se pudo cargar la pareja.",
      });
    }
  },
  // Resets store state to default empty values on sign-out or session end.
  reset: () => set({ coupleId: null, loading: false, error: null }),
}));
