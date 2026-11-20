import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { assertOk, result } from "./gym";
export type Level = Database["public"]["Tables"]["tenant_levels"]["Row"];
export type ItemLevel = Database["public"]["Tables"]["wod_item_levels"]["Row"];
export const levelsQuery = (tenant: string | null) => queryOptions({ queryKey: ["levels", tenant], enabled: !!tenant, queryFn: async () => tenant ? result(await supabase.from("tenant_levels").select("*").eq("tenant_id", tenant).order("position")) : [] });
export const classLevelsQuery = (itemIds: string[]) => queryOptions({ queryKey: ["item-levels", itemIds], enabled: itemIds.length > 0, queryFn: async () => result(await supabase.from("wod_item_levels").select("*").in("wod_item_id", itemIds)) });
export async function addLevel(tenant: string, name: string, position: number) { if (!name.trim()) throw new Error("Escribe un nombre"); assertOk(await supabase.from("tenant_levels").insert({ tenant_id: tenant, name: name.trim(), position })); }
export async function deleteLevel(id: string) { assertOk(await supabase.from("tenant_levels").delete().eq("id", id)); }
export async function saveItemLevel(tenant: string, item: string, level: string, v: { load_kg: number | null; percent_rm: number | null; reps: string | null; notes: string | null }) {
  assertOk(await supabase.from("wod_item_levels").upsert({ tenant_id: tenant, wod_item_id: item, level_id: level, ...v }, { onConflict: "wod_item_id,level_id" }));
}
export async function deleteItemLevel(id: string) { assertOk(await supabase.from("wod_item_levels").delete().eq("id", id)); }
export async function setPreferredLevel(user: string, name: string | null) { assertOk(await supabase.from("profiles").update({ preferred_level_name: name }).eq("id", user)); }
export async function setFacilitiesEnabled(tenant: string, enabled: boolean) { assertOk(await supabase.from("tenant_settings").update({ facilities_enabled: enabled }).eq("tenant_id", tenant)); }
export async function setBranding(tenant: string, patch: { theme_preset?: string; logo_url?: string | null }) { assertOk(await supabase.from("tenant_settings").update(patch as never).eq("tenant_id", tenant)); }
export const myExerciseLevelsQuery = (tenant: string | null, user: string | undefined) => queryOptions({ queryKey: ["exercise-levels", tenant, user], enabled: !!tenant && !!user, queryFn: async () => { const rows = result(await supabase.from("user_exercise_levels").select("exercise_id,level_name").eq("tenant_id", tenant!).eq("user_id", user!)); return Object.fromEntries(rows.map(r => [r.exercise_id, r.level_name])) as Record<string, string>; } });
export async function setExerciseLevel(tenant: string, user: string, exercise: string, level: string | null) {
  if (!level) { assertOk(await supabase.from("user_exercise_levels").delete().eq("user_id", user).eq("exercise_id", exercise)); return; }
  assertOk(await supabase.from("user_exercise_levels").upsert({ tenant_id: tenant, user_id: user, exercise_id: exercise, level_name: level }, { onConflict: "user_id,exercise_id" }));
}
export type LevelMode = "class" | "gender" | "combo";
export const LEVEL_MODE_LABEL: Record<LevelMode, string> = { class: "Por clase (RX/Scaled/Open)", gender: "Por género (Hombre/Mujer)", combo: "Clase + género" };
export function levelMode(name: string): LevelMode { if (/^(hombre|mujer)$/i.test(name.trim())) return "gender"; if (/[♂♀]/.test(name)) return "combo"; return "class"; }
