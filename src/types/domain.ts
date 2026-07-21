import type { Tables } from "./supabase";

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

export type Photo = PhotoRecord & { url: string };

export type DashboardCounts = {
  events: number;
  memories: number;
  photos: number;
  goals: number;
  messages: number;
  letters: number;
  unreadNotifications: number;
};

export type CoupleSummary = {
  couple: Couple | null;
  nextEvent: Event | null;
  recentMemories: Memory[];
  recentPhotos: Photo[];
  counts: DashboardCounts;
};

export type GoalWithChecklist = Goal & {
  checklist_items: ChecklistItem[];
};
