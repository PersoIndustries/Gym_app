import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { eventsQuery, saveEvent, deleteEvent } from "@/lib/data/gym";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";
export const Route=createFileRoute("/_authenticated/admin/gym-calendar")({head:pageHead("Vacaciones y cierres","Calendario de vacaciones y cierres del gimnasio."),component:GymEvents});
function GymEvents(){
 const {tenantId}=useSession();const qc=useQueryClient();const {data:events=[],isError}=useQuery(eventsQuery(tenantId));
 const [f,setF]=useState({title:"",description:"",starts_at:"",ends_at:"",kind:"closure",blocks_classes:true});
 const inv=()=>{qc.invalidateQueries({queryKey:["gym-events"]});qc.invalidateQueries({queryKey:["classes"]});};
 const add=useMutation({mutationFn:async()=>{if(!tenantId)throw new Error("Selecciona un box");if(!f.title.trim()||!f.starts_at||!f.ends_at||new Date(f.ends_at)<=new Date(f.starts_at))throw new Error("Revisa el título y las fechas");await saveEvent(tenantId,f);},onSuccess:()=>{inv();setF({...f,title:"",description:""});toast.success("Periodo guardado");},onError:e=>toast.error(e instanceof Error?e.message:"No se pudo guardar")});
 const remove=useMutation({mutationFn:deleteEvent,onSuccess:inv,onError:()=>toast.error("No se pudo borrar")});
 return <AppShell title="Vacaciones y cierres"><section className="border-b border-border pb-6"><h2 className="mb-4 font-semibold">Nuevo periodo</h2><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Título<Input value={f.title} onChange={e=>setF({...f,title:e.target.value})}/></label><label className="text-sm">Tipo<Select value={f.kind} onValueChange={v=>setF({...f,kind:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="closure">Cierre</SelectItem><SelectItem value="holiday">Vacaciones</SelectItem></SelectContent></Select></label><label className="text-sm">Desde<Input type="datetime-local" value={f.starts_at} onChange={e=>setF({...f,starts_at:e.target.value})}/></label><label className="text-sm">Hasta<Input type="datetime-local" value={f.ends_at} onChange={e=>setF({...f,ends_at:e.target.value})}/></label><label className="text-sm sm:col-span-2">Información<Input value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></label><label className="flex items-center gap-2 text-sm"><Switch checked={f.blocks_classes} onCheckedChange={v=>setF({...f,blocks_classes:v})}/>Gimnasio cerrado · cancelar clases del periodo</label></div>{f.blocks_classes && <p className="mt-3 text-xs text-warning">Las clases existentes del periodo se cancelarán; al eliminar el cierre no se reactivan automáticamente.</p>}<Button className="mt-4" disabled={add.isPending} onClick={()=>add.mutate()}><Plus/>Guardar periodo</Button></section><h2 className="mb-4 mt-6 font-semibold">Calendario del gimnasio</h2>{isError && <p role="alert" className="text-destructive">No se pudieron cargar los periodos.</p>}{!events.length && <p className="text-muted-foreground">No hay vacaciones ni cierres registrados.</p>}<div className="space-y-3">{events.map(e=><div key={e.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4"><div><h3 className="font-semibold text-warning">{e.title} · {e.blocks_classes?"Cerrado":"Vacaciones"}</h3><p className="mt-1 text-sm">{new Date(e.starts_at).toLocaleString("es-ES")} — {new Date(e.ends_at).toLocaleString("es-ES")}</p><p className="mt-1 text-sm text-muted-foreground">{e.description}</p></div><Button size="icon" variant="ghost" aria-label={`Borrar ${e.title}`} onClick={()=>confirm("¿Eliminar periodo? Las clases canceladas no se reactivarán.")&&remove.mutate(e.id)}><Trash2/></Button></div>)}</div></AppShell>;
}
