import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dumbbell, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/lib/auth/session";
import { viewOptions, type ViewOption } from "@/lib/access/views";

const ICON = { athlete: Dumbbell, staff: LayoutDashboard, console: ShieldCheck };

/** Tras iniciar sesión, coach/admin/super admin eligen con qué vista entran. */
export function ViewPickerDialog() {
  const s = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [remember, setRemember] = useState(false);
  const options = viewOptions(s.memberships, s.platformRole);
  useEffect(() => {
    if (s.loading || options.length < 2) return;
    if (sessionStorage.getItem("bf.viewPicked") || localStorage.getItem("bf.rememberView")) return;
    setOpen(true);
  }, [s.loading, options.length]);
  if (!open) return null;
  const pick = (o: ViewOption) => {
    sessionStorage.setItem("bf.viewPicked", "1");
    if (remember) localStorage.setItem("bf.rememberView", "1");
    setOpen(false);
    if (o.mode === "console") { s.setView("console"); navigate({ to: "/platform" }); return; }
    s.setTenantId(o.tenantId); s.setView("box"); s.setBoxMode(o.mode);
    navigate({ to: o.mode === "staff" ? "/admin" : "/dashboard" });
  };
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { sessionStorage.setItem("bf.viewPicked", "1"); setOpen(false); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>¿Cómo quieres entrar?</DialogTitle><DialogDescription>Puedes cambiarlo cuando quieras desde el menú.</DialogDescription></DialogHeader>
        <div className="space-y-2">
          {options.map((o) => { const Icon = ICON[o.mode]; return (
            <button key={o.key} onClick={() => pick(o)} className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left hover:border-primary">
              <Icon className="h-5 w-5 text-primary" />
              <span><span className="block font-medium">{o.label}</span><span className="block text-xs text-muted-foreground">{o.hint}</span></span>
            </button>); })}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground"><Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />Recordar mi elección en este dispositivo</label>
      </DialogContent>
    </Dialog>
  );
}
