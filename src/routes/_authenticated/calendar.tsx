import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ClassCard } from "@/components/ClassCard";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/data/mock";
import { canAccessClass } from "@/lib/access/membership";
import { EMPTY_COUNTS, classesQuery, weekRange } from "@/lib/data/box";
import { useClassActions } from "@/lib/data/use-class-actions";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({ head: pageHead("Calendario", "Clases de la semana en tu box."), component: CalendarPage });

function CalendarPage() {
  const { tenantId, planId } = useSession();
  const [week, setWeek] = useState(0);
  const { data, isLoading } = useQuery(classesQuery(tenantId, week));
  const { book, leave, busy } = useClassActions();
  const { from } = weekRange(week);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(from); d.setDate(from.getDate() + i); return d; });
  const todayIdx = days.findIndex((d) => d.toDateString() === new Date().toDateString());
  const [sel, setSel] = useState(Math.max(0, todayIdx));
  // Cuota demo: solo se aplica la regla de días hasta conectar user_memberships.
  const demo = PLANS.find((p) => p.id === planId);
  const plan = demo ? { ...demo, allowed_activity_type_ids: [] } : null;
  const list = (data?.classes ?? []).filter((c) => new Date(c.starts_at).toDateString() === days[sel]!.toDateString());
  const weekly = Object.values(data?.mine ?? {}).length;
  return (
    <AppShell title="Calendario">
      <div className="mb-3 flex items-center justify-between">
        <Button size="icon" variant="ghost" onClick={() => setWeek(week - 1)} aria-label="Semana anterior"><ChevronLeft /></Button>
        <p className="text-sm text-muted-foreground">{week === 0 ? "Esta semana" : `Semana del ${from.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`}</p>
        <Button size="icon" variant="ghost" onClick={() => setWeek(week + 1)} aria-label="Semana siguiente"><ChevronRight /></Button>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {days.map((dt, i) => (
          <button key={i} onClick={() => setSel(i)} className={cn("flex min-w-14 flex-1 flex-col items-center rounded-lg border border-border px-3 py-2", i === sel ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
            <span className="text-[11px] uppercase">{dt.toLocaleDateString("es-ES", { weekday: "short" })}</span><span className="font-display text-lg font-bold">{dt.getDate()}</span>
          </button>))}
      </div>
      <div className="mt-4 space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Cargando clases…</p>}
        {!isLoading && list.length === 0 && <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No hay clases este día.</div>}
        {list.map((c) => {
          const a = canAccessClass(plan, { ...c, coach: c.coach_name ?? "", booked: 0, activity_type_id: c.activity_type_id ?? "" }, weekly);
          return <ClassCard key={c.id} c={c} counts={data?.counts[c.id] ?? EMPTY_COUNTS} mine={data?.mine[c.id]} blockedReason={a.allowed ? undefined : a.reason} busy={busy}
            onIntent={(intent) => book.mutate({ id: c.id, intent })} onLeave={() => leave.mutate(c.id)} />;
        })}
      </div>
    </AppShell>
  );
}
