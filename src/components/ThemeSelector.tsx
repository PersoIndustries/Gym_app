import { Check, Dumbbell } from "lucide-react";
import { THEMES, type ThemeId } from "@/lib/brand/themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeSelector({ value, onChange, disabled = false }: { value: ThemeId; onChange: (theme: ThemeId) => void; disabled?: boolean }) {
  return <div className="grid grid-cols-2 gap-3" role="group" aria-label="Tema del gimnasio">
    {THEMES.map(theme => <Button key={theme.id} type="button" variant="outline" disabled={disabled} aria-pressed={value === theme.id} onClick={() => onChange(theme.id)} className={cn("h-auto min-w-0 flex-col items-stretch gap-0 overflow-hidden whitespace-normal p-0 text-left", value === theme.id && "border-primary ring-2 ring-primary")}>
      <span data-theme={theme.id} className="theme-preview relative flex h-24 items-center justify-center border-b border-border p-4 text-foreground" aria-hidden="true">
        <span className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2"><Dumbbell className="text-primary" /><span className="text-xs font-semibold">WOD</span><span className="h-2 w-6 rounded bg-primary" /></span>
        {value === theme.id && <span className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground"><Check /></span>}
      </span>
      <span className="min-h-20 px-3 py-3"><span className="block break-words text-sm font-semibold">{theme.label}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{theme.hint}</span></span>
    </Button>)}
  </div>;
}