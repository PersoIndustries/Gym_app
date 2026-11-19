import { Link } from "@tanstack/react-router";
import { AlertTriangle, Lock } from "lucide-react";
import type { BoxClass, MyEnrollment } from "@/lib/data/box";
import { INTENT_LABEL, atRisk, confirmed, isFull, occupied, type Counts, type Intent } from "@/lib/access/attendance";
import { cn } from "@/lib/utils";

const fmt = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
const mins = (c: BoxClass) => Math.round((new Date(c.ends_at).getTime() - new Date(c.starts_at).getTime()) / 60000);

export function ClassCard({ c, counts, mine, blockedReason, onIntent, onLeave, busy }: {
  c: BoxClass; counts: Counts; mine?: MyEnrollment | undefined; blockedReason?: string | undefined;
  onIntent: (i: Intent) => void; onLeave: () => void; busy?: boolean;
}) {
  const cancelled = c.status === "cancelled";
  const past = new Date(c.starts_at) < new Date();
  const full = isFull(c, counts) && !mine;
  const risk = atRisk(c, counts);
  const disabled = busy || cancelled || past || (!mine && !!blockedReason);
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", cancelled && "opacity-60")}>
      <div className="flex items-start gap-4">
        <div className="w-14 text-center"><p className="font-display text-lg font-bold">{fmt(c.starts_at)}</p><p className="text-xs text-muted-foreground">{mins(c)} min</p></div>
        <Link to="/class/$classId" params={{ classId: c.id }} className="min-w-0 flex-1">
          <p className="truncate font-semibold hover:text-primary">{c.title}{cancelled && " · Cancelada"}</p>
          <p className="text-xs text-muted-foreground">{c.coach_name ?? "Sin coach"} · {occupied(counts)}/{c.capacity} plazas · {confirmed(counts)}/{c.min_attendees} mín.{counts.waitlist ? ` · ${counts.waitlist} en espera` : ""}</p>
          {cancelled && c.cancelled_reason && <p className="mt-1 text-xs text-destructive">{c.cancelled_reason}</p>}
          {!cancelled && risk && <p className="mt-1 flex items-center gap-1 text-xs text-warning"><AlertTriangle className="h-3 w-3" />Faltan confirmados: puede cancelarse {c.cancel_hours_before} h antes</p>}
          {blockedReason && !mine && <p className="mt-1 flex items-center gap-1 text-xs text-warning"><Lock className="h-3 w-3" />{blockedReason}</p>}
          {mine?.status === "waitlist" && <p className="mt-1 text-xs text-primary">Estás en lista de espera</p>}
        </Link>
      </div>
      {!cancelled && !past && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(["sure", "going", "maybe"] as Intent[]).map((i) => (
            <button key={i} disabled={disabled} onClick={() => onIntent(i)}
              className={cn("min-h-9 rounded-md px-3 text-sm font-medium transition-colors disabled:opacity-50", mine?.intent === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
              {INTENT_LABEL[i]}{!mine && full && i !== "maybe" ? " (espera)" : ""}
            </button>))}
          {mine && <button disabled={busy} onClick={onLeave} className="min-h-9 rounded-md px-3 text-sm text-muted-foreground hover:text-destructive">No voy</button>}
        </div>)}
    </div>
  );
}
