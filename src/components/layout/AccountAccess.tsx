import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/data/auth";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/session";

export function AccountAccess() {
  const { user, realRole, platformRole } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const destination = platformRole ? "/platform" : realRole === "admin" || realRole === "coach" ? "/admin" : realRole ? "/dashboard" : "/bienvenida";
  return <div className="flex items-center"><Button asChild variant="ghost"><Link to={user ? destination : "/auth"}>{user ? "Mi cuenta" : "Entrar"}</Link></Button>{user && <Button variant="ghost" size="icon" title="Cerrar sesión" aria-label="Cerrar sesión" onClick={async () => {
    try { await queryClient.cancelQueries(); queryClient.clear(); await signOut(); await navigate({ to: "/auth", search: {}, replace: true }); }
    catch { toast.error("No se pudo cerrar la sesión"); }
  }}><LogOut /></Button>}</div>;
}