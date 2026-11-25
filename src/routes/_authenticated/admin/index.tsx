import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCog, CreditCard, DoorOpen, Palette, Settings, Ticket, Trophy, Users, Zap, Palmtree, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { settingsQuery } from "@/lib/data/box";
import { AppShell } from "@/components/layout/AppShell";
import { HelpInbox } from "@/components/admin/BoxSettings";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/")({ head: pageHead("Gestión", "Gestión del box."), component: AdminHome });
function AdminHome() {
  const { role, tenantId, can } = useSession(); const admin = role === "admin";
  const { data: settings } = useQuery(settingsQuery(tenantId));
  const all = [
    { to: "/admin/classes", t: "Clases", d: "Horarios y WOD", icon: CalendarCog, coach: true, perm: "classes.manage" },
    { to: "/admin/members", t: "Socios", d: admin ? "Roles y cuotas" : "Listado", icon: Users, coach: true, perm: "members.view" },
    { to: "/admin/roles", t: "Roles", d: "Permisos del equipo", icon: ShieldCheck },
    { to: "/admin/codes", t: "Códigos", d: "Invitaciones", icon: Ticket },
    { to: "/admin/plans", t: "Cuotas", d: "Planes y límites", icon: CreditCard },
    { to: "/admin/brand", t: "Tu marca", d: "Logo y tema", icon: Palette },
    { to: "/admin/activities", t: "Actividades", d: "Modos y logos", icon: Zap },
    { to: "/admin/gym-calendar", t: "Cierres", d: "Vacaciones y festivos", icon: Palmtree },
    { to: "/events", t: "Eventos", d: admin ? "Carreras y solicitudes" : "Proponer eventos", icon: Trophy, coach: true, perm: "events.manage" },
    { to: "/spaces", t: "Espacios", d: "Sauna, pistas", icon: DoorOpen },
    { to: "/admin/settings", t: "Ajustes", d: "Instalaciones y niveles", icon: Settings },
  ] as const;
  const items = all.filter((i) => (i.to !== "/spaces" || !!settings?.facilities_enabled) && (admin || ("coach" in i && i.coach && can(i.perm))));
  return (
    <AppShell title="Gestión del box">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{items.map(({ to, t, d, icon: I }) => <Link key={to} to={to} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><I className="h-4 w-4 text-primary" /></span><span className="min-w-0"><span className="block font-semibold leading-tight">{t}</span><span className="block truncate text-xs text-muted-foreground">{d}</span></span></Link>)}</div>
      {admin ? <HelpInbox /> : <p className="mt-6 text-sm text-muted-foreground">Como profesor gestionas clases, asistencias y propones eventos. La configuración del box es del admin.</p>}
    </AppShell>
  );
}
