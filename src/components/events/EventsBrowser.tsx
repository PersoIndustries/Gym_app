import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { calendarEventsQuery, type CommunityEvent } from "@/lib/data/events";
import { cn } from "@/lib/utils";

/** Próximos eventos publicados (box + comunidad), del más cercano al más lejano. */
export function upcomingEvents(events: CommunityEvent[], now = new Date()) {
  return events.filter(e => e.status === "published" && new Date(e.ends_at) >= now).sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
}
const dayKey = (d: Date) => d.toLocaleDateString("sv-SE");
const coversDay = (e: CommunityEvent, d: Date) => { const s = new Date(e.starts_at); s.setHours(0, 0, 0, 0); const en = new Date(e.ends_at); en.setHours(23, 59, 59, 999); return d >= s && d <= en; };

export function EventsBrowser({ tenant }: { tenant: string | null }) {
  const { data = [], isError } = useQuery(calendarEventsQuery(tenant));
  const [view, setView] = useState<"list" | "month">("list");
  const [scope, setScope] = useState<"all" | "box" | "community">("all");
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const [day, setDay] = useState<Date | null>(null);
  const published = data.filter(e => e.status === "published" && (scope === "all" || e.scope === scope));
  const list = upcomingEvents(published);
  const first = new Date(month); const offset = (first.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))] as (Date | null)[];
  const shift = (n: number) => { setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)); setDay(null); };
  const dayEvents = day ? published.filter(e => coversDay(e, day)).sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at)) : [];
  const todayKey = dayKey(new Date());
  return <div>
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="flex rounded-md bg-muted p-0.5">{([["list", "Lista"], ["month", "Calendario"]] as const).map(([k, l]) => <Button key={k} size="sm" className="h-7" variant={view === k ? "default" : "ghost"} onClick={() => setView(k)}>{l}</Button>)}</div>
      <div className="ml-auto flex gap-1">{([["all", "Todos"], ["box", "Mi box"], ["community", "Comunidad"]] as const).map(([k, l]) => <button key={k} onClick={() => setScope(k)} className={cn("rounded-full border px-2.5 py-0.5 text-xs", scope === k ? "border-primary text-primary" : "border-border text-muted-foreground")}>{l}</button>)}</div>
    </div>
    {isError && <p role="alert" className="text-sm text-destructive">No se pudieron cargar los eventos.</p>}
    {view === "list" ? <>
      {!list.length && <p className="text-sm text-muted-foreground">No hay eventos próximos.</p>}
      <div className="grid gap-3 sm:grid-cols-2">{list.map(e => <EventCard key={e.id} e={e} to="app" />)}</div>
    </> : <>
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between"><Button size="icon" variant="ghost" aria-label="Mes anterior" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button><p className="font-semibold capitalize">{month.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</p><Button size="icon" variant="ghost" aria-label="Mes siguiente" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button></div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">{["L", "M", "X", "J", "V", "S", "D"].map(d => <span key={d}>{d}</span>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">{cells.map((d, i) => { if (!d) return <span key={i} />; const n = published.filter(e => coversDay(e, d)).length; const sel = day && dayKey(day) === dayKey(d); return <button key={i} onClick={() => setDay(d)} className={cn("flex h-10 flex-col items-center justify-center rounded-md text-sm", sel ? "bg-primary text-primary-foreground" : "hover:bg-muted", dayKey(d) === todayKey && !sel && "ring-1 ring-primary")}>{d.getDate()}{n > 0 && <span className={cn("mt-0.5 h-1.5 w-1.5 rounded-full", sel ? "bg-primary-foreground" : "bg-primary")} />}</button>; })}</div>
      </div>
      <div className="mt-3">{!day ? <p className="text-sm text-muted-foreground">Toca un día para ver sus eventos.</p> : !dayEvents.length ? <p className="text-sm text-muted-foreground">No hay eventos ese día.</p> : <div className="grid gap-3 sm:grid-cols-2">{dayEvents.map(e => <EventCard key={e.id} e={e} to="app" />)}</div>}</div>
    </>}
  </div>;
}
