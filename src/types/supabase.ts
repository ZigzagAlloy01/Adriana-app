export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; avatar_url: string | null; timezone: string; locale: string; created_at: string; updated_at: string };
        Insert: { id: string; display_name?: string | null; avatar_url?: string | null; timezone?: string; locale?: string; created_at?: string; updated_at?: string };
        Update: { id?: string; display_name?: string | null; avatar_url?: string | null; timezone?: string; locale?: string; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      couples: {
        Row: { id: string; name: string | null; anniversary_date: string | null; invite_code: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; name?: string | null; anniversary_date?: string | null; invite_code?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string | null; anniversary_date?: string | null; invite_code?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      couple_members: {
        Row: { couple_id: string; user_id: string; role: string; status: string; joined_at: string; created_at: string };
        Insert: { couple_id: string; user_id: string; role?: string; status?: string; joined_at?: string; created_at?: string };
        Update: { couple_id?: string; user_id?: string; role?: string; status?: string; joined_at?: string; created_at?: string };
        Relationships: [];
      };
      events: {
        Row: { id: string; couple_id: string; title: string; description: string | null; starts_at: string; ends_at: string | null; location: string | null; event_type: string; color: string; all_day: boolean; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; couple_id: string; title: string; description?: string | null; starts_at: string; ends_at?: string | null; location?: string | null; event_type?: string; color?: string; all_day?: boolean; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; couple_id?: string; title?: string; description?: string | null; starts_at?: string; ends_at?: string | null; location?: string | null; event_type?: string; color?: string; all_day?: boolean; created_by?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      memories: {
        Row: { id: string; couple_id: string; title: string; description: string | null; memory_date: string | null; favorite: boolean; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; couple_id: string; title: string; description?: string | null; memory_date?: string | null; favorite?: boolean; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; couple_id?: string; title?: string; description?: string | null; memory_date?: string | null; favorite?: boolean; created_by?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      photos: {
        Row: { id: string; couple_id: string | null; album_id: string | null; uploaded_by: string | null; storage_path: string; public_url: string | null; caption: string | null; width: number | null; height: number | null; size_bytes: number | null; mime_type: string | null; taken_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; couple_id?: string | null; album_id?: string | null; uploaded_by?: string | null; storage_path: string; public_url?: string | null; caption?: string | null; width?: number | null; height?: number | null; size_bytes?: number | null; mime_type?: string | null; taken_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; couple_id?: string | null; album_id?: string | null; uploaded_by?: string | null; storage_path?: string; public_url?: string | null; caption?: string | null; width?: number | null; height?: number | null; size_bytes?: number | null; mime_type?: string | null; taken_at?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      messages: {
        Row: { id: string; couple_id: string; sender_id: string; body: string; attachment_path: string | null; edited_at: string | null; created_at: string };
        Insert: { id?: string; couple_id: string; sender_id: string; body: string; attachment_path?: string | null; edited_at?: string | null; created_at?: string };
        Update: { id?: string; couple_id?: string; sender_id?: string; body?: string; attachment_path?: string | null; edited_at?: string | null; created_at?: string };
        Relationships: [];
      };
      goals: {
        Row: { id: string; couple_id: string; title: string; description: string | null; status: string; due_date: string | null; completed_at: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; couple_id: string; title: string; description?: string | null; status?: string; due_date?: string | null; completed_at?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; couple_id?: string; title?: string; description?: string | null; status?: string; due_date?: string | null; completed_at?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      checklist_items: {
        Row: { id: string; goal_id: string; title: string; completed: boolean; position: number; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; goal_id: string; title: string; completed?: boolean; position?: number; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; goal_id?: string; title?: string; completed?: boolean; position?: number; created_by?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      notifications: {
        Row: { id: string; user_id: string | null; couple_id: string | null; title: string; body: string | null; read: boolean; kind: string; metadata: Json; created_at: string; read_at: string | null };
        Insert: { id?: string; user_id?: string | null; couple_id?: string | null; title: string; body?: string | null; read?: boolean; kind?: string; metadata?: Json; created_at?: string; read_at?: string | null };
        Update: { id?: string; user_id?: string | null; couple_id?: string | null; title?: string; body?: string | null; read?: boolean; kind?: string; metadata?: Json; created_at?: string; read_at?: string | null };
        Relationships: [];
      };
      timeline_posts: {
        Row: { id: string; couple_id: string | null; body: string | null; created_by: string | null; created_at: string };
        Insert: { id?: string; couple_id?: string | null; body?: string | null; created_by?: string | null; created_at?: string };
        Update: { id?: string; couple_id?: string | null; body?: string | null; created_by?: string | null; created_at?: string };
        Relationships: [];
      };
      albums: {
        Row: { id: string; couple_id: string; name: string; description: string | null; cover_photo_id: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; couple_id: string; name: string; description?: string | null; cover_photo_id?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; couple_id?: string; name?: string; description?: string | null; cover_photo_id?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
    };
    Views: { dashboard_overview: { Row: { couple_id: string; name: string | null; anniversary_date: string | null; created_at: string; updated_at: string; members: Json }; Relationships: [] } };
    Functions: {
      create_couple_with_invitation: { Args: { p_anniversary_date?: string | null; p_display_name?: string | null }; Returns: { couple_id: string; invitation_code: string }[] };
      join_couple_by_code: { Args: { p_code: string }; Returns: string };
      create_invitation: { Args: Record<PropertyKey, never>; Returns: string };
      get_my_couple_id: { Args: Record<PropertyKey, never>; Returns: string | null };
      get_dashboard_summary: { Args: Record<PropertyKey, never>; Returns: Json };
    };
    Enums: Record<PropertyKey, never>;
    CompositeTypes: Record<PropertyKey, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
