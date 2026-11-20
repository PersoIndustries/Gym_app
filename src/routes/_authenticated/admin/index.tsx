import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCog, CreditCard, Layers, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth/session";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery } from "@/lib/data/box";
import { addLevel, deleteLevel, levelsQuery, setBranding, setFacilitiesEnabled } from "@/lib/data/levels";
import { isValidLogoUrl, resolveTheme } from "@/lib/brand/themes";
import { ThemeSelector } from "@/components/ThemeSelector";
import { AppShell } from "@/components/layout/AppShell";
import { LogoUpload } from "@/components/LogoUpload";
import { BrandImage } from "@/components/BrandImage";
import { ActivityLogos } from "@/components/ActivityLogos";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/")({ head: pageHead("Gestión", "Gestión del box."), component: AdminHome });
function AdminHome() {
  const { role } = useSession(); const admin = role === "admin";
  const all = [
    { to: "/admin/classes", t: "Clases", d: admin ? "Horarios y capacidad" : "Clases de la semana y asistencia", icon: CalendarCog, coach: true },
    { to: "/admin/members", t: "Socios", d: admin ? "Roles y cuotas" : "Listado de socios", icon: Users, coach: true },
    { to: "/admin/plans", t: "Cuotas", d: "Reglas de acceso", icon: CreditCard },
    { to: "/admin/gym-calendar", t: "Vacaciones y cierres", d: "Calendario del gimnasio", icon: CalendarCog },
    { to: "/spaces", t: "Espacios y reservas", d: "Sauna, pistas y solicitudes", icon: CalendarCog },
    { to: "/events", t: "Eventos y carreras", d: admin ? "Internos, comunidad y solicitudes" : "Proponer eventos al admin", icon: Trophy, coach: true },
  ];
  const items = all.filter((i) => admin || ("coach" in i && i.coach));
  return (
    <AppShell title="Gestión del box">
      <div className="grid gap-3 sm:grid-cols-2">{items.map(({ to, t, d, icon: I }) => <Link key={to} to={to} className="rounded-lg border border-border bg-card p-5 hover:border-primary"><I className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></Link>)}</div>
      {admin ? <><HelpInbox /><BoxSettings /></> : <p className="mt-6 text-sm text-muted-foreground">Como profesor gestionas clases, asistencias y propones eventos. La configuración del box (marca, cuotas, espacios, horario fijo y cierres) es del admin.</p>}
    </AppShell>
  );
}

function BoxSettings() {
  const { tenantId, role } = useSession();
  const qc = useQueryClient();
  const { data: settings } = useQuery(settingsQuery(tenantId));
  const { data: levels = [] } = useQuery(levelsQuery(tenantId));
  const [name, setName] = useState("");
  const err = (e: unknown) => toast.error(e instanceof Error ? e.message : String(e));
  const toggle = useMutation({ mutationFn: (v: boolean) => setFacilitiesEnabled(tenantId!, v), onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); qc.invalidateQueries({ queryKey: ["facilities"] }); toast.success("Ajuste guardado"); }, onError: err });
  const add = useMutation({ mutationFn: () => addLevel(tenantId!, name, levels.length + 1), onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["levels"] }); }, onError: err });
  const del = useMutation({ mutationFn: deleteLevel, onSuccess: () => qc.invalidateQueries({ queryKey: ["levels"] }), onError: err });
  if (!tenantId) return null;
  return <section className="mt-8 space-y-6">
    <h2 className="font-semibold">Ajustes del box</h2>
    <BrandSettings /><ActivityLogos />
    <label className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4"><span><span className="font-medium">Reservas de instalaciones activas</span><span className="block text-sm text-muted-foreground">Si está apagado, los socios no ven “Espacios” ni pueden reservar. Tú puedes seguir configurándolos.</span></span><Switch checked={!!settings?.facilities_enabled} disabled={role !== "admin" || toggle.isPending} onCheckedChange={v => toggle.mutate(v)} /></label>
    <div className="rounded-lg border border-border bg-card p-4"><p className="flex items-center gap-2 font-medium"><Layers className="h-4 w-4 text-primary" />Niveles del WOD</p><p className="mb-3 text-sm text-muted-foreground">Aparecen en cada ejercicio para indicar pesos o reps por nivel (RX ♂, RX ♀, Open, Masters…).</p>
      <div className="flex flex-wrap gap-2">{levels.map(l => <span key={l.id} className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-sm">{l.name}<button aria-label={`Quitar ${l.name}`} onClick={() => confirm(`¿Quitar el nivel ${l.name}?`) && del.mutate(l.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button></span>)}</div>
      <div className="mt-3 flex gap-2"><Input placeholder="Nuevo nivel, p. ej. Open" value={name} onChange={e => setName(e.target.value)} /><Button disabled={!name.trim() || add.isPending} onClick={() => add.mutate()}>Añadir</Button></div></div>
  </section>;
}

function BrandSettings() {
  const { tenantId, role } = useSession();
  const qc = useQueryClient();
  const { data } = useQuery(settingsQuery(tenantId));
  const s = data as { theme_preset?: string; logo_url?: string | null } | null | undefined;
  const current = resolveTheme(s?.theme_preset);
  const [logo, setLogo] = useState<string | null>(null);
  const logoValue = logo ?? s?.logo_url ?? "";
  const save = useMutation({ mutationFn: (p: { theme_preset?: string; logo_url?: string | null }) => setBranding(tenantId!, p), onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); qc.invalidateQueries({ queryKey: ["branding"] }); setLogo(null); toast.success("Marca guardada"); }, onError: (e) => toast.error(e instanceof Error ? e.message : String(e)) });
  const admin = role === "admin";
  return <div className="rounded-lg border border-border bg-card p-4">
    <p className="font-medium">Marca del box</p><p className="mb-3 text-sm text-muted-foreground">Tus socios verán este tema y logo al entrar por el enlace del box y dentro de la app.</p>
    <ThemeSelector value={current} disabled={!admin || save.isPending} onChange={theme => save.mutate({ theme_preset: theme })} />
    <div className="mt-4"><LogoUpload tenant={tenantId} disabled={!admin || save.isPending} onUploaded={url => save.mutateAsync({ logo_url: url }).then(() => undefined)} /></div>
    <div className="mt-4 flex gap-2"><Input placeholder="URL del logo (https://…)" value={logoValue} disabled={!admin} onChange={e => setLogo(e.target.value)} />
      <Button disabled={!admin || save.isPending || (logoValue !== "" && !isValidLogoUrl(logoValue))} onClick={() => save.mutate({ logo_url: logoValue.trim() || null })}>Guardar logo</Button></div>
    {logoValue && isValidLogoUrl(logoValue) && <BrandImage url={logoValue} alt="Vista previa del logo" className="mt-3 h-12 object-contain" />}
  </div>;
}

function HelpInbox() {
  const { tenantId } = useSession(); const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["help", tenantId], enabled: !!tenantId, queryFn: async () => { const r = await supabase.from("help_requests").select("*").eq("tenant_id", tenantId!).eq("status", "open").order("created_at", { ascending: false }); if (r.error) throw r.error; return r.data; } });
  const close = useMutation({ mutationFn: async (id: string) => { const r = await supabase.from("help_requests").update({ status: "closed" }).eq("id", id); if (r.error) throw r.error; }, onSuccess: () => qc.invalidateQueries({ queryKey: ["help"] }) });
  if (!data.length) return null;
  return <section className="mt-8"><h2 className="mb-3 font-semibold">Solicitudes de ayuda ({data.length})</h2><ul className="space-y-2">{data.map((h) => <li key={h.id} className="rounded-lg border border-border bg-card p-4"><p className="font-medium">{h.subject}</p><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{h.message}</p><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{new Date(h.created_at).toLocaleString("es-ES")}</span><Button size="sm" variant="secondary" onClick={() => close.mutate(h.id)}>Marcar resuelta</Button></div></li>)}</ul></section>;
}
