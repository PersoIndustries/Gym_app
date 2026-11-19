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
import { BLOCKS, classDetailQuery, exercisesQuery, myRmsQuery, settingsQuery, type WodItem } from "@/lib/data/box";
import { useClassActions } from "@/lib/data/use-class-actions";
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
  const { book, leave, busy } = useClassActions();
  const refresh = () => { qc.invalidateQueries({ queryKey: ["class", classId] }); qc.invalidateQueries({ queryKey: ["classes"] }); };
  const cancel = useMutation({ mutationFn: async (s: string) => { const r = await supabase.from("classes").update({ status: s, cancelled_reason: s === "cancelled" ? "Cancelada por el box" : null }).eq("id", classId); if (r.error) throw r.error; }, onSuccess: refresh });
  const mark = useMutation({ mutationFn: async (v: { uid: string; attended: boolean }) => { const r = await supabase.from("class_enrollments").update({ attended: v.attended }).eq("class_id", classId).eq("user_id", v.uid); if (r.error) throw r.error; }, onSuccess: refresh });

  if (isLoading || !data) return <AppShell title="Clase"><p className="text-sm text-muted-foreground">Cargando…</p></AppShell>;
  const { cls, wod, attendees } = data;
  const me = attendees.find((a) => a.user_id === user?.id);
  const booked = attendees.filter((a) => a.status === "booked");
  const counts = { sure: booked.filter((a) => a.intent === "sure").length, going: booked.filter((a) => a.intent === "going").length, maybe: booked.filter((a) => a.intent === "maybe").length, waitlist: attendees.length - booked.length };
  const exById = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const blocks = Object.keys(BLOCKS).filter((b) => wod.some((w) => w.block === b));
  const rounding = Number(settings?.rounding_kg ?? 2.5);

  return (
    <AppShell title={cls.title} action={<Button asChild size="sm" variant="ghost"><Link to="/calendar"><ArrowLeft className="mr-1 h-4 w-4" />Calendario</Link></Button>}>
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-display text-xl font-bold capitalize">{new Date(cls.starts_at).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
        <p className="text-sm text-muted-foreground">{cls.coach_name ?? "Sin coach"} · {booked.length}/{cls.capacity} plazas · {confirmed(counts)}/{cls.min_attendees} confirmados mínimo · cancela {cls.cancel_hours_before} h antes si no se llega</p>
        {cls.status === "cancelled" && <p className="mt-2 font-medium text-destructive">Clase cancelada. {cls.cancelled_reason}</p>}
        {cls.status !== "cancelled" && new Date(cls.starts_at) > new Date() && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(["sure", "going", "maybe"] as Intent[]).map((i) => <Button key={i} size="sm" disabled={busy} variant={me?.intent === i ? "default" : "secondary"} onClick={() => book.mutate({ id: cls.id, intent: i })}>{INTENT_LABEL[i]}</Button>)}
            {me && <Button size="sm" variant="ghost" disabled={busy} onClick={() => leave.mutate(cls.id)}>No voy</Button>}
          </div>)}
        {staff && <div className="mt-4 border-t border-border pt-4">{cls.status === "cancelled"
          ? <Button size="sm" variant="outline" onClick={() => cancel.mutate("scheduled")}>Reactivar clase</Button>
          : <Button size="sm" variant="destructive" onClick={() => confirm("¿Cancelar esta clase?") && cancel.mutate("cancelled")}>Cancelar clase</Button>}</div>}
      </section>

      <h2 className="mt-6 mb-3 font-semibold">WOD</h2>
      {wod.length === 0 && !staff && <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">El coach aún no ha publicado el entreno.</p>}
      <div className="space-y-4">{blocks.map((b) => (
        <section key={b} className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{BLOCKS[b]}</h3>
          <ul className="space-y-2">{wod.filter((w) => w.block === b).map((w) => {
            const ex = w.exercise_id ? exById[w.exercise_id] : undefined;
            const rm = ex?.rm_lift ? rms[ex.rm_lift] : undefined;
            const kg = recommendedKg(rm, w.percent_rm, rounding);
            return (
              <li key={w.id} className="flex items-start justify-between gap-3">
                <div><p className="font-medium">{ex?.name ?? w.label}</p><p className="text-sm text-muted-foreground">{describeLoad(w.sets, w.reps, w.percent_rm, null)}{w.notes ? ` · ${w.notes}` : ""}</p></div>
                {w.percent_rm && ex?.rm_lift ? (kg !== null
                  ? <span className="shrink-0 rounded-md bg-primary px-2.5 py-1 font-display text-lg font-bold text-primary-foreground">{kg.toLocaleString("es-ES")} kg</span>
                  : <Link to="/profile" className="shrink-0 text-xs text-warning underline">Añade tu RM de {ex.rm_lift}</Link>) : null}
                {staff && <WodDelete id={w.id} onDone={refresh} />}
              </li>);
          })}</ul>
        </section>))}</div>
      {staff && tenantId && <WodEditor classId={cls.id} tenantId={tenantId} exercises={exercises} nextPos={wod.length} onDone={refresh} />}

      <h2 className="mt-6 mb-3 font-semibold">Asistentes ({booked.length})</h2>
      <div className="space-y-1.5">{attendees.map((a) => (
        <div key={a.user_id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
          <span>{a.full_name}{a.user_id === user?.id && " (tú)"}</span>
          <span className="flex items-center gap-2">
            <Badge variant={a.status === "waitlist" ? "outline" : a.intent === "maybe" ? "secondary" : "default"}>{a.status === "waitlist" ? "En espera" : INTENT_LABEL[a.intent]}</Badge>
            {staff && <><button title="Vino" onClick={() => mark.mutate({ uid: a.user_id, attended: true })} className={cn("rounded p-1", a.attended === true ? "bg-primary text-primary-foreground" : "text-muted-foreground")}><Check className="h-4 w-4" /></button>
              <button title="No vino" onClick={() => mark.mutate({ uid: a.user_id, attended: false })} className={cn("rounded p-1", a.attended === false ? "bg-destructive text-destructive-foreground" : "text-muted-foreground")}><X className="h-4 w-4" /></button></>}
          </span>
        </div>))}
        {attendees.length === 0 && <p className="text-sm text-muted-foreground">Nadie apuntado todavía.</p>}
        {!staff && <p className="pt-1 text-xs text-muted-foreground">Algunos socios pueden ocultar su asistencia.</p>}
      </div>
    </AppShell>
  );
}

function WodDelete({ id, onDone }: { id: string; onDone: () => void }) {
  return <button aria-label="Quitar" className="text-muted-foreground hover:text-destructive" onClick={async () => { await supabase.from("wod_items").delete().eq("id", id); onDone(); }}><Trash2 className="h-4 w-4" /></button>;
}

function WodEditor({ classId, tenantId, exercises, nextPos, onDone }: { classId: string; tenantId: string; exercises: { id: string; name: string; uses_load: boolean }[]; nextPos: number; onDone: () => void }) {
  const [f, setF] = useState<Partial<WodItem>>({ block: "strength", sets: 5, reps: "5", percent_rm: 75 });
  const add = useMutation({
    mutationFn: async () => {
      if (!f.exercise_id && !f.label) throw new Error("Elige un ejercicio o escribe uno");
      const r = await supabase.from("wod_items").insert({ tenant_id: tenantId, class_id: classId, block: f.block ?? "strength", position: nextPos, exercise_id: f.exercise_id ?? null, label: f.label ?? null, sets: f.sets ?? null, reps: f.reps ?? null, percent_rm: f.percent_rm ?? null, notes: f.notes ?? null });
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
        <Select value={f.block ?? "strength"} onValueChange={(v) => setF({ ...f, block: v })}><SelectTrigger className="sm:col-span-2"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(BLOCKS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select>
        <Select value={f.exercise_id ?? "custom"} onValueChange={(v) => setF({ ...f, exercise_id: v === "custom" ? null : v })}><SelectTrigger className="sm:col-span-4"><SelectValue placeholder="Ejercicio" /></SelectTrigger>
          <SelectContent><SelectItem value="custom">Otro (texto libre)</SelectItem>{exercises.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
        {!f.exercise_id && <Input className="sm:col-span-6" placeholder="Ej.: AMRAP 12' de 10 burpees + 200 m remo" value={f.label ?? ""} onChange={(e) => setF({ ...f, label: e.target.value })} />}
        <Input type="number" placeholder="Series" value={f.sets ?? ""} onChange={(e) => setF({ ...f, sets: num(e.target.value) })} />
        <Input placeholder="Reps" value={f.reps ?? ""} onChange={(e) => setF({ ...f, reps: e.target.value || null })} />
        <Input inputMode="decimal" placeholder="% RM" value={f.percent_rm ?? ""} onChange={(e) => setF({ ...f, percent_rm: num(e.target.value) })} />
        <Input className="sm:col-span-3" placeholder="Notas" value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value || null })} />
      </div>
      <Button className="mt-3" size="sm" disabled={add.isPending} onClick={() => add.mutate()}><Plus className="mr-1 h-4 w-4" />Añadir</Button>
    </section>
  );
}
