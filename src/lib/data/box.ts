// Datos reales del box activo (Supabase, filtrado por RLS + tenant_id).
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Counts, Intent } from "@/lib/access/attendance";

export type GroupFormat = "amrap" | "emom" | "for_time" | "rounds" | "sets";
export interface WodGroup { key: string; format: GroupFormat; minutes?: number | null; rounds?: number | null; title?: string }
export const FORMAT_LABEL: Record<GroupFormat, string> = { amrap: "AMRAP", emom: "EMOM", for_time: "For Time", rounds: "Rondas", sets: "Series" };
export function groupTitle(g: WodGroup) { const parts = [FORMAT_LABEL[g.format]]; if (g.rounds) parts.push(g.format === "for_time" ? `${g.rounds} rondas` : `x${g.rounds}`); if (g.minutes) parts.push(g.format === "for_time" ? `cap ${g.minutes}'` : `${g.minutes}'`); return (g.title ? g.title + " · " : "") + parts.join(" "); }
export interface Phase { key: string; title: string; alternatives: string; alternativeTo?: string; groups?: WodGroup[] }
export interface BoxClass { id: string; tenant_id: string; title: string; coach_name: string | null; coach_id: string | null; phases: Phase[]; starts_at: string; ends_at: string; capacity: number; min_attendees: number; cancel_hours_before: number; status: string; cancelled_reason: string | null; activity_type_id: string | null }
export interface MyEnrollment { class_id: string; intent: Intent; status: string }
export interface WodItem { id: string; class_id: string; block: string; position: number; exercise_id: string | null; label: string | null; sets: number | null; reps: string | null; percent_rm: number | null; notes: string | null; alternatives: string | null; alternative_to: string | null; group_key?: string | null }
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
    if (!tenantId) throw new Error("Selecciona un box");
    const { from, to } = weekRange(offset);
    const classes = must<BoxClass[]>(await supabase.from("classes").select("*").eq("tenant_id", tenantId).gte("starts_at", from.toISOString()).lt("starts_at", to.toISOString()).order("starts_at"));
    const att = must<{ class_id: string; going: number; maybe: number; not_going: number; waitlist: number }[]>(await supabase.rpc("class_attendance", { _tenant: tenantId, _from: from.toISOString(), _to: to.toISOString() }));
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Inicia sesión");
    const mine = must<MyEnrollment[]>(await supabase.from("class_enrollments").select("class_id, intent, status").eq("user_id", u.user.id).in("class_id", classes.map((c) => c.id).concat("00000000-0000-0000-0000-000000000000")));
    const counts: Record<string, Counts> = {}; att.forEach((a) => (counts[a.class_id] = a));
    return { classes, counts, mine: Object.fromEntries(mine.map((m) => [m.class_id, m])) as Record<string, MyEnrollment> };
  },
});

export const classDetailQuery = (classId: string) => queryOptions({
  queryKey: ["class", classId],
  queryFn: async () => {
    const cls = must<BoxClass>(await supabase.from("classes").select("*").eq("id", classId).single());
    const wod = must<WodItem[]>(await supabase.from("wod_items").select("*").eq("class_id", classId).order("block").order("position"));
    const attendees = must<{ user_id: string | null; full_name: string; avatar_url: string | null; intent: Intent; status: string; attended: boolean | null }[]>(await supabase.rpc("class_attendees", { _class: classId }));
    return { cls, wod, attendees };
  },
});

export const exercisesQuery = (tenantId: string | null) => queryOptions({
  queryKey: ["exercises", tenantId], enabled: !!tenantId,
  queryFn: async () => tenantId ? must<Exercise[]>(await supabase.from("exercises").select("id, name, category, uses_load, rm_lift").eq("tenant_id", tenantId).order("name")) : [],
});

export const settingsQuery = (tenantId: string | null) => queryOptions({
  queryKey: ["settings", tenantId], enabled: !!tenantId,
  queryFn: async () => tenantId ? (await supabase.from("tenant_settings").select("*").eq("tenant_id", tenantId).maybeSingle()).data ?? { rounding_kg: 2.5, default_cancel_hours: 4, default_min_attendees: 3, facilities_enabled: false } : null,
});

export const myRmsQuery = () => queryOptions({
  queryKey: ["rms"],
  queryFn: async () => { const { data } = await supabase.auth.getUser(); if (!data.user) throw new Error("Inicia sesión"); const rows = must<{ lift: string; weight_kg: number }[]>(await supabase.from("personal_records").select("lift, weight_kg").eq("user_id", data.user.id)); return Object.fromEntries(rows.map((r) => [r.lift, Number(r.weight_kg)])) as Record<string, number>; },
});

export const templatesQuery = (tenantId: string | null) => queryOptions({
  queryKey: ["templates", tenantId], enabled: !!tenantId,
  queryFn: async () => tenantId ? must<{ id: string; title: string; weekday: number; start_time: string; duration_min: number; coach_name: string | null; coach_id: string | null; capacity: number; min_attendees: number; cancel_hours_before: number; active: boolean }[]>(
    await supabase.from("class_templates").select("*").eq("tenant_id", tenantId).order("weekday").order("start_time")) : [],
});

export async function bookClass(classId: string, intent: Intent) { return must<string>(await supabase.rpc("book_class", { _class: classId, _intent: intent })); }
export async function leaveClass(classId: string) { must(await supabase.rpc("leave_class", { _class: classId })); }
export async function saveRm(lift: string, kg: number | null) {
  if (kg !== null && (!Number.isFinite(kg) || kg <= 0)) throw new Error("El RM debe ser mayor que cero");
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Inicia sesión");
  if (kg === null) { must(await supabase.from("personal_records").delete().eq("user_id", u.user.id).eq("lift", lift)); return; }
  must(await supabase.from("personal_records").upsert({ user_id: u.user.id, lift, weight_kg: kg, recorded_on: new Date().toISOString().slice(0, 10) }, { onConflict: "user_id,lift" }));
}
export const monthClassesQuery = (tenant: string | null, year: number, month: number) => queryOptions({ queryKey: ["classes", tenant, "month", year, month], enabled: !!tenant, queryFn: async () => {
  if (!tenant) return { classes: [] as BoxClass[], counts: {} as Record<string, Counts>, mine: {} as Record<string, MyEnrollment> };
  const from = new Date(year, month, 1); from.setDate(from.getDate()-((from.getDay()+6)%7));
  const to = new Date(year, month + 1, 1); to.setDate(to.getDate()+((7-((to.getDay()+6)%7))%7));
  const classes = must<BoxClass[]>(await supabase.from("classes").select("*").eq("tenant_id", tenant).gte("starts_at", from.toISOString()).lt("starts_at", to.toISOString()).order("starts_at"));
  const att = must<(Counts & { class_id: string })[]>(await supabase.rpc("class_attendance", { _tenant: tenant, _from: from.toISOString(), _to: to.toISOString() }));
  const { data } = await supabase.auth.getUser(); if (!data.user) throw new Error("Inicia sesión");
  const mine = must<MyEnrollment[]>(await supabase.from("class_enrollments").select("class_id,intent,status").eq("tenant_id", tenant).eq("user_id", data.user.id).in("class_id", classes.map(c => c.id).concat("00000000-0000-0000-0000-000000000000")));
  return { classes, counts: Object.fromEntries(att.map(a => [a.class_id,a])), mine: Object.fromEntries(mine.map(m => [m.class_id,m])) };
} });
export const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const BLOCKS: Record<string, string> = { warmup: "Calentamiento", strength: "Fuerza", metcon: "Metcon", accessory: "Accesorios" };

export async function updateClass(id: string, values: { title?: string; status?: string; cancelled_reason?: string | null; coach_id?: string | null; coach_name?: string | null }) { must(await supabase.from("classes").update(values).eq("id", id)); }
export async function updatePhases(id: string, phases: Phase[]) { must(await supabase.from("classes").update({ phases: JSON.parse(JSON.stringify(phases)) }).eq("id", id)); }
export async function deletePhase(id: string, key: string, phases: Phase[]) { must(await supabase.rpc("delete_class_phase", { _class: id, _key: key })); }
export async function deleteWod(id: string) { must(await supabase.from("wod_items").delete().eq("id", id)); }
export async function addWod(tenant: string, classId: string, f: Partial<WodItem>, position: number) {
  if (!f.exercise_id && !f.label?.trim()) throw new Error("Elige o escribe un ejercicio");
  return must(await supabase.from("wod_items").insert({ tenant_id: tenant, class_id: classId, block: f.block ?? "strength", position, exercise_id: f.exercise_id ?? null, label: f.label?.trim() ?? null, sets: f.sets ?? null, reps: f.reps ?? null, percent_rm: f.percent_rm ?? null, notes: f.notes ?? null, alternative_to: f.alternative_to ?? null, group_key: f.group_key ?? null }).select("id").single()) as { id: string };
}
export async function addAttendee(classId: string, uid: string) { return must<string>(await supabase.rpc("add_class_attendee", { _class: classId, _user: uid })); }
export async function markAttendee(classId: string, uid: string, attended: boolean) { must(await supabase.from("class_enrollments").update({ attended }).eq("class_id", classId).eq("user_id", uid)); }
export const myProfileQuery = (uid: string | undefined) => queryOptions({ queryKey: ["profile", uid], enabled: !!uid, queryFn: async () => uid ? must<{ full_name: string | null; hide_attendance: boolean; preferred_level_name: string | null }>(await supabase.from("profiles").select("full_name,hide_attendance,preferred_level_name").eq("id", uid).single()) : null });
export async function setAttendancePrivacy(uid: string, hidden: boolean) { must(await supabase.from("profiles").update({ hide_attendance: hidden }).eq("id", uid)); }

export async function deleteGroupItems(classId: string, groupKey: string) { must(await supabase.from("wod_items").delete().eq("class_id", classId).eq("group_key", groupKey)); }
