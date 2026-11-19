import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ClassCard } from "@/components/ClassCard";
import { CLASSES, PLANS } from "@/lib/data/mock";
import { canAccessClass } from "@/lib/access/membership";
import { useBookings } from "@/lib/data/bookings";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({ head: pageHead("Calendario", "Clases de la semana en tu box."), component: CalendarPage });

function CalendarPage() {
  const days = Array.from(new Set(CLASSES.map((c) => new Date(c.starts_at).toDateString())));
  const todayIdx = Math.max(0, days.indexOf(new Date().toDateString()));
  const [sel, setSel] = useState(todayIdx);
  const { ids, toggle } = useBookings();
  const { planId } = useSession();
  const plan = PLANS.find((p) => p.id === planId) ?? null;
  const list = CLASSES.filter((c) => new Date(c.starts_at).toDateString() === days[sel]);
  return (
    <AppShell title="Calendario">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {days.map((d, i) => { const dt = new Date(d); return (
          <button key={d} onClick={() => setSel(i)} className={cn("flex min-w-14 flex-col items-center rounded-lg border border-border px-3 py-2", i === sel ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
            <span className="text-[11px] uppercase">{dt.toLocaleDateString("es-ES", { weekday: "short" })}</span><span className="font-display text-lg font-bold">{dt.getDate()}</span>
          </button>); })}
      </div>
      <div className="mt-4 space-y-2">
        {list.map((c) => { const a = canAccessClass(plan, c, ids.length); return <ClassCard key={c.id} c={c} booked={ids.includes(c.id)} blockedReason={a.allowed ? undefined : a.reason} onToggle={() => toggle(c.id)} />; })}
      </div>
    </AppShell>
  );
}
