import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ACTIVITIES, PLANS } from "@/lib/data/mock";
import { pageHead } from "@/lib/seo";

const DAYS = ["D", "L", "M", "X", "J", "V", "S"];
export const Route = createFileRoute("/_authenticated/admin/plans")({ head: pageHead("Cuotas", "Cuotas y reglas de acceso."), component: Plans });
function Plans() {
  return (
    <AppShell title="Cuotas">
      <div className="grid gap-3 md:grid-cols-3">{PLANS.map((p) => (
        <div key={p.id} className="rounded-xl border border-border bg-card p-5">
          <p className="font-display text-xl font-bold">{p.name}</p><p className="text-sm text-muted-foreground">{(p.price_cents / 100).toFixed(0)} €/mes</p>
          <div className="mt-4 flex gap-1">{[1, 2, 3, 4, 5, 6, 0].map((d) => <span key={d} className={`grid h-7 w-7 place-items-center rounded text-xs ${p.allowed_weekdays.includes(d) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{DAYS[d]}</span>)}</div>
          <p className="mt-3 text-xs text-muted-foreground">Actividades: {p.allowed_activity_type_ids.length ? p.allowed_activity_type_ids.map((a) => ACTIVITIES.find((x) => x.id === a)?.name).join(", ") : "todas"}</p>
          <p className="text-xs text-muted-foreground">Límite semanal: {p.weekly_class_limit ?? "sin límite"}</p>
        </div>))}</div>
    </AppShell>
  );
}
