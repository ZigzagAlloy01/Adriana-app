import { create } from "zustand";
import { getDashboardData } from "@/services/dashboard";
import type { CoupleSummary } from "@/types/domain";
// Type definition for dashboard store state and async fetching actions.
type DashboardState = {
  summary: CoupleSummary | null;
  loading: boolean;
  error: string | null;
  load: (coupleId: string) => Promise<void>;
  reset: () => void;
};
// Global Zustand store for caching aggregated dashboard summary metrics and entities.
export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  loading: false,
  error: null,
  // Loads and hydrates dashboard metrics for the target couple ID.
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
  // Clears dashboard summary state back to initial values.
  reset: () => set({ summary: null, loading: false, error: null }),
}));
