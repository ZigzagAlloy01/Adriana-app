import { supabase } from "@/services/supabase";

/* =========================
   COUPLE CONTEXT
========================= */

export async function getMyCoupleId() {
  const { data, error } = await supabase.rpc("get_my_couple_id");

  if (error) {
    console.error("Error obteniendo el ID de pareja:", error);
    throw error;
  }

  return data;
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
    .maybeSingle();

  if (error) return null;

  return data;
}

/* =========================
   MEMORIES
========================= */

export async function getRecentMemories(coupleId: string) {
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(5);
  
  if (error) {
    console.error("Error cargando recuerdos:", error);
    return [];
  }

  return data ?? [];
}

/* =========================
   PHOTOS
========================= */

export async function getRecentPhotos(coupleId: string) {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("Error cargando fotos:", error);
    return [];
  }

  return data ?? [];
}