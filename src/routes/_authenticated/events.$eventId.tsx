import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, ExternalLink, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PersonAvatar } from "@/components/PersonAvatar";
import { EventEditor } from "@/components/events/EventEditor";
import { fmtEventDate } from "@/components/events/EventCard";
import { clearParticipation, deleteEvent, eventAttendeesQuery, eventQuery, myParticipationQuery, setParticipation } from "@/lib/data/events";
import { activitiesQuery, myPlanQuery } from "@/lib/data/gym";
import { canAccessEvent } from "@/lib/access/membership";
import { ActivityMark } from "@/components/ActivityMark";
import { EVENT_FORMAT_LABEL, EVENT_INTENT_LABEL, EVENT_KIND_LABEL, type EventIntent } from "@/lib/access/events";
import { isBoxStaff, useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/events/$eventId")({ head: pageHead("Evento", "Quién va de tu box, busco pareja y detalles del evento."), component: EventPage });
const STYLE: Record<EventIntent, string> = { going: "bg-success text-success-foreground", interested: "bg-warning text-warning-foreground", not_going: "bg-destructive/20 text-destructive" };
const err = (e: unknown) => toast.error(e instanceof Error ? e.message : String(e));

function EventPage() {
  const { eventId } = Route.useParams();
  const { tenantId, user, role } = useSession();
  const qc = useQueryClient();
  const { data: e, isLoading } = useQuery(eventQuery(eventId));
  const { data: people = [] } = useQuery(eventAttendeesQuery(eventId, tenantId));
  const { data: mine } = useQuery(myParticipationQuery(eventId, user?.id, tenantId));
  const { data: activities = [] } = useQuery(activitiesQuery(tenantId));
  const { data: plan } = useQuery(myPlanQuery(tenantId, user?.id));
  const [partner, setPartner] = useState(false); const [category, setCategory] = useState(""); const [note, setNote] = useState("");
  useEffect(() => { setPartner(mine?.looking_for_partner ?? false); setCategory(mine?.category ?? ""); setNote(mine?.note ?? ""); }, [mine]);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["event-attendees", eventId] }); qc.invalidateQueries({ queryKey: ["event-me", eventId] }); };
  const join = useMutation({ mutationFn: (intent: EventIntent) => { if (!tenantId || !user) throw new Error("Inicia sesión"); return setParticipation(eventId, tenantId, user.id, { intent, looking_for_partner: intent !== "not_going" && partner, category: category || null, note: note || null }); }, onSuccess: () => { refresh(); toast.success("Guardado"); }, onError: err });
  const leave = useMutation({ mutationFn: () => { if (!tenantId || !user) throw new Error("Inicia sesión"); return clearParticipation(eventId, tenantId, user.id); }, onSuccess: refresh, onError: err });
  const del = useMutation({ mutationFn: () => deleteEvent(eventId), onSuccess: () => { qc.invalidateQueries({ queryKey: ["community-events"] }); history.back(); }, onError: err });
  if (isLoading) return <AppShell title="Evento"><p className="text-sm text-muted-foreground">Cargando…</p></AppShell>;
  if (!e) return <AppShell title="Evento"><p>Este evento no existe o no tienes acceso.</p></AppShell>;
  const canEdit = isBoxStaff(role) && e.tenant_id === tenantId;
  const access = canAccessEvent(plan ?? null, e);
  const seekers = people.filter(p => p.looking_for_partner && p.intent !== "not_going");
  const share = () => { const url = `${location.origin}/eventos/${e.id}`; navigator.clipboard.writeText(url).then(() => toast.success("Enlace copiado: compártelo con un compañero")); };
  return <AppShell title="Evento">
    <Link to="/events" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Eventos</Link>
    <section className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{e.scope === "community" ? "Comunidad" : "Solo socios del box"} · {EVENT_KIND_LABEL[e.kind]} · {EVENT_FORMAT_LABEL[e.format]}{e.tenants?.name ? ` · ${e.tenants.name}` : ""}</p>
      <div className="mt-2 flex items-center gap-3"><ActivityMark name="Evento" className="h-10 w-10"/><h2 className="font-display text-2xl font-bold">{e.title}</h2></div>
      <p className="text-sm text-muted-foreground">{fmtEventDate(e)}{e.location ? ` · ${e.location}` : ""}</p>
      {e.description && <p className="mt-3 whitespace-pre-line text-sm">{e.description}</p>}
      <div className="mt-3 flex flex-wrap gap-2 text-sm">{e.price_cents != null && <span>{(e.price_cents / 100).toLocaleString("es-ES")} €</span>}{e.capacity && <span>· {e.capacity} plazas</span>}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {e.url && <Button asChild size="sm" variant="outline"><a href={e.url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Inscripción</a></Button>}
        {e.scope === "community" && <Button size="sm" variant="outline" onClick={share}><Copy className="mr-1 h-4 w-4" />Invitar a un compañero</Button>}
        {canEdit && <EventEditor tenant={tenantId} event={e} activities={activities} />}
        {canEdit && <Button size="sm" variant="ghost" onClick={() => confirm("¿Borrar este evento?") && del.mutate()}><Trash2 className="h-4 w-4" /></Button>}
      </div>
    </section>
    {tenantId && user && <section className="mt-5 space-y-3 border-b border-border pb-5">
      <h3 className="font-semibold">Mi participación</h3>
      {!access.allowed && <p className="text-sm text-warning">{access.reason}</p>}
      <div className="grid grid-cols-3 gap-2">{(Object.keys(EVENT_INTENT_LABEL) as EventIntent[]).map(i => <Button key={i} variant="outline" aria-pressed={mine?.intent === i} disabled={join.isPending || (i !== "not_going" && !access.allowed)} className={cn(mine?.intent === i ? STYLE[i] : "border-border bg-transparent text-muted-foreground")} onClick={() => join.mutate(i)}>{EVENT_INTENT_LABEL[i]}</Button>)}</div>
      <label className="flex items-center justify-between gap-3 text-sm">Busco pareja / equipo<Switch checked={partner} onCheckedChange={setPartner} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        {e.categories.length > 0 && <label className="text-sm">Categoría<Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger><SelectContent>{e.categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></label>}
        <label className="text-sm">Nota para compañeros<Input value={note} placeholder="Busco pareja mixta, ritmo 5'/km…" onChange={ev => setNote(ev.target.value)} /></label>
      </div>
      <p className="text-xs text-muted-foreground">Pulsa Voy / Me interesa de nuevo para guardar los cambios.</p>
      {mine && <Button size="sm" variant="ghost" onClick={() => leave.mutate()}>Quitar mi respuesta</Button>}
    </section>}
    {seekers.length > 0 && <section className="mt-5"><h3 className="mb-2 flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-primary" />Buscan pareja ({seekers.length})</h3><div className="space-y-2">{seekers.map((p, i) => <div key={i} className="flex items-center gap-3 rounded-lg border border-primary/40 p-3"><PersonAvatar name={p.full_name} url={p.avatar_url} anonymous={p.full_name === "Anónimo"} /><div><p className="text-sm font-medium">{p.full_name}{p.category ? ` · ${p.category}` : ""}</p>{p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}</div></div>)}</div></section>}
    <section className="mt-5"><h3 className="mb-2 font-semibold">Quién va de mi box</h3>
      {(["going", "interested", "not_going"] as EventIntent[]).map(i => { const l = people.filter(p => p.intent === i); return l.length ? <div key={i} className="mb-3"><p className="mb-1 text-xs text-muted-foreground">{EVENT_INTENT_LABEL[i]} ({l.length})</p><div className="flex flex-wrap gap-3">{l.map((p, k) => <div key={k} className="flex items-center gap-2"><PersonAvatar name={p.full_name} url={p.avatar_url} anonymous={p.full_name === "Anónimo"} className="h-7 w-7" /><span className="text-sm">{p.full_name}{p.category ? ` (${p.category})` : ""}</span></div>)}</div></div> : null; })}
      {!people.length && <p className="text-sm text-muted-foreground">Nadie de tu box se ha apuntado todavía.</p>}
    </section>
  </AppShell>;
}
