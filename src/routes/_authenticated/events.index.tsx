import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  const list = events.filter(e => e.status === "published" && new Date(e.ends_at).getTime() >= now && (filter === "all" || e.scope === filter));
  const requests = events.filter(e => e.scope === "box" && (e.status === "pending" || e.status === "rejected") && (role === "admin" || e.created_by === user?.id));
  const qc = useQueryClient();
  const review = useMutation({ mutationFn: async (v: { id: string; ok: boolean; note?: string | undefined }) => { const r = await supabase.from("community_events").update({ status: v.ok ? "published" : "rejected", review_note: v.note ?? null }).eq("id", v.id); if (r.error) throw r.error; }, onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["community-events"] }); toast.success(v.ok ? "Evento aprobado" : "Solicitud rechazada"); }, onError: (e) => toast.error(e instanceof Error ? e.message : String(e)) });
  return <AppShell title="Eventos y carreras" action={isBoxStaff(role) && tenantId ? <EventEditor tenant={tenantId} activities={activities} /> : undefined}>
    <div className="mb-4 flex gap-2">{([["all", "Todos"], ["box", "Mi box"], ["community", "Comunidad"]] as const).map(([k, l]) => <Button key={k} size="sm" variant={filter === k ? "default" : "secondary"} onClick={() => setFilter(k)}>{l}</Button>)}</div>
    {requests.length > 0 && <section className="mb-6 rounded-xl border border-border bg-card p-4"><h2 className="mb-2 font-semibold">{role === "admin" ? "Solicitudes de profesores" : "Mis solicitudes"}</h2>
      <ul className="space-y-2">{requests.map(e => <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 first:border-0 first:pt-0"><span><span className="font-medium">{e.title}</span><span className="block text-xs text-muted-foreground">{new Date(e.starts_at).toLocaleString("es-ES")} · {e.status === "pending" ? "Pendiente de aprobación" : `Rechazado${e.review_note ? `: ${e.review_note}` : ""}`}</span></span>
        {role === "admin" && e.status === "pending" && <span className="flex gap-2"><Button size="sm" onClick={() => review.mutate({ id: e.id, ok: true })}>Aprobar</Button><Button size="sm" variant="secondary" onClick={() => { const note = prompt("Motivo del rechazo (opcional)") ?? undefined; review.mutate({ id: e.id, ok: false, note }); }}>Rechazar</Button></span>}</li>)}</ul></section>}
    {isError && <p role="alert" className="text-destructive">No se pudieron cargar los eventos.</p>}
    {!list.length && <p className="text-sm text-muted-foreground">No hay eventos próximos.</p>}
    <div className="grid gap-3 sm:grid-cols-2">{list.map(e => <EventCard key={e.id} e={e} to="app" highlight={e.activity_type_ids.length > 0 && isRelevantForPlan(e.activity_type_ids, plan?.allowed_activity_type_ids ?? null)} />)}</div>
  </AppShell>;
}
