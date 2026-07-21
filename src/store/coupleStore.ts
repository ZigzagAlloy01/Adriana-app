import { create } from "zustand";
import { supabase } from "@/services/supabase";
import { getMyCouple } from "@/services/couples";

type CoupleState = {
  coupleId: string | null;
  loading: boolean;
  error: string | null;
  fetchCouple: () => Promise<void>;
  reset: () => void;
};

export const useCoupleStore = create<CoupleState>((set) => ({
  coupleId: null,
  loading: true,
  error: null,

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

  reset: () => set({ coupleId: null, loading: false, error: null }),
}));
