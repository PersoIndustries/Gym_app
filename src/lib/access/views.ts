import type { PlatformRole, TenantRole } from "@/lib/domain/types";

export interface ViewOption { key: string; mode: "athlete" | "staff" | "console"; tenantId: string | null; label: string; hint: string }

/** Vistas posibles según roles reales: cada box como usuario, como staff si es coach/admin, y consola si es de plataforma. */
export function viewOptions(memberships: { tenant_id: string; role: TenantRole; tenant_name: string }[], platformRole: PlatformRole | null): ViewOption[] {
  const out: ViewOption[] = [];
  for (const m of memberships) {
    out.push({ key: `${m.tenant_id}:athlete`, mode: "athlete", tenantId: m.tenant_id, label: `Usuario del gym · ${m.tenant_name}`, hint: "Calendario, reservas y tus RMs" });
    if (m.role !== "athlete") out.push({ key: `${m.tenant_id}:staff`, mode: "staff", tenantId: m.tenant_id, label: `${m.role === "admin" ? "Admin" : "Coach"} · ${m.tenant_name}`, hint: "Gestión de clases, socios y WODs" });
  }
  if (platformRole) out.push({ key: "console", mode: "console", tenantId: null, label: "Consola de plataforma", hint: platformRole === "super_admin" ? "Super Admin: clientes, facturas y métricas" : "Desarrollo y roadmap" });
  return out;
}
