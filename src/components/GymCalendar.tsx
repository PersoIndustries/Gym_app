import { BrandImage } from "@/components/BrandImage";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClassCard } from "@/components/ClassCard";
import { PersonAvatar } from "@/components/PersonAvatar";
import { classesQuery, monthClassesQuery, EMPTY_COUNTS, weekRange } from "@/lib/data/box";
import { coachesQuery, eventsQuery, myPlanQuery, activitiesQuery } from "@/lib/data/gym";
import { calendarEventsQuery } from "@/lib/data/events";
import { EVENT_KIND_LABEL } from "@/lib/access/events";
import { useClassActions } from "@/lib/data/use-class-actions";
import { useSession } from "@/lib/auth/session";
import { canAccessClass } from "@/lib/access/membership";
import { classState, STATE_LABEL, STATE_STYLE } from "@/lib/access/class-state";
import { occupied } from "@/lib/access/attendance";
import { cn } from "@/lib/utils";

export function GymCalendar({ staff = false, onWeekChange }: { staff?: boolean; onWeekChange?: (week: number) => void }) {
 const { tenantId, user, realRole } = useSession();
 const [mode, setMode] = useState<"week" | "month">("week");
 const [offset, setOffset] = useState(0);
 const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
 const [selected, setSelected] = useState(() => new Date().toLocaleDateString("sv-SE"));
 const week = useQuery(classesQuery(tenantId, offset));
 const monthly = useQuery(monthClassesQuery(tenantId, month.getFullYear(), month.getMonth()));
 const { data: activities = [] } = useQuery(activitiesQuery(tenantId));
 const classLogo = (id: string | null) => activities.find(a => a.id === id)?.logo_url;
 const { data: coaches = [] } = useQuery(coachesQuery(tenantId));
 const { data: events = [] } = useQuery(eventsQuery(tenantId));
 const { data: plan } = useQuery(myPlanQuery(tenantId, user?.id));
 const { data: comm = [] } = useQuery(calendarEventsQuery(tenantId));
 const [show, setShow] = useState({ classes: true, events: true, closures: true });
 const dayComm = (d: Date) => { if (!show.events) return []; const end = new Date(d); end.setDate(end.getDate() + 1); return comm.filter(e => new Date(e.starts_at) < end && new Date(e.ends_at) > d); };
 const { book, leave, busy } = useClassActions();
 const active = mode === "week" ? week : monthly;
 const data = active.data;
 const from = mode === "week" ? weekRange(offset).from : new Date(month.getFullYear(), month.getMonth(), 1 - ((month.getDay() + 6) % 7));
 const days = Array.from({ length: mode === "week" ? 7 : 42 }, (_, i) => { const d = new Date(from); d.setDate(d.getDate() + i); return d; });
 const dateKey = (d: Date) => d.toLocaleDateString("sv-SE");
 const dayClasses = (d: Date) => (show.classes ? data?.classes ?? [] : []).filter(c => dateKey(new Date(c.starts_at)) === dateKey(d));
 const dayEvents = (d: Date) => { const end = new Date(d); end.setDate(end.getDate() + 1); return show.closures ? events.filter(e => new Date(e.starts_at) < end && new Date(e.ends_at) > d) : []; };
 const shown = (show.classes ? data?.classes ?? [] : []).filter(c => dateKey(new Date(c.starts_at)) === selected);
 const selectedEvents = dayEvents(new Date(`${selected}T00:00:00`));
 const selectedComm = dayComm(new Date(`${selected}T00:00:00`));
 const weeklyCount = Object.values(week.data?.mine ?? {}).filter(m => m.intent !== "not_going" && ["booked", "waitlist"].includes(m.status) && week.data?.classes.some(c => c.id === m.class_id && c.status !== "cancelled")).length;
 const move = (direction: number) => {
   if (mode === "month") { const next = new Date(month.getFullYear(), month.getMonth() + direction, 1); setMonth(next); setSelected(dateKey(next)); }
   else { const next = offset + direction; setOffset(next); onWeekChange?.(next); setSelected(dateKey(weekRange(next).from)); }
 };
 return <div className="space-y-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div className="flex items-center gap-2"><Button size="icon" variant="ghost" aria-label="Periodo anterior" onClick={() => move(-1)}><ChevronLeft /></Button><h2 className="text-base font-semibold capitalize">{mode === "month" ? month.toLocaleDateString("es-ES", { month: "long", year: "numeric" }) : `Semana del ${from.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`}</h2><Button size="icon" variant="ghost" aria-label="Periodo siguiente" onClick={() => move(1)}><ChevronRight /></Button></div>
   <div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => { setOffset(0); onWeekChange?.(0); setMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1)); setSelected(dateKey(new Date())); }}>Hoy</Button>{(["week","month"] as const).map(m => <Button key={m} size="sm" variant={mode === m ? "default" : "secondary"} onClick={() => {setMode(m);setSelected(dateKey(m === "week" ? weekRange(offset).from : month));}}>{m === "week" ? "Semana" : "Mes"}</Button>)}</div>
  </div>
  <div className="flex flex-wrap gap-2 text-xs">{([["classes","Clases"],["events","Eventos y carreras"],["closures","Cierres"]] as const).map(([k,l]) => <Button key={k} size="sm" variant={show[k] ? "default" : "outline"} aria-pressed={show[k]} onClick={() => setShow({ ...show, [k]: !show[k] })}>{l}</Button>)}</div>
  {active.isError && <p role="alert" className="text-destructive">No se pudo cargar el calendario.</p>}
  {active.isLoading && <p className="text-sm text-muted-foreground">Cargando calendario…</p>}
  <div className="overflow-x-auto">
   <div className={cn("grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border", staff && mode === "week" ? "min-w-[700px]" : "") }>
    {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => <div key={d} className="bg-background py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>)}
    {days.map(d => { const list = dayClasses(d); const ev = dayEvents(d); const selectedDay = dateKey(d) === selected; return <div key={dateKey(d)} className={cn("min-w-0 bg-background", mode === "month" ? "min-h-24 sm:min-h-32" : "min-h-24", selectedDay && "bg-accent/50", mode === "month" && d.getMonth() !== month.getMonth() && "opacity-40")}>
      <Button variant="ghost" className={cn("h-auto w-full flex-col items-start gap-1 rounded-none px-1.5 py-2 sm:px-2", selectedDay && "text-primary")} onClick={() => { setSelected(dateKey(d)); if (mode === "month" && d.getMonth() !== month.getMonth()) setMonth(new Date(d.getFullYear(),d.getMonth(),1)); }} aria-label={d.toLocaleDateString("es-ES",{dateStyle:"full"})}><span className={cn("text-sm font-bold",dateKey(d) === dateKey(new Date()) && "text-primary")}>{d.getDate()}</span>{list.length > 0 && <span className="text-[10px] text-muted-foreground">{list.length} clases</span>}{ev.length > 0 && <span className="w-full truncate text-[10px] text-warning">{ev[0]?.title}</span>}{dayComm(d).slice(0,1).map(x => <span key={x.id} className="w-full truncate text-[10px] text-primary">★ {x.title}</span>)}</Button>
      {staff && mode === "week" ? <div className="space-y-2 px-1 pb-2">{list.map(c => <Link key={c.id} to="/class/$classId" params={{classId:c.id}} className={cn("block rounded border border-border p-2 text-xs",STATE_STYLE[classState(c)])}><BrandImage url={classLogo(c.activity_type_id)} alt="" className="float-left mr-1 h-5 w-5 object-contain"/><p className="font-semibold">{new Date(c.starts_at).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</p><p className="mt-1 break-words font-medium">{c.title}</p><p>{occupied(data?.counts[c.id] ?? EMPTY_COUNTS)}/{c.capacity} plazas</p><p className="mt-1 text-[10px]">{STATE_LABEL[classState(c)]}</p></Link>)}</div> : <div className="space-y-1 px-1 pb-2">{list.slice(0,mode === "month" ? 2 : 3).map(c => <Link to="/class/$classId" params={{classId:c.id}} key={c.id} className={cn("flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-[9px] sm:text-[11px]",STATE_STYLE[classState(c)])}><BrandImage url={classLogo(c.activity_type_id)} alt="" className="h-4 w-4 shrink-0 object-contain"/>{new Date(c.starts_at).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}<span className="hidden truncate sm:inline"> · {c.title}</span></Link>)}{list.length > 2 && mode === "month" && <p className="text-[10px] text-muted-foreground">+{list.length-2}</p>}</div>}
     </div>; })}
   </div>
  </div>
  <h3 className="font-semibold capitalize">{new Date(`${selected}T00:00:00`).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}</h3>
  {selectedEvents.map(e => <div key={e.id} className="border-l-2 border-warning bg-warning/10 p-3 text-sm"><p className="font-medium text-warning">{e.title} · {e.blocks_classes ? "Cerrado" : "Vacaciones"}</p>{e.description && <p className="mt-1 text-muted-foreground">{e.description}</p>}<p className="mt-1 text-xs text-muted-foreground">{new Date(e.starts_at).toLocaleString("es-ES")} — {new Date(e.ends_at).toLocaleString("es-ES")}</p></div>)}
  {selectedComm.map(e => <Link key={e.id} to="/events/$eventId" params={{eventId:e.id}} className="block border-l-2 border-primary bg-primary/10 p-3 text-sm"><p className="font-medium text-primary">{e.title} · {EVENT_KIND_LABEL[e.kind] ?? e.kind}</p><p className="mt-1 text-xs text-muted-foreground">{e.scope === "community" ? "Comunidad" : "Evento del box"}{e.location ? ` · ${e.location}` : ""}</p></Link>)}
  {!active.isLoading && shown.length === 0 && <p className="py-5 text-sm text-muted-foreground">No hay clases este día.</p>}
  <div className="grid gap-3 lg:grid-cols-2">{shown.map(c => { const count = mode === "month" ? (data?.classes ?? []).filter(x => { const start = new Date(c.starts_at); start.setDate(start.getDate()-((start.getDay()+6)%7));start.setHours(0,0,0,0); const end = new Date(start);end.setDate(end.getDate()+7);const mine = data?.mine[x.id];return new Date(x.starts_at)>=start && new Date(x.starts_at)<end && mine && mine.intent!=="not_going" && x.status!=="cancelled"; }).length : weeklyCount; const access = canAccessClass(plan ?? null,{...c,coach:c.coach_name ?? "",booked:0,activity_type_id:c.activity_type_id ?? ""}, count - (data?.mine[c.id]?.intent !== "not_going" && data?.mine[c.id] ? 1 : 0)); return <ClassCard key={c.id} c={c} coachAvatar={coaches.find(p => p.user_id === c.coach_id)?.avatar_url} counts={data?.counts[c.id] ?? EMPTY_COUNTS} mine={data?.mine[c.id]} busy={busy} blockedReason={realRole === "coach" || realRole === "admin" || access.allowed ? undefined : access.reason} onIntent={intent => book.mutate({id:c.id,intent})} onLeave={() => leave.mutate(c.id)} />; })}</div>
 </div>;
}
