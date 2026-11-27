import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { myPlanQuery } from "@/lib/data/gym";
import { isUpcomingEnrollment, recentFinished } from "@/lib/access/class-state";
import { EMPTY_COUNTS, classesQuery } from "@/lib/data/box";
import { atRisk, confirmed, occupied } from "@/lib/access/attendance";
import { isBoxStaff, isPlatformRole, useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/dashboard")({ head: pageHead("Inicio", "Tu resumen del box."), component: Dashboard });

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-bold">{value}</p></div>;
}

function Dashboard() {
  const { role, user, tenantId, tenantName, loading, memberships, platformRole } = useSession();
  const { data } = useQuery(classesQuery(tenantId, 0));
  const { data: plan } = useQuery(myPlanQuery(tenantId,user?.id));
  if (loading) return null;
  if (isPlatformRole(role)) return <Navigate to="/platform" />;
  if (!memberships.length && !platformRole) return <Navigate to="/join" />;
  const name = (user?.user_metadata?.["full_name"] as string) || user?.email?.split("@")[0] || "atleta";
  const classes = data?.classes ?? [];
  const cnt = (id: string) => data?.counts[id] ?? EMPTY_COUNTS;
  if (isBoxStaff(role)) {
    const today = classes.filter((c) => new Date(c.starts_at).toDateString() === new Date().toDateString());
    const risky = classes.filter((c) => atRisk(c, cnt(c.id)));
    const occ = today.reduce((a, c) => a + occupied(cnt(c.id)), 0); const cap = today.reduce((a, c) => a + c.capacity, 0);
    return (
      <AppShell title={tenantName ?? "Panel del box"}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Clases hoy" value={today.length} /><Stat label="Clases semana" value={classes.length} /><Stat label="En riesgo de cancelarse" value={risky.length} /><Stat label="Ocupación hoy" value={`${cap ? Math.round((occ / cap) * 100) : 0}%`} />
        </div>
        {risky.length > 0 && <section className="mt-6"><h2 className="mb-2 font-semibold">Clases sin mínimo</h2><div className="space-y-2">{risky.map((c) => (
          <Link key={c.id} to="/class/$classId" params={{ classId: c.id }} className="flex justify-between rounded-lg border border-warning/50 bg-card px-4 py-3 text-sm"><span>{c.title} · {new Date(c.starts_at).toLocaleString("es-ES", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</span><span>{confirmed(cnt(c.id))}/{c.min_attendees}</span></Link>))}</div></section>}
        <div className="mt-6 flex flex-wrap gap-2"><Button asChild><Link to="/admin/classes">Gestionar clases</Link></Button><Button asChild variant="secondary"><Link to="/admin/members">Socios</Link></Button><Button asChild variant="secondary"><Link to="/admin/plans">Cuotas</Link></Button></div>
      </AppShell>
    );
  }
  const upcoming = classes.filter((c) => isUpcomingEnrollment(c,data?.mine[c.id])).slice(0, 3);
  const done = recentFinished(classes, data?.mine ?? {});
  return (
    <AppShell title={`Hola, ${name}`}>
      <div className="rounded-xl border border-border bg-card bg-hero p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{tenantName} · tu cuota</p>
        <p className="mt-1 font-display text-2xl font-bold">{plan?.name ?? "Sin cuota"}</p>
      </div>
      {done && <Link to="/class/$classId" params={{ classId: done.id }} hash="foto" className="mt-4 flex items-center gap-3 rounded-xl border border-primary/60 bg-primary/10 p-4 hover:border-primary"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Camera className="h-5 w-5"/></span><span className="min-w-0"><span className="block text-xs font-semibold uppercase tracking-wider text-primary">¡Entreno completado!</span><span className="block truncate font-semibold">{done.title}</span><span className="block text-sm text-muted-foreground">Haz tu foto finish y compártela</span></span></Link>}
      <h2 className="mt-6 mb-3 font-semibold">Próximas clases</h2>
      {upcoming.length ? <div className="space-y-2">{upcoming.map((c) => <Link key={c.id} to="/class/$classId" params={{ classId: c.id }} className="block rounded-lg border border-border bg-card p-4 hover:border-primary"><p className="font-semibold">{c.title}{c.status === "cancelled" && " · Cancelada"}</p><p className="text-sm capitalize text-muted-foreground">{new Date(c.starts_at).toLocaleString("es-ES", { weekday: "long", hour: "2-digit", minute: "2-digit" })} · ver WOD</p></Link>)}</div>
        : <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aún no tienes reservas.<div className="mt-3"><Button asChild size="sm"><Link to="/calendar">Ver calendario</Link></Button></div></div>}
    </AppShell>
  );
}
