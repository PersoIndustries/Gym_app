import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCog, CreditCard, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/")({ head: pageHead("Gestión", "Gestión del box."), component: AdminHome });
function AdminHome() {
  const items = [
    { to: "/admin/classes", t: "Clases", d: "Horarios y capacidad", icon: CalendarCog },
    { to: "/admin/members", t: "Socios", d: "Roles y cuotas", icon: Users },
    { to: "/admin/plans", t: "Cuotas", d: "Reglas de acceso", icon: CreditCard },
  ] as const;
  return (
    <AppShell title="Gestión del box">
      <div className="grid gap-3 sm:grid-cols-3">{items.map(({ to, t, d, icon: I }) => <Link key={to} to={to} className="rounded-xl border border-border bg-card p-5 hover:border-primary"><I className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></Link>)}</div>
    </AppShell>
  );
}
