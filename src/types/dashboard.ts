export type Event = {
  id: string;
  title: string;
  description?: string;
  event_date: string;
};

export type Memory = {
  id: string;
  title: string;
  description?: string;
  created_at: string;
};

export type Photo = {
  id: string;
  url: string;
  caption?: string;
};