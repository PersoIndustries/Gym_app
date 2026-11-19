import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { EMPTY_COUNTS, WEEKDAYS, classesQuery, exercisesQuery, settingsQuery, templatesQuery, weekRange } from "@/lib/data/box";
import { confirmed, occupied } from "@/lib/access/attendance";
import { MAIN_LIFTS } from "@/lib/data/mock";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";
import { GymCalendar } from "@/components/GymCalendar";
import { coachesQuery, activitiesQuery } from "@/lib/data/gym";

export const Route = createFileRoute("/_authenticated/admin/classes")({ head: pageHead("Clases", "Horario, WODs, ejercicios y reglas del box."), component: AdminClasses });

const err = (e: unknown) => toast.error(e instanceof Error ? e.message : "Error");
const ok = <T,>(r: { error: unknown; data?: unknown }) => { if (r.error) throw r.error; return r.data as T; };

function AdminClasses() {
  const { tenantId } = useSession();
  if (!tenantId) return <AppShell title="Clases"><p className="text-sm text-muted-foreground">No tienes box activo.</p></AppShell>;
  return (
    <AppShell title="Clases">
      <Tabs defaultValue="week">
        <TabsList className="w-full justify-start overflow-x-auto"><TabsTrigger value="week">Semana</TabsTrigger><TabsTrigger value="schedule">Horario fijo</TabsTrigger><TabsTrigger value="exercises">Ejercicios</TabsTrigger><TabsTrigger value="rules">Reglas</TabsTrigger></TabsList>
        <TabsContent value="week"><Week tenantId={tenantId} /></TabsContent>
        <TabsContent value="schedule"><Schedule tenantId={tenantId} /></TabsContent>
        <TabsContent value="exercises"><Exercises tenantId={tenantId} /></TabsContent>
        <TabsContent value="rules"><Rules tenantId={tenantId} /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Week({ tenantId }: { tenantId: string }) {
  const [week, setWeek] = useState(0);
  const qc = useQueryClient();
  const { data } = useQuery(classesQuery(tenantId, week));
  const gen = useMutation({
    mutationFn: async () => ok<number>(await supabase.rpc("generate_week_classes", { _tenant: tenantId, _week_start: weekRange(week).from.toLocaleDateString("sv-SE") })),
    onSuccess: (n) => { toast.success(n ? `${n} clases creadas` : "La semana ya estaba creada"); qc.invalidateQueries({ queryKey: ["classes"] }); }, onError: err,
  });
  const classes = data?.classes ?? [];
  const total = classes.reduce((a, c) => a + occupied(data?.counts[c.id] ?? EMPTY_COUNTS), 0);
  const cap = classes.filter((c) => c.status !== "cancelled").reduce((a, c) => a + c.capacity, 0);
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => gen.mutate()} disabled={gen.isPending}>Crear semana del {weekRange(week).from.toLocaleDateString("es-ES",{day:"numeric",month:"short"})}</Button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs text-muted-foreground">Clases</p><p className="font-display text-xl font-bold">{classes.length}</p></div>
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs text-muted-foreground">Canceladas</p><p className="font-display text-xl font-bold">{classes.filter((c) => c.status === "cancelled").length}</p></div>
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs text-muted-foreground">Ocupación</p><p className="font-display text-xl font-bold">{cap ? Math.round((total / cap) * 100) : 0}%</p></div>
      </div>
      {classes.length === 0 && <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">No hay clases esta semana. Pulsa "Crear semana desde el horario".</p>}
      <GymCalendar staff onWeekChange={setWeek} />
    </div>
  );
}

function Schedule({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery(templatesQuery(tenantId));
  const { data: coaches = [] } = useQuery(coachesQuery(tenantId));
  const { data: activities = [] } = useQuery(activitiesQuery(tenantId));
  const blank = { title: "WOD", weekday: 1, start_time: "18:00", duration_min: 60, coach_name: "", coach_id: null as string | null, activity_type_id: null as string | null, capacity: 16, min_attendees: 3, cancel_hours_before: 4 };
  const [f, setF] = useState(blank);
  const inv = () => qc.invalidateQueries({ queryKey: ["templates"] });
  const add = useMutation({ mutationFn: async () => ok(await supabase.from("class_templates").insert({ ...f, tenant_id: tenantId, coach_name: f.coach_name || null })), onSuccess: () => { toast.success("Clase añadida al horario"); inv(); }, onError: err });
  const upd = useMutation({ mutationFn: async (v: { id: string; patch: { active: boolean } }) => ok(await supabase.from("class_templates").update(v.patch).eq("id", v.id)), onSuccess: inv, onError: err });
  const del = useMutation({ mutationFn: async (id: string) => ok(await supabase.from("class_templates").delete().eq("id", id)), onSuccess: inv, onError: err });
  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold">Nueva clase semanal</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Nombre" />
          <Select value={String(f.weekday)} onValueChange={(v) => setF({ ...f, weekday: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5, 6, 0].map((d) => <SelectItem key={d} value={String(d)}>{WEEKDAYS[d]}</SelectItem>)}</SelectContent></Select>
          <Input type="time" value={f.start_time} onChange={(e) => setF({ ...f, start_time: e.target.value })} />
          <Select value={f.coach_id ?? "none"} onValueChange={id=>{const c=coaches.find(p=>p.user_id===id);setF({...f,coach_id:c?.user_id ?? null,coach_name:c?.full_name ?? ""});}}><SelectTrigger><SelectValue placeholder="Profesor" /></SelectTrigger><SelectContent><SelectItem value="none">Sin profesor</SelectItem>{coaches.map(c=><SelectItem key={c.user_id} value={c.user_id}>{c.full_name}</SelectItem>)}</SelectContent></Select>
          <label className="text-xs text-muted-foreground">Actividad<Select value={f.activity_type_id ?? "none"} onValueChange={v=>setF({...f,activity_type_id:v==="none"?null:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Sin actividad</SelectItem>{activities.map(a=><SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></label>
          <label className="text-xs text-muted-foreground">Minutos<Input type="number" value={f.duration_min} onChange={(e) => setF({ ...f, duration_min: Number(e.target.value) })} /></label>
          <label className="text-xs text-muted-foreground">Aforo máx.<Input type="number" value={f.capacity} onChange={(e) => setF({ ...f, capacity: Number(e.target.value) })} /></label>
          <label className="text-xs text-muted-foreground">Mínimo<Input type="number" value={f.min_attendees} onChange={(e) => setF({ ...f, min_attendees: Number(e.target.value) })} /></label>
          <label className="text-xs text-muted-foreground">Cancelar (h antes)<Input type="number" value={f.cancel_hours_before} onChange={(e) => setF({ ...f, cancel_hours_before: Number(e.target.value) })} /></label>
        </div>
        <Button className="mt-3" size="sm" onClick={() => add.mutate()}>Añadir al horario</Button>
      </section>
      {[1, 2, 3, 4, 5, 6, 0].map((d) => { const rows = data.filter((t) => t.weekday === d); if (!rows.length) return null; return (
        <section key={d}><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{WEEKDAYS[d]}</h3>
          <div className="space-y-1.5">{rows.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <span className="w-12 font-display font-bold">{t.start_time.slice(0, 5)}</span>
              <span className="min-w-0 flex-1 truncate">{t.title} · {t.coach_name ?? "—"} <span className="text-xs text-muted-foreground">({t.min_attendees}-{t.capacity}, {t.cancel_hours_before} h)</span></span>
              <label className="flex items-center gap-2 text-xs"><Switch checked={t.active} onCheckedChange={(v) => upd.mutate({ id: t.id, patch: { active: v } })} aria-label={`Generar ${t.title} cada semana`} />{t.active ? "Se genera cada semana" : "Pausada"}</label>
              <button aria-label="Borrar" onClick={() => confirm("¿Quitar del horario?") && del.mutate(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>))}</div></section>); })}
    </div>
  );
}

function Exercises({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery(exercisesQuery(tenantId));
  const [f, setF] = useState({ name: "", category: "weightlifting", uses_load: true, rm_lift: "none" });
  const [q, setQ] = useState("");
  const inv = () => qc.invalidateQueries({ queryKey: ["exercises"] });
  const add = useMutation({ mutationFn: async () => { if (!f.name.trim()) throw new Error("Pon un nombre"); return ok(await supabase.from("exercises").insert({ tenant_id: tenantId, name: f.name.trim(), category: f.category, uses_load: f.uses_load, rm_lift: f.rm_lift === "none" ? null : f.rm_lift })); }, onSuccess: () => { setF({ ...f, name: "" }); inv(); }, onError: err });
  const del = useMutation({ mutationFn: async (id: string) => ok(await supabase.from("exercises").delete().eq("id", id)), onSuccess: inv, onError: err });
  const CATS: Record<string, string> = { weightlifting: "Halterofilia/fuerza", gymnastics: "Gimnásticos", metcon: "Metcon", monostructural: "Cardio" };
  return (
    <div className="mt-4 space-y-3">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-2 sm:grid-cols-4">
          <Input placeholder="Nombre del ejercicio" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CATS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select>
          <Select value={f.rm_lift} onValueChange={(v) => setF({ ...f, rm_lift: v })}><SelectTrigger><SelectValue placeholder="Calcula con el RM de…" /></SelectTrigger><SelectContent><SelectItem value="none">Sin cálculo por RM</SelectItem>{MAIN_LIFTS.map((l) => <SelectItem key={l} value={l}>RM de {l}</SelectItem>)}</SelectContent></Select>
          <label className="flex items-center gap-2 text-sm"><Switch checked={f.uses_load} onCheckedChange={(v) => setF({ ...f, uses_load: v })} />Usa carga</label>
        </div>
        <Button className="mt-3" size="sm" onClick={() => add.mutate()}>Añadir ejercicio</Button>
      </section>
      <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      {data.filter((e) => e.name.toLowerCase().includes(q.toLowerCase())).map((e) => (
        <div key={e.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
          <div><p className="font-medium">{e.name}</p><p className="text-xs text-muted-foreground">{CATS[e.category] ?? e.category}{e.rm_lift ? ` · kilos según RM de ${e.rm_lift}` : ""}</p></div>
          <button aria-label="Borrar" onClick={() => confirm(`¿Borrar ${e.name}?`) && del.mutate(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>))}
    </div>
  );
}

function Rules({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery(settingsQuery(tenantId));
  const [f, setF] = useState<{ rounding_kg: number; default_cancel_hours: number; default_min_attendees: number } | null>(null);
  const v = f ?? { rounding_kg: Number(data?.rounding_kg ?? 2.5), default_cancel_hours: data?.default_cancel_hours ?? 4, default_min_attendees: data?.default_min_attendees ?? 3 };
  const save = useMutation({ mutationFn: async () => ok(await supabase.from("tenant_settings").upsert({ tenant_id: tenantId, ...v })), onSuccess: () => { toast.success("Reglas guardadas"); qc.invalidateQueries({ queryKey: ["settings"] }); }, onError: err });
  return (
    <section className="mt-4 space-y-3 rounded-xl border border-border bg-card p-4">
      <div><Label>Redondeo de kilos (disco más pequeño)</Label><Input inputMode="decimal" value={v.rounding_kg} onChange={(e) => setF({ ...v, rounding_kg: Number(e.target.value.replace(",", ".")) || 0 })} /></div>
      <div><Label>Horas antes para cancelar si no se llega al mínimo</Label><Input type="number" value={v.default_cancel_hours} onChange={(e) => setF({ ...v, default_cancel_hours: Number(e.target.value) })} /></div>
      <div><Label>Mínimo de confirmados por defecto</Label><Input type="number" value={v.default_min_attendees} onChange={(e) => setF({ ...v, default_min_attendees: Number(e.target.value) })} /></div>
      <p className="text-xs text-muted-foreground">Mínimo de asistentes confirmados: solo «Voy».</p>
      <Button size="sm" onClick={() => save.mutate()}>Guardar</Button>
    </section>
  );
}
