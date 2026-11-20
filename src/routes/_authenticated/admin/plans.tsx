import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoHelp } from "@/components/InfoHelp";
import { QuotaAccessCodes } from "@/components/QuotaAccessCodes";
import { activitiesQuery, plansQuery, savePlan, deletePlan } from "@/lib/data/gym";
import { parsePlanValues } from "@/lib/access/plan-values";
import { useSession } from "@/lib/auth/session";
import { WEEKDAYS } from "@/lib/data/box";
import { pageHead } from "@/lib/seo";
import type { FacilityWindow } from "@/lib/access/membership";

export const Route = createFileRoute("/_authenticated/admin/plans")({ head: pageHead("Cuotas y códigos", "Cuotas de BoxFlow: acceso, reservas, clases y códigos de entrada del gimnasio."), component: Plans });
const days = [1, 2, 3, 4, 5, 6, 0];
const blank = { name: "", price: "0", weekdays: [1, 2, 3, 4, 5], activities: [] as string[], limit: "", classes: true, booking: true, trial: false, trialLimit: "", windows: [] as FacilityWindow[] };
function Plans() {
  const { tenantId, role } = useSession(); const qc = useQueryClient();
  const { data: plans = [], isLoading, isError } = useQuery(plansQuery(tenantId)); const { data: activities = [] } = useQuery(activitiesQuery(tenantId));
  const [open, setOpen] = useState(false); const [id, setId] = useState<string | null>(null); const [f, setF] = useState(blank);
  const inv = () => { qc.invalidateQueries({ queryKey: ["plans"] }); qc.invalidateQueries({ queryKey: ["my-plan"] }); };
  const save = useMutation({ mutationFn: async () => {
    if (!tenantId || role !== "admin") throw new Error("Solo el admin puede editar cuotas");
    if (!f.name.trim()) throw new Error("Introduce un nombre para la cuota");
    if (f.trial && !f.trialLimit.trim()) throw new Error("Introduce el total de clases de prueba");
    const values = parsePlanValues(f.price, f.limit, f.trial ? f.trialLimit : "");
    if (f.windows.some(w => !w.from || !w.to || w.from >= w.to)) throw new Error("La hora final debe ser posterior al inicio");
    await savePlan(tenantId, id, { ...values, name: f.name.trim(), classes_enabled: f.classes, facility_booking_enabled: f.booking, allowed_weekdays: f.weekdays, allowed_activity_type_ids: f.activities, facility_windows: f.windows.map(w => ({ ...w })) });
  }, onSuccess: () => { setOpen(false); inv(); toast.success("Cuota guardada"); }, onError: e => toast.error(e && typeof e === "object" && "message" in e ? String(e.message) : "No se pudo guardar") });
  const remove = useMutation({ mutationFn: deletePlan, onSuccess: inv, onError: () => toast.error("No se puede borrar una cuota asignada a socios") });
  return <AppShell title="Cuotas" action={role === "admin" ? <Button size="sm" onClick={() => { setId(null); setF(blank); setOpen(true); }}><Plus />Nueva cuota</Button> : undefined}>
    <Tabs defaultValue="plans"><TabsList className="mb-5"><TabsTrigger value="plans">Cuotas</TabsTrigger>{role === "admin" && <TabsTrigger value="codes">Códigos de acceso</TabsTrigger>}</TabsList>
      <TabsContent value="plans">
        {isLoading && <p className="text-muted-foreground">Cargando cuotas…</p>}{isError && <p role="alert" className="text-destructive">No se pudieron cargar las cuotas.</p>}{!isLoading && !plans.length && <p className="py-8 text-muted-foreground">Aún no hay cuotas configuradas.</p>}
        <div className="grid gap-3 md:grid-cols-2">{plans.map(p => <article key={p.id} className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-2"><h2 className="min-w-0 break-words text-xl font-bold">{p.name}</h2>{role === "admin" && <div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" aria-label={`Editar ${p.name}`} onClick={() => { setId(p.id); setF({ name: p.name, price: String(p.price_cents / 100), weekdays: p.allowed_weekdays, activities: p.allowed_activity_type_ids, limit: p.weekly_class_limit === null ? "" : String(p.weekly_class_limit), classes: p.classes_enabled, booking: p.facility_booking_enabled, trial: p.trial_class_limit !== null, trialLimit: p.trial_class_limit === null ? "" : String(p.trial_class_limit), windows: Array.isArray(p.facility_windows) ? p.facility_windows as unknown as FacilityWindow[] : [] }); setOpen(true); }}><Pencil /></Button><Button size="icon" variant="ghost" aria-label={`Borrar ${p.name}`} onClick={() => confirm("¿Borrar cuota? Si tiene socios asignados no se podrá borrar.") && remove.mutate(p.id)}><Trash2 /></Button></div>}</div>
          <p className="mt-1 text-2xl text-primary">{(p.price_cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}<span className="text-sm text-muted-foreground"> / mes</span></p>
          <div className="mt-4 border-t border-border pt-3"><h3 className="text-xs font-semibold text-muted-foreground">CLASES</h3><p className="mt-2 text-sm">{!p.classes_enabled ? "No permitidas" : p.weekly_class_limit === 0 ? "0 clases por semana" : p.weekly_class_limit === null ? "Sin límite semanal" : `${p.weekly_class_limit} clases / semana`}</p>{p.classes_enabled && <><p className="mt-1 text-xs text-muted-foreground">{p.allowed_weekdays.length ? days.filter(d => p.allowed_weekdays.includes(d)).map(d => WEEKDAYS[d]).join(" · ") : "Sin días de clases"}</p><p className="mt-1 text-xs text-muted-foreground">{p.allowed_activity_type_ids.length ? p.allowed_activity_type_ids.map(a => activities.find(x => x.id === a)?.name ?? "Actividad").join(", ") : "Todas las actividades"}</p>{p.trial_class_limit !== null && <p className="mt-2 text-sm text-primary">Bono de prueba: {p.trial_class_limit} clases en total</p>}</>}</div>
          <div className="mt-4 border-t border-border pt-3"><h3 className="text-xs font-semibold text-muted-foreground">ACCESO A INSTALACIONES</h3>{Array.isArray(p.facility_windows) && p.facility_windows.length ? (p.facility_windows as unknown as FacilityWindow[]).map((w, i) => <p key={i} className="mt-1 text-sm">{WEEKDAYS[w.weekday]} · {w.from}–{w.to}</p>) : <p className="mt-1 text-sm text-muted-foreground">Sin acceso a instalaciones</p>}<p className="mt-2 text-xs text-muted-foreground">{p.facility_booking_enabled ? "Reservas permitidas dentro de las franjas" : "Reservas no permitidas"}</p></div>
        </article>)}</div>
      </TabsContent><TabsContent value="codes"><QuotaAccessCodes /></TabsContent>
    </Tabs>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{id ? "Editar cuota" : "Nueva cuota"}</DialogTitle></DialogHeader><div className="space-y-5">
      <label className="block text-sm">Nombre<Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <div><div className="flex items-center gap-1"><span className="text-sm">Precio mensual (€)</span><InfoHelp label="Precio mensual">Puede ser 0 € para una cuota gratuita o de prueba. Este importe define la cuota; no activa un cobro automático.</InfoHelp></div><Input aria-label="Precio mensual (€)" type="number" min="0" step="0.01" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></div>
      <section className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Clases</h3><InfoHelp label="Clases y acceso">Los días de clases son independientes de los días de acceso a instalaciones. Desactivar clases impide apuntarse a clases y actividades dirigidas.</InfoHelp></div>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.classes} onCheckedChange={v => setF({ ...f, classes: v === true })} />Permitir participar en clases</label>
        {f.classes && <><div className="flex items-center gap-1"><span className="text-sm">Máximo de clases por semana</span><InfoHelp label="Límite semanal">Vacío significa sin límite; 0 no permite ninguna clase. Voy, Dudas y la lista de espera reservan una clase del límite. No voy y las clases canceladas no cuentan.</InfoHelp></div><Input aria-label="Máximo de clases por semana" type="number" min="0" step="1" placeholder="Sin límite" value={f.limit} onChange={e => setF({ ...f, limit: e.target.value })} />
          <h4 className="text-sm font-medium">Días de clases</h4><div className="flex flex-wrap gap-x-4 gap-y-2">{days.map(d => <label key={d} className="flex items-center gap-2 text-sm"><Checkbox checked={f.weekdays.includes(d)} onCheckedChange={v => setF({ ...f, weekdays: v === true ? [...f.weekdays, d] : f.weekdays.filter(x => x !== d) })} />{WEEKDAYS[d]}</label>)}</div>
          <div className="flex items-center gap-1"><h4 className="text-sm font-medium">Actividades incluidas</h4><InfoHelp label="Actividades incluidas">Sin selección se incluyen todas las actividades. Marca actividades concretas para restringir la cuota.</InfoHelp></div><div className="flex flex-wrap gap-3">{activities.map(a => <label key={a.id} className="flex items-center gap-2 text-sm"><Checkbox checked={f.activities.includes(a.id)} onCheckedChange={v => setF({ ...f, activities: v === true ? [...f.activities, a.id] : f.activities.filter(x => x !== a.id) })} />{a.name}</label>)}</div>
          <div className="flex items-center gap-1"><label className="flex items-center gap-2 text-sm"><Checkbox checked={f.trial} onCheckedChange={v => setF({ ...f, trial: v === true })} />Bono de clases de prueba</label><InfoHelp label="Bono de prueba">Es un máximo total, no se renueva cada semana. Cuenta las clases desde la fecha de inicio de la cuota, incluidas las ya realizadas y las reservas futuras. No voy y las clases canceladas liberan el bono. El límite semanal también se aplica.</InfoHelp></div>{f.trial && <label className="block text-sm">Total de clases de prueba<Input type="number" min="0" step="1" value={f.trialLimit} onChange={e => setF({ ...f, trialLimit: e.target.value })} /></label>}
        </>}
      </section>
      <section className="space-y-3 border-t border-border pt-4"><div className="flex items-center justify-between"><h3 className="font-semibold">Acceso a instalaciones</h3><InfoHelp label="Acceso a instalaciones">Cada franja define un día y unas horas para acceder al gimnasio. Por ejemplo, sábado de 08:00 a 12:00, sin incluir clases del sábado. Sin franjas no hay acceso a instalaciones. No controla puertas ni tornos físicos.</InfoHelp></div>
        <div className="flex items-center gap-1"><label className="flex items-center gap-2 text-sm"><Checkbox checked={f.booking} onCheckedChange={v => setF({ ...f, booking: v === true })} />Permitir reservar instalaciones</label><InfoHelp label="Permiso de reserva">Acceder no equivale a reservar. Esta opción permite solicitar un espacio únicamente dentro de las franjas de acceso, si el gimnasio tiene activadas las reservas y hay disponibilidad.</InfoHelp></div>
        <div className="flex items-center justify-between"><h4 className="text-sm font-medium">Días y franjas de acceso</h4><Button size="sm" variant="outline" onClick={() => setF({ ...f, windows: [...f.windows, { weekday: 6, from: "08:00", to: "12:00" }] })}><Plus />Franja</Button></div>
        {f.windows.map((w, i) => <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2"><label className="col-span-3 text-xs">Día<Select value={String(w.weekday)} onValueChange={v => setF({ ...f, windows: f.windows.map((x, j) => j === i ? { ...x, weekday: Number(v) } : x) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{days.map(d => <SelectItem key={d} value={String(d)}>{WEEKDAYS[d]}</SelectItem>)}</SelectContent></Select></label><label className="min-w-0 text-xs">Desde<Input className="min-w-0" type="time" value={w.from} onChange={e => setF({ ...f, windows: f.windows.map((x, j) => j === i ? { ...x, from: e.target.value } : x) })} /></label><label className="min-w-0 text-xs">Hasta<Input className="min-w-0" type="time" value={w.to} onChange={e => setF({ ...f, windows: f.windows.map((x, j) => j === i ? { ...x, to: e.target.value } : x) })} /></label><Button size="icon" variant="ghost" aria-label="Quitar franja" onClick={() => setF({ ...f, windows: f.windows.filter((_, j) => j !== i) })}><Trash2 /></Button></div>)}
      </section>
    </div><DialogFooter><Button disabled={save.isPending} onClick={() => save.mutate()}>Guardar cuota</Button></DialogFooter></DialogContent></Dialog>
  </AppShell>;
}
