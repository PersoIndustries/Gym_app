import { Lock } from "lucide-react";
import type { GymClass } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";

const fmt = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

export function ClassCard({ c, booked, blockedReason, onToggle }: { c: GymClass; booked: boolean; blockedReason?: string | undefined; onToggle: () => void }) {
  const full = c.booked >= c.capacity && !booked;
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <div className="w-14 text-center"><p className="font-display text-lg font-bold">{fmt(c.starts_at)}</p><p className="text-xs text-muted-foreground">60 min</p></div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{c.title}</p>
        <p className="text-xs text-muted-foreground">{c.coach} · {c.booked + (booked ? 1 : 0)}/{c.capacity} plazas</p>
        {blockedReason && <p className="mt-1 flex items-center gap-1 text-xs text-warning"><Lock className="h-3 w-3" />{blockedReason}</p>}
      </div>
      <Button size="sm" variant={booked ? "secondary" : "default"} disabled={!booked && (!!blockedReason || full)} onClick={onToggle}>
        {booked ? "Anular" : full ? "Llena" : "Reservar"}
      </Button>
    </div>
  );
}
