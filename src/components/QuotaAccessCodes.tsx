import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoHelp } from "@/components/InfoHelp";
import { invitesQuery, plansQuery, saveInvite } from "@/lib/data/gym";
import { useSession } from "@/lib/auth/session";

const blank = { code: "", plan: "none", approval: false, max: "", expires: "" };
const message = (e: unknown) => e && typeof e === "object" && "message" in e ? String(e.message) : "No se pudo guardar el código";
export function QuotaAccessCodes() {
  const { tenantId, role } = useSession(); const qc = useQueryClient();
  const { data: invites = [], isError, isPending } = useQuery({ ...invitesQuery(tenantId), enabled: !!tenantId && role === "admin" });
  const { data: plans = [] } = useQuery(plansQuery(tenantId));
  const [open, setOpen] = useState(false); const [id, setId] = useState<string | null>(null); const [f, setF] = useState(blank);
  const save = useMutation({ mutationFn: async () => {
    if (!tenantId || role !== "admin") throw new Error("Solo el admin puede gestionar códigos");
    const code = f.code.trim();
    if (!/^[A-Za-z0-9_-]{4,64}$/.test(code)) throw new Error("Usa entre 4 y 64 letras, números, guiones o guiones bajos");
    const max = f.max.trim() ? Number(f.max) : null;
    if (max !== null && (!Number.isSafeInteger(max) || max < 1)) throw new Error("El máximo de usos debe ser un entero desde 1");
    await saveInvite(tenantId, id, { code, membership_plan_id: f.plan === "none" ? null : f.plan, requires_approval: f.approval, max_uses: max, expires_at: f.expires ? new Date(`${f.expires}T23:59:59`).toISOString() : null });
  }, onSuccess: () => { setOpen(false); qc.invalidateQueries({ queryKey: ["invites"] }); qc.invalidateQueries({ queryKey: ["members"] }); toast.success("Código guardado"); }, onError: e => toast.error(message(e)) });
  if (role !== "admin") return null;
  return <section className="space-y-4">
    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-1"><h2 className="font-semibold">Códigos de acceso</h2><InfoHelp label="Códigos de acceso">Cada código invita al mismo gimnasio. Puedes asignar una cuota al entrar o dejarla pendiente para asignarla después. No son códigos de descuento de BoxFlow.</InfoHelp></div><Button size="sm" onClick={() => { setId(null); setF(blank); setOpen(true); }}><Plus />Nuevo código</Button></div>
    {isError && <p role="alert" className="text-destructive">No se pudieron cargar los códigos.</p>}
    {isPending && <p className="text-sm text-muted-foreground">Cargando códigos…</p>}
    {!isPending && !invites.length && <p className="text-sm text-muted-foreground">Aún no hay códigos de acceso.</p>}
    <div className="divide-y divide-border">{invites.map(i => {
      const exhausted = i.max_uses !== null && i.uses >= i.max_uses;
      const expired = !!i.expires_at && new Date(i.expires_at) <= new Date();
      return <article key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0"><p className="break-all font-mono font-semibold text-primary">{i.code}</p><p className="mt-1 text-sm">{plans.find(p => p.id === i.membership_plan_id)?.name ?? "Sin cuota automática"}</p><p className="mt-1 text-xs text-muted-foreground">{i.uses} / {i.max_uses ?? "∞"} usos · {expired ? "Caducado" : exhausted ? "Agotado" : "Disponible"}{i.requires_approval ? " · Con aprobación" : " · Entrada directa"}</p>{i.expires_at && <p className="mt-1 text-xs text-muted-foreground">Caduca: {new Date(i.expires_at).toLocaleDateString("es-ES")}</p>}</div>
        <div className="flex gap-1"><Button size="icon" variant="ghost" aria-label={`Copiar enlace del código ${i.code}`} onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/b/${encodeURIComponent(i.code)}`); toast.success("Enlace copiado"); } catch { toast.error("No se pudo copiar el enlace"); } }}><Copy /></Button><Button size="icon" variant="ghost" aria-label={`Editar código ${i.code}`} onClick={() => { setId(i.id); setF({ code: i.code, plan: i.membership_plan_id ?? "none", approval: i.requires_approval, max: i.max_uses === null ? "" : String(i.max_uses), expires: i.expires_at ? new Date(i.expires_at).toLocaleDateString("sv-SE") : "" }); setOpen(true); }}><Pencil /></Button></div>
      </article>;
    })}</div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{id ? "Editar código" : "Nuevo código de acceso"}</DialogTitle></DialogHeader><div className="space-y-4">
      <label className="block text-sm">Código<Input value={f.code} maxLength={64} onChange={e => setF({ ...f, code: e.target.value })} /></label>
      <div><div className="flex items-center gap-1"><span className="text-sm">Cuota automática</span><InfoHelp label="Cuota automática">La cuota se asigna al entrar o al aprobar la solicitud. Sin cuota automática, el alumno verá la pantalla de espera hasta que el gimnasio le asigne una.</InfoHelp></div><Select value={f.plan} onValueChange={plan => setF({ ...f, plan })}><SelectTrigger aria-label="Cuota automática"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sin cuota automática</SelectItem>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.approval} onCheckedChange={v => setF({ ...f, approval: v === true })} />Requiere aprobación del admin</label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Máximo de usos<Input type="number" min="1" placeholder="Sin límite" value={f.max} onChange={e => setF({ ...f, max: e.target.value })} /></label><label className="text-sm">Caducidad<Input type="date" value={f.expires} onChange={e => setF({ ...f, expires: e.target.value })} /></label></div>
    </div><DialogFooter><Button disabled={save.isPending} onClick={() => save.mutate()}>Guardar código</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}