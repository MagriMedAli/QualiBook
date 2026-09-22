export type LeadStage =
  | "new"
  | "qualifying"
  | "qualified"
  | "unqualified"
  | "booked";

export type Lead = {
  id: number;
  contact_id: string;
  name: string | null;
  budget: string | null;
  area: string | null;
  intent: string | null;
  timeline: string | null;
  stage: LeadStage;
  qualified: boolean | null;
  meeting_time: string | null;
  last_message: string | null;
  created_at: string;
  updated_at: string;
};

export type DashboardStats = {
  total: number;
  new: number;
  qualifying: number;
  qualified: number;
  unqualified: number;
  booked: number;
  meetingsThisWeek: number;
  qualifiedRate: number;
  stages: Array<{ name: LeadStage; value: number }>;
};
