import { supabase } from "@/services/supabase";

/* =========================
   COUPLE CONTEXT
========================= */

export async function getMyCoupleId() {
  const { data, error } = await supabase
    .from("couple_members")
    .select("couple_id")
    .single();

  if (error) throw error;

  return data.couple_id;
}

/* =========================
   EVENTS
========================= */

export async function getNextEvent(coupleId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("couple_id", coupleId)
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(1)
    .single();

  if (error) return null;

  return data;
}

/* =========================
   MEMORIES
========================= */

export async function getRecentMemories(coupleId: string) {
  const { data } = await supabase
    .from("memories")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(5);

  return data ?? [];
}

/* =========================
   PHOTOS
========================= */

export async function getRecentPhotos(coupleId: string) {
  const { data } = await supabase
    .from("photos")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(6);

  return data ?? [];
}