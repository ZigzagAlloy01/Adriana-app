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
  set({ loading: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    set({
      coupleId: null,
      loading: false,
    });
    return;
  }

  const { data, error } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .maybeSingle();

  console.log("Couple query:", { data, error });

  if (error) {
    set({
      coupleId: null,
      loading: false,
    });
    return;
  }

  set({
    coupleId: data?.couple_id ?? null,
    loading: false,
  });
},
}));