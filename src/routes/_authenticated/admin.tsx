import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { isBoxStaff, useSession } from "@/lib/auth/session";

// Guard de UI (demo). La seguridad real la aplican las políticas RLS por tenant.
export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });
function AdminLayout() {
  const { role } = useSession();
  if (!isBoxStaff(role)) return <Navigate to="/dashboard" />;
  return <Outlet />;
}
