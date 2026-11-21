import { SocialPhoto } from "@/components/SocialPhoto";
import { visibleWorkoutPhases } from "@/lib/access/content";
import { CoachProfile } from "@/components/CoachProfile";
import { ActivityMark } from "@/components/ActivityMark";
import { ClassSessionPanel } from "@/components/ClassSessionPanel";
import { IntentSwitch } from "@/components/IntentSwitch";
import { activityMode, MODE_LABEL } from "@/lib/brand/activities";
import { canShareClass } from "@/lib/media/images";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, ArrowLeft, Check, ClipboardPaste, Copy, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BLOCKS, classDetailQuery, exercisesQuery, myRmsQuery, settingsQuery, updateClass, updatePhases, deletePhase, deleteWod, deleteGroupItems, groupTitle, FORMAT_LABEL, type WodGroup, type GroupFormat, addWod, addAttendee, markAttendee, saveRm, copyClassSetup, reorderWod, pasteClassSetup, hasClassClipboard, clipboardTitle, type WodItem, type Phase } from "@/lib/data/box";
import { coachesQuery, membersQuery, activitiesQuery, myPlanQuery } from "@/lib/data/gym";
import { classState, STATE_LABEL, STATE_STYLE, INTENT_STYLE } from "@/lib/access/class-state";
import { useClassActions } from "@/lib/data/use-class-actions";
import { PersonAvatar } from "@/components/PersonAvatar";
import { INTENT_LABEL, confirmed, type Intent } from "@/lib/access/attendance";
import { recommendedKg } from "@/lib/training/weights";
import { isBoxStaff, useSession } from "@/lib/auth/session";
import { levelMode, LEVEL_MODE_LABEL, type LevelMode, myExerciseLevelsQuery, classLevelsQuery, levelsQuery, saveItemLevel, deleteItemLevel, type Level, type ItemLevel } from "@/lib/data/levels";
import { myProfileQuery } from "@/lib/data/box";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { canAccessClass } from "@/lib/access/membership";

export const Route = createFileRoute("/_authenticated/class/$classId")({
  head: pageHead("Clase y WOD", "Entreno del día, asistentes y pesos personalizados en BoxFlow."),
  component: ClassPage,
  errorComponent: () => <div role="alert" className="p-6">No se pudo cargar la clase.</div>,
});
const errorToast = (e: unknown) => toast.error(e instanceof Error ? e.message : (e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "Algo ha fallado"));
function ClassPage() {
  const { classId } = Route.useParams();
  const { role, tenantId, tenantName, user } = useSession();
  const [preview, setPreview] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const canManage = isBoxStaff(role);
  const staff = canManage && !preview;
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(classDetailQuery(classId));
  const { data: exercises = [] } = useQuery(exercisesQuery(tenantId));
  const { data: rms = {} } = useQuery(myRmsQuery());
  const { data: settings } = useQuery(settingsQuery(tenantId));
  const { data: activities = [] } = useQuery(activitiesQuery(tenantId));
  const { data: plan } = useQuery(myPlanQuery(tenantId, user?.id));
  const { data: coaches = [] } = useQuery(coachesQuery(tenantId));
  const { data: levels = [] } = useQuery(levelsQuery(tenantId));
  const { data: itemLevels = [] } = useQuery(classLevelsQuery((data?.wod ?? []).map(w => w.id)));
  const { data: prof } = useQuery(myProfileQuery(user?.id));
  const { data: exLevels = {} } = useQuery(myExerciseLevelsQuery(tenantId, user?.id));
  const { book, busy } = useClassActions();
  const refresh = () => { qc.invalidateQueries({ queryKey: ["item-levels"] }); qc.invalidateQueries({ queryKey: ["class", classId] }); qc.invalidateQueries({ queryKey: ["classes"] }); };
  const cancel = useMutation({ mutationFn: (s: string) => updateClass(classId, { status: s, cancelled_reason: s === "cancelled" ? "Cancelada por el box" : null }), onSuccess: refresh, onError: errorToast });
  const mark = useMutation({ mutationFn: (v: { uid: string; attended: boolean }) => markAttendee(classId, v.uid, v.attended), onSuccess: refresh, onError: errorToast });
  if (isLoading || !data) return <AppShell title="Clase"><p className="text-sm text-muted-foreground">Cargando…</p></AppShell>;
  const { cls, wod, attendees } = data;
  const activity = activities.find(a => a.id === cls.activity_type_id);
  const mode = activity ? activityMode(activity.name, (activity as { mode?: string }).mode) : "wod";
  const access = canAccessClass(plan ?? null, { ...cls, activity_type_id: cls.activity_type_id ?? "", coach: cls.coach_name ?? "", booked: 0 }, 0, Math.max(0, (plan?.trial_used ?? 0) - (plan?.trial_class_ids?.includes(cls.id) ? 1 : 0)));
  const me = attendees.find(a => a.user_id === user?.id);
  const booked = attendees.filter(a => a.status === "booked");
  const counts = { going: booked.filter(a => a.intent === "going").length, maybe: attendees.filter(a => a.intent === "maybe").length, not_going: attendees.filter(a => a.intent === "not_going").length, waitlist: attendees.filter(a => a.status === "waitlist").length };
  const phases: Phase[] = cls.phases ?? [];
  const blocks: Phase[] = [...phases, ...Array.from(new Set(wod.map(w => w.block))).filter(key => !phases.some(p => p.key === key)).map(key => ({ key, title: BLOCKS[key] ?? key, alternatives: "" }))];
  const allPhases = blocks;
  const rounding = Number(settings?.rounding_kg ?? 2.5);
  const sortable = (list: WodItem[]) => list.sort((a,b)=>a.position-b.position).map(w => <div key={w.id} draggable={staff} onDragStart={e=>{ if(!staff) return; setDragId(w.id); e.dataTransfer.effectAllowed="move"; }} onDragEnd={()=>setDragId(null)} onDragOver={e=>{ if(staff && dragId && list.some(x=>x.id===dragId)) e.preventDefault(); }} onDrop={async e=>{ e.preventDefault(); if(!dragId || dragId===w.id) return; const ids=list.map(x=>x.id).filter(id=>id!==dragId); ids.splice(ids.indexOf(w.id) + (list.findIndex(x=>x.id===dragId) < list.findIndex(x=>x.id===w.id) ? 1 : 0), 0, dragId); setDragId(null); try { await reorderWod(ids); refresh(); } catch(err){ errorToast(err); } }} className={cn(staff && "flex gap-1", dragId===w.id && "opacity-40")}>{staff && <GripVertical className="mt-3 h-4 w-4 shrink-0 cursor-grab text-muted-foreground" aria-label="Arrastrar para ordenar"/>}<div className="min-w-0 flex-1">{renderItem(w)}{wod.filter(a=>a.alternative_to===w.id).map(renderItem)}</div></div>);
  const renderItem = (w: WodItem) => {
    const ex = exercises.find(e => e.id === w.exercise_id);
    return <div key={w.id} className={cn("py-2", w.alternative_to && "ml-3 border-l-2 border-warning pl-3")}>
      {w.alternative_to && <p className="mb-1 flex items-center gap-1 text-xs text-warning"><Plus className="h-3 w-3"/>Alternativa</p>}
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-medium break-words">{ex?.name ?? w.label}</p><p className="text-sm text-muted-foreground">{w.sets ? `${w.sets} series` : ""}{w.reps ? ` · ${w.reps} repeticiones` : ""}{w.percent_rm ? ` · ${w.percent_rm}% RM` : ""}{w.notes ? ` · ${w.notes}` : ""}</p></div>
        {w.percent_rm && ex?.rm_lift && <LoadButton lift={ex.rm_lift} rm={rms[ex.rm_lift]} percent={w.percent_rm} rounding={rounding}/>}
        {staff && <Button size="icon" variant="ghost" title="Eliminar ejercicio" aria-label="Eliminar ejercicio" onClick={async () => { try { await deleteWod(w.id); refresh(); } catch(e) { errorToast(e); } }}><Trash2 className="h-4 w-4"/></Button>}
      </div>
      <LevelRow item={w} levels={levels} values={itemLevels.filter(l => l.wod_item_id === w.id)} preferred={(w.exercise_id && exLevels[w.exercise_id]) || prof?.preferred_level_name} staff={staff} tenantId={tenantId} rm={ex?.rm_lift ? rms[ex.rm_lift] : undefined} rounding={rounding} onDone={refresh}/>
      {staff && !w.alternative_to && tenantId && <WodEditor phases={allPhases} initialBlock={w.block} groupKey={w.group_key ?? null} alternativeTo={w.id} levels={levels} classId={cls.id} tenantId={tenantId} exercises={exercises} nextPos={wod.length} onDone={refresh}/>}
    </div>;
  };
  function socialItem(w: WodItem) {
    const ex = exercises.find(e => e.id === w.exercise_id); const preferred = (w.exercise_id && exLevels[w.exercise_id]) || prof?.preferred_level_name;
    const level = itemLevels.find(l => l.wod_item_id === w.id && levels.find(x => x.id === l.level_id)?.name === preferred);
    const pct = level?.percent_rm ?? w.percent_rm; const rm = ex?.rm_lift ? rms[ex.rm_lift] : undefined;
    const kg = level?.load_kg ?? (pct ? recommendedKg(rm, pct, rounding) : null);
    return [w.alternative_to ? "Alternativa:" : "", ex?.name ?? w.label ?? "Ejercicio", w.sets ? `${w.sets} series` : "", level?.reps ?? w.reps ?? "", kg != null ? `${kg} kg` : pct ? `${pct}% RM` : "", level?.notes ?? w.notes ?? ""].filter(Boolean).join(" · ");
  }
  return <AppShell title={cls.title} action={<Button asChild size="icon" variant="ghost" title="Calendario"><Link to="/calendar"><ArrowLeft className="h-4 w-4"/></Link></Button>}>
    {canManage && <div className="mb-4 flex flex-wrap justify-end gap-2">{staff && <><Button variant="outline" size="sm" onClick={async()=>{ try { await copyClassSetup(cls.id,cls.title,phases,wod); toast.success("Configuración copiada"); refresh(); } catch(e){ errorToast(e); } }}><Copy className="mr-2 h-4 w-4"/>Copiar WOD</Button>{hasClassClipboard() && <Button variant="outline" size="sm" onClick={async()=>{ if(!confirm(`¿Pegar "${clipboardTitle() ?? "clase copiada"}"? Se reemplazará el WOD actual.`)) return; try { await pasteClassSetup(cls.tenant_id,cls.id); toast.success("Configuración pegada"); refresh(); } catch(e){ errorToast(e); } }}><ClipboardPaste className="mr-2 h-4 w-4"/>Pegar WOD</Button>}</>}<Button variant="outline" size="sm" onClick={() => setPreview(!preview)}><Eye className="mr-2 h-4 w-4"/>{preview ? "Volver a gestión" : "Ver como alumno"}</Button></div>}
    <section className="relative mt-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <span className={cn("absolute -top-px right-4 rounded-b-md px-2.5 py-1 text-xs font-medium", STATE_STYLE[classState(cls)])}>{STATE_LABEL[classState(cls)]}</span>
      <div className="flex items-center gap-3 pr-20"><ActivityMark url={activity?.logo_url} name={activity?.name ?? cls.title} className="h-12 w-12 shrink-0"/><div className="min-w-0"><div className="flex items-center gap-1"><h2 className="font-display text-xl font-bold break-words">{cls.title}</h2>{staff && <ClassNameEditor id={cls.id} title={cls.title} onDone={refresh}/>}</div><p className="text-xs text-muted-foreground">{activity?.name}{activity ? ` · ${MODE_LABEL[mode]}` : ""}</p></div></div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm"><div><p className="font-display text-2xl font-bold leading-none">{new Date(cls.starts_at).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</p><p className="mt-1 capitalize text-muted-foreground">{new Date(cls.starts_at).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}</p></div><CoachProfile id={cls.coach_id} name={cls.coach_name} avatar={coaches.find(p => p.user_id === cls.coach_id)?.avatar_url}/></div>
      <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{booked.length}/{cls.capacity} plazas</span><span>{confirmed(counts)}/{cls.min_attendees} mínimo{counts.maybe ? ` · ${counts.maybe} con dudas` : ""}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${Math.min(100,(booked.length/Math.max(1,cls.capacity))*100)}%`}}/></div></div>
      {staff && <Select value={cls.coach_id ?? "none"} onValueChange={async id => { try { const coach = coaches.find(p => p.user_id === id); await updateClass(cls.id,{coach_id:coach?.user_id ?? null,coach_name:coach?.full_name ?? null}); refresh(); } catch(e) { errorToast(e); } }}><SelectTrigger className="mt-4" aria-label="Profesor de la clase"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Sin profesor</SelectItem>{coaches.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}</SelectContent></Select>}
      {cls.status === "cancelled" && <p className="mt-3 text-sm text-destructive">Clase cancelada. {cls.cancelled_reason}</p>}
      {!staff && cls.status !== "cancelled" && new Date(cls.starts_at) > new Date() && <div className="mt-4"><IntentSwitch value={me?.intent} disabled={busy} blockedReason={access.allowed ? undefined : (access.reason || "No tienes una cuota activa que cubra esta clase. Pide al box que te la asigne.")} onChange={i => book.mutate({id:cls.id,intent:i})}/></div>}
      {staff && <Button className="mt-4" size="sm" variant="outline" disabled={cancel.isPending} onClick={() => (cls.status==="cancelled" || confirm("¿Cancelar esta clase?")) && cancel.mutate(cls.status==="cancelled" ? "scheduled" : "cancelled")}>{cls.status==="cancelled" ? "Reactivar clase" : "Cancelar clase"}</Button>}
    </section>
    {mode !== "wod" && <ClassSessionPanel classId={cls.id} mode={mode} session={cls.session ?? {}} staff={staff} onDone={refresh}/>}
    {canShareClass(cls) && (mode !== "wod" || wod.length > 0) && <SocialPhoto title={cls.title} gym={tenantName ?? "Mi gimnasio"} activity={activity?.name ?? MODE_LABEL[mode]} date={new Date(cls.starts_at).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })} gymLogo={settings && "logo_url" in settings ? settings.logo_url as string | null : null}
      stats={mode === "cardio" ? [["Distancia", cls.session?.distance_km ? `${cls.session.distance_km.toLocaleString("es-ES")} km` : ""], ["Ritmo", cls.session?.pace ? `${cls.session.pace}/km` : ""], ["Tiempo", cls.session?.duration ?? ""]].filter(([, v]) => v).map(([label, value]) => ({ label: label!, value: value! }))
        : mode === "studio" ? [["Foco", cls.session?.focus ?? ""], ["Duración", cls.session?.duration ?? ""]].filter(([, v]) => v).map(([label, value]) => ({ label: label!, value: value! }))
        : mode === "wod" ? [{ label: "Duración", value: `${Math.round((new Date(cls.ends_at).getTime() - new Date(cls.starts_at).getTime()) / 60000)} min` }, ...(prof?.preferred_level_name ? [{ label: "Nivel", value: prof.preferred_level_name }] : [])] : []}
      sections={mode === "wod" ? blocks.map(p => ({ key: p.key, title: p.title, lines: [...(p.groups ?? []).flatMap(g => [groupTitle(g), ...wod.filter(w => w.group_key === g.key).map(w => socialItem(w))]), ...wod.filter(w => w.block === p.key && !(p.groups ?? []).some(g => g.key === w.group_key)).map(w => socialItem(w))] })).filter(s => s.lines.length) : mode === "studio" && cls.session?.description ? [{ key: "s", title: "Sesión", lines: [cls.session.description] }] : []}/>}
    {mode === "wod" && <h2 className="mt-6 mb-3 font-semibold">Entrenamiento</h2>}
    {mode === "wod" && wod.length===0 && !staff && <p className="mt-5 text-sm text-muted-foreground">El profesor aún no ha publicado el entreno.</p>}
    {mode === "wod" && visibleWorkoutPhases(blocks, wod, staff).map(phase => <section key={phase.key} className={cn("border-t border-border py-4", phase.alternativeTo && "border-l-2 border-l-warning pl-3")}>
      <div className="mb-2 flex flex-wrap items-center gap-2">{phase.alternativeTo && <Plus className="h-4 w-4 text-warning"/>}<h3 className={cn("font-semibold", phase.alternativeTo ? "text-warning" : "text-primary")}>{phase.title}</h3>{phase.alternativeTo && <span className="text-xs text-muted-foreground">Alternativa de {blocks.find(p=>p.key===phase.alternativeTo)?.title}</span>}{staff && <PhaseEditor phase={phase} phases={allPhases} classId={cls.id} onDone={refresh}/>}</div>
      {sortable(wod.filter(w=>w.block===phase.key && !w.alternative_to && !(phase.groups ?? []).some(g=>g.key===w.group_key)))}
      {(phase.groups ?? []).map(g=><div key={g.key} className="my-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-center justify-between gap-2"><p className="font-display text-sm font-bold uppercase tracking-wide text-primary">{groupTitle(g)}</p>{staff && <Button size="icon" variant="ghost" title="Eliminar bloque" aria-label="Eliminar bloque" onClick={async()=>{ if(!confirm("¿Eliminar el bloque y sus ejercicios?")) return; try { await deleteGroupItems(cls.id,g.key); await updatePhases(cls.id,allPhases.map(p=>p.key===phase.key?{...p,groups:(p.groups??[]).filter(x=>x.key!==g.key)}:p)); refresh(); } catch(e){ errorToast(e); } }}><Trash2 className="h-4 w-4"/></Button>}</div>
        <div className="divide-y divide-border/60">{sortable(wod.filter(w=>w.group_key===g.key && !w.alternative_to))}</div>
        {staff && tenantId && <WodEditor phases={allPhases} initialBlock={phase.key} groupKey={g.key} classId={cls.id} tenantId={tenantId} exercises={exercises} levels={levels} nextPos={wod.length} onDone={refresh}/>}
      </div>)}
      {staff && tenantId && <div className="mt-2 flex flex-wrap gap-2"><WodEditor phases={allPhases} initialBlock={phase.key} classId={cls.id} tenantId={tenantId} exercises={exercises} levels={levels} nextPos={wod.length} onDone={refresh}/><NewGroup phase={phase} phases={allPhases} classId={cls.id} onDone={refresh}/>{!phase.alternativeTo && <NewPhase phases={allPhases} classId={cls.id} alternativeTo={phase.key} onDone={refresh}/>}</div>}
    </section>)}
    {mode === "wod" && staff && tenantId && <div className="mt-4 flex flex-wrap gap-2"><NewPhase phases={allPhases} classId={cls.id} onDone={refresh} first={allPhases.length===0}/></div>}
    <div className="mt-6 mb-3 flex items-center justify-between gap-2"><h2 className="font-semibold">Asistentes ({booked.length})</h2>{staff && <AddParticipant tenantId={cls.tenant_id} classId={cls.id} onDone={refresh}/>}</div>
    {([["Van", attendees.filter(a=>a.intent==="going")], ["Tienen dudas", attendees.filter(a=>a.intent==="maybe")], ["No van", attendees.filter(a=>a.intent==="not_going")]] as const).map(([label,list])=>list.length>0 && <div key={label} className="mb-4"><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label} ({list.length})</h3><div className="space-y-2">{list.map((a,index)=><div key={a.user_id ?? `anonymous-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm"><span className="flex min-w-0 items-center gap-3"><PersonAvatar name={a.full_name} url={a.avatar_url} anonymous={a.full_name==="Anónimo"}/><span className="break-words">{a.full_name}{a.user_id===user?.id && " (tú)"}</span></span><span className="flex items-center gap-1"><Badge variant="outline" className={INTENT_STYLE[a.intent]}>{a.status==="waitlist" ? "En espera" : INTENT_LABEL[a.intent]}</Badge>{staff && a.user_id && <><Button title="Vino" size="icon" variant="ghost" className={a.attended===true ? "text-success" : "text-muted-foreground"} onClick={()=>{if(a.user_id)mark.mutate({uid:a.user_id,attended:true});}}><Check className="h-4 w-4"/></Button><Button title="No vino" size="icon" variant="ghost" className={a.attended===false ? "text-destructive" : "text-muted-foreground"} onClick={()=>{if(a.user_id)mark.mutate({uid:a.user_id,attended:false});}}><X className="h-4 w-4"/></Button></>}</span></div>)}</div></div>)}{attendees.length===0 && <p className="text-sm text-muted-foreground">Nadie apuntado todavía.</p>}
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
function NewPhase({phases,classId,onDone,alternativeTo,first}:{phases:Phase[];classId:string;onDone:()=>void;alternativeTo?:string;first?:boolean}) {
  const [open,setOpen]=useState(false);const [name,setName]=useState("");
  const save=useMutation({mutationFn:()=>updatePhases(classId,[...phases,{key:crypto.randomUUID(),title:name.trim(),alternatives:"",...(alternativeTo ? {alternativeTo} : {})}]),onSuccess:()=>{onDone();setName("");setOpen(false);},onError:errorToast});
  return <><Button size="sm" variant={first ? "default" : "outline"} onClick={()=>setOpen(true)}><Plus className="mr-1 h-4 w-4"/>{alternativeTo ? "Alternativa de fase" : first ? "Añadir primera fase" : "Nueva fase"}</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{alternativeTo ? "Nueva fase alternativa" : "Nueva fase"}</DialogTitle></DialogHeader><Input aria-label="Nombre de nueva fase" value={name} onChange={e=>setName(e.target.value)}/><Button disabled={!name.trim()||save.isPending} onClick={()=>save.mutate()}>Añadir fase</Button></DialogContent></Dialog></>;
}
function WodEditor({classId,tenantId,exercises,levels,nextPos,onDone,phases,alternativeTo,initialBlock,groupKey}:{classId:string;tenantId:string;exercises:{id:string;name:string}[];levels:Level[];nextPos:number;onDone:()=>void;phases:Phase[];alternativeTo?:string;initialBlock?:string;groupKey?:string|null}) {
  const inGroup=!!groupKey;
  const blank=():Partial<WodItem>=>({block:initialBlock ?? phases[0]?.key ?? "strength",sets:inGroup?null:5,reps:inGroup?"10":"5",percent_rm:inGroup?null:75});
  const [open,setOpen]=useState(false);const [f,setF]=useState<Partial<WodItem>>(blank);const [loads,setLoads]=useState<Record<string,string>>({});const [mode,setMode]=useState<LevelMode>("class");
  const add=useMutation({mutationFn:async()=>{ const row=await addWod(tenantId,classId,{...f,group_key:groupKey ?? null,alternative_to:alternativeTo ?? null},nextPos); for(const l of levels.filter(x=>levelMode(x.name)===mode)){ const v=loads[l.id]?.trim(); if(v) await saveItemLevel(tenantId,row.id,l.id,{load_kg:Number(v.replace(",",".")),percent_rm:null,reps:null,notes:null}); } },onSuccess:()=>{onDone();setOpen(false);toast.success("Ejercicio añadido");},onError:errorToast});
  return <><Button className={alternativeTo ? "mt-2" : ""} variant={alternativeTo ? "ghost" : "outline"} size="sm" onClick={()=>{setF(blank());setLoads({});setOpen(true);}}><Plus className="mr-1 h-4 w-4"/>{alternativeTo ? "Alternativa de ejercicio" : "Ejercicio"}</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{alternativeTo ? "Nuevo ejercicio alternativo" : inGroup ? "Añadir ejercicio al bloque" : "Añadir ejercicio a la fase"}</DialogTitle></DialogHeader><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm sm:col-span-2">Ejercicio<Select value={f.exercise_id ?? "custom"} onValueChange={id=>setF({...f,exercise_id:id==="custom"?null:id})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="custom">Ejercicio personalizado</SelectItem>{exercises.map(e=><SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></label>{!f.exercise_id && <Input className="sm:col-span-2" aria-label="Nombre del ejercicio" placeholder="Nombre del ejercicio" value={f.label ?? ""} onChange={e=>setF({...f,label:e.target.value})}/>}{!inGroup && <label className="text-sm">Series<Input type="number" min="1" value={f.sets ?? ""} onChange={e=>setF({...f,sets:e.target.value ? Number(e.target.value) : null})}/></label>}<label className="text-sm">{inGroup ? "Repeticiones / calorías / metros" : "Repeticiones por serie"}<Input value={f.reps ?? ""} onChange={e=>setF({...f,reps:e.target.value})}/></label><label className="text-sm">Porcentaje del RM (opcional)<Input type="number" min="1" value={f.percent_rm ?? ""} onChange={e=>setF({...f,percent_rm:e.target.value ? Number(e.target.value) : null})}/></label><label className="text-sm">Notas / descanso<Input value={f.notes ?? ""} onChange={e=>setF({...f,notes:e.target.value})}/></label></div>
  {levels.length>0 && <fieldset className="rounded-md border border-border p-3"><legend className="px-1 text-sm font-semibold">Pesos por nivel (kg)</legend><ModePicker value={mode} onChange={setMode}/><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{levels.filter(l=>levelMode(l.name)===mode).map(l=><label key={l.id} className="text-xs">{l.name}<Input inputMode="decimal" placeholder="—" value={loads[l.id] ?? ""} onChange={e=>setLoads({...loads,[l.id]:e.target.value})}/></label>)}</div><p className="mt-2 text-xs text-muted-foreground">Ej.: RX hombre 43, RX mujer 30. Deja vacío lo que no aplique.</p></fieldset>}
  <Button disabled={add.isPending} onClick={()=>add.mutate()}>Añadir ejercicio</Button></DialogContent></Dialog></>;
}
function NewGroup({phase,phases,classId,onDone}:{phase:Phase;phases:Phase[];classId:string;onDone:()=>void}) {
  const [open,setOpen]=useState(false);const [g,setG]=useState<{format:GroupFormat;minutes:string;rounds:string;title:string}>({format:"amrap",minutes:"12",rounds:"",title:""});
  const save=useMutation({mutationFn:()=>{ const group:WodGroup={key:crypto.randomUUID(),format:g.format,minutes:g.minutes?Number(g.minutes):null,rounds:g.rounds?Number(g.rounds):null,...(g.title.trim()?{title:g.title.trim()}:{})}; return updatePhases(classId,phases.map(p=>p.key===phase.key?{...p,groups:[...(p.groups??[]),group]}:p)); },onSuccess:()=>{onDone();setOpen(false);},onError:errorToast});
  return <><Button size="sm" variant="outline" onClick={()=>setOpen(true)}><Plus className="mr-1 h-4 w-4"/>Bloque AMRAP/EMOM…</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Nuevo bloque en {phase.title}</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Crea el bloque y luego añade dentro todos sus ejercicios.</p><div className="grid grid-cols-2 gap-3"><label className="col-span-2 text-sm">Formato<Select value={g.format} onValueChange={v=>setG({...g,format:v as GroupFormat})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{(Object.keys(FORMAT_LABEL) as GroupFormat[]).map(k=><SelectItem key={k} value={k}>{FORMAT_LABEL[k]}</SelectItem>)}</SelectContent></Select></label><label className="text-sm">{g.format==="for_time"?"Time cap (min)":"Minutos"}<Input type="number" min="1" value={g.minutes} onChange={e=>setG({...g,minutes:e.target.value})}/></label><label className="text-sm">Rondas<Input type="number" min="1" value={g.rounds} onChange={e=>setG({...g,rounds:e.target.value})}/></label><label className="col-span-2 text-sm">Nombre (opcional)<Input placeholder="Parte A" value={g.title} onChange={e=>setG({...g,title:e.target.value})}/></label></div><Button disabled={save.isPending} onClick={()=>save.mutate()}>Crear bloque</Button></DialogContent></Dialog></>;
}
function AddParticipant({tenantId,classId,onDone}:{tenantId:string;classId:string;onDone:()=>void}) {
  const [open,setOpen]=useState(false);const [uid,setUid]=useState(""); const [search,setSearch]=useState("");
  const {data}=useQuery({...membersQuery(tenantId),enabled:open});
  const add=useMutation({mutationFn:()=>addAttendee(classId,uid),onSuccess:status=>{onDone();setOpen(false);toast.success(status==="waitlist" ? "Añadido a lista de espera" : "Asistente añadido");},onError:errorToast});
  return <><Button variant="outline" size="sm" onClick={()=>setOpen(true)}><Plus className="mr-1 h-4 w-4"/>Asistente</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Añadir asistente</DialogTitle></DialogHeader><Input placeholder="Buscar socio" aria-label="Buscar socio" value={search} onChange={e=>setSearch(e.target.value)}/><div className="max-h-64 overflow-y-auto space-y-1">{data?.members.filter(m=>(data.profiles.find(p=>p.id===m.user_id)?.full_name ?? "Sin nombre").toLowerCase().includes(search.toLowerCase())).map(m=>{const p=data.profiles.find(p=>p.id===m.user_id);return <Button key={m.user_id} variant={uid===m.user_id ? "secondary" : "ghost"} className="h-auto w-full justify-start gap-3 py-2" onClick={()=>setUid(m.user_id)}><PersonAvatar name={p?.full_name ?? "Sin nombre"} url={p?.avatar_url}/>{p?.full_name ?? "Sin nombre"}</Button>;})}</div><Button disabled={!uid||add.isPending} onClick={()=>add.mutate()}>Añadir a la clase</Button></DialogContent></Dialog></>;
}

function LevelRow({item,levels,values,preferred,staff,tenantId,rm,rounding,onDone}:{item:WodItem;levels:Level[];values:ItemLevel[];preferred:string|null|undefined;staff:boolean;tenantId:string|null;rm:number|undefined;rounding:number;onDone:()=>void}) {
  const [open,setOpen]=useState(false);
  const [draft,setDraft]=useState<Record<string,{load:string;pct:string;reps:string;notes:string}>>({});
  const [mode,setMode]=useState<LevelMode>("class");
  const name=(id:string)=>levels.find(l=>l.id===id)?.name ?? "Nivel";
  const save=useMutation({mutationFn:async()=>{ if(!tenantId) return; for(const l of levels){ const d=draft[l.id]; const cur=values.find(v=>v.level_id===l.id); if(levelMode(l.name)!==mode){ if(cur) await deleteItemLevel(cur.id); continue; } if(!d) continue; const empty=!d.load&&!d.pct&&!d.reps&&!d.notes; if(empty){ if(cur) await deleteItemLevel(cur.id); continue; } const num=(x:string)=>x?Number(x.replace(",",".")):null; await saveItemLevel(tenantId,item.id,l.id,{load_kg:num(d.load),percent_rm:num(d.pct),reps:d.reps||null,notes:d.notes||null}); } },onSuccess:()=>{onDone();setOpen(false);toast.success("Niveles guardados");},onError:errorToast});
  const start=()=>{setDraft(Object.fromEntries(levels.map(l=>{const v=values.find(x=>x.level_id===l.id);return [l.id,{load:v?.load_kg!=null?String(v.load_kg):"",pct:v?.percent_rm!=null?String(v.percent_rm):"",reps:v?.reps??"",notes:v?.notes??""}];})));const first=values[0];setMode(first?levelMode(name(first.level_id)):"class");setOpen(true);};
  const sorted=[...values].sort((a,b)=>(levels.find(l=>l.id===a.level_id)?.position??0)-(levels.find(l=>l.id===b.level_id)?.position??0));
  if(!values.length && !staff) return null;
  return <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
    {sorted.map(v=>{const n=name(v.level_id);const mine=preferred===n;const kg=v.percent_rm?recommendedKg(rm,Number(v.percent_rm),rounding):null;return <span key={v.id} className={cn("rounded border px-2 py-0.5 text-xs",mine?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground")}><b className="font-semibold">{n}</b>{v.load_kg!=null?` · ${Number(v.load_kg).toLocaleString("es-ES")} kg`:""}{v.percent_rm!=null?` · ${v.percent_rm}% RM${mine&&kg!==null?` (${kg} kg)`:""}`:""}{v.reps?` · ${v.reps} reps`:""}{v.notes?` · ${v.notes}`:""}</span>;})}
    {staff && levels.length>0 && <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={start}>{values.length?"Editar niveles":"+ Niveles"}</Button>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Niveles del ejercicio</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Deja vacío un nivel para no mostrarlo. Puedes poner peso fijo, % RM, repeticiones o una nota.</p><ModePicker value={mode} onChange={setMode}/>
      {levels.filter(l=>levelMode(l.name)===mode).map(l=>{const d=draft[l.id] ?? {load:"",pct:"",reps:"",notes:""};const set=(k:keyof typeof d,v:string)=>setDraft({...draft,[l.id]:{...d,[k]:v}});return <fieldset key={l.id} className="rounded-md border border-border p-3"><legend className="px-1 text-sm font-semibold">{l.name}</legend><div className="grid grid-cols-3 gap-2"><label className="text-xs">Peso (kg)<Input inputMode="decimal" value={d.load} onChange={e=>set("load",e.target.value)}/></label><label className="text-xs">% RM<Input inputMode="decimal" value={d.pct} onChange={e=>set("pct",e.target.value)}/></label><label className="text-xs">Reps<Input value={d.reps} onChange={e=>set("reps",e.target.value)}/></label></div><label className="mt-2 block text-xs">Nota<Input placeholder="Banda, step-up…" value={d.notes} onChange={e=>set("notes",e.target.value)}/></label></fieldset>;})}
      <Button disabled={save.isPending} onClick={()=>save.mutate()}>Guardar niveles</Button></DialogContent></Dialog>
  </div>;
}

function ModePicker({value,onChange}:{value:LevelMode;onChange:(m:LevelMode)=>void}) {
  return <div className="mb-2 flex flex-wrap gap-1" role="radiogroup" aria-label="Tipo de niveles">{(Object.keys(LEVEL_MODE_LABEL) as LevelMode[]).map(m=><Button key={m} type="button" size="sm" role="radio" aria-checked={value===m} variant={value===m?"default":"outline"} className="h-7 px-2 text-xs" onClick={()=>onChange(m)}>{LEVEL_MODE_LABEL[m]}</Button>)}</div>;
}
