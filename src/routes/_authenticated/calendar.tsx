import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { GymCalendar } from "@/components/GymCalendar";
import { EventCard } from "@/components/events/EventCard";
import { isBoxStaff, useSession } from "@/lib/auth/session";
import { calendarEventsQuery } from "@/lib/data/events";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/calendar")({ head: pageHead("Calendarios", "Calendario de tu box, de gestión y de la comunidad: clases, cierres, eventos y carreras."), component: CalendarPage });

type Tab = "box" | "staff" | "community";
function CalendarPage() {
  const { role, tenantId } = useSession();
  const staff = isBoxStaff(role);
  const [tab, setTab] = useState<Tab>(staff ? "staff" : "box");
  const tabs: [Tab, string][] = [["box", "Mi box"], ...(staff ? [["staff", "Gestión"] as [Tab, string]] : []), ["community", "Comunidad"]];
  return <AppShell title="Calendarios">
    <div role="tablist" className="mb-5 flex gap-2">{tabs.map(([k, l]) => <Button key={k} role="tab" aria-selected={tab === k} size="sm" variant={tab === k ? "default" : "secondary"} onClick={() => setTab(k)}>{l}</Button>)}</div>
    {tab !== "community" ? <GymCalendar key={tab} staff={tab === "staff"} /> : <Community tenant={tenantId} />}
  </AppShell>;
}

function Community({ tenant }: { tenant: string | null }) {
  const { data = [] } = useQuery(calendarEventsQuery(tenant));
  const list = data.filter(e => e.scope === "community" && new Date(e.ends_at) >= new Date());
  return <div><p className="mb-3 text-sm text-muted-foreground">Carreras y competiciones abiertas a todos. <Link to="/eventos" className="text-primary underline">Ver versión pública</Link></p>
    {!list.length && <p className="text-sm text-muted-foreground">No hay eventos de comunidad próximos.</p>}
    <div className="grid gap-3 sm:grid-cols-2">{list.map(e => <EventCard key={e.id} e={e} to="app" />)}</div></div>;
}
