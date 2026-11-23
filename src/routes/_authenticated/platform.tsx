import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Ban, Download, RefreshCw, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { CommunityModeration } from "@/components/events/CommunityModeration";
import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocalState } from "@/lib/data/local-store";
import { INVOICES, PLATFORM_USERS, SAAS_PLANS, TENANTS_OPS, computeMrr, fmtEUR, invoiceTotals, type AuditEntry, type Invoice, type InvoiceStatus, type PlatformUser, type SaasPlan, type TenantOps, type TenantStatus } from "@/lib/data/platform";
import { useSession } from "@/lib/auth/session";
import type { TenantRole } from "@/lib/domain/types";
import { pageHead } from "@/lib/seo";
import { RealTenants } from "@/components/platform/RealTenants";

const STATUS: Record<TenantStatus, string> = { active: "Activo", trial: "En prueba", paused: "Suspendido", cancelled: "Baja" };
const INV: Record<InvoiceStatus, string> = { paid: "Pagada", pending: "Pendiente", failed: "Fallida", refunded: "Reembolsada" };
const ROLE: Record<TenantRole, string> = { athlete: "Atleta", coach: "Coach", admin: "Admin box" };
const invVariant = (s: InvoiceStatus) => (s === "paid" ? "default" : s === "failed" ? "destructive" : s === "pending" ? "secondary" : "outline");

export const Route = createFileRoute("/_authenticated/platform")({ head: pageHead("Gimnasios", "Consola de plataforma: gestión operativa de gimnasios."), component: Platform });

function Platform() {
  const { platformRole, loading } = useSession();
  const [tenants, setTenants] = useLocalState<TenantOps[]>("bf.ops.tenants", TENANTS_OPS);
  const [invoices, setInvoices] = useLocalState<Invoice[]>("bf.ops.invoices", INVOICES);
  const [users, setUsers] = useLocalState<PlatformUser[]>("bf.ops.users", PLATFORM_USERS);
  const [audit, setAudit] = useLocalState<AuditEntry[]>("bf.ops.audit", []);
  const [q, setQ] = useState(""); const [st, setSt] = useState<"all" | TenantStatus>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  if (loading) return null;
  if (!platformRole) return <Navigate to="/dashboard" />;

  const log = (action: string, target: string) => setAudit((a) => [{ id: crypto.randomUUID(), at: new Date().toISOString(), action, target }, ...a].slice(0, 200));
  const rows = tenants.filter((t) => (st === "all" || t.status === st) && (t.name + t.city + t.owner_email).toLowerCase().includes(q.toLowerCase()));
  const overdue = (id: string) => invoices.some((i) => i.tenant_id === id && i.status === "failed");
  const open = tenants.find((t) => t.id === openId) ?? null;

  return (
    <ConsoleShell title="Gimnasios" subtitle="Gestión operativa de todos los clientes"
      action={<><Select value={st} onValueChange={(v) => setSt(v as typeof st)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{Object.entries(STATUS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select>
        <Input placeholder="Buscar gimnasio, ciudad, email…" value={q} onChange={(e) => setQ(e.target.value)} className="w-72" /></>}>
      <RealTenants />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
        {[["Gimnasios", tenants.length], ["Activos", tenants.filter((t) => t.status === "active").length], ["En prueba", tenants.filter((t) => t.status === "trial").length], ["MRR", fmtEUR(computeMrr(tenants))], ["Cobros fallidos", fmtEUR(invoiceTotals(invoices).failed)]].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 font-display text-2xl font-bold">{v}</p></div>))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Gimnasio</TableHead><TableHead>Ciudad</TableHead><TableHead>Plan</TableHead><TableHead className="text-right">Socios</TableHead><TableHead>Renovación</TableHead><TableHead>Estado</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>{rows.map((t) => (
            <TableRow key={t.id} className="cursor-pointer" onClick={() => setOpenId(t.id)}>
              <TableCell><p className="font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.owner_email}</p></TableCell>
              <TableCell>{t.city}</TableCell><TableCell>{SAAS_PLANS[t.plan].label}</TableCell><TableCell className="text-right">{users.filter((u) => u.tenant_id === t.id).length > 0 ? t.members : t.members}</TableCell>
              <TableCell className="text-sm">{t.renews_at}</TableCell>
              <TableCell className="space-x-1"><Badge variant={t.status === "active" ? "default" : t.status === "trial" ? "secondary" : "outline"}>{STATUS[t.status]}</Badge>{overdue(t.id) && <Badge variant="destructive">Impago</Badge>}</TableCell>
              <TableCell><Button size="sm" variant="outline">Gestionar</Button></TableCell>
            </TableRow>))}</TableBody>
        </Table>
      </div>
      {audit.length > 0 && <section className="mt-8"><h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Registro de acciones</h2>
        <ul className="space-y-1 rounded-xl border border-border bg-card p-4 text-sm">{audit.slice(0, 10).map((a) => <li key={a.id} className="flex gap-3"><span className="w-40 shrink-0 text-muted-foreground">{new Date(a.at).toLocaleString("es-ES")}</span><span>{a.action} — <b>{a.target}</b></span></li>)}</ul></section>}

      {platformRole === "super_admin" && <CommunityModeration />}
      {open && <TenantSheet t={open} onClose={() => setOpenId(null)}
        invoices={invoices.filter((i) => i.tenant_id === open.id)} users={users.filter((u) => u.tenant_id === open.id)}
        update={(patch, action) => { setTenants(tenants.map((x) => (x.id === open.id ? { ...x, ...patch } : x))); log(action, open.name); toast.success(action); }}
        setInvoice={(id, status) => { setInvoices(invoices.map((i) => (i.id === id ? { ...i, status } : i))); log(`Factura ${id} → ${INV[status]}`, open.name); toast.success(`Factura marcada como ${INV[status].toLowerCase()}`); }}
        setUser={(u, action) => { setUsers(u ? users.map((x) => (x.id === u.id ? u : x)) : users); log(action, open.name); toast.success(action); }}
        deleteUser={(u) => { setUsers(users.filter((x) => x.id !== u.id)); log(`Usuario eliminado: ${u.email}`, open.name); toast.success("Usuario eliminado"); }} />}
    </ConsoleShell>
  );
}

function TenantSheet({ t, invoices, users, onClose, update, setInvoice, setUser, deleteUser }: {
  t: TenantOps; invoices: Invoice[]; users: PlatformUser[]; onClose: () => void;
  update: (p: Partial<TenantOps>, action: string) => void; setInvoice: (id: string, s: InvoiceStatus) => void;
  setUser: (u: PlatformUser, action: string) => void; deleteUser: (u: PlatformUser) => void;
}) {
  const [notes, setNotes] = useState(t.notes); const [uq, setUq] = useState("");
  const [toDelete, setToDelete] = useState<PlatformUser | null>(null); const [confirmText, setConfirmText] = useState("");
  const tot = invoiceTotals(invoices);
  const download = (i: Invoice) => { const blob = new Blob([`FACTURA ${i.number}\nCliente: ${t.name}\nFecha: ${i.date}\nImporte: ${fmtEUR(i.amount_cents)}\nEstado: ${INV[i.status]}\nMétodo: ${i.method}\n`], { type: "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${i.number}.txt`; a.click(); };
  const ulist = users.filter((u) => (u.name + u.email).toLowerCase().includes(uq.toLowerCase()));
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader><SheetTitle className="text-2xl">{t.name}</SheetTitle><p className="text-sm text-muted-foreground">{t.city} · {t.owner_email} · cliente desde {t.created_at}</p></SheetHeader>
        <Tabs defaultValue="ops" className="mt-6">
          <TabsList><TabsTrigger value="ops">Operaciones</TabsTrigger><TabsTrigger value="billing">Facturas</TabsTrigger><TabsTrigger value="users">Usuarios ({users.length})</TabsTrigger></TabsList>

          <TabsContent value="ops" className="space-y-5 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Estado</Label><Select value={t.status} onValueChange={(v) => update({ status: v as TenantStatus }, `Estado → ${STATUS[v as TenantStatus]}`)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Plan SaaS</Label><Select value={t.plan} onValueChange={(v) => update({ plan: v as SaasPlan }, `Plan → ${SAAS_PLANS[v as SaasPlan].label}`)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(SAAS_PLANS).map(([k, p]) => <SelectItem key={k} value={k}>{p.label} · {fmtEUR(p.price_cents)}/mes</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Código de acceso</Label><div className="flex gap-2"><Input readOnly value={t.invite_code} className="font-mono" /><Button variant="outline" size="icon" title="Regenerar" onClick={() => update({ invite_code: Math.random().toString(36).slice(2, 8).toUpperCase() }, "Código de acceso regenerado")}><RefreshCw className="h-4 w-4" /></Button></div></div>
              <div><Label>Próxima renovación</Label><Input type="date" value={t.renews_at} onChange={(e) => update({ renews_at: e.target.value }, `Renovación → ${e.target.value}`)} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => { const d = new Date(t.renews_at); d.setDate(d.getDate() + 14); update({ renews_at: d.toISOString().slice(0, 10), status: t.status === "paused" ? "active" : t.status }, "Ampliados 14 días"); }}>Ampliar 14 días</Button>
              {t.status !== "paused" ? <Button variant="outline" onClick={() => update({ status: "paused" }, "Box suspendido")}><Ban className="mr-1 h-4 w-4" />Suspender</Button> : <Button onClick={() => update({ status: "active" }, "Box reactivado")}><UserCheck className="mr-1 h-4 w-4" />Reactivar</Button>}
              <Button variant="destructive" onClick={() => confirm(`¿Dar de baja ${t.name}?`) && update({ status: "cancelled" }, "Box dado de baja")}>Dar de baja</Button>
            </div>
            <div><Label>Notas internas</Label><Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /><Button size="sm" className="mt-2" onClick={() => update({ notes }, "Notas actualizadas")}>Guardar notas</Button></div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-3">{[["Cobrado", tot.paid], ["Pendiente", tot.pending], ["Fallido", tot.failed]].map(([l, v]) => <div key={l} className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-lg font-bold">{fmtEUR(v as number)}</p></div>)}</div>
            {invoices.length === 0 ? <p className="text-sm text-muted-foreground">Sin facturas: el box está en periodo de prueba.</p> :
              <Table><TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Importe</TableHead><TableHead>Método</TableHead><TableHead>Estado</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>{[...invoices].reverse().map((i) => (
                  <TableRow key={i.id}><TableCell className="font-mono text-xs">{i.number}</TableCell><TableCell>{i.date}</TableCell><TableCell className="text-right">{fmtEUR(i.amount_cents)}</TableCell><TableCell className="text-xs">{i.method}</TableCell>
                    <TableCell><Badge variant={invVariant(i.status)}>{INV[i.status]}</Badge></TableCell>
                    <TableCell className="flex gap-1">
                      {i.status !== "paid" && i.status !== "refunded" && <Button size="sm" variant="outline" onClick={() => setInvoice(i.id, "paid")}>Marcar pagada</Button>}
                      {i.status === "failed" && <Button size="sm" variant="outline" onClick={() => setInvoice(i.id, "pending")}>Reintentar</Button>}
                      {i.status === "paid" && <Button size="sm" variant="ghost" onClick={() => confirm("¿Reembolsar esta factura?") && setInvoice(i.id, "refunded")}>Reembolsar</Button>}
                      <Button size="icon" variant="ghost" title="Descargar" onClick={() => download(i)}><Download className="h-4 w-4" /></Button>
                    </TableCell></TableRow>))}</TableBody></Table>}
          </TabsContent>

          <TabsContent value="users" className="space-y-3 pt-4">
            <Input placeholder="Buscar usuario…" value={uq} onChange={(e) => setUq(e.target.value)} />
            <Table><TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Rol</TableHead><TableHead>Última vez</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>{ulist.map((u) => (
                <TableRow key={u.id} className={u.blocked ? "opacity-60" : ""}>
                  <TableCell><p className="font-medium">{u.name} {u.blocked && <Badge variant="outline">Bloqueado</Badge>}</p><p className="text-xs text-muted-foreground">{u.email}</p></TableCell>
                  <TableCell><Select value={u.role} onValueChange={(v) => setUser({ ...u, role: v as TenantRole }, `${u.email}: rol → ${ROLE[v as TenantRole]}`)}><SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ROLE).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell className="text-sm">{u.last_seen}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => toast.success(`Enlace de cambio de contraseña enviado a ${u.email}`)}>Resetear clave</Button>
                    <Button size="sm" variant="outline" onClick={() => setUser({ ...u, blocked: !u.blocked }, `${u.email} ${u.blocked ? "desbloqueado" : "bloqueado"}`)}>{u.blocked ? "Desbloquear" : "Bloquear"}</Button>
                    <Button size="icon" variant="ghost" title="Eliminar usuario" onClick={() => { setToDelete(u); setConfirmText(""); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell></TableRow>))}</TableBody></Table>
            {ulist.length === 0 && <p className="text-sm text-muted-foreground">No hay usuarios.</p>}
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar a {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Se borrarán su acceso al box, reservas y marcas. No se puede deshacer. Escribe <b>ELIMINAR</b> para confirmar.</AlertDialogDescription></AlertDialogHeader>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="ELIMINAR" />
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction disabled={confirmText !== "ELIMINAR"} onClick={() => { if (toDelete) deleteUser(toDelete); setToDelete(null); }}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
