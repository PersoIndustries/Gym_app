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
import { settingsQuery } from "@/lib/data/box";
import { addLevel, deleteLevel, levelsQuery, setBranding, setFacilitiesEnabled } from "@/lib/data/levels";
import { THEMES, isValidLogoUrl, resolveTheme } from "@/lib/brand/themes";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/")({ head: pageHead("Gestión", "Gestión del box."), component: AdminHome });
function AdminHome() {
  const items = [
    { to: "/admin/classes", t: "Clases", d: "Horarios y capacidad", icon: CalendarCog },
    { to: "/admin/members", t: "Socios", d: "Roles y cuotas", icon: Users },
    { to: "/admin/plans", t: "Cuotas", d: "Reglas de acceso", icon: CreditCard },
    { to: "/admin/gym-calendar", t: "Vacaciones y cierres", d: "Calendario del gimnasio", icon: CalendarCog },
    { to: "/spaces", t: "Espacios y reservas", d: "Sauna, pistas y solicitudes", icon: CalendarCog },
    { to: "/events", t: "Eventos y carreras", d: "Internos y de la comunidad", icon: Trophy },
  ] as const;
  return (
    <AppShell title="Gestión del box">
      <div className="grid gap-3 sm:grid-cols-2">{items.map(({ to, t, d, icon: I }) => <Link key={to} to={to} className="rounded-lg border border-border bg-card p-5 hover:border-primary"><I className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></Link>)}</div>
      <BoxSettings />
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
    <BrandSettings />
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
    <div className="grid gap-2 sm:grid-cols-2">{THEMES.map(t => <button key={t.id} type="button" disabled={!admin || save.isPending} onClick={() => save.mutate({ theme_preset: t.id })} aria-pressed={current === t.id} className={cn("flex items-center gap-3 rounded-md border p-3 text-left", current === t.id ? "border-primary ring-1 ring-primary" : "border-border")}>
      <span className="flex overflow-hidden rounded">{t.swatch.map(c => <span key={c} className="h-8 w-6" style={{ background: c }} />)}</span>
      <span><span className="block text-sm font-medium">{t.label}</span><span className="block text-xs text-muted-foreground">{t.hint}</span></span></button>)}</div>
    <div className="mt-4 flex gap-2"><Input placeholder="URL del logo (https://…)" value={logoValue} disabled={!admin} onChange={e => setLogo(e.target.value)} />
      <Button disabled={!admin || save.isPending || (logoValue !== "" && !isValidLogoUrl(logoValue))} onClick={() => save.mutate({ logo_url: logoValue.trim() || null })}>Guardar logo</Button></div>
    {logoValue && isValidLogoUrl(logoValue) && <img src={logoValue} alt="Vista previa del logo" className="mt-3 h-12 object-contain" />}
  </div>;
}
