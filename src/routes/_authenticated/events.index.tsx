import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { EventEditor } from "@/components/events/EventEditor";
import { calendarEventsQuery } from "@/lib/data/events";
import { activitiesQuery, myPlanQuery } from "@/lib/data/gym";
import { isBoxStaff, useSession } from "@/lib/auth/session";
import { isRelevantForPlan } from "@/lib/access/events";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/events/")({ head: pageHead("Eventos y carreras", "Competiciones, carreras y quedadas de tu box y de la comunidad."), component: EventsPage });

function EventsPage() {
  const { tenantId, role, user } = useSession();
  const [filter, setFilter] = useState<"all" | "box" | "community">("all");
  const { data: events = [], isError } = useQuery(calendarEventsQuery(tenantId));
  const { data: activities = [] } = useQuery(activitiesQuery(tenantId));
  const { data: plan } = useQuery(myPlanQuery(tenantId, user?.id));
  const now = Date.now();
  const list = events.filter(e => new Date(e.ends_at).getTime() >= now && (filter === "all" || e.scope === filter));
  return <AppShell title="Eventos y carreras" action={isBoxStaff(role) && tenantId ? <EventEditor tenant={tenantId} activities={activities} /> : undefined}>
    <div className="mb-4 flex gap-2">{([["all", "Todos"], ["box", "Mi box"], ["community", "Comunidad"]] as const).map(([k, l]) => <Button key={k} size="sm" variant={filter === k ? "default" : "secondary"} onClick={() => setFilter(k)}>{l}</Button>)}</div>
    {isError && <p role="alert" className="text-destructive">No se pudieron cargar los eventos.</p>}
    {!list.length && <p className="text-sm text-muted-foreground">No hay eventos próximos.</p>}
    <div className="grid gap-3 sm:grid-cols-2">{list.map(e => <EventCard key={e.id} e={e} to="app" highlight={e.activity_type_ids.length > 0 && isRelevantForPlan(e.activity_type_ids, plan?.allowed_activity_type_ids ?? null)} />)}</div>
  </AppShell>;
}
