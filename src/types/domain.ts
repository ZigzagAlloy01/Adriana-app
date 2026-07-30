import type { Tables } from "./supabase";
// Database row entity type aliases extracted from Supabase schema definitions.
export type Profile = Tables<"profiles">;
export type Couple = Tables<"couples">;
export type Event = Tables<"events">;
export type Memory = Tables<"memories">;
export type Message = Tables<"messages">;
export type Goal = Tables<"goals">;
export type ChecklistItem = Tables<"checklist_items">;
export type Notification = Tables<"notifications">;
export type TimelinePost = Tables<"timeline_posts">;
export type Album = Tables<"albums">;
export type PhotoRecord = Tables<"photos">;
// Extended photo entity type appending client-side signed storage URL.
export type Photo = PhotoRecord & { url: string };
// Counter metrics shape for dashboard navigation badge indicators.
export type DashboardCounts = {
  events: number;
  memories: number;
  photos: number;
  goals: number;
  messages: number;
  letters: number;
  unreadNotifications: number;
};
// Aggregated data payload structure for primary dashboard view hydration.
export type CoupleSummary = {
  couple: Couple | null;
  nextEvent: Event | null;
  recentMemories: Memory[];
  recentPhotos: Photo[];
  counts: DashboardCounts;
};
// Composite goal entity type joined with nested checklist sub-items.
export type GoalWithChecklist = Goal & {
  checklist_items: ChecklistItem[];
};
