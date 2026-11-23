import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export interface CustomRole { id: string; name: string; description: string | null; permissions: string[] }
const ok = <T,>(r: { error: unknown; data: T | null }): T => { if (r.error) throw r.error; return r.data as T; };
export const customRolesQuery = (tenant: string | null) => queryOptions({ queryKey: ["custom-roles", tenant], enabled: !!tenant, queryFn: async (): Promise<CustomRole[]> => tenant ? ok(await supabase.from("tenant_custom_roles").select("id,name,description,permissions").eq("tenant_id", tenant).order("name")) : [] });
export async function saveCustomRole(tenant: string, id: string | null, v: { name: string; description: string | null; permissions: string[] }) {
  if (id) ok(await supabase.from("tenant_custom_roles").update(v).eq("tenant_id", tenant).eq("id", id));
  else ok(await supabase.from("tenant_custom_roles").insert({ ...v, tenant_id: tenant }));
}
export async function deleteCustomRole(tenant: string, id: string) { ok(await supabase.from("tenant_custom_roles").delete().eq("tenant_id", tenant).eq("id", id)); }
export async function assignCustomRole(tenant: string, memberId: string, roleId: string | null) { ok(await supabase.from("tenant_members").update({ custom_role_id: roleId }).eq("tenant_id", tenant).eq("id", memberId)); }
