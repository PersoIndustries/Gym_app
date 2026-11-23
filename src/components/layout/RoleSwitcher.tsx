import { useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/auth/session";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLE: Record<string, string> = { athlete: "Atleta", coach: "Coach", admin: "Admin" };

/** Selector de contexto: box activo (si perteneces a varios) o consola de plataforma. Roles reales de la base de datos. */
export function RoleSwitcher({ className }: { className?: string }) {
  const { memberships, platformRole, tenantId, view, setTenantId, setView } = useSession();
  const navigate = useNavigate();
  if (memberships.length + (platformRole ? 1 : 0) < 2) return null;
  const value = view === "console" ? "console" : tenantId ?? "";
  return (
    <Select value={value} onValueChange={(v) => {
      // Navegar primero: así ningún guard de la página actual intercepta el cambio de rol.
      if (v === "console") void navigate({ to: "/platform" }).then(() => setView("console"));
      else void navigate({ to: "/dashboard" }).then(() => { setTenantId(v); setView("box"); });
    }}>
      <SelectTrigger className={className} aria-label="Cambiar de box"><SelectValue /></SelectTrigger>
      <SelectContent>
        {memberships.map((m) => <SelectItem key={m.tenant_id} value={m.tenant_id}>{m.tenant_name} · {ROLE[m.role]}</SelectItem>)}
        {platformRole && <SelectItem value="console">Consola plataforma</SelectItem>}
      </SelectContent>
    </Select>
  );
}
