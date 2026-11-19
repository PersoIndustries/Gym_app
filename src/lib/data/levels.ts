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
