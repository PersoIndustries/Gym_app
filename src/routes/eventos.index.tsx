import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { calendarEventsQuery } from "@/lib/data/events";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/eventos/")({ head: pageHead("Calendario de la comunidad", "Carreras, competiciones y eventos abiertos de los boxes de Meowscle."), component: PublicEvents });

function PublicEvents() {
  const { data: events = [], isLoading } = useQuery(calendarEventsQuery(null));
  const upcoming = events.filter(e => new Date(e.ends_at) >= new Date());
  const months = Array.from(new Set(upcoming.map(e => new Date(e.starts_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" }))));
  return <div className="mx-auto max-w-4xl px-4 py-6">
    <header className="mb-8 flex items-center justify-between"><Link to="/"><Logo /></Link><Button asChild size="sm" variant="outline"><Link to="/auth">Entrar</Link></Button></header>
    <h1 className="font-display text-3xl font-bold">Calendario de la comunidad</h1>
    <p className="mt-1 text-muted-foreground">Carreras y competiciones abiertas publicadas por los boxes.</p>
    {isLoading && <p className="mt-6 text-sm text-muted-foreground">Cargando…</p>}
    {!isLoading && !upcoming.length && <p className="mt-6 text-sm text-muted-foreground">No hay eventos publicados.</p>}
    {months.map(m => <section key={m} className="mt-8"><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{m}</h2><div className="grid gap-3 sm:grid-cols-2">{upcoming.filter(e => new Date(e.starts_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" }) === m).map(e => <EventCard key={e.id} e={e} to="public" />)}</div></section>)}
  </div>;
}
