import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BLOCKS, classDetailQuery, exercisesQuery, myRmsQuery, settingsQuery, type WodItem, type Phase } from "@/lib/data/box";
import { coachesQuery } from "@/lib/data/gym";
import { classState, STATE_LABEL, STATE_STYLE, INTENT_STYLE } from "@/lib/access/class-state";
import { useClassActions } from "@/lib/data/use-class-actions";
import { PersonAvatar } from "@/components/PersonAvatar";
import { INTENT_LABEL, confirmed, type Intent } from "@/lib/access/attendance";
import { describeLoad, recommendedKg } from "@/lib/training/weights";
import { isBoxStaff, useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/class/$classId")({
  head: pageHead("Clase y WOD", "Entreno del día con tus kilos según tu RM."),
  component: ClassPage,
  errorComponent: () => <div role="alert" className="p-6">No se pudo cargar la clase.</div>,
  notFoundComponent: () => <div className="p-6">Clase no encontrada.</div>,
});

function ClassPage() {
  const { classId } = Route.useParams();
  const { role, tenantId, user } = useSession();
  const staff = isBoxStaff(role);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(classDetailQuery(classId));
  const { data: exercises = [] } = useQuery(exercisesQuery(tenantId));
  const { data: rms = {} } = useQuery(myRmsQuery());
  const { data: settings } = useQuery(settingsQuery(tenantId));
  const { data: coaches = [] } = useQuery(coachesQuery(tenantId));
  const { book, leave, busy } = useClassActions();
  const refresh = () => { qc.invalidateQueries({ queryKey: ["class", classId] }); qc.invalidateQueries({ queryKey: ["classes"] }); };
  const cancel = useMutation({ mutationFn: async (s: string) => { const r = await supabase.from("classes").update({ status: s, cancelled_reason: s === "cancelled" ? "Cancelada por el box" : null }).eq("id", classId); if (r.error) throw r.error; }, onSuccess: refresh });
  const mark = useMutation({ mutationFn: async (v: { uid: string; attended: boolean }) => { const r = await supabase.from("class_enrollments").update({ attended: v.attended }).eq("class_id", classId).eq("user_id", v.uid); if (r.error) throw r.error; }, onSuccess: refresh });

  if (isLoading || !data) return <AppShell title="Clase"><p className="text-sm text-muted-foreground">Cargando…</p></AppShell>;
  const { cls, wod, attendees } = data;
  const me = attendees.find((a) => a.user_id === user?.id);
  const booked = attendees.filter((a) => a.status === "booked");
  const counts = { going: booked.filter((a) => a.intent === "going").length, maybe: booked.filter((a) => a.intent === "maybe").length, not_going: attendees.filter((a) => a.status === "declined").length, waitlist: attendees.filter((a) => a.status === "waitlist").length };
  const exById = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const phases = cls.phases ?? Object.entries(BLOCKS).map(([key, title]) => ({ key, title, alternatives: "" }));
  const blocks = [...phases, ...Array.from(new Set(wod.map(w => w.block))).filter(key => !phases.some(p => p.key === key)).map(key => ({ key, title: BLOCKS[key] ?? key, alternatives: "" }))].filter(p => staff || wod.some(w => w.block === p.key) || p.alternatives);
  const rounding = Number(settings?.rounding_kg ?? 2.5);

  return (
    <AppShell title={cls.title} action={<Button asChild size="sm" variant="ghost"><Link to="/calendar"><ArrowLeft className="mr-1 h-4 w-4" />Calendario</Link></Button>}>
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-display text-xl font-bold capitalize">{new Date(cls.starts_at).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
        <div className="my-3 flex items-center gap-3"><PersonAvatar name={cls.coach_name ?? "Sin coach"} url={coaches.find(p => p.user_id === cls.coach_id)?.avatar_url} className="h-10 w-10"/><div><p className="text-sm font-medium">{cls.coach_name ?? "Sin coach"}</p><p className="text-xs text-muted-foreground">Profesor</p></div><span className={cn("ml-auto rounded px-2 py-1 text-xs",STATE_STYLE[classState(cls)])}>{STATE_LABEL[classState(cls)]}</span></div>
        <p className="text-sm text-muted-foreground">{booked.length}/{cls.capacity} plazas · {confirmed(counts)}/{cls.min_attendees} confirmados mínimo · cancela {cls.cancel_hours_before} h antes si no se llega</p>
        {staff && <Select value={cls.coach_id ?? "none"} onValueChange={async id => { const coach = coaches.find(p => p.user_id === id); const r = await supabase.from("classes").update({coach_id:coach?.user_id ?? null,coach_name:coach?.full_name ?? null}).eq("id",cls.id); if(r.error) toast.error(r.error.message); else refresh(); }}><SelectTrigger className="mt-3"><SelectValue placeholder="Asignar profesor" /></SelectTrigger><SelectContent><SelectItem value="none">Sin profesor asignado</SelectItem>{coaches.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}</SelectContent></Select>}
        {cls.status === "cancelled" && <p className="mt-2 font-medium text-destructive">Clase cancelada. {cls.cancelled_reason}</p>}
        {cls.status !== "cancelled" && new Date(cls.starts_at) > new Date() && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(["going", "maybe", "not_going"] as Intent[]).map((i) => <Button key={i} size="sm" disabled={busy} variant="outline" aria-pressed={me?.intent === i} className={cn(INTENT_STYLE[i], me?.intent === i && "ring-1 ring-current")} onClick={() => book.mutate({ id: cls.id, intent: i })}>{INTENT_LABEL[i]}</Button>)}
          </div>)}
        {staff && <div className="mt-4 border-t border-border pt-4">{cls.status === "cancelled"
          ? <Button size="sm" variant="outline" onClick={() => cancel.mutate("scheduled")}>Reactivar clase</Button>
          : <Button size="sm" variant="destructive" onClick={() => confirm("¿Cancelar esta clase?") && cancel.mutate("cancelled")}>Cancelar clase</Button>}</div>}
      </section>

      <h2 className="mt-6 mb-3 font-semibold">WOD</h2>
      {wod.length === 0 && !staff && <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">El coach aún no ha publicado el entreno.</p>}
      <div className="space-y-4">{blocks.map((phase) => (
        <section key={phase.key} className="border-t border-border py-4">
          <h3 className="mb-2 font-semibold text-primary">{phase.title}</h3>
          {phase.alternatives && <p className="mb-3 border-l-2 border-warning pl-3 text-sm text-warning">Alternativas: {phase.alternatives}</p>}
          {staff && <PhaseEditor phase={phase} phases={phases} classId={cls.id} onDone={refresh} />}
          <ul className="space-y-2">{wod.filter((w) => w.block === phase.key).map((w) => {
            const ex = w.exercise_id ? exById[w.exercise_id] : undefined;
            const rm = ex?.rm_lift ? rms[ex.rm_lift] : undefined;
            const kg = recommendedKg(rm, w.percent_rm, rounding);
            return (
              <li key={w.id} className="flex items-start justify-between gap-3">
                <div><p className="font-medium">{ex?.name ?? w.label}</p><p className="text-sm text-muted-foreground">{w.sets ? `${w.sets} series` : ""}{w.reps ? ` · ${w.reps} repeticiones` : ""}{w.percent_rm ? ` · ${w.percent_rm}% RM` : ""}{w.notes ? ` · ${w.notes}` : ""}</p>{w.alternatives && <p className="mt-1 text-sm text-warning">Alternativa: {w.alternatives}</p>}</div>
                {w.percent_rm && ex?.rm_lift ? (kg !== null
                  ? <span className="shrink-0 rounded-md bg-primary px-2.5 py-1 font-display text-lg font-bold text-primary-foreground">{kg.toLocaleString("es-ES")} kg</span>
                  : <Link to="/profile" className="shrink-0 text-xs text-warning underline">Añade tu RM de {ex.rm_lift}</Link>) : null}
                {staff && <WodDelete id={w.id} onDone={refresh} />}
              </li>);
          })}</ul>
        </section>))}</div>
      {staff && tenantId && <><NewPhase phases={phases} classId={cls.id} onDone={refresh} /><WodEditor phases={phases} classId={cls.id} tenantId={tenantId} exercises={exercises} nextPos={wod.length} onDone={refresh} /></>}

      <h2 className="mt-6 mb-3 font-semibold">Asistentes ({booked.length})</h2>
      <div className="space-y-1.5">{attendees.map((a) => (
        <div key={a.user_id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
          <span className="flex items-center gap-3"><PersonAvatar name={a.full_name} url={a.avatar_url} />{a.full_name}{a.user_id === user?.id && " (tú)"}</span>
          <span className="flex items-center gap-2">
            <Badge variant="outline" className={INTENT_STYLE[a.intent]}>{a.status === "waitlist" ? "En espera" : INTENT_LABEL[a.intent]}</Badge>
            {staff && <><button title="Vino" onClick={() => mark.mutate({ uid: a.user_id, attended: true })} className={cn("rounded p-1", a.attended === true ? "bg-primary text-primary-foreground" : "text-muted-foreground")}><Check className="h-4 w-4" /></button>
              <button title="No vino" onClick={() => mark.mutate({ uid: a.user_id, attended: false })} className={cn("rounded p-1", a.attended === false ? "bg-destructive text-destructive-foreground" : "text-muted-foreground")}><X className="h-4 w-4" /></button></>}
          </span>
        </div>))}
        {attendees.length === 0 && <p className="text-sm text-muted-foreground">Nadie apuntado todavía.</p>}
      </div>
    </AppShell>
  );
}

function WodDelete({ id, onDone }: { id: string; onDone: () => void }) {
  return <button aria-label="Quitar" className="text-muted-foreground hover:text-destructive" onClick={async () => { await supabase.from("wod_items").delete().eq("id", id); onDone(); }}><Trash2 className="h-4 w-4" /></button>;
}

function WodEditor({ classId, tenantId, exercises, nextPos, onDone, phases }: { classId: string; tenantId: string; exercises: { id: string; name: string; uses_load: boolean }[]; nextPos: number; onDone: () => void; phases: Phase[] }) {
  const [f, setF] = useState<Partial<WodItem>>({ block: "strength", sets: 5, reps: "5", percent_rm: 75 });
  const add = useMutation({
    mutationFn: async () => {
      if (!f.exercise_id && !f.label) throw new Error("Elige un ejercicio o escribe uno");
      const r = await supabase.from("wod_items").insert({ tenant_id: tenantId, class_id: classId, block: f.block ?? "strength", position: nextPos, exercise_id: f.exercise_id ?? null, label: f.label ?? null, sets: f.sets ?? null, reps: f.reps ?? null, percent_rm: f.percent_rm ?? null, notes: f.notes ?? null, alternatives: f.alternatives ?? null });
      if (r.error) throw r.error;
    },
    onSuccess: () => { toast.success("Añadido al WOD"); setF({ ...f, exercise_id: null, label: null, notes: null }); onDone(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });
  const num = (v: string) => (v === "" ? null : Number(v.replace(",", ".")));
  return (
    <section className="mt-4 rounded-xl border border-dashed border-primary/50 p-4">
      <p className="mb-3 text-sm font-semibold">Añadir al WOD</p>
      <div className="grid gap-2 sm:grid-cols-6">
        <Select value={f.block ?? "strength"} onValueChange={(v) => setF({ ...f, block: v })}><SelectTrigger className="sm:col-span-2"><SelectValue /></SelectTrigger><SelectContent>{phases.map(p => <SelectItem key={p.key} value={p.key}>{p.title}</SelectItem>)}</SelectContent></Select>
        <Select value={f.exercise_id ?? "custom"} onValueChange={(v) => setF({ ...f, exercise_id: v === "custom" ? null : v })}><SelectTrigger className="sm:col-span-4"><SelectValue placeholder="Ejercicio" /></SelectTrigger>
          <SelectContent><SelectItem value="custom">Otro (texto libre)</SelectItem>{exercises.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
        {!f.exercise_id && <Input className="sm:col-span-6" placeholder="Ej.: AMRAP 12' de 10 burpees + 200 m remo" value={f.label ?? ""} onChange={(e) => setF({ ...f, label: e.target.value })} />}
        <label className="text-xs text-muted-foreground">Series<Input type="number" min="1" value={f.sets ?? ""} onChange={(e) => setF({ ...f, sets: num(e.target.value) })} /></label>
        <label className="text-xs text-muted-foreground">Repeticiones por serie<Input value={f.reps ?? ""} onChange={(e) => setF({ ...f, reps: e.target.value || null })} /></label>
        <label className="text-xs text-muted-foreground">Porcentaje del RM<Input inputMode="decimal" value={f.percent_rm ?? ""} onChange={(e) => setF({ ...f, percent_rm: num(e.target.value) })} /></label>
        <label className="text-xs text-muted-foreground sm:col-span-3">Notas / duración / descanso<Input value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value || null })} /></label>
        <label className="text-xs text-muted-foreground sm:col-span-6">Alternativa del ejercicio<Input value={f.alternatives ?? ""} onChange={(e) => setF({ ...f, alternatives: e.target.value || null })} /></label>
      </div>
      <Button className="mt-3" size="sm" disabled={add.isPending} onClick={() => add.mutate()}><Plus className="mr-1 h-4 w-4" />Añadir</Button>
    </section>
  );
}

async function savePhases(classId: string, phases: Phase[], onDone: () => void) {
  const r = await supabase.from("classes").update({phases: phases.map(p => ({key:p.key,title:p.title,alternatives:p.alternatives}))}).eq("id",classId);
  if(r.error) toast.error(r.error.message); else {toast.success("Fases guardadas");onDone();}
}
function NewPhase({phases,classId,onDone}:{phases:Phase[];classId:string;onDone:()=>void}) {
  const [name,setName] = useState("");
  return <div className="my-4 flex gap-2"><Input aria-label="Nombre de la nueva fase" placeholder="Nueva fase: movilidad, técnica…" value={name} onChange={e=>setName(e.target.value)}/><Button variant="outline" disabled={!name.trim()} onClick={async()=>{await savePhases(classId,[...phases,{key:crypto.randomUUID(),title:name.trim(),alternatives:""}],onDone);setName("");}}><Plus/>Fase</Button></div>;
}
function PhaseEditor({phase,phases,classId,onDone}:{phase:Phase;phases:Phase[];classId:string;onDone:()=>void}) {
 const [title,setTitle]=useState(phase.title);const [alternatives,setAlternatives]=useState(phase.alternatives);
 return <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_2fr_auto]"><Input aria-label="Nombre de fase" value={title} onChange={e=>setTitle(e.target.value)}/><Input aria-label="Alternativas de fase" placeholder="Alternativas / adaptación de esta fase" value={alternatives} onChange={e=>setAlternatives(e.target.value)}/><Button variant="outline" size="sm" disabled={!title.trim()} onClick={()=>savePhases(classId,phases.map(p=>p.key===phase.key?{...p,title:title.trim(),alternatives}:p),onDone)}>Guardar fase</Button></div>;
}
