import { create } from "zustand";
import { getDashboardData } from "@/services/dashboard";
import type { CoupleSummary } from "@/types/domain";

type DashboardState = {
  summary: CoupleSummary | null;
  loading: boolean;
  error: string | null;
  load: (coupleId: string) => Promise<void>;
  reset: () => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  loading: false,
  error: null,

  load: async (coupleId) => {
    set({ loading: true, error: null });
    try {
      const summary = await getDashboardData(coupleId);
      set({ summary, loading: false });
    } catch (error) {
      set({
        summary: null,
        loading: false,
        error: error instanceof Error ? error.message : "No se pudo cargar el dashboard.",
      });
    }
  },

  reset: () => set({ summary: null, loading: false, error: null }),
}));
