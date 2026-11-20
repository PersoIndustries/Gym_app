import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSession } from "@/lib/auth/session";
import { promoCodesQuery, savePromo, deletePromo, type PromoCode, type PromoInput } from "@/lib/data/promos";
import { SAAS_PLANS, commission, remainingUses } from "@/lib/access/saas-plans";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/codes")({ head: pageHead("Códigos promocionales", "Códigos de descuento y afiliados para nuevos gimnasios."), component: Codes });
const eur = (c: number) => (c / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
const EMPTY: PromoInput = { code: "", plan_id: null, discount_pct: 20, duration_months: 3, max_uses: 50, expires_at: null, active: true, affiliate_name: null, affiliate_email: null, commission_pct: 0, notes: null };

function Codes() {
  const { platformRole } = useSession();
  const { data, isError } = useQuery({ ...promoCodesQuery(), enabled: platformRole === "super_admin" });
  const [edit, setEdit] = useState<{ id: string | null; v: PromoInput } | null>(null);
  if (platformRole !== "super_admin") return <Navigate to="/platform" />;
  const codes = data?.codes ?? []; const red = data?.redemptions ?? [];
  const stats = (c: PromoCode) => { const rs = red.filter(r => r.code_id === c.id); const mrr = rs.reduce((s, r) => s + (r.billing === "year" ? Math.round(r.price_after_cents / 12) : r.price_after_cents), 0); return { gyms: rs.length, mrr, fee: commission(mrr, Number(c.commission_pct)) }; };
  const totals = codes.reduce((a, c) => { const s = stats(c); return { uses: a.uses + c.uses, mrr: a.mrr + s.mrr, fee: a.fee + s.fee }; }, { uses: 0, mrr: 0, fee: 0 });
  const ranking = [...codes].sort((a, b) => b.uses - a.uses).slice(0, 5);
  return <ConsoleShell title="Códigos promocionales" subtitle="Descuentos para nuevos gimnasios y retribución a afiliados" action={<Button onClick={() => setEdit({ id: null, v: EMPTY })}><Plus />Nuevo código</Button>}>
    {isError && <p role="alert" className="mb-4 text-destructive">No se pudieron cargar los códigos.</p>}
    <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
      {[["Códigos activos", codes.filter(c => c.active).length], ["Usos totales", totals.uses], ["Ingreso mensual generado", eur(totals.mrr)], ["Retribución estimada / mes", eur(totals.fee)]].map(([l, v]) => <div key={l} className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 font-display text-2xl font-bold">{v}</p></div>)}
    </div>
    <div className="overflow-x-auto rounded-xl border border-border bg-card"><Table>
      <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Plan</TableHead><TableHead className="text-right">Desc.</TableHead><TableHead>Duración</TableHead><TableHead className="text-right">Usos</TableHead><TableHead className="text-right">Restantes</TableHead><TableHead>Caduca</TableHead><TableHead>Afiliado</TableHead><TableHead className="text-right">Ingreso/mes</TableHead><TableHead className="text-right">Retribución</TableHead><TableHead>Estado</TableHead><TableHead /></TableRow></TableHeader>
      <TableBody>{codes.map(c => { const s = stats(c); const left = remainingUses(c); const expired = !!c.expires_at && new Date(c.expires_at) < new Date(); return <TableRow key={c.id}>
        <TableCell className="font-mono font-semibold">{c.code}</TableCell>
        <TableCell>{c.plan_id ? SAAS_PLANS.find(p => p.id === c.plan_id)?.name : "Cualquiera"}</TableCell>
        <TableCell className="text-right">{c.discount_pct}%</TableCell>
        <TableCell>{c.duration_months ? `${c.duration_months} mes(es)` : "Siempre"}</TableCell>
        <TableCell className="text-right">{c.uses}{c.max_uses ? ` / ${c.max_uses}` : ""}</TableCell>
        <TableCell className="text-right">{left ?? "∞"}</TableCell>
        <TableCell className="text-sm">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("es-ES") : "—"}</TableCell>
        <TableCell>{c.affiliate_name ? <><p className="text-sm">{c.affiliate_name}</p><p className="text-xs text-muted-foreground">{c.commission_pct}%</p></> : "—"}</TableCell>
        <TableCell className="text-right">{eur(s.mrr)}</TableCell><TableCell className="text-right">{eur(s.fee)}</TableCell>
        <TableCell>{!c.active ? <Badge variant="outline">Pausado</Badge> : expired ? <Badge variant="secondary">Caducado</Badge> : left === 0 ? <Badge variant="secondary">Agotado</Badge> : <Badge>Activo</Badge>}</TableCell>
        <TableCell className="whitespace-nowrap"><Button size="icon" variant="ghost" aria-label="Copiar código" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Código copiado"); }}><Copy /></Button><Button size="icon" variant="ghost" aria-label="Editar" onClick={() => { const { id, uses: _u, created_at: _c, updated_at: _d, ...v } = c; setEdit({ id, v }); }}><Pencil /></Button></TableCell>
      </TableRow>; })}
      {!codes.length && <TableRow><TableCell colSpan={12} className="py-8 text-center text-muted-foreground">Aún no hay códigos.</TableCell></TableRow>}</TableBody></Table></div>
    {ranking.length > 0 && <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <div><h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ranking por usos</h2><ol className="space-y-2 rounded-xl border border-border bg-card p-4">{ranking.map((c, i) => <li key={c.id} className="flex justify-between text-sm"><span>{i + 1}. <span className="font-mono">{c.code}</span>{c.affiliate_name ? ` · ${c.affiliate_name}` : ""}</span><b>{c.uses}</b></li>)}</ol></div>
      <div><h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Últimos canjes</h2><ul className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">{red.slice(0, 8).map(r => <li key={r.id} className="flex justify-between gap-3"><span>{(r.tenants as { name: string } | null)?.name ?? "Gimnasio"} · <span className="font-mono">{codes.find(c => c.id === r.code_id)?.code}</span></span><span className="text-muted-foreground">{r.plan_id} · {eur(r.price_after_cents)}/{r.billing === "year" ? "año" : "mes"}</span></li>)}{!red.length && <li className="text-muted-foreground">Sin canjes todavía.</li>}</ul></div>
    </section>}
    {edit && <Editor init={edit} onClose={() => setEdit(null)} />}
  </ConsoleShell>;
}

function Editor({ init, onClose }: { init: { id: string | null; v: PromoInput }; onClose: () => void }) {
  const qc = useQueryClient(); const [v, setV] = useState(init.v);
  const done = () => { qc.invalidateQueries({ queryKey: ["promo-codes"] }); onClose(); };
  const save = useMutation({ mutationFn: () => savePromo(init.id, { ...v, code: v.code.trim().toUpperCase() }), onSuccess: () => { toast.success("Código guardado"); done(); }, onError: (e) => toast.error(e.message) });
  const del = useMutation({ mutationFn: () => deletePromo(init.id!), onSuccess: () => { toast.success("Código eliminado"); done(); }, onError: (e) => toast.error(e.message) });
  const num = (s: string) => (s === "" ? null : Math.max(0, Number(s) || 0));
  return <Sheet open onOpenChange={o => !o && onClose()}><SheetContent className="overflow-y-auto sm:max-w-md"><SheetHeader><SheetTitle>{init.id ? "Editar código" : "Nuevo código"}</SheetTitle></SheetHeader>
    <div className="mt-4 grid gap-4 px-4 pb-6">
      <div><Label>Código</Label><Input className="font-mono uppercase" value={v.code} onChange={e => setV({ ...v, code: e.target.value.toUpperCase() })} placeholder="JUAN20" /></div>
      <div><Label>Plan</Label><Select value={v.plan_id ?? "any"} onValueChange={p => setV({ ...v, plan_id: p === "any" ? null : p })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Cualquier plan</SelectItem>{SAAS_PLANS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid grid-cols-2 gap-3"><div><Label>Descuento %</Label><Input type="number" min={0} max={100} value={v.discount_pct} onChange={e => setV({ ...v, discount_pct: Math.min(100, num(e.target.value) ?? 0) })} /></div>
        <div><Label>Duración (meses)</Label><Input type="number" min={1} placeholder="Siempre" value={v.duration_months ?? ""} onChange={e => setV({ ...v, duration_months: num(e.target.value) || null })} /></div></div>
      <div className="grid grid-cols-2 gap-3"><div><Label>Usos máximos</Label><Input type="number" min={1} placeholder="Ilimitados" value={v.max_uses ?? ""} onChange={e => setV({ ...v, max_uses: num(e.target.value) || null })} /></div>
        <div><Label>Caduca</Label><Input type="date" value={v.expires_at?.slice(0, 10) ?? ""} onChange={e => setV({ ...v, expires_at: e.target.value ? new Date(e.target.value + "T23:59:59").toISOString() : null })} /></div></div>
      <label className="flex items-center justify-between text-sm">Activo<Switch checked={v.active} onCheckedChange={a => setV({ ...v, active: a })} /></label>
      <div className="rounded-lg border border-border p-3"><p className="mb-2 text-sm font-medium">Afiliado / influencer <span className="text-xs text-muted-foreground">(solo visible para ti)</span></p>
        <div className="grid gap-3"><Input placeholder="Nombre" value={v.affiliate_name ?? ""} onChange={e => setV({ ...v, affiliate_name: e.target.value || null })} />
          <Input type="email" placeholder="Correo" value={v.affiliate_email ?? ""} onChange={e => setV({ ...v, affiliate_email: e.target.value || null })} />
          <div><Label>Retribución %</Label><Input type="number" min={0} max={100} value={v.commission_pct} onChange={e => setV({ ...v, commission_pct: Math.min(100, num(e.target.value) ?? 0) })} /></div></div></div>
      <div><Label>Notas</Label><Textarea value={v.notes ?? ""} onChange={e => setV({ ...v, notes: e.target.value || null })} /></div>
      <div className="flex justify-between">{init.id ? <Button variant="ghost" className="text-destructive" onClick={() => confirm("¿Eliminar el código? Se borran también sus canjes.") && del.mutate()}><Trash2 />Eliminar</Button> : <span />}<Button disabled={save.isPending || v.code.trim().length < 3} onClick={() => save.mutate()}>Guardar</Button></div>
    </div></SheetContent></Sheet>;
}
