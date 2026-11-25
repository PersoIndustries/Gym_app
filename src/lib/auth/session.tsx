import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, PlatformRole, TenantRole } from "@/lib/domain/types";
import { useLocalState } from "@/lib/data/local-store";
import { hasPermission, type Permission } from "@/lib/access/permissions";

export interface Membership { tenant_id: string; role: TenantRole; tenant_name: string; suspended: boolean; permissions: string[] | null }
interface SessionCtx {
  user: User | null;
  loading: boolean;
  memberships: Membership[];
  platformRole: PlatformRole | null;
  /** Rol efectivo: el del box activo, o el de plataforma si estás en la consola. */
  role: AppRole;
  view: "box" | "console"; setView: (v: "box" | "console") => void;
  /** Rol real en el box activo (base de datos). */
  realRole: TenantRole | null;
  /** El admin del box ha suspendido esta cuenta. */
  suspended: boolean;
  /** Coach/admin pueden ver la app como usuario del gym; nunca eleva permisos. */
  boxMode: "athlete" | "staff"; setBoxMode: (m: "athlete" | "staff") => void;
  tenantId: string | null; setTenantId: (id: string | null) => void;
  tenantName: string | null;
  refresh: () => void;
  /** Permiso efectivo en el box activo (espejo de has_tenant_permission). */
  can: (perm: Permission) => boolean;
}
const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useLocalState<"box" | "console">("bf.view", "box");
  const [storedTenant, setTenantId] = useLocalState<string | null>("bf.tenant.v2", null);
  const [boxMode, setBoxMode] = useLocalState<"athlete" | "staff">("bf.boxMode", "staff");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((e, s) => { setUser(s?.user ?? null); if (e === "SIGNED_OUT") sessionStorage.removeItem("bf.viewPicked"); });
    return () => data.subscription.unsubscribe();
  }, []);
  const q = useQuery({
    queryKey: ["session-roles", user?.id], enabled: !!user,
    queryFn: async () => {
      if (!user) return { memberships: [] as Membership[], platformRole: null };
      const [m, p] = await Promise.all([
        supabase.from("tenant_members").select("tenant_id, role, status, tenants(name), tenant_custom_roles(permissions)").eq("user_id", user.id),
        supabase.from("platform_roles").select("role").eq("user_id", user.id),
      ]);
      if (m.error) throw m.error;
      const memberships: Membership[] = (m.data ?? []).map((r) => ({ tenant_id: r.tenant_id, role: r.role, tenant_name: (r.tenants as { name: string } | null)?.name ?? "Box", suspended: r.status === "suspended", permissions: (r.tenant_custom_roles as { permissions: string[] } | null)?.permissions ?? null }));
      const roles = (p.data ?? []).map((r) => r.role);
      const platformRole: PlatformRole | null = roles.includes("super_admin") ? "super_admin" : roles.includes("developer") ? "developer" : null;
      return { memberships, platformRole };
    },
  });
  const value = useMemo<SessionCtx>(() => {
    const memberships = q.data?.memberships ?? [];
    const platformRole = q.data?.platformRole ?? null;
    const active = memberships.find((m) => m.tenant_id === storedTenant) ?? memberships[0] ?? null;
    const effView = platformRole && (view === "console" || !active) ? "console" : "box";
    const realRole = active?.role ?? null;
    const boxRole: TenantRole = realRole && realRole !== "athlete" && boxMode === "athlete" ? "athlete" : realRole ?? "athlete";
    const role: AppRole = effView === "console" && platformRole ? platformRole : boxRole;
    return { user, loading: !user || q.isLoading, memberships, platformRole, role, view: effView, setView, realRole, suspended: !!active?.suspended, boxMode, setBoxMode, tenantId: active?.tenant_id ?? null, tenantName: active?.tenant_name ?? null, setTenantId, refresh: () => void q.refetch(), can: (perm) => hasPermission(boxRole, active?.permissions ?? null, perm) };
  }, [user, q.data, q.isLoading, storedTenant, view, boxMode]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useSession() { const c = useContext(Ctx); if (!c) throw new Error("SessionProvider missing"); return c; }
export const isPlatformRole = (r: AppRole) => r === "super_admin" || r === "developer";
export const isBoxStaff = (r: AppRole) => r === "admin" || r === "coach";
