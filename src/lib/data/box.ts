// Datos reales del box activo (Supabase, filtrado por RLS + tenant_id).
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Counts, Intent } from "@/lib/access/attendance";

export interface BoxClass { id: string; tenant_id: string; title: string; coach_name: string | null; starts_at: string; ends_at: string; capacity: number; min_attendees: number; cancel_hours_before: number; status: string; cancelled_reason: string | null; activity_type_id: string | null }
export interface MyEnrollment { class_id: string; intent: Intent; status: string }
export interface WodItem { id: string; class_id: string; block: string; position: number; exercise_id: string | null; label: string | null; sets: number | null; reps: string | null; percent_rm: number | null; notes: string | null }
export interface Exercise { id: string; name: string; category: string; uses_load: boolean; rm_lift: string | null }

export const EMPTY_COUNTS: Counts = { going: 0, maybe: 0, not_going: 0, waitlist: 0 };
const must = <T,>(r: { data: unknown; error: unknown }) => { if (r.error) throw r.error; return r.data as T; };

export function weekRange(offset = 0) {
  const now = new Date(); const monday = new Date(now); monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  const end = new Date(monday); end.setDate(monday.getDate() + 7);
  return { from: monday, to: end };
}

export const classesQuery = (tenantId: string | null, offset = 0) => queryOptions({
  queryKey: ["classes", tenantId, offset], enabled: !!tenantId,
  queryFn: async () => {
    const { from, to } = weekRange(offset);
    const classes = must<BoxClass[]>(await supabase.from("classes").select("*").eq("tenant_id", tenantId!).gte("starts_at", from.toISOString()).lt("starts_at", to.toISOString()).order("starts_at"));
    const att = must<{ class_id: string; going: number; maybe: number; not_going: number; waitlist: number }[]>(await supabase.rpc("class_attendance", { _tenant: tenantId!, _from: from.toISOString(), _to: to.toISOString() }));
    const { data: u } = await supabase.auth.getUser();
    const mine = must<MyEnrollment[]>(await supabase.from("class_enrollments").select("class_id, intent, status").eq("user_id", u.user!.id).in("class_id", classes.map((c) => c.id).concat("00000000-0000-0000-0000-000000000000")));
    const counts: Record<string, Counts> = {}; att.forEach((a) => (counts[a.class_id] = a));
    return { classes, counts, mine: Object.fromEntries(mine.map((m) => [m.class_id, m])) as Record<string, MyEnrollment> };
  },
});

export const classDetailQuery = (classId: string) => queryOptions({
  queryKey: ["class", classId],
  queryFn: async () => {
    const cls = must<BoxClass>(await supabase.from("classes").select("*").eq("id", classId).single());
    const wod = must<WodItem[]>(await supabase.from("wod_items").select("*").eq("class_id", classId).order("block").order("position"));
    const attendees = must<{ user_id: string; full_name: string; avatar_url: string | null; intent: Intent; status: string; attended: boolean | null }[]>(await supabase.rpc("class_attendees", { _class: classId }));
    return { cls, wod, attendees };
  },
});

export const exercisesQuery = (tenantId: string | null) => queryOptions({
  queryKey: ["exercises", tenantId], enabled: !!tenantId,
  queryFn: async () => must<Exercise[]>(await supabase.from("exercises").select("id, name, category, uses_load, rm_lift").eq("tenant_id", tenantId!).order("name")),
});

export const settingsQuery = (tenantId: string | null) => queryOptions({
  queryKey: ["settings", tenantId], enabled: !!tenantId,
  queryFn: async () => (await supabase.from("tenant_settings").select("*").eq("tenant_id", tenantId!).maybeSingle()).data ?? { rounding_kg: 2.5, default_cancel_hours: 4, default_min_attendees: 3 },
});

export const myRmsQuery = () => queryOptions({
  queryKey: ["rms"],
  queryFn: async () => { const rows = must<{ lift: string; weight_kg: number }[]>(await supabase.from("personal_records").select("lift, weight_kg")); return Object.fromEntries(rows.map((r) => [r.lift, Number(r.weight_kg)])) as Record<string, number>; },
});

export const templatesQuery = (tenantId: string | null) => queryOptions({
  queryKey: ["templates", tenantId], enabled: !!tenantId,
  queryFn: async () => must<{ id: string; title: string; weekday: number; start_time: string; duration_min: number; coach_name: string | null; capacity: number; min_attendees: number; cancel_hours_before: number; active: boolean }[]>(
    await supabase.from("class_templates").select("*").eq("tenant_id", tenantId!).order("weekday").order("start_time")),
});

export async function bookClass(classId: string, intent: Intent) { return must<string>(await supabase.rpc("book_class", { _class: classId, _intent: intent })); }
export async function leaveClass(classId: string) { must(await supabase.rpc("leave_class", { _class: classId })); }
export async function saveRm(lift: string, kg: number | null) {
  const { data: u } = await supabase.auth.getUser();
  if (kg === null) { must(await supabase.from("personal_records").delete().eq("user_id", u.user!.id).eq("lift", lift)); return; }
  must(await supabase.from("personal_records").upsert({ user_id: u.user!.id, lift, weight_kg: kg, recorded_on: new Date().toISOString().slice(0, 10) }, { onConflict: "user_id,lift" }));
}
export const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const BLOCKS: Record<string, string> = { warmup: "Calentamiento", strength: "Fuerza", metcon: "Metcon", accessory: "Accesorios" };
