import { useEffect } from "react";
import { createFileRoute, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { isBoxStaff, useSession } from "@/lib/auth/session";
import { hasClassManagement } from "@/lib/access/permissions";

// Guard de UI. La seguridad real la aplican las políticas RLS por tenant.
const ADMIN_ONLY = ["/admin/plans", "/admin/gym-calendar", "/admin/roles"];
export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });
function AdminLayout() {
  const { role, realRole, boxMode, setBoxMode, loading, can } = useSession();
  const restore = !loading && !isBoxStaff(role) && isBoxStaff(realRole ?? "athlete") && boxMode === "athlete";
  useEffect(() => { if (restore) setBoxMode("staff"); }, [restore, setBoxMode]);
  const { pathname } = useLocation();
  if (loading || restore) return null;
  if (!isBoxStaff(role)) return <Navigate to="/dashboard" />;
  if (role !== "admin" && ADMIN_ONLY.some((p) => pathname.startsWith(p))) return <Navigate to="/admin" />;
  if (role === "coach" && ((pathname.startsWith("/admin/classes") && !hasClassManagement(can)) || (pathname.startsWith("/admin/members") && !can("members.view")))) return <Navigate to="/admin" />;
  return <Outlet />;
}
