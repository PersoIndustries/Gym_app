import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { MembershipPlan } from "@/lib/domain/types";

export type GymEvent = Database["public"]["Tables"]["gym_events"]["Row"];
export const result = <T,>(r: { data: T | null; error: unknown }): T => { if (r.error) throw r.error; if (r.data === null) throw new Error("No se encontraron datos"); return r.data; };
export const assertOk = (r: { error: unknown }) => { if (r.error) throw r.error; };
export const coachesQuery = (tenant: string | null) => queryOptions({ queryKey: ["coaches", tenant], enabled: !!tenant, queryFn: async () => tenant ? result(await supabase.rpc("box_coaches", { _tenant: tenant })) : [] });
export const eventsQuery = (tenant: string | null) => queryOptions({ queryKey: ["gym-events", tenant], enabled: !!tenant, queryFn: async () => tenant ? result(await supabase.from("gym_events").select("*").eq("tenant_id", tenant).order("starts_at")) : [] });
export const plansQuery = (tenant: string | null) => queryOptions({ queryKey: ["plans", tenant], enabled: !!tenant, queryFn: async () => tenant ? result(await supabase.from("membership_plans").select("*").eq("tenant_id", tenant).order("name")) : [] });
export const activitiesQuery = (tenant: string | null) => queryOptions({ queryKey: ["activities", tenant], enabled: !!tenant, queryFn: async () => tenant ? result(await supabase.from("activity_types").select("*").eq("tenant_id", tenant)) : [] });
export const myPlanQuery = (tenant: string | null, user: string | undefined) => queryOptions({
  queryKey: ["my-plan", tenant, user], enabled: !!tenant && !!user,
  queryFn: async () => {
    if (!tenant || !user) return null;
    const day = new Date().toLocaleDateString("sv-SE");
    const rows = result(await supabase.from("user_memberships").select("*, membership_plans(*)").eq("tenant_id", tenant).eq("user_id", user).eq("status", "active").lte("starts_on", day).or(`ends_on.is.null,ends_on.gte.${day}`).order("starts_on", { ascending: false }).order("created_at", { ascending: false }).limit(1));
    const plan = rows[0]?.membership_plans;
    if (!plan) return null;
    const windows = Array.isArray(plan.facility_windows) ? plan.facility_windows.flatMap(w => {
      if (!w || typeof w !== "object" || Array.isArray(w) || typeof w["weekday"] !== "number" || typeof w["from"] !== "string" || typeof w["to"] !== "string") return [];
      return [{weekday:w["weekday"],from:w["from"],to:w["to"]}];
    }) : [];
    return { ...plan, facility_windows: windows } satisfies MembershipPlan;
  },
});
export const tenantLinksQuery = () => queryOptions({ queryKey: ["tenant-links"], queryFn: async () => result(await supabase.from("tenants").select("id,name,city,slug,tenant_invites(code)").order("name")) });
export async function saveEvent(tenant: string, f: { title: string; description: string; starts_at: string; ends_at: string; kind: string; blocks_classes: boolean }) { assertOk(await supabase.from("gym_events").insert({ ...f, tenant_id: tenant, starts_at: new Date(f.starts_at).toISOString(), ends_at: new Date(f.ends_at).toISOString() })); }
export async function deleteEvent(id: string) { assertOk(await supabase.from("gym_events").delete().eq("id", id)); }
export async function savePlan(tenant: string, id: string | null, plan: Omit<Database["public"]["Tables"]["membership_plans"]["Insert"], "tenant_id">) {
  if (id) assertOk(await supabase.from("membership_plans").update(plan).eq("id", id).eq("tenant_id", tenant));
  else assertOk(await supabase.from("membership_plans").insert({ ...plan, tenant_id: tenant }));
}
export async function deletePlan(id: string) { assertOk(await supabase.from("membership_plans").delete().eq("id", id)); }
export const membersQuery = (tenant: string | null) => queryOptions({ queryKey: ["members", tenant], enabled: !!tenant, queryFn: async () => {
  if (!tenant) return { members: [], requests: [], invites: [], profiles: [], memberships: [] };
  const members = result(await supabase.from("tenant_members").select("id,user_id,role").eq("tenant_id", tenant));
  const requests = result(await supabase.from("tenant_join_requests").select("id,user_id,role,created_at").eq("tenant_id", tenant).eq("status", "pending"));
  const invites = result(await supabase.from("tenant_invites").select("id,code,requires_approval,uses,membership_plan_id").eq("tenant_id", tenant));
  const ids = [...members.map(m => m.user_id), ...requests.map(r => r.user_id)];
  const profiles = ids.length ? result(await supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids)) : [];
  const memberships = result(await supabase.from("user_memberships").select("*").eq("tenant_id", tenant).order("starts_on", { ascending: false }).order("created_at", { ascending: false }));
  return { members, requests, invites, profiles, memberships };
} });
export async function assignPlan(tenant: string, user: string, plan: string, existing?: string) {
  if (plan === "none") { if (existing) assertOk(await supabase.from("user_memberships").update({ status: "inactive" }).eq("id", existing).eq("tenant_id", tenant)); return; }
  const value = { tenant_id: tenant, user_id: user, plan_id: plan, starts_on: new Date().toLocaleDateString("sv-SE"), ends_on: null, status: "active" };
  if (existing) assertOk(await supabase.from("user_memberships").update(value).eq("id", existing));
  else assertOk(await supabase.from("user_memberships").insert(value));
}
export async function changeMemberRole(tenant: string, id: string, role: "athlete" | "coach" | "admin") { assertOk(await supabase.from("tenant_members").update({ role }).eq("tenant_id", tenant).eq("id", id)); }
export async function setInvitePlan(tenant: string, invite: string, plan: string) { assertOk(await supabase.from("tenant_invites").update({ membership_plan_id: plan === "none" ? null : plan }).eq("tenant_id", tenant).eq("id", invite)); }