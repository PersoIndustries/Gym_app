import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { fmtEventDate } from "@/components/events/EventCard";
import { eventQuery } from "@/lib/data/events";
import { EVENT_FORMAT_LABEL, EVENT_KIND_LABEL } from "@/lib/access/events";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/eventos/$id")({ head: pageHead("Evento de la comunidad", "Detalles, categorías e inscripción del evento en BoxFlow."), component: PublicEvent });

function PublicEvent() {
  const { id } = Route.useParams();
  const { data: e, isLoading } = useQuery(eventQuery(id));
  return <div className="mx-auto max-w-2xl px-4 py-6">
    <header className="mb-6 flex items-center justify-between"><Link to="/"><Logo /></Link><Button asChild size="sm"><Link to="/auth">Apuntarme con mi box</Link></Button></header>
    <Link to="/eventos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Comunidad</Link>
    {isLoading ? <p className="text-sm text-muted-foreground">Cargando…</p> : !e ? <p>Este evento no está disponible.</p> : <article className="rounded-xl border border-border bg-card p-6">
      <p className="text-xs text-muted-foreground">{EVENT_KIND_LABEL[e.kind]} · {EVENT_FORMAT_LABEL[e.format]}{e.tenants?.name ? ` · ${e.tenants.name}` : ""}</p>
      <h1 className="mt-1 font-display text-3xl font-bold">{e.title}</h1>
      <p className="text-muted-foreground">{fmtEventDate(e)}{e.location ? ` · ${e.location}` : ""}</p>
      {e.description && <p className="mt-4 whitespace-pre-line">{e.description}</p>}
      {e.categories.length > 0 && <div className="mt-4 flex flex-wrap gap-1">{e.categories.map(c => <span key={c} className="rounded bg-muted px-2 py-0.5 text-xs">{c}</span>)}</div>}
      {e.price_cents != null && <p className="mt-4 text-sm">Precio orientativo: {(e.price_cents / 100).toLocaleString("es-ES")} €</p>}
      {e.url && <Button asChild className="mt-5"><a href={e.url} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Inscripción oficial</a></Button>}
    </article>}
  </div>;
}
