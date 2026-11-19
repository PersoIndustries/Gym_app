// Domain types mirroring the Supabase schema (supabase/migrations). Keep in sync.
export type TenantRole = "athlete" | "coach" | "admin";
export type PlatformRole = "super_admin" | "developer";
export type AppRole = TenantRole | PlatformRole;
export type RoadmapStatus = "pending" | "in_progress" | "done";

export interface Tenant { id: string; name: string; slug: string; city: string; status: "active" | "trial" | "paused"; members: number; }
export interface ActivityType { id: string; tenant_id: string; name: string; kind: "class" | "facility"; }
export interface MembershipPlan {
  id: string; tenant_id: string; name: string; price_cents: number;
  /** 0 = domingo … 6 = sábado */
  allowed_weekdays: number[];
  /** vacío = todas las actividades */
  allowed_activity_type_ids: string[];
  weekly_class_limit: number | null;
  facility_windows?: { weekday: number; from: string; to: string }[];
}
export interface GymClass { id: string; tenant_id: string; activity_type_id: string; title: string; coach: string; starts_at: string; ends_at: string; capacity: number; booked: number; }
export interface Member { id: string; tenant_id: string; name: string; email: string; role: TenantRole; plan_id: string | null; }
export interface PersonalRecord { lift: string; weight_kg: number; recorded_on: string; }
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export interface RoadmapItem { id: string; title: string; description: string; status: RoadmapStatus; sort_order: number; priority?: TaskPriority; tags?: string[]; notes?: string; due?: string | null; }
