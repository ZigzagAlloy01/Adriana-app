import { create } from "zustand";
import { supabase } from "@/services/supabase";
import type { User } from "@supabase/supabase-js";

type AuthState = {
  user: User | null;
  loading: boolean;
  initialized: boolean;

  init: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  init: async () => {
    set({ loading: true });

    const { data } = await supabase.auth.getUser();

    set({
      user: data.user,
      loading: false,
      initialized: true,
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));