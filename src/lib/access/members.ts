import type { TenantRole } from "@/lib/domain/types";

export type MemberStatus = "active" | "suspended";
export type QuotaState = "with_quota" | "no_quota";
export interface MemberRow { id: string; user_id: string; name: string; role: TenantRole; status: MemberStatus; quotas: number }
export interface MemberFilter { q: string; role: "all" | TenantRole; state: "all" | MemberStatus | QuotaState }

/** Filtro del listado de socios: texto, rol y estado (suspendido o con/sin cuota). */
export function filterMembers(rows: MemberRow[], f: MemberFilter): MemberRow[] {
  const q = f.q.trim().toLowerCase();
  return rows.filter(r =>
    (!q || r.name.toLowerCase().includes(q)) &&
    (f.role === "all" || r.role === f.role) &&
    (f.state === "all" || (f.state === "with_quota" ? r.quotas > 0 : f.state === "no_quota" ? r.quotas === 0 : r.status === f.state)));
}

/** El box nunca se queda sin admin activo y nadie se cambia a sí mismo. */
export function canChangeMember(target: MemberRow, me: string | undefined, rows: MemberRow[]): boolean {
  if (target.user_id === me) return false;
  if (target.role !== "admin") return true;
  return rows.some(r => r.id !== target.id && r.role === "admin" && r.status === "active");
}
