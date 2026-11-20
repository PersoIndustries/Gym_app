import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth/session";
import type { TenantRole } from "@/lib/domain/types";
import { pageHead } from "@/lib/seo";
import { membersQuery, plansQuery, addMembership, endMembership, changeMemberRole, setInvitePlan } from "@/lib/data/gym";
import { PersonAvatar } from "@/components/PersonAvatar";

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
  const setRole = useMutation({ mutationFn: async (v: { id: string; role: TenantRole }) => { if (!tenantId) throw new Error("Selecciona un box"); await changeMemberRole(tenantId, v.id, v.role); }, onSuccess: () => { inv(); refresh(); qc.invalidateQueries({ queryKey: ["coaches"] }); toast.success("Rol actualizado"); }, onError: (e) => toast.error(String(e)) });
  const remove = useMutation({ mutationFn: async (id: string) => ok(await supabase.from("tenant_members").delete().eq("id", id)), onSuccess: () => { toast.success("Socio dado de baja del box"); inv(); } });
  const approval = useMutation({ mutationFn: async (v: { id: string; on: boolean }) => ok(await supabase.from("tenant_invites").update({ requires_approval: v.on }).eq("id", v.id)), onSuccess: inv });
  const inviteQuota = useMutation({ mutationFn: async (v: { id: string; plan: string }) => { if (!tenantId) throw new Error("Selecciona un box"); await setInvitePlan(tenantId, v.id, v.plan); }, onSuccess: () => { inv(); toast.success("Cuota automática actualizada"); }, onError: () => toast.error("No se pudo asignar la cuota al código") });

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

      {isAdmin && <section className="mb-6 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 font-semibold">Códigos de acceso</h2>
        {data?.invites.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span><span className="font-mono text-lg text-primary">{i.code}</span> <span className="text-muted-foreground">· {i.uses} usos</span></span>
            <label className="flex items-center gap-2">Requiere aprobación<Switch checked={i.requires_approval} onCheckedChange={(on) => approval.mutate({ id: i.id, on })} /></label>
            <div className="flex items-center gap-2"><span>Cuota automática</span><Select value={i.membership_plan_id ?? "none"} disabled={inviteQuota.isPending} onValueChange={plan => inviteQuota.mutate({ id: i.id, plan })}><SelectTrigger aria-label={`Cuota automática del código ${i.code}`} className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sin cuota automática</SelectItem>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
          </div>))}
      </section>}

      <h2 className="mb-2 font-semibold">Socios ({data?.members.length ?? 0})</h2>
      <div className="space-y-2">{data?.members.map((m) => {
        const day=new Date().toLocaleDateString("sv-SE"); const active=data.memberships.filter(x=>x.user_id===m.user_id&&x.status==="active"&&x.starts_on<=day&&(!x.ends_on||x.ends_on>=day)).flatMap(x=>{const p=plans.find(pl=>pl.id===x.plan_id);return p?[{ms:x,plan:p}]:[];}); const total=active.reduce((s,a)=>s+a.plan.price_cents,0);
        return (
        <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex min-w-0 items-center gap-3"><PersonAvatar name={name[m.user_id] ?? "Sin nombre"} url={data.profiles.find(p=>p.id===m.user_id)?.avatar_url}/><div><p className="font-medium">{name[m.user_id] ?? "Sin nombre"}{m.user_id === user?.id && " (tú)"}</p><p className="text-xs text-muted-foreground">{active.length ? `${active.length} cuota${active.length>1?"s":""} · ${(total/100).toLocaleString("es-ES")} €/mes` : "Sin cuota activa"}</p></div></div>
          <div className="flex flex-wrap items-center gap-2">
            {active.map(a=><Badge key={a.ms.id} variant="outline" className="gap-1">{a.plan.name}{isAdmin && <button type="button" aria-label={`Quitar ${a.plan.name}`} className="ml-1 text-muted-foreground hover:text-destructive" onClick={()=>confirm(`¿Quitar la cuota ${a.plan.name}?`)&&quota.mutate({uid:m.user_id,end:a.ms.id})}>×</button>}</Badge>)}
            {isAdmin && <Select value="" onValueChange={p=>quota.mutate({uid:m.user_id,plan:p})}><SelectTrigger aria-label={`Añadir cuota a ${name[m.user_id]}`} className="h-8 w-36"><SelectValue placeholder="+ Añadir cuota"/></SelectTrigger><SelectContent>{plans.filter(p=>!active.some(a=>a.plan.id===p.id)).map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>}
            {isAdmin && m.user_id !== user?.id ? <>
              <Select value={m.role} onValueChange={(v) => setRole.mutate({ id: m.id, role: v as TenantRole })}><SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ROLE).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select>
              <Button size="sm" variant="ghost" onClick={() => confirm("¿Dar de baja del box?") && remove.mutate(m.id)}>Baja</Button></>
              : <Badge variant="secondary">{ROLE[m.role]}</Badge>}
          </div>
        </div>); })}</div>
    </AppShell>
  );
}
