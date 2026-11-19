import { Link } from "@tanstack/react-router";
import { AlertTriangle, Lock } from "lucide-react";
import type { BoxClass, MyEnrollment } from "@/lib/data/box";
import { INTENTS, INTENT_LABEL, atRisk, confirmed, isFull, occupied, type Counts, type Intent } from "@/lib/access/attendance";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/PersonAvatar";
import { classState, STATE_LABEL, STATE_STYLE, INTENT_STYLE } from "@/lib/access/class-state";

const fmt = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
const mins = (c: BoxClass) => Math.round((new Date(c.ends_at).getTime() - new Date(c.starts_at).getTime()) / 60000);

export function ClassCard({ c, counts, mine, blockedReason, onIntent, busy, coachAvatar }: {
  c: BoxClass; counts: Counts; mine?: MyEnrollment | undefined; blockedReason?: string | undefined;
  onIntent: (i: Intent) => void; onLeave: () => void; busy?: boolean;
  coachAvatar?: string | null | undefined;
}) {
  const cancelled = c.status === "cancelled";
  const state = classState(c);
  const past = state === "live" || state === "finished";
  const full = isFull(c, counts) && !mine;
  const risk = atRisk(c, counts);
  const disabled = busy || cancelled || past || (!mine && !!blockedReason);
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", cancelled && "opacity-60")}>
      <div className="mb-2 flex justify-end"><span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATE_STYLE[state])}>{STATE_LABEL[state]}</span></div>
      <div className="flex items-start gap-4">
        <div className="w-14 text-center"><p className="font-display text-lg font-bold">{fmt(c.starts_at)}</p><p className="text-xs text-muted-foreground">{mins(c)} min</p></div>
        <Link to="/class/$classId" params={{ classId: c.id }} className="min-w-0 flex-1">
          <p className="truncate font-semibold hover:text-primary">{c.title}{cancelled && " · Cancelada"}</p>
          <div className="my-2 flex items-center gap-2"><PersonAvatar name={c.coach_name ?? "Sin coach"} url={coachAvatar} className="h-6 w-6" /><span className="text-xs text-muted-foreground">{c.coach_name ?? "Sin coach"}</span></div>
          <p className="text-xs text-muted-foreground">{occupied(counts)}/{c.capacity} plazas · {confirmed(counts)}/{c.min_attendees} mín.{counts.waitlist ? ` · ${counts.waitlist} en espera` : ""}</p>
          {cancelled && c.cancelled_reason && <p className="mt-1 text-xs text-destructive">{c.cancelled_reason}</p>}
          {!cancelled && risk && <p className="mt-1 flex items-center gap-1 text-xs text-warning"><AlertTriangle className="h-3 w-3" />Faltan confirmados: puede cancelarse {c.cancel_hours_before} h antes</p>}
          {blockedReason && !mine && <p className="mt-1 flex items-center gap-1 text-xs text-warning"><Lock className="h-3 w-3" />{blockedReason}</p>}
          {mine?.status === "waitlist" && <p className="mt-1 text-xs text-primary">Estás en lista de espera</p>}
        </Link>
      </div>
      {!cancelled && !past && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {INTENTS.map((i) => (
            <Button key={i} variant="outline" aria-pressed={mine?.intent === i} disabled={busy || cancelled || past || (i !== "not_going" && disabled)} onClick={() => onIntent(i)}
              className={cn("min-h-9 px-3 text-sm font-medium", INTENT_STYLE[i], mine?.intent === i && "ring-1 ring-current")}>
              {INTENT_LABEL[i]}{!mine && full && i === "going" ? " (espera)" : ""}
            </Button>))}
        </div>)}
    </div>
  );
}
