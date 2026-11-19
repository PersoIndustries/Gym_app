import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, PlatformRole, TenantRole } from "@/lib/domain/types";
import { useLocalState } from "@/lib/data/local-store";

export interface Membership { tenant_id: string; role: TenantRole; tenant_name: string }
interface SessionCtx {
  user: User | null;
  loading: boolean;
  memberships: Membership[];
  platformRole: PlatformRole | null;
  /** Rol efectivo: el del box activo, o el de plataforma si estás en la consola. */
  role: AppRole;
  view: "box" | "console"; setView: (v: "box" | "console") => void;
  tenantId: string | null; setTenantId: (id: string | null) => void;
  tenantName: string | null;
  /** Cuota de demostración hasta conectar user_memberships. */
  planId: string | null; setPlanId: (id: string | null) => void;
  refresh: () => void;
}
const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useLocalState<"box" | "console">("bf.view", "box");
  const [storedTenant, setTenantId] = useLocalState<string | null>("bf.tenant.v2", null);
  const [planId, setPlanId] = useLocalState<string | null>("bf.plan", "p-full");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  const q = useQuery({
    queryKey: ["session-roles", user?.id], enabled: !!user,
    queryFn: async () => {
      const [m, p] = await Promise.all([
        supabase.from("tenant_members").select("tenant_id, role, tenants(name)").eq("user_id", user!.id),
        supabase.from("platform_roles").select("role").eq("user_id", user!.id),
      ]);
      if (m.error) throw m.error;
      const memberships: Membership[] = (m.data ?? []).map((r) => ({ tenant_id: r.tenant_id, role: r.role, tenant_name: (r.tenants as { name: string } | null)?.name ?? "Box" }));
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
    const role: AppRole = effView === "console" && platformRole ? platformRole : active?.role ?? "athlete";
    return { user, loading: !user || q.isLoading, memberships, platformRole, role, view: effView, setView, tenantId: active?.tenant_id ?? null, tenantName: active?.tenant_name ?? null, setTenantId, planId, setPlanId, refresh: () => void q.refetch() };
  }, [user, q.data, q.isLoading, storedTenant, view, planId]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useSession() { const c = useContext(Ctx); if (!c) throw new Error("SessionProvider missing"); return c; }
export const isPlatformRole = (r: AppRole) => r === "super_admin" || r === "developer";
export const isBoxStaff = (r: AppRole) => r === "admin" || r === "coach";
