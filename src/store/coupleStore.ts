import { create } from "zustand";
import { supabase } from "@/services/supabase";

type CoupleState = {
  coupleId: string | null;
  loading: boolean;
  fetchCouple: () => Promise<void>;
};

export const useCoupleStore = create<CoupleState>((set) => ({
  coupleId: null,
  loading: true,

  fetchCouple: async () => {
    const { data } = await supabase
      .from("couple_members")
      .select("couple_id")
      .maybeSingle();

    set({
      coupleId: data?.couple_id ?? null,
      loading: false,
    });
  },
}));