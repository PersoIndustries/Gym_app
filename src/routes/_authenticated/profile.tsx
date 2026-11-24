import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { InfoHelp } from "@/components/InfoHelp";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MAIN_LIFTS } from "@/lib/data/mock";
import { myPlanQuery, saveProfile } from "@/lib/data/gym";
import type { FacilityWindow } from "@/lib/access/membership";
import { WEEKDAYS } from "@/lib/data/box";
import { myRmsQuery, saveRm, myProfileQuery, setAttendancePrivacy, setShowAlias } from "@/lib/data/box";
import { levelsQuery, setPreferredLevel, myExerciseLevelsQuery, setExerciseLevel } from "@/lib/data/levels";
import { exercisesQuery } from "@/lib/data/box";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PersonAvatar } from "@/components/PersonAvatar";
import { supabase } from "@/integrations/supabase/client";
import { changePassword } from "@/lib/data/passwords";
import { isBoxStaff } from "@/lib/auth/session";
import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/data/auth";

function SignOutButton() {
  const qc = useQueryClient(); const navigate = useNavigate(); const { user } = useSession();
  const out = async () => { try { await qc.cancelQueries(); qc.clear(); await signOut(); await navigate({ to: "/auth", search: {}, replace: true }); } catch { toast.error("No se pudo cerrar la sesión"); } };
  return <section className="mt-5 rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Conectado como <b className="text-foreground">{user?.email}</b></p><Button variant="destructive" className="mt-3" onClick={out}><LogOut className="h-4 w-4" />Cerrar sesión</Button></section>;
}

export const Route = createFileRoute("/_authenticated/profile")({ head: pageHead("Perfil", "Tu ficha, tus RMs y tu privacidad."), component: Profile });

function Profile() {
  const { user, tenantId, tenantName, role } = useSession();
  const { data: plan } = useQuery(myPlanQuery(tenantId,user?.id));
  const qc = useQueryClient();
  const { data: rms = {} } = useQuery(myRmsQuery());
  const { data: prof } = useQuery(myProfileQuery(user?.id));
  const privacy = useMutation({ mutationFn: async (hidden: boolean) => { if (!user) throw new Error("Inicia sesión"); await setAttendancePrivacy(user.id, hidden); }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); qc.invalidateQueries({ queryKey: ["class"] }); }, onError: () => toast.error("No se pudo guardar tu privacidad") });
  const alias = useMutation({ mutationFn: async (v: boolean) => { if (!user) throw new Error("Inicia sesión"); await setShowAlias(user.id, v); }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); qc.invalidateQueries({ queryKey: ["class"] }); }, onError: () => toast.error("No se pudo guardar") });
  const { data: levels = [] } = useQuery(levelsQuery(tenantId));
  const level = useMutation({ mutationFn: (v: string) => setPreferredLevel(user!.id, v === "none" ? null : v), onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Nivel guardado"); }, onError: () => toast.error("No se pudo guardar el nivel") });
  const { data: exercises = [] } = useQuery(exercisesQuery(tenantId));
  const { data: exLevels = {} } = useQuery(myExerciseLevelsQuery(tenantId, user?.id));
  const exLevel = useMutation({ mutationFn: (v: { ex: string; level: string }) => setExerciseLevel(tenantId!, user!.id, v.ex, v.level === "default" ? null : v.level), onSuccess: () => { qc.invalidateQueries({ queryKey: ["exercise-levels"] }); toast.success("Nivel guardado"); }, onError: () => toast.error("No se pudo guardar el nivel") });
  const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => { setDraft(Object.fromEntries(Object.entries(rms).map(([k, v]) => [k, String(v).replace(".", ",")]))); }, [rms]);
  const save = useMutation({ mutationFn: (v: { lift: string; kg: number | null }) => saveRm(v.lift, v.kg), onSuccess: () => { toast.success("RM guardado"); qc.invalidateQueries({ queryKey: ["rms"] }); }, onError: () => toast.error("No se pudo guardar") });
  const commit = (lift: string) => {
    const raw = (draft[lift] ?? "").replace(",", ".");
    const kg = raw === "" ? null : Number(raw);
    if (kg !== null && (!Number.isFinite(kg) || kg <= 0)) return;
    if ((rms[lift] ?? null) !== kg) save.mutate({ lift, kg });
  };
  const staff = isBoxStaff(role);
  return (
    <AppShell title="Perfil">
      <Tabs defaultValue="me">
        <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="me">Mi perfil</TabsTrigger><TabsTrigger value="level">Mi nivel</TabsTrigger><TabsTrigger value="privacy">Privacidad y cuenta</TabsTrigger>{staff && <TabsTrigger value="stats">Mis datos</TabsTrigger>}
        </TabsList>
        <TabsContent value="me"><AccountForm prof={prof} />
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-display text-xl font-bold">{prof?.full_name || (user?.user_metadata?.["full_name"] as string) || "Sin nombre"}</p>
        <p className="text-sm text-muted-foreground">{user?.email}{tenantName ? ` · ${tenantName}` : ""}</p>
        <div className="mt-4"><div className="flex items-center gap-1"><p className="text-xs text-muted-foreground">Mi cuota</p><InfoHelp label="Mi cuota">Tu gimnasio asigna la cuota y decide el acceso, las reservas y las clases permitidas. Los días de instalaciones y los de clases son independientes.</InfoHelp></div><p className="font-semibold text-primary">{plan?.name ?? "Sin cuota activa"}</p>{plan && <><p className="mt-1 text-sm text-muted-foreground">{(plan.price_cents/100).toLocaleString("es-ES")} €/mes · {plan.classes_enabled === false ? "Sin clases" : `${plan.weekly_class_limit ?? "Sin límite de"} clases semanales`}</p>{plan.classes_enabled !== false && <p className="mt-2 text-sm">Clases: {plan.allowed_weekdays.map(d=>WEEKDAYS[d]).join(", ") || "Sin días permitidos"}</p>}{plan.trial_class_limit != null && <p className="mt-2 text-sm text-primary">Prueba: {Math.max(0,plan.trial_class_limit-(plan.trial_used ?? 0))} de {plan.trial_class_limit} clases disponibles</p>}{Array.isArray(plan.facility_windows) && (plan.facility_windows as FacilityWindow[]).map((w,i)=><p key={i} className="mt-1 text-sm text-muted-foreground">Acceso a instalaciones: {WEEKDAYS[w.weekday]} · {w.from}–{w.to}</p>)}<p className="mt-2 text-sm text-muted-foreground">Reservas: {plan.facility_booking_enabled === false ? "No permitidas" : "Permitidas dentro de las franjas de acceso"}</p></>}</div>
      </section>
        </TabsContent>
        <TabsContent value="level">
      {levels.length > 0 && <label className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4"><span><span className="block">Mi nivel en los WOD</span><span className="text-xs text-muted-foreground">Se resalta en cada ejercicio con niveles.</span></span><Select value={prof?.preferred_level_name ?? "none"} onValueChange={v => level.mutate(v)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sin preferencia</SelectItem>{levels.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent></Select></label>}
      {levels.length > 0 && exercises.length > 0 && <details className="mb-5 border-b border-border pb-4"><summary className="cursor-pointer font-medium">Mi nivel por ejercicio</summary><p className="mt-1 text-xs text-muted-foreground">Si no eliges, se usa tu nivel general.</p><div className="mt-3 space-y-2">{exercises.map(e => <div key={e.id} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 break-words">{e.name}</span><Select value={exLevels[e.id] ?? "default"} onValueChange={v => exLevel.mutate({ ex: e.id, level: v })}><SelectTrigger className="w-36 shrink-0" aria-label={`Nivel en ${e.name}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="default">General</SelectItem>{levels.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent></Select></div>)}</div></details>}
      <div className="mt-6 mb-3 flex items-center gap-1"><h2 className="font-semibold">Mis RMs (1RM, kg)</h2><InfoHelp label="Repetición máxima (1RM)">El máximo peso que puedes levantar una vez con buena técnica. Se utiliza con el porcentaje indicado por el profesor para calcular tus kilos del WOD. Se guarda al salir del campo.</InfoHelp></div>
      <div className="grid gap-2 sm:grid-cols-2">
        {MAIN_LIFTS.map((l) => (
          <label key={l} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <span className="text-sm font-medium">{l}</span>
            <Input inputMode="decimal" className="w-24 text-right font-display text-lg" placeholder="—" value={draft[l] ?? ""}
              onChange={(e) => setDraft({ ...draft, [l]: e.target.value.replace(/[^0-9.,]/g, "") })} onBlur={() => commit(l)} />
          </label>))}
      </div>
        </TabsContent>
        <TabsContent value="privacy">
      <div className="my-5 flex items-center justify-between gap-4 border-y border-border py-4"><div className="flex items-center gap-1"><span>Ocultar mi asistencia</span><InfoHelp label="Privacidad de asistencia">Seguirás apareciendo en la lista, pero los demás verán Anónimo y un icono de interrogación en lugar de tu nombre y foto.</InfoHelp></div><Switch aria-label="Ocultar mi asistencia" checked={prof?.hide_attendance ?? false} disabled={!prof || privacy.isPending} onCheckedChange={v => privacy.mutate(v)} /></div>
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4"><div className="flex items-center gap-1"><span>Mostrar mi alias en lugar del nombre</span><InfoHelp label="Alias o nombre">Los demás atletas verán tu alias. Profesores y administradores verán tu alias junto a tu nombre completo.</InfoHelp></div><Switch aria-label="Mostrar mi alias" checked={prof?.show_alias ?? false} disabled={!prof || !prof.alias || alias.isPending} onCheckedChange={v => alias.mutate(v)} /></div>
          <PasswordForm /><HelpForm /><SignOutButton />
        </TabsContent>
        {staff && <TabsContent value="stats"><CoachStats /></TabsContent>}
      </Tabs>
    </AppShell>
  );
}

type Prof = { full_name: string | null; alias: string | null; avatar_url: string | null; bio: string | null } | null | undefined;
function AccountForm({ prof }: { prof: Prof }) {
  const { user } = useSession(); const qc = useQueryClient();
  const [v, setV] = useState({ full_name: "", alias: "", avatar_url: "", email: "", bio: "" });
  useEffect(() => { setV({ full_name: prof?.full_name ?? "", alias: prof?.alias ?? "", avatar_url: prof?.avatar_url ?? "", email: user?.email ?? "", bio: prof?.bio ?? "" }); }, [prof, user?.email]);
  const save = useMutation({ mutationFn: async () => {
    if (v.avatar_url && !/^https:\/\/\S+$/.test(v.avatar_url)) throw new Error("La foto debe ser un enlace https");
    if (!user) throw new Error("Inicia sesión");
    await saveProfile(user.id, { full_name: v.full_name.trim() || null, alias: v.alias.trim() || null, avatar_url: v.avatar_url.trim() || null, bio: v.bio.trim() || null });
    if (v.email.trim() && v.email.trim() !== user?.email) { const e = await supabase.auth.updateUser({ email: v.email.trim() }); if (e.error) throw e.error; return "email"; }
    return "ok";
  }, onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["profile"] }); qc.invalidateQueries({ queryKey: ["coach-profile"] }); toast.success(r === "email" ? "Te hemos enviado un correo para confirmar el nuevo email" : "Perfil guardado"); }, onError: (e) => toast.error(e instanceof Error ? e.message : String(e)) });
  return <section className="mb-5 rounded-xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-3"><PersonAvatar name={v.full_name || user?.email || "?"} url={v.avatar_url || null} /><p className="text-sm text-muted-foreground">Tu foto y nombre se ven en las clases.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div><Label>Nombre completo</Label><Input value={v.full_name} onChange={(e) => setV({ ...v, full_name: e.target.value })} /></div>
      <div><Label>Alias</Label><Input value={v.alias} onChange={(e) => setV({ ...v, alias: e.target.value })} placeholder="Cómo te llaman en el box" /></div>
      <div><Label>Foto (enlace https)</Label><Input value={v.avatar_url} onChange={(e) => setV({ ...v, avatar_url: e.target.value })} placeholder="https://…" /></div>
      <div><Label>Correo electrónico</Label><Input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></div>
    </div><div className="mt-3"><Label htmlFor="profile-bio">Sobre mí</Label><Textarea id="profile-bio" maxLength={500} value={v.bio} onChange={e => setV({ ...v, bio: e.target.value })}/><p className="mt-1 text-right text-xs text-muted-foreground">{v.bio.length}/500</p></div><Button className="mt-4" disabled={save.isPending} onClick={() => save.mutate()}>Guardar</Button></section>;
}
function PasswordForm() {
  const [current, setCurrent] = useState(""); const [a, setA] = useState(""); const [b, setB] = useState("");
  const save = useMutation({ mutationFn: () => changePassword(a, b, current), onSuccess: () => { setCurrent(""); setA(""); setB(""); toast.success("Contraseña cambiada"); }, onError: (e) => toast.error(e && typeof e === "object" && "message" in e ? String(e.message) : "No se pudo cambiar la contraseña") });
  return <section className="mb-5 border-y border-border py-5"><h2 className="mb-3 font-semibold">Cambiar contraseña</h2><form className="space-y-3" onSubmit={e => { e.preventDefault(); save.mutate(); }}><Label htmlFor="current-password">Contraseña actual</Label><Input id="current-password" type="password" autoComplete="current-password" required value={current} onChange={e => setCurrent(e.target.value)}/><div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="profile-new-password">Nueva contraseña</Label><Input id="profile-new-password" type="password" autoComplete="new-password" minLength={8} required value={a} onChange={e => setA(e.target.value)}/></div><div><Label htmlFor="profile-confirm-password">Repetir contraseña</Label><Input id="profile-confirm-password" type="password" autoComplete="new-password" required value={b} onChange={e => setB(e.target.value)}/></div></div><Button disabled={save.isPending}>Cambiar contraseña</Button></form></section>;
}
function HelpForm() {
  const { user, tenantId, tenantName } = useSession(); const [subject, setSubject] = useState(""); const [message, setMessage] = useState("");
  const send = useMutation({ mutationFn: async () => { const r = await supabase.from("help_requests").insert({ tenant_id: tenantId!, user_id: user!.id, subject: subject.trim(), message: message.trim() }); if (r.error) throw r.error; }, onSuccess: () => { setSubject(""); setMessage(""); toast.success("Solicitud enviada al gimnasio"); }, onError: (e) => toast.error(e instanceof Error ? e.message : String(e)) });
  if (!tenantId) return null;
  return <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Solicitar ayuda a {tenantName ?? "tu gimnasio"}</h2><p className="mb-3 text-sm text-muted-foreground">Le llega al admin del box.</p><Input placeholder="Asunto" value={subject} onChange={(e) => setSubject(e.target.value)} /><Textarea className="mt-2" placeholder="Cuéntanos qué necesitas" value={message} onChange={(e) => setMessage(e.target.value)} /><Button className="mt-3" disabled={!subject.trim() || !message.trim() || send.isPending} onClick={() => send.mutate()}>Enviar</Button></section>;
}
const monthRange = (offset: number) => { const d = new Date(); const from = new Date(d.getFullYear(), d.getMonth() + offset, 1); const to = new Date(d.getFullYear(), d.getMonth() + offset + 1, 1); return { from, to }; };
function CoachStats() {
  const { tenantId } = useSession();
  const { data = [], isError } = useQuery({ queryKey: ["coach-stats", tenantId], enabled: !!tenantId, queryFn: async () => Promise.all([0, -1, -2, -3, -4, -5].map(async (o) => { const { from, to } = monthRange(o); const r = await supabase.rpc("coach_stats", { _tenant: tenantId!, _from: from.toISOString(), _to: to.toISOString() }); if (r.error) throw r.error; return { from, ...(r.data?.[0] ?? { done: 0, pending: 0, attendees: 0, capacity: 0 }) }; })) });
  const cur = data[0];
  if (isError) return <p role="alert" className="text-destructive">No se pudieron cargar tus datos.</p>;
  if (!cur) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  const avg = cur.done ? Math.round((cur.attendees / cur.done) * 10) / 10 : 0; const occ = cur.capacity ? Math.round((cur.attendees / cur.capacity) * 100) : 0;
  return <div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Clases impartidas este mes", cur.done], ["Pendientes este mes", cur.pending], ["Media de asistentes", avg], ["Ocupación", `${occ}%`]].map(([l, v]) => <div key={l} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 font-display text-2xl font-bold">{v}</p></div>)}</div>
    <h2 className="mt-6 mb-2 font-semibold">Histórico</h2><ul className="divide-y divide-border rounded-xl border border-border bg-card">{data.map((m) => <li key={m.from.toISOString()} className="flex justify-between px-4 py-2 text-sm"><span className="capitalize">{m.from.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</span><span className="text-muted-foreground">{m.done} clases · {m.attendees} asistentes</span></li>)}</ul>
    <p className="mt-2 text-xs text-muted-foreground">Cuenta las clases donde eres el profesor asignado.</p></div>;
}
