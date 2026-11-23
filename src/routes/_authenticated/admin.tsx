import { createFileRoute, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { isBoxStaff, useSession } from "@/lib/auth/session";

// Guard de UI. La seguridad real la aplican las políticas RLS por tenant.
const ADMIN_ONLY = ["/admin/plans", "/admin/gym-calendar", "/admin/roles"];
export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });
function AdminLayout() {
  const { role, loading } = useSession();
  const { pathname } = useLocation();
  if (loading) return null;
  if (!isBoxStaff(role)) return <Navigate to="/dashboard" />;
  if (role !== "admin" && ADMIN_ONLY.some((p) => pathname.startsWith(p))) return <Navigate to="/admin" />;
  return <Outlet />;
}
