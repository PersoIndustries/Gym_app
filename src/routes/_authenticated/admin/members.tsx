import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth/session";
import type { TenantRole } from "@/lib/domain/types";
import { pageHead } from "@/lib/seo";
import { membersQuery, plansQuery, addMembership, endMembership, changeMemberRole, setMemberStatus, removeMember } from "@/lib/data/gym";
import { PersonAvatar } from "@/components/PersonAvatar";
import { useState } from "react";
import { Ban, CheckCircle2, MoreVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { canChangeMember, filterMembers, type MemberFilter, type MemberRow } from "@/lib/access/members";
const errText = (e: unknown) => (e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e));

export const Route = createFileRoute("/_authenticated/admin/members")({ head: pageHead("Socios", "Socios, solicitudes y códigos del box."), component: Members });
const ROLE: Record<TenantRole, string> = { athlete: "Alumno", coach: "Profesor", admin: "Admin" };
const ok = <T,>(r: { error: unknown; data: T | null }) => { if (r.error) throw r.error; return r.data as T; };

function Members() {
  const { tenantId, role, user, refresh } = useSession();
  const qc = useQueryClient();
  const isAdmin = role === "admin";
  const { data, isError } = useQuery(membersQuery(tenantId));
  const { data: plans = [] } = useQuery(plansQuery(tenantId));
  const name = Object.fromEntries((data?.profiles ?? []).map(p=>[p.id,p.full_name ?? "Sin nombre"]));
  const inv = () => qc.invalidateQueries({ queryKey: ["members"] });
  const quota = useMutation({mutationFn:async(v:{uid:string;plan?:string;end?:string})=>{if(!tenantId)throw new Error("Selecciona un box");if(v.end)await endMembership(tenantId,v.end);else if(v.plan)await addMembership(tenantId,v.uid,v.plan);},onSuccess:(_d,v)=>{inv();qc.invalidateQueries({queryKey:["my-plan"]});toast.success(v.end?"Cuota retirada":"Cuota añadida");},onError:e=>toast.error(String(e))});
  const review = useMutation({ mutationFn: async (v: { id: string; approve: boolean }) => ok(await supabase.rpc("review_join_request", { _id: v.id, _approve: v.approve })), onSuccess: (_d, v) => { toast.success(v.approve ? "Socio aceptado" : "Solicitud rechazada"); inv(); } });
  const setRole = useMutation({ mutationFn: async (v: { id: string; role: TenantRole }) => { if (!tenantId) throw new Error("Selecciona un box"); await changeMemberRole(tenantId, v.id, v.role); }, onSuccess: () => { inv(); refresh(); qc.invalidateQueries({ queryKey: ["coaches"] }); toast.success("Rol actualizado"); }, onError: (e) => toast.error(errText(e)) });
  const remove = useMutation({ mutationFn: async (id: string) => { if (!tenantId) throw new Error("Selecciona un box"); await removeMember(tenantId, id); }, onSuccess: () => { toast.success("Socio dado de baja del box"); inv(); }, onError: (e) => toast.error(errText(e)) });
  const status = useMutation({ mutationFn: async (v: { id: string; status: "active" | "suspended"; note: string | null }) => { if (!tenantId) throw new Error("Selecciona un box"); await setMemberStatus(tenantId, v.id, v.status, v.note); }, onSuccess: (_d, v) => { toast.success(v.status === "suspended" ? "Socio suspendido: no podrá reservar" : "Socio reactivado"); inv(); }, onError: (e) => toast.error(errText(e)) });
  const [f, setF] = useState<MemberFilter>({ q: "", role: "all", state: "all" });
  const day = new Date().toLocaleDateString("sv-SE");
  const activeOf = (uid: string) => (data?.memberships ?? []).filter(x=>x.user_id===uid&&x.status==="active"&&x.starts_on<=day&&(!x.ends_on||x.ends_on>=day)).flatMap(x=>{const p=plans.find(pl=>pl.id===x.plan_id);return p?[{ms:x,plan:p}]:[];});
  const rows: MemberRow[] = (data?.members ?? []).map(m => ({ id: m.id, user_id: m.user_id, name: name[m.user_id] ?? "Sin nombre", role: m.role, status: m.status === "suspended" ? "suspended" : "active", quotas: activeOf(m.user_id).length }));
  const shown = filterMembers(rows, f);

  return (
    <AppShell title="Socios">
      {isError && <p role="alert" className="text-destructive">No se pudieron cargar los socios.</p>}
      {!!data?.requests.length && <section className="mb-6">
        <h2 className="mb-2 font-semibold">Solicitudes pendientes ({data.requests.length})</h2>
        <div className="space-y-2">{data.requests.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border border-primary/50 bg-card px-4 py-3">
            <span className="font-medium">{name[r.user_id] ?? "Nuevo usuario"}</span>
            {isAdmin && <span className="flex gap-2"><Button size="sm" onClick={() => review.mutate({ id: r.id, approve: true })}>Aceptar</Button><Button size="sm" variant="ghost" onClick={() => review.mutate({ id: r.id, approve: false })}>Rechazar</Button></span>}
          </div>))}</div></section>}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-semibold">Socios ({rows.length})</h2>
        <Input value={f.q} onChange={e=>setF({...f,q:e.target.value})} placeholder="Buscar por nombre…" className="h-9 w-full sm:w-56" />
        <Select value={f.role} onValueChange={v=>setF({...f,role:v as MemberFilter["role"]})}><SelectTrigger aria-label="Filtrar por rol" className="h-9 w-32"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{Object.entries(ROLE).map(([k,l])=><SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select>
        <Select value={f.state} onValueChange={v=>setF({...f,state:v as MemberFilter["state"]})}><SelectTrigger aria-label="Filtrar por estado" className="h-9 w-36"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Cualquier estado</SelectItem><SelectItem value="active">Activos</SelectItem><SelectItem value="suspended">Suspendidos</SelectItem><SelectItem value="with_quota">Con cuota</SelectItem><SelectItem value="no_quota">Sin cuota</SelectItem></SelectContent></Select>
      </div>
      {!shown.length && <p className="py-6 text-sm text-muted-foreground">Ningún socio coincide con el filtro.</p>}
      <div className="space-y-2">{shown.map((r) => {
        const m = data!.members.find(x=>x.id===r.id)!; const active = activeOf(m.user_id); const total=active.reduce((s,a)=>s+a.plan.price_cents,0);
        const editable = isAdmin && canChangeMember(r, user?.id, rows);
        return (
        <div key={m.id} className={`rounded-lg border bg-card px-4 py-3 ${r.status==="suspended" ? "border-destructive/40 opacity-80" : "border-border"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3"><PersonAvatar name={r.name} url={data!.profiles.find(p=>p.id===m.user_id)?.avatar_url}/><div className="min-w-0"><p className="flex flex-wrap items-center gap-2 font-medium">{r.name}{m.user_id === user?.id && " (tú)"}<Badge variant="secondary">{ROLE[r.role]}</Badge>{r.status==="suspended" && <Badge variant="destructive">Suspendido</Badge>}</p><p className="text-xs text-muted-foreground">{active.length ? `${active.length} cuota${active.length>1?"s":""} · ${(total/100).toLocaleString("es-ES")} €/mes` : "Sin cuota activa"}{m.status_note ? ` · ${m.status_note}` : ""}</p></div></div>
            {editable && <DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Acciones para ${r.name}`}><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
              <DropdownMenuLabel>Rol</DropdownMenuLabel>
              {(Object.keys(ROLE) as TenantRole[]).filter(k=>k!==r.role).map(k=><DropdownMenuItem key={k} onClick={()=>setRole.mutate({id:m.id,role:k})}>{k==="coach"?"Hacer profesor":k==="admin"?"Hacer admin":"Pasar a alumno"}</DropdownMenuItem>)}
              <DropdownMenuSeparator/>
              {r.status==="active"
                ? <DropdownMenuItem onClick={()=>{const note=prompt(`Motivo de la suspensión de ${r.name} (opcional)`); if(note!==null) status.mutate({id:m.id,status:"suspended",note:note.trim()||null});}}><Ban className="h-4 w-4"/>Suspender</DropdownMenuItem>
                : <DropdownMenuItem onClick={()=>status.mutate({id:m.id,status:"active",note:null})}><CheckCircle2 className="h-4 w-4"/>Reactivar</DropdownMenuItem>}
              <DropdownMenuItem className="text-destructive" onClick={()=>confirm(`¿Dar de baja a ${r.name} del box? Perderá el acceso y sus cuotas dejarán de aplicarse.`)&&remove.mutate(m.id)}><Trash2 className="h-4 w-4"/>Dar de baja</DropdownMenuItem>
            </DropdownMenuContent></DropdownMenu>}
          </div>
          {isAdmin && <div className="mt-2 flex flex-wrap items-center gap-2">
            {active.map(a=><Badge key={a.ms.id} variant="outline" className="gap-1">{a.plan.name}<button type="button" aria-label={`Quitar ${a.plan.name}`} className="ml-1 text-muted-foreground hover:text-destructive" onClick={()=>confirm(`¿Quitar la cuota ${a.plan.name}?`)&&quota.mutate({uid:m.user_id,end:a.ms.id})}>×</button></Badge>)}
            <Select value="" onValueChange={p=>quota.mutate({uid:m.user_id,plan:p})}><SelectTrigger aria-label={`Añadir cuota a ${r.name}`} className="h-8 w-36"><SelectValue placeholder="+ Añadir cuota"/></SelectTrigger><SelectContent>{plans.filter(p=>!active.some(a=>a.plan.id===p.id)).map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
          </div>}
          {!isAdmin && active.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{active.map(a=><Badge key={a.ms.id} variant="outline">{a.plan.name}</Badge>)}</div>}
        </div>); })}</div>
    </AppShell>
  );
}
