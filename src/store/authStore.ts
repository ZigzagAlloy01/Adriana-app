import { create } from "zustand";
import { supabase } from "@/services/supabase";
import type { User } from "@supabase/supabase-js";
// Type definition for authentication store state and lifecycle actions.
type AuthState = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  logout: () => Promise<void>;
};
// Global Zustand store managing Supabase auth session state and initialization.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  // Initializes current user auth state from active Supabase session.
  init: async () => {
    set({ loading: true });
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      set({ user: null, loading: false, initialized: true });
      return;
    }
    set({ user: data.user, loading: false, initialized: true });
  },
  // Terminates Supabase authentication session and resets local state.
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
