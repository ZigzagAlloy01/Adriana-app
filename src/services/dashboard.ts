import { supabase } from "@/services/supabase";
import { requireCurrentUserId } from "@/services/helpers";
import type { ChecklistItem, Couple, CoupleSummary, Event, GoalWithChecklist, Memory, Notification, Photo, TimelinePost } from "@/types/domain";

const emptyCounts = { events: 0, memories: 0, photos: 0, goals: 0, messages: 0, letters: 0, unreadNotifications: 0 };

async function attachPhotoUrls(rows: Omit<Photo, "url">[]): Promise<Photo[]> {
  if (rows.length === 0) return [];

  const { data } = await supabase.storage
    .from("couple-photos")
    .createSignedUrls(rows.map((photo) => photo.storage_path), 60 * 60);

  return rows.map((photo, index) => ({
    ...photo,
    url: photo.public_url || data?.[index]?.signedUrl || "",
  }));
}

export async function getMyCoupleId() {
  const { data, error } = await supabase.rpc("get_my_couple_id");
  if (error) throw error;
  return data;
}

export async function getCouple(coupleId: string) {
  const { data, error } = await supabase.from("couples").select("*").eq("id", coupleId).single();
  if (error) throw error;
  return data;
}

export async function updateCouple(coupleId: string, values: Partial<Pick<Couple, "name" | "anniversary_date">>) {
  const { data, error } = await supabase.from("couples").update(values).eq("id", coupleId).select("*").single();
  if (error) throw error;
  return data;
}

export async function getNextEvent(coupleId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("couple_id", coupleId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getRecentMemories(coupleId: string, limit = 5) {
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getRecentPhotos(coupleId: string, limit = 6) {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return attachPhotoUrls(data ?? []);
}

export async function getDashboardData(coupleId: string): Promise<CoupleSummary> {
  const [
    couple,
    nextEvent,
    memories,
    photos,
    eventsCount,
    memoriesCount,
    photosCount,
    goalsCount,
    messagesCount,
    lettersCount,
    unreadNotificationsCount,
  ] = await Promise.all([
    getCouple(coupleId),
    getNextEvent(coupleId),
    getRecentMemories(coupleId),
    getRecentPhotos(coupleId),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("couple_id", coupleId),
    supabase.from("memories").select("id", { count: "exact", head: true }).eq("couple_id", coupleId),
    supabase.from("photos").select("id", { count: "exact", head: true }).eq("couple_id", coupleId),
    supabase.from("goals").select("id", { count: "exact", head: true }).eq("couple_id", coupleId).eq("status", "active"),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("couple_id", coupleId),
    supabase.from("timeline_posts").select("id", { count: "exact", head: true }).eq("couple_id", coupleId),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false),
  ]);

  return {
    couple,
    nextEvent,
    recentMemories: memories,
    recentPhotos: photos,
    counts: {
      events: eventsCount.count ?? emptyCounts.events,
      memories: memoriesCount.count ?? emptyCounts.memories,
      photos: photosCount.count ?? emptyCounts.photos,
      goals: goalsCount.count ?? emptyCounts.goals,
      messages: messagesCount.count ?? emptyCounts.messages,
      letters: lettersCount.count ?? emptyCounts.letters,
      unreadNotifications: unreadNotificationsCount.count ?? emptyCounts.unreadNotifications,
    },
  };
}

export async function listEvents(coupleId: string) {
  const { data, error } = await supabase.from("events").select("*").eq("couple_id", coupleId).order("starts_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createEvent(coupleId: string, input: Pick<Event, "title" | "description" | "starts_at" | "location">) {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase.from("events").insert({ ...input, couple_id: coupleId, created_by: userId }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listMemories(coupleId: string) {
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("couple_id", coupleId)
    .order("memory_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMemory(coupleId: string, input: Pick<Memory, "title" | "description" | "memory_date">) {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase.from("memories").insert({ ...input, couple_id: coupleId, created_by: userId }).select("*").single();
  if (error) throw error;
  return data;
}

export async function toggleMemoryFavorite(memoryId: string, favorite: boolean) {
  const { data, error } = await supabase.from("memories").update({ favorite }).eq("id", memoryId).select("*").single();
  if (error) throw error;
  return data;
}

export async function listPhotos(coupleId: string) {
  const { data, error } = await supabase.from("photos").select("*").eq("couple_id", coupleId).order("created_at", { ascending: false });
  if (error) throw error;
  return attachPhotoUrls(data ?? []);
}

export async function uploadPhoto(coupleId: string, file: File, caption: string) {
  const userId = await requireCurrentUserId();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = coupleId + "/" + crypto.randomUUID() + "-" + safeName;

  const { error: uploadError } = await supabase.storage.from("couple-photos").upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("photos")
    .insert({ couple_id: coupleId, uploaded_by: userId, storage_path: storagePath, caption: caption.trim() || null, mime_type: file.type || null, size_bytes: file.size })
    .select("*")
    .single();
  if (error) throw error;
  const [photo] = await attachPhotoUrls([data]);
  return photo;
}

export async function listMessages(coupleId: string) {
  const { data, error } = await supabase.from("messages").select("*").eq("couple_id", coupleId).order("created_at", { ascending: true }).limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(coupleId: string, body: string) {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase.from("messages").insert({ couple_id: coupleId, sender_id: userId, body }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listLetters(coupleId: string): Promise<TimelinePost[]> {
  const { data, error } = await supabase
    .from("timeline_posts")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createLetter(coupleId: string, body: string): Promise<TimelinePost> {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from("timeline_posts")
    .insert({ couple_id: coupleId, created_by: userId, body })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listGoals(coupleId: string): Promise<GoalWithChecklist[]> {
  const { data: goals, error } = await supabase.from("goals").select("*").eq("couple_id", coupleId).order("created_at", { ascending: false });
  if (error) throw error;
  if (!goals?.length) return [];

  const { data: items, error: itemsError } = await supabase
    .from("checklist_items")
    .select("*")
    .in("goal_id", goals.map((goal) => goal.id))
    .order("position", { ascending: true });
  if (itemsError) throw itemsError;

  return goals.map((goal) => ({
    ...goal,
    checklist_items: (items ?? []).filter((item) => item.goal_id === goal.id),
  }));
}

export async function createGoal(coupleId: string, title: string, description: string): Promise<GoalWithChecklist> {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from("goals")
    .insert({ couple_id: coupleId, title, description: description.trim() || null, created_by: userId })
    .select("*")
    .single();
  if (error) throw error;
  return { ...data, checklist_items: [] };
}

export async function toggleGoal(goalId: string, complete: boolean): Promise<GoalWithChecklist> {
  const { data, error } = await supabase
    .from("goals")
    .update({ status: complete ? "completed" : "active", completed_at: complete ? new Date().toISOString() : null })
    .eq("id", goalId)
    .select("*")
    .single();
  if (error) throw error;
  return { ...data, checklist_items: [] };
}

export async function createChecklistItem(goalId: string, title: string, position: number): Promise<ChecklistItem> {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from("checklist_items")
    .insert({ goal_id: goalId, title, position, created_by: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function toggleChecklistItem(itemId: string, completed: boolean): Promise<ChecklistItem> {
  const { data, error } = await supabase.from("checklist_items").update({ completed }).eq("id", itemId).select("*").single();
  if (error) throw error;
  return data;
}
