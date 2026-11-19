import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/domain/types";
import { useLocalState } from "@/lib/data/local-store";

interface SessionCtx {
  user: User | null;
  /** Rol de demostración mientras no haya roles reales asignados en tenant_members/platform_roles. */
  role: AppRole; setRole: (r: AppRole) => void;
  tenantId: string | null; setTenantId: (id: string | null) => void;
  planId: string | null; setPlanId: (id: string | null) => void;
}
const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useLocalState<AppRole>("bf.role", "athlete");
  const [tenantId, setTenantId] = useLocalState<string | null>("bf.tenant", "t1");
  const [planId, setPlanId] = useLocalState<string | null>("bf.plan", "p-week");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return <Ctx.Provider value={{ user, role, setRole, tenantId, setTenantId, planId, setPlanId }}>{children}</Ctx.Provider>;
}
export function useSession() { const c = useContext(Ctx); if (!c) throw new Error("SessionProvider missing"); return c; }
export const isPlatformRole = (r: AppRole) => r === "super_admin" || r === "developer";
export const isBoxStaff = (r: AppRole) => r === "admin" || r === "coach";
