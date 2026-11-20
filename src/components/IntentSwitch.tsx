import { Check } from "lucide-react";
import { toast } from "sonner";
import { INTENT_LABEL, type Intent } from "@/lib/access/attendance";
import { INTENT_STYLE } from "@/lib/access/class-state";
import { cn } from "@/lib/utils";
/** blockedReason: si existe, "Voy" y "Dudas" no reservan y muestran el motivo al pulsarlos. */
export function IntentSwitch({ value, onChange, disabled, blockedReason }: { value: Intent | undefined; onChange: (i: Intent) => void; disabled?: boolean; blockedReason?: string | undefined }) {
  return <div role="radiogroup" aria-label="Tu asistencia" className="grid grid-cols-3 gap-1 rounded-full border border-border bg-muted/40 p-1">
    {(["going", "maybe", "not_going"] as Intent[]).map(i => { const sel = value === i; const blocked = !!blockedReason && i !== "not_going"; return <button key={i} type="button" role="radio" aria-checked={sel} aria-disabled={blocked || undefined} disabled={disabled} onClick={() => blocked ? toast.warning(blockedReason) : onChange(i)} className={cn("flex h-10 items-center justify-center gap-1 rounded-full text-sm transition-colors disabled:opacity-40", sel ? cn(INTENT_STYLE[i], "font-semibold shadow-sm") : "text-muted-foreground hover:text-foreground", blocked && "opacity-60")}>{sel && <Check className="h-4 w-4" />}{INTENT_LABEL[i]}</button>; })}
  </div>;
}
