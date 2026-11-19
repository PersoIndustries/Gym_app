import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { assertOk, result } from "./gym";
import type { EventIntent } from "@/lib/access/events";

export type CommunityEvent = Database["public"]["Tables"]["community_events"]["Row"];
export type EventInput = Pick<CommunityEvent, "title" | "description" | "location" | "url" | "kind" | "format" | "scope" | "starts_at" | "ends_at" | "price_cents" | "capacity" | "categories" | "activity_type_ids">;

/** Eventos de comunidad publicados (público) + internos de mi box. */
export const calendarEventsQuery = (tenant: string | null) => queryOptions({
  queryKey: ["community-events", tenant],
  queryFn: async () => {
    let q = supabase.from("community_events").select("*").order("starts_at");
    q = tenant ? q.or(`and(scope.eq.community,status.eq.published),tenant_id.eq.${tenant}`) : q.eq("scope", "community").eq("status", "published");
    return result(await q.limit(500));
  },
});
/** Todos los de comunidad, incluidos ocultos, para moderación de plataforma. */
export const moderationEventsQuery = () => queryOptions({ queryKey: ["community-events", "moderation"], queryFn: async () => result(await supabase.from("community_events").select("*, tenants(name)").eq("scope", "community").order("starts_at")) });
export const eventQuery = (id: string) => queryOptions({ queryKey: ["community-event", id], queryFn: async () => { const r = await supabase.from("community_events").select("*, tenants(name)").eq("id", id).maybeSingle(); if (r.error) throw r.error; return r.data; } });
export const eventAttendeesQuery = (event: string, tenant: string | null) => queryOptions({ queryKey: ["event-attendees", event, tenant], enabled: !!tenant, queryFn: async () => tenant ? result(await supabase.rpc("event_attendees", { _event: event, _tenant: tenant })) : [] });
export const myParticipationQuery = (event: string, user: string | undefined, tenant: string | null) => queryOptions({ queryKey: ["event-me", event, user, tenant], enabled: !!user && !!tenant, queryFn: async () => (await supabase.from("event_participants").select("*").eq("event_id", event).eq("user_id", user!).eq("tenant_id", tenant!).maybeSingle()).data });

export async function saveEvent(tenant: string | null, id: string | null, e: EventInput) {
  if (!e.title.trim()) throw new Error("Escribe un título");
  if (new Date(e.ends_at) < new Date(e.starts_at)) throw new Error("La fecha de fin es anterior al inicio");
  if (id) assertOk(await supabase.from("community_events").update(e).eq("id", id));
  else assertOk(await supabase.from("community_events").insert({ ...e, tenant_id: tenant }));
}
export async function deleteEvent(id: string) { assertOk(await supabase.from("community_events").delete().eq("id", id)); }
export async function moderateEvent(id: string, patch: { status?: string; featured?: boolean }) { assertOk(await supabase.from("community_events").update(patch).eq("id", id)); }
export async function setParticipation(event: string, tenant: string, user: string, p: { intent: EventIntent; looking_for_partner: boolean; category: string | null; note: string | null }) {
  assertOk(await supabase.from("event_participants").upsert({ event_id: event, tenant_id: tenant, user_id: user, ...p }, { onConflict: "event_id,user_id,tenant_id" }));
}
export async function clearParticipation(event: string, tenant: string, user: string) { assertOk(await supabase.from("event_participants").delete().eq("event_id", event).eq("tenant_id", tenant).eq("user_id", user)); }
