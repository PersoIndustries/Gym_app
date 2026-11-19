import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BLOCKS, classDetailQuery, exercisesQuery, myRmsQuery, settingsQuery, updateClass, updatePhases, deletePhase, deleteWod, addWod, addAttendee, markAttendee, saveRm, type WodItem, type Phase } from "@/lib/data/box";
import { coachesQuery, membersQuery } from "@/lib/data/gym";
import { classState, STATE_LABEL, STATE_STYLE, INTENT_STYLE } from "@/lib/access/class-state";
import { useClassActions } from "@/lib/data/use-class-actions";
import { PersonAvatar } from "@/components/PersonAvatar";
import { INTENT_LABEL, confirmed, type Intent } from "@/lib/access/attendance";
import { recommendedKg } from "@/lib/training/weights";
import { isBoxStaff, useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/class/$classId")({
  head: pageHead("Clase y WOD", "Entreno del día, asistentes y pesos personalizados en BoxFlow."),
  component: ClassPage,
  errorComponent: () => <div role="alert" className="p-6">No se pudo cargar la clase.</div>,
});
const errorToast = (e: unknown) => toast.error(e instanceof Error ? e.message : String(e));
function ClassPage() {
  const { classId } = Route.useParams();
  const { role, tenantId, user } = useSession();
  const [preview, setPreview] = useState(false);
  const canManage = isBoxStaff(role);
  const staff = canManage && !preview;
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(classDetailQuery(classId));
  const { data: exercises = [] } = useQuery(exercisesQuery(tenantId));
  const { data: rms = {} } = useQuery(myRmsQuery());
  const { data: settings } = useQuery(settingsQuery(tenantId));
  const { data: coaches = [] } = useQuery(coachesQuery(tenantId));
  const { book, busy } = useClassActions();
  const refresh = () => { qc.invalidateQueries({ queryKey: ["class", classId] }); qc.invalidateQueries({ queryKey: ["classes"] }); };
  const cancel = useMutation({ mutationFn: (s: string) => updateClass(classId, { status: s, cancelled_reason: s === "cancelled" ? "Cancelada por el box" : null }), onSuccess: refresh, onError: errorToast });
  const mark = useMutation({ mutationFn: (v: { uid: string; attended: boolean }) => markAttendee(classId, v.uid, v.attended), onSuccess: refresh, onError: errorToast });
  if (isLoading || !data) return <AppShell title="Clase"><p className="text-sm text-muted-foreground">Cargando…</p></AppShell>;
  const { cls, wod, attendees } = data;
  const me = attendees.find(a => a.user_id === user?.id);
  const booked = attendees.filter(a => a.status === "booked");
  const counts = { going: booked.filter(a => a.intent === "going").length, maybe: booked.filter(a => a.intent === "maybe").length, not_going: attendees.filter(a => a.status === "declined").length, waitlist: attendees.filter(a => a.status === "waitlist").length };
  const phases: Phase[] = cls.phases ?? Object.entries(BLOCKS).map(([key, title]) => ({ key, title, alternatives: "" }));
  const blocks: Phase[] = [...phases, ...Array.from(new Set(wod.map(w => w.block))).filter(key => !phases.some(p => p.key === key)).map(key => ({ key, title: BLOCKS[key] ?? key, alternatives: "" }))];
  const allPhases = blocks;
  const rounding = Number(settings?.rounding_kg ?? 2.5);
  const renderItem = (w: WodItem) => {
    const ex = exercises.find(e => e.id === w.exercise_id);
    return <div key={w.id} className={cn("py-2", w.alternative_to && "ml-3 border-l-2 border-warning pl-3")}>
      {w.alternative_to && <p className="mb-1 flex items-center gap-1 text-xs text-warning"><Plus className="h-3 w-3"/>Alternativa</p>}
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-medium break-words">{ex?.name ?? w.label}</p><p className="text-sm text-muted-foreground">{w.sets ? `${w.sets} series` : ""}{w.reps ? ` · ${w.reps} repeticiones` : ""}{w.percent_rm ? ` · ${w.percent_rm}% RM` : ""}{w.notes ? ` · ${w.notes}` : ""}</p></div>
        {w.percent_rm && ex?.rm_lift && <LoadButton lift={ex.rm_lift} rm={rms[ex.rm_lift]} percent={w.percent_rm} rounding={rounding}/>}
        {staff && <Button size="icon" variant="ghost" title="Eliminar ejercicio" aria-label="Eliminar ejercicio" onClick={async () => { try { await deleteWod(w.id); refresh(); } catch(e) { errorToast(e); } }}><Trash2 className="h-4 w-4"/></Button>}
      </div>
      {staff && !w.alternative_to && tenantId && <WodEditor phases={allPhases} initialBlock={w.block} alternativeTo={w.id} classId={cls.id} tenantId={tenantId} exercises={exercises} nextPos={wod.length} onDone={refresh}/>}
    </div>;
  };
  return <AppShell title={cls.title} action={<Button asChild size="icon" variant="ghost" title="Calendario"><Link to="/calendar"><ArrowLeft className="h-4 w-4"/></Link></Button>}>
    {canManage && <div className="mb-4 flex justify-end"><Button variant="outline" size="sm" onClick={() => setPreview(!preview)}><Eye className="mr-2 h-4 w-4"/>{preview ? "Volver a gestión" : "Ver como alumno"}</Button></div>}
    <section className="border-y border-border py-5">
      <div className="flex items-center gap-2"><h2 className="font-display text-xl font-bold">{cls.title}</h2>{staff && <ClassNameEditor id={cls.id} title={cls.title} onDone={refresh}/>}</div>
      <p className="mt-2 text-sm capitalize">{new Date(cls.starts_at).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
      <div className="my-3 flex flex-wrap items-center gap-3"><PersonAvatar name={cls.coach_name ?? "Sin profesor"} url={coaches.find(p => p.user_id === cls.coach_id)?.avatar_url} className="h-10 w-10"/><div><p className="text-sm font-medium">{cls.coach_name ?? "Sin profesor"}</p><p className="text-xs text-muted-foreground">Profesor</p></div><span className={cn("ml-auto rounded px-2 py-1 text-xs", STATE_STYLE[classState(cls)])}>{STATE_LABEL[classState(cls)]}</span></div>
      <p className="text-sm text-muted-foreground">{booked.length}/{cls.capacity} plazas · {confirmed(counts)}/{cls.min_attendees} confirmados mínimo</p>
      {staff && <Select value={cls.coach_id ?? "none"} onValueChange={async id => { try { const coach = coaches.find(p => p.user_id === id); await updateClass(cls.id,{coach_id:coach?.user_id ?? null,coach_name:coach?.full_name ?? null}); refresh(); } catch(e) { errorToast(e); } }}><SelectTrigger className="mt-3" aria-label="Profesor de la clase"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Sin profesor</SelectItem>{coaches.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}</SelectContent></Select>}
      {cls.status === "cancelled" && <p className="mt-2 text-destructive">Clase cancelada. {cls.cancelled_reason}</p>}
      {cls.status !== "cancelled" && new Date(cls.starts_at) > new Date() && <div className="mt-4 flex flex-wrap gap-2">{(["going", "maybe", "not_going"] as Intent[]).map(i => <Button key={i} size="sm" disabled={busy} variant="outline" aria-pressed={me?.intent===i} className={cn(INTENT_STYLE[i], me?.intent===i && "ring-1 ring-current")} onClick={() => book.mutate({id:cls.id,intent:i})}>{INTENT_LABEL[i]}</Button>)}</div>}
      {staff && <Button className="mt-4" size="sm" variant="outline" disabled={cancel.isPending} onClick={() => (cls.status==="cancelled" || confirm("¿Cancelar esta clase?")) && cancel.mutate(cls.status==="cancelled" ? "scheduled" : "cancelled")}>{cls.status==="cancelled" ? "Reactivar clase" : "Cancelar clase"}</Button>}
    </section>
    <h2 className="mt-6 mb-3 font-semibold">WOD</h2>
    {wod.length===0 && !staff && <p className="text-sm text-muted-foreground">El profesor aún no ha publicado el entreno.</p>}
    {blocks.map(phase => <section key={phase.key} className={cn("border-t border-border py-4", phase.alternativeTo && "border-l-2 border-l-warning pl-3")}>
      <div className="mb-2 flex flex-wrap items-center gap-2">{phase.alternativeTo && <Plus className="h-4 w-4 text-warning"/>}<h3 className={cn("font-semibold", phase.alternativeTo ? "text-warning" : "text-primary")}>{phase.title}</h3>{phase.alternativeTo && <span className="text-xs text-muted-foreground">Alternativa de {blocks.find(p=>p.key===phase.alternativeTo)?.title}</span>}{staff && <PhaseEditor phase={phase} phases={allPhases} classId={cls.id} onDone={refresh}/>}</div>
      {wod.filter(w=>w.block===phase.key && !w.alternative_to).map(w=><div key={w.id}>{renderItem(w)}{wod.filter(a=>a.alternative_to===w.id).map(renderItem)}</div>)}
      {staff && !phase.alternativeTo && <NewPhase phases={allPhases} classId={cls.id} alternativeTo={phase.key} onDone={refresh}/>}
    </section>)}
    {staff && tenantId && <div className="mt-4 flex flex-wrap gap-2"><NewPhase phases={allPhases} classId={cls.id} onDone={refresh}/><WodEditor phases={allPhases} classId={cls.id} tenantId={tenantId} exercises={exercises} nextPos={wod.length} onDone={refresh}/></div>}
    <div className="mt-6 mb-3 flex items-center justify-between gap-2"><h2 className="font-semibold">Asistentes ({booked.length})</h2>{staff && <AddParticipant tenantId={cls.tenant_id} classId={cls.id} onDone={refresh}/>}</div>
    <div className="space-y-2">{attendees.map((a,index)=><div key={a.user_id ?? `anonymous-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm"><span className="flex min-w-0 items-center gap-3"><PersonAvatar name={a.full_name} url={a.avatar_url} anonymous={a.full_name==="Anónimo"}/><span className="break-words">{a.full_name}{a.user_id===user?.id && " (tú)"}</span></span><span className="flex items-center gap-1"><Badge variant="outline" className={INTENT_STYLE[a.intent]}>{a.status==="waitlist" ? "En espera" : INTENT_LABEL[a.intent]}</Badge>{staff && a.user_id && <><Button title="Vino" size="icon" variant="ghost" className={a.attended===true ? "text-success" : "text-muted-foreground"} onClick={()=>{if(a.user_id)mark.mutate({uid:a.user_id,attended:true});}}><Check className="h-4 w-4"/></Button><Button title="No vino" size="icon" variant="ghost" className={a.attended===false ? "text-destructive" : "text-muted-foreground"} onClick={()=>{if(a.user_id)mark.mutate({uid:a.user_id,attended:false});}}><X className="h-4 w-4"/></Button></>}</span></div>)}{attendees.length===0 && <p className="text-sm text-muted-foreground">Nadie apuntado todavía.</p>}</div>
  </AppShell>;
}
function LoadButton({lift,rm,percent,rounding}:{lift:string;rm:number|undefined;percent:number;rounding:number}) {
  const [open,setOpen]=useState(false); const [value,setValue]=useState(""); const qc=useQueryClient();
  const kg=recommendedKg(rm,percent,rounding);
  const save=useMutation({mutationFn:()=>saveRm(lift,Number(value.replace(",","."))),onSuccess:()=>{qc.invalidateQueries({queryKey:["rms"]});setOpen(false);toast.success("RM actualizado");},onError:errorToast});
  return <><Button className="shrink-0 font-display font-bold" size="sm" variant={kg===null ? "outline" : "default"} onClick={()=>{setValue(rm ? String(rm) : "");setOpen(true);}}>{kg===null ? "Añadir RM" : `${kg.toLocaleString("es-ES")} kg`}</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{lift} · Peso recomendado</DialogTitle></DialogHeader><dl className="grid grid-cols-2 gap-3 text-sm"><dt className="text-muted-foreground">Tu RM</dt><dd>{rm ?? "—"} kg</dd><dt className="text-muted-foreground">Porcentaje aplicado</dt><dd>{percent}%</dd><dt className="text-muted-foreground">Peso redondeado</dt><dd>{kg ?? "—"} kg</dd></dl><label className="text-sm">Cambiar RM (kg)<Input inputMode="decimal" value={value} onChange={e=>setValue(e.target.value)}/></label><Button disabled={save.isPending || !value || Number(value.replace(",","."))<=0} onClick={()=>save.mutate()}>Actualizar RM</Button></DialogContent></Dialog></>;
}
function ClassNameEditor({id,title,onDone}:{id:string;title:string;onDone:()=>void}) {
  const [open,setOpen]=useState(false);const [name,setName]=useState(title);
  const save=useMutation({mutationFn:()=>updateClass(id,{title:name.trim()}),onSuccess:()=>{onDone();setOpen(false);},onError:errorToast});
  return <><Button variant="ghost" size="icon" title="Editar nombre de clase" aria-label="Editar nombre de clase" onClick={()=>{setName(title);setOpen(true);}}><Pencil className="h-4 w-4"/></Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Nombre de la clase</DialogTitle></DialogHeader><Input aria-label="Nombre de la clase" value={name} onChange={e=>setName(e.target.value)} placeholder="WOD - ENDURANCE"/><Button disabled={!name.trim()||save.isPending} onClick={()=>save.mutate()}>Guardar</Button></DialogContent></Dialog></>;
}
function PhaseEditor({phase,phases,classId,onDone}:{phase:Phase;phases:Phase[];classId:string;onDone:()=>void}) {
  const [open,setOpen]=useState(false);const [name,setName]=useState(phase.title);
  const save=useMutation({mutationFn:()=>updatePhases(classId,phases.map(p=>p.key===phase.key?{...p,title:name.trim()}:p)),onSuccess:()=>{onDone();setOpen(false);},onError:errorToast});
  const remove=useMutation({mutationFn:()=>deletePhase(classId,phase.key,phases),onSuccess:()=>{onDone();setOpen(false);},onError:errorToast});
  return <><Button variant="ghost" size="icon" title={`Editar ${phase.title}`} aria-label={`Editar ${phase.title}`} onClick={()=>{setName(phase.title);setOpen(true);}}><Pencil className="h-4 w-4"/></Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Editar fase</DialogTitle></DialogHeader><Input aria-label="Nombre de fase" value={name} onChange={e=>setName(e.target.value)}/><div className="flex justify-between gap-2"><Button variant="destructive" disabled={remove.isPending} onClick={()=>confirm("¿Eliminar la fase, sus ejercicios y alternativas?") && remove.mutate()}><Trash2 className="mr-2 h-4 w-4"/>Eliminar fase</Button><Button disabled={!name.trim()||save.isPending} onClick={()=>save.mutate()}>Guardar</Button></div></DialogContent></Dialog></>;
}
function NewPhase({phases,classId,onDone,alternativeTo}:{phases:Phase[];classId:string;onDone:()=>void;alternativeTo?:string}) {
  const [open,setOpen]=useState(false);const [name,setName]=useState("");
  const save=useMutation({mutationFn:()=>updatePhases(classId,[...phases,{key:crypto.randomUUID(),title:name.trim(),alternatives:"",...(alternativeTo ? {alternativeTo} : {})}]),onSuccess:()=>{onDone();setName("");setOpen(false);},onError:errorToast});
  return <><Button size="sm" variant="outline" onClick={()=>setOpen(true)}><Plus className="mr-1 h-4 w-4"/>{alternativeTo ? "Alternativa de fase" : "Nueva fase"}</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{alternativeTo ? "Nueva fase alternativa" : "Nueva fase"}</DialogTitle></DialogHeader><Input aria-label="Nombre de nueva fase" value={name} onChange={e=>setName(e.target.value)}/><Button disabled={!name.trim()||save.isPending} onClick={()=>save.mutate()}>Añadir fase</Button></DialogContent></Dialog></>;
}
function WodEditor({classId,tenantId,exercises,nextPos,onDone,phases,alternativeTo,initialBlock}:{classId:string;tenantId:string;exercises:{id:string;name:string}[];nextPos:number;onDone:()=>void;phases:Phase[];alternativeTo?:string;initialBlock?:string}) {
  const [open,setOpen]=useState(false);const [f,setF]=useState<Partial<WodItem>>({block:initialBlock ?? phases[0]?.key ?? "strength",sets:5,reps:"5",percent_rm:75});
  const add=useMutation({mutationFn:()=>addWod(tenantId,classId,{...f,alternative_to:alternativeTo ?? null},nextPos),onSuccess:()=>{onDone();setOpen(false);toast.success("Ejercicio añadido");},onError:errorToast});
  return <><Button className={alternativeTo ? "mt-2" : ""} variant={alternativeTo ? "ghost" : "outline"} size="sm" onClick={()=>setOpen(true)}><Plus className="mr-1 h-4 w-4"/>{alternativeTo ? "Alternativa de ejercicio" : "Nuevo ejercicio"}</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{alternativeTo ? "Nuevo ejercicio alternativo" : "Añadir ejercicio al WOD"}</DialogTitle></DialogHeader><div className="grid gap-3 sm:grid-cols-2">{!alternativeTo && <label className="text-sm sm:col-span-2">Fase<Select value={f.block ?? phases[0]?.key ?? "strength"} onValueChange={block=>setF({...f,block})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{phases.map(p=><SelectItem key={p.key} value={p.key}>{p.title}</SelectItem>)}</SelectContent></Select></label>}<label className="text-sm sm:col-span-2">Ejercicio<Select value={f.exercise_id ?? "custom"} onValueChange={id=>setF({...f,exercise_id:id==="custom"?null:id})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="custom">Ejercicio personalizado</SelectItem>{exercises.map(e=><SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></label>{!f.exercise_id && <Input className="sm:col-span-2" aria-label="Nombre del ejercicio" placeholder="Nombre del ejercicio" value={f.label ?? ""} onChange={e=>setF({...f,label:e.target.value})}/>}<label className="text-sm">Series<Input type="number" min="1" value={f.sets ?? ""} onChange={e=>setF({...f,sets:e.target.value ? Number(e.target.value) : null})}/></label><label className="text-sm">Repeticiones por serie<Input value={f.reps ?? ""} onChange={e=>setF({...f,reps:e.target.value})}/></label><label className="text-sm">Porcentaje del RM<Input type="number" min="1" value={f.percent_rm ?? ""} onChange={e=>setF({...f,percent_rm:e.target.value ? Number(e.target.value) : null})}/></label><label className="text-sm">Notas / descanso<Input value={f.notes ?? ""} onChange={e=>setF({...f,notes:e.target.value})}/></label></div><Button disabled={add.isPending} onClick={()=>add.mutate()}>Añadir ejercicio</Button></DialogContent></Dialog></>;
}
function AddParticipant({tenantId,classId,onDone}:{tenantId:string;classId:string;onDone:()=>void}) {
  const [open,setOpen]=useState(false);const [uid,setUid]=useState(""); const [search,setSearch]=useState("");
  const {data}=useQuery({...membersQuery(tenantId),enabled:open});
  const add=useMutation({mutationFn:()=>addAttendee(classId,uid),onSuccess:status=>{onDone();setOpen(false);toast.success(status==="waitlist" ? "Añadido a lista de espera" : "Asistente añadido");},onError:errorToast});
  return <><Button variant="outline" size="sm" onClick={()=>setOpen(true)}><Plus className="mr-1 h-4 w-4"/>Asistente</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Añadir asistente</DialogTitle></DialogHeader><Input placeholder="Buscar socio" aria-label="Buscar socio" value={search} onChange={e=>setSearch(e.target.value)}/><div className="max-h-64 overflow-y-auto space-y-1">{data?.members.filter(m=>(data.profiles.find(p=>p.id===m.user_id)?.full_name ?? "Sin nombre").toLowerCase().includes(search.toLowerCase())).map(m=>{const p=data.profiles.find(p=>p.id===m.user_id);return <Button key={m.user_id} variant={uid===m.user_id ? "secondary" : "ghost"} className="h-auto w-full justify-start gap-3 py-2" onClick={()=>setUid(m.user_id)}><PersonAvatar name={p?.full_name ?? "Sin nombre"} url={p?.avatar_url}/>{p?.full_name ?? "Sin nombre"}</Button>;})}</div><Button disabled={!uid||add.isPending} onClick={()=>add.mutate()}>Añadir a la clase</Button></DialogContent></Dialog></>;
}
