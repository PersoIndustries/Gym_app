import { useQuery } from "@tanstack/react-query";
import { activitiesQuery } from "@/lib/data/gym";
import { ActivityMark } from "@/components/ActivityMark";
import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import type { BoxClass, MyEnrollment } from "@/lib/data/box";
import { INTENTS, INTENT_LABEL, atRisk, confirmed, isFull, occupied, type Counts, type Intent } from "@/lib/access/attendance";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CoachProfile } from "@/components/CoachProfile";
import { PersonAvatar } from "@/components/PersonAvatar";
import { classState, STATE_LABEL, STATE_STYLE, INTENT_STYLE } from "@/lib/access/class-state";

const fmt = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
const mins = (c: BoxClass) => Math.round((new Date(c.ends_at).getTime() - new Date(c.starts_at).getTime()) / 60000);

/** manage: tarjeta de edición (toda clicable, sin botones de asistencia). */
export function ClassCard({ c, counts, mine, blockedReason, onIntent, busy, coachAvatar, manage = false }: {
  c: BoxClass; counts: Counts; mine?: MyEnrollment | undefined; blockedReason?: string | undefined;
  onIntent: (i: Intent) => void; onLeave: () => void; busy?: boolean;
  coachAvatar?: string | null | undefined; manage?: boolean;
}) {
  const { data: activities = [] } = useQuery(activitiesQuery(c.tenant_id));
  const activity = activities.find(a => a.id === c.activity_type_id);
  const cancelled = c.status === "cancelled";
  const state = classState(c);
  const past = state === "live" || state === "finished";
  const full = isFull(c, counts) && !mine;
  const risk = atRisk(c, counts);
  const disabled = busy || cancelled || past || !!blockedReason;
  const header = <>
    <div className="flex min-w-0 items-center gap-3 pr-20">
      <div className="shrink-0"><p className="font-display text-xl font-bold leading-none">{fmt(c.starts_at)}</p><p className="mt-1 text-xs text-muted-foreground">{mins(c)} min</p></div>
      <ActivityMark url={activity?.logo_url} name={activity?.name ?? c.title} className="h-10 w-10 shrink-0"/>
      <p className="min-w-0 break-words font-display text-base font-bold leading-tight">{c.title}</p>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{occupied(counts)}/{c.capacity} plazas · {confirmed(counts)}/{c.min_attendees} mín.{counts.maybe > 0 ? ` · ${counts.maybe} con dudas` : ""}</p>
  </>;
  const tag = <span className={cn("absolute right-0 top-0 rounded-bl-md rounded-tr-lg px-2 py-0.5 text-[11px] font-medium", STATE_STYLE[state])}>{STATE_LABEL[state]}</span>;
  const box = cn("relative block overflow-hidden rounded-lg border border-border bg-card p-4", cancelled && "opacity-60");
  if (manage) return (
    <Link to="/class/$classId" params={{ classId: c.id }} className={cn(box, "transition-colors hover:border-primary")}>
      {tag}{header}
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">{c.coach_id || c.coach_name ? <>Impartido por: <PersonAvatar name={c.coach_name ?? "Profesor"} url={coachAvatar} className="h-6 w-6"/><span className="truncate">{c.coach_name}</span></> : "Sin profesor asignado"}</div>
      {cancelled && c.cancelled_reason && <p className="mt-2 text-xs text-destructive">{c.cancelled_reason}</p>}
      {!cancelled && !past && risk && <p className="mt-2 flex items-start gap-1 text-xs text-warning"><AlertTriangle className="h-3 w-3 shrink-0"/>Mínimo pendiente · revisión {c.cancel_hours_before} h antes</p>}
    </Link>
  );
  return (
    <div className={box}>
      {tag}
      <div className="flex items-start justify-between gap-2"><Link to="/class/$classId" params={{ classId: c.id }} className="block min-w-0 flex-1 hover:text-primary">{header}</Link><div className="mt-6"><CoachProfile id={c.coach_id} name={c.coach_name} avatar={coachAvatar}/></div></div>
      {mine?.status === "waitlist" && <p className="mt-1 text-xs text-primary">Estás en lista de espera</p>}
      {cancelled && c.cancelled_reason && <p className="mt-2 text-xs text-destructive">{c.cancelled_reason}</p>}
      {!cancelled && !past && risk && <p className="mt-2 flex items-start gap-1 text-xs text-warning"><AlertTriangle className="h-3 w-3 shrink-0"/>Mínimo pendiente · revisión {c.cancel_hours_before} h antes</p>}
      {!cancelled && !past && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {INTENTS.map((i) => (
            <Button key={i} variant="outline" aria-pressed={mine?.intent === i} disabled={busy || cancelled || past || (i === "going" && disabled)} onClick={() => onIntent(i)}
              className={cn("min-h-9 px-3 text-sm font-medium", mine?.intent === i ? cn(INTENT_STYLE[i], "ring-1 ring-current") : "border-border bg-transparent text-muted-foreground")}>
              {INTENT_LABEL[i]}{!mine && full && i === "going" ? " (espera)" : ""}
            </Button>))}
        </div>)}
    </div>
  );
}
