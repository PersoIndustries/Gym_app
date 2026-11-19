import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EVENT_FORMAT_LABEL, EVENT_KIND_LABEL } from "@/lib/access/events";
import type { CommunityEvent } from "@/lib/data/events";
import { cn } from "@/lib/utils";

export const fmtEventDate = (e: { starts_at: string; ends_at: string }) => {
  const s = new Date(e.starts_at), en = new Date(e.ends_at);
  const d = s.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  return s.toDateString() === en.toDateString() ? `${d} · ${s.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}` : `${d} – ${en.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;
};

export function EventCard({ e, to, highlight }: { e: CommunityEvent; to: "public" | "app"; highlight?: boolean }) {
  const body = <>
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={e.scope === "community" ? "default" : "secondary"}>{e.scope === "community" ? "Comunidad" : "Mi box"}</Badge>
      <span className="text-xs text-muted-foreground">{EVENT_KIND_LABEL[e.kind] ?? e.kind} · {EVENT_FORMAT_LABEL[e.format] ?? e.format}</span>
      {e.featured && <Star className="h-4 w-4 text-primary" aria-label="Destacado" />}
      {highlight && <Badge variant="outline" className="border-primary text-primary">Para ti</Badge>}
    </div>
    <p className="mt-2 font-display text-lg font-bold">{e.title}</p>
    <p className="text-sm text-muted-foreground">{fmtEventDate(e)}</p>
    {e.location && <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{e.location}</p>}
    {e.categories.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{e.categories.map(c => <span key={c} className="rounded bg-muted px-2 py-0.5 text-xs">{c}</span>)}</div>}
  </>;
  const cls = cn("block rounded-lg border border-border bg-card p-4 hover:border-primary", e.featured && "border-primary/60");
  return to === "public" ? <Link to="/eventos/$id" params={{ id: e.id }} className={cls}>{body}</Link> : <Link to="/events/$eventId" params={{ eventId: e.id }} className={cls}>{body}</Link>;
}
