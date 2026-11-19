import { useSession } from "@/lib/auth/session";
import type { AppRole } from "@/lib/domain/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";

const LABELS: Record<AppRole, string> = { athlete: "Atleta", coach: "Coach", admin: "Admin del box", super_admin: "Super Admin", developer: "Developer" };

/** Selector de rol de demostración. Eliminar cuando los roles vengan de tenant_members / platform_roles. */
export function RoleSwitcher({ className }: { className?: string }) {
  const { role, setRole } = useSession();
  const navigate = useNavigate();
  return (
    <Select value={role} onValueChange={(v) => { const r = v as AppRole; setRole(r); navigate({ to: r === "super_admin" || r === "developer" ? "/platform" : "/dashboard" }); }}>
      <SelectTrigger className={className} aria-label="Rol de demostración"><SelectValue /></SelectTrigger>
      <SelectContent>{(Object.keys(LABELS) as AppRole[]).map((r) => <SelectItem key={r} value={r}>Demo: {LABELS[r]}</SelectItem>)}</SelectContent>
    </Select>
  );
}
