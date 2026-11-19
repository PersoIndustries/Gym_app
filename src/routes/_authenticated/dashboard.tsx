import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { CLASSES, MEMBERS, PLANS } from "@/lib/data/mock";
import { isBoxStaff, isPlatformRole, useSession } from "@/lib/auth/session";
import { useBookings } from "@/lib/data/bookings";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/dashboard")({ head: pageHead("Inicio", "Tu resumen del box."), component: Dashboard });

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-bold">{value}</p></div>;
}

function Dashboard() {
  const { role, user, planId } = useSession();
  const { ids } = useBookings();
  if (isPlatformRole(role)) return <Navigate to="/platform" />;
  const name = (user?.user_metadata?.["full_name"] as string) || user?.email?.split("@")[0] || "atleta";
  const upcoming = CLASSES.filter((c) => ids.includes(c.id) && new Date(c.starts_at) > new Date()).slice(0, 3);
  const plan = PLANS.find((p) => p.id === planId);
  if (isBoxStaff(role)) {
    const today = CLASSES.filter((c) => new Date(c.starts_at).toDateString() === new Date().toDateString());
    return (
      <AppShell title="Panel del box">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Clases hoy" value={today.length} /><Stat label="Socios" value={MEMBERS.length} /><Stat label="Sin cuota" value={MEMBERS.filter((m) => !m.plan_id).length} /><Stat label="Ocupación hoy" value={`${Math.round((today.reduce((a, c) => a + c.booked, 0) / Math.max(1, today.reduce((a, c) => a + c.capacity, 0))) * 100)}%`} />
        </div>
        <div className="mt-6 flex flex-wrap gap-2"><Button asChild><Link to="/admin/classes">Gestionar clases</Link></Button><Button asChild variant="secondary"><Link to="/admin/members">Socios</Link></Button><Button asChild variant="secondary"><Link to="/admin/plans">Cuotas</Link></Button></div>
      </AppShell>
    );
  }
  return (
    <AppShell title={`Hola, ${name}`}>
      <div className="rounded-xl border border-border bg-card bg-hero p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Tu cuota</p>
        <p className="mt-1 font-display text-2xl font-bold">{plan?.name ?? "Sin cuota"}</p>
      </div>
      <h2 className="mt-6 mb-3 font-semibold">Próximas clases</h2>
      {upcoming.length ? <div className="space-y-2">{upcoming.map((c) => <div key={c.id} className="rounded-lg border border-border bg-card p-4"><p className="font-semibold">{c.title}</p><p className="text-sm text-muted-foreground">{new Date(c.starts_at).toLocaleString("es-ES", { weekday: "long", hour: "2-digit", minute: "2-digit" })}</p></div>)}</div>
        : <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aún no tienes reservas.<div className="mt-3"><Button asChild size="sm"><Link to="/calendar">Ver calendario</Link></Button></div></div>}
    </AppShell>
  );
}
