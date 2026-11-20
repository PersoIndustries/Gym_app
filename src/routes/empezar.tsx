import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Logo } from "@/components/layout/Logo";
import { useSession } from "@/lib/auth/session";
import { SAAS_PLANS, TRIAL_DAYS, discounted, getPlan, isValidCode, suggestCode, type SaasPlanId } from "@/lib/access/saas-plans";
import { checkPromo } from "@/lib/data/promos";
import { isValidLogoUrl, type ThemeId } from "@/lib/brand/themes";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useApplyTheme } from "@/lib/brand/use-box-theme";
import { LogoUpload } from "@/components/LogoUpload";
import { BrandImage } from "@/components/BrandImage";
import { setBranding } from "@/lib/data/levels";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ActivityMark } from "@/components/ActivityMark";
import { DEFAULT_ACTIVITIES, validActivitySelection, type ActivityName } from "@/lib/brand/activities";
import { createGym } from "@/lib/data/onboarding";

const PLAN_IDS = ["starter", "pro", "elite"] as const;
export const Route = createFileRoute("/empezar")({
  validateSearch: (s: Record<string, unknown>): { plan?: SaasPlanId } => (PLAN_IDS.includes(s["plan"] as SaasPlanId) ? { plan: s["plan"] as SaasPlanId } : {}),
  head: pageHead("Crea tu gimnasio", "Da de alta tu box en BoxFlow en unos minutos: datos, plan, marca y ajustes básicos."),
  component: Wizard,
});
const STEPS = ["Box", "Plan", "Marca", "Ajustes", "Listo"];

function Wizard() {
  const { plan: initialPlan } = Route.useSearch();
  const { user, setTenantId, setView } = useSession();
  const qc = useQueryClient(); const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", city: "", code: "", approval: false, plan: (initialPlan ?? "pro") as SaasPlanId, billing: "month" as "month" | "year", theme: "lime" as ThemeId, logo: "", rounding: 2.5, cancelHours: 4, minAttendees: 3, facilities: false });
  const [activities, setActivities] = useState<ActivityName[]>(["CrossFit"]);
  const [codeTouched, setCodeTouched] = useState(false);
  const [promoText, setPromoText] = useState(""); const [promo, setPromo] = useState<{ code: string; plan_id: string | null; discount_pct: number; duration_months: number | null } | null>(null);
  async function applyPromo() { try { const p = await checkPromo(promoText); if (!p) { setPromo(null); toast.error("Código no válido, caducado o agotado"); return; } setPromo(p); if (p.plan_id) setF((x) => ({ ...x, plan: p.plan_id as SaasPlanId })); toast.success(`Descuento del ${p.discount_pct}% aplicado`); } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } }
  const [busy, setBusy] = useState(false); const [created, setCreated] = useState<{ id: string; code: string } | null>(null);
  useApplyTheme(f.theme);
  useEffect(() => { if (!codeTouched) setF((x) => ({ ...x, code: x.name ? suggestCode(x.name) : "" })); }, [f.name, codeTouched]);
  const plan = getPlan(f.plan);

  if (!user) return <Shell><h1 className="text-3xl font-bold">Crea tu gimnasio</h1><p className="mt-2 text-muted-foreground">Primero crea tu cuenta o inicia sesión. Después volverás aquí para configurar tu box.</p>
    <Button className="mt-6" asChild><Link to="/auth" search={{ intent: "create_gym", plan: f.plan, mode: "signup" }}>Crear cuenta o entrar</Link></Button></Shell>;

  const canNext = [f.name.trim().length > 1 && isValidCode(f.code), true, !f.logo || isValidLogoUrl(f.logo), validActivitySelection(activities, plan.maxActivityTypes)][step] ?? true;
  async function create() {
    setBusy(true);
    const r = await createGym({ name: f.name, city: f.city, code: f.code.toUpperCase(), approval: f.approval, plan: f.plan, billing: f.billing, theme: f.theme, logo: f.logo, rounding: f.rounding, cancelHours: f.cancelHours, minAttendees: f.minAttendees, facilities: f.facilities && plan.facilities, activities, promo: promo?.code ?? null });
    setBusy(false);
    if (r.error) { toast.error(r.error.message); return; }
    sessionStorage.removeItem("bf.next");
    setCreated({ id: r.data, code: f.code.toUpperCase() }); setStep(4);
    if (f.logo) { try { const { adoptDraftLogo } = await import("@/lib/data/media"); const adopted = await adoptDraftLogo(f.logo, r.data); if (adopted !== f.logo) { await setBranding(r.data, { logo_url: adopted }); setF(x => ({ ...x, logo: adopted })); } } catch { toast.error("Gimnasio creado; vuelve a subir el logo en Gestión"); } }
    await qc.invalidateQueries();
  }
  const link = created ? `${typeof window !== "undefined" ? window.location.origin : ""}/b/${created.code}` : "";

  return <Shell>
    <ol className="mb-8 flex gap-2 text-xs">{STEPS.map((s, i) => <li key={s} className={cn("flex-1 rounded-full py-1 text-center", i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{i + 1}. {s}</li>)}</ol>
    {step === 0 && <div className="grid gap-4"><h1 className="text-2xl font-bold">Datos de tu box</h1>
      <div><Label>Nombre del gimnasio</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="CrossFit Puerto" /></div>
      <div><Label>Ciudad</Label><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="Valencia" /></div>
      <div><Label>Código de acceso para tus socios</Label><Input className="font-mono uppercase" value={f.code} onChange={(e) => { setCodeTouched(true); setF({ ...f, code: e.target.value.toUpperCase() }); }} />
        <p className="mt-1 text-xs text-muted-foreground">{isValidCode(f.code) ? `Tus socios entrarán en /b/${f.code}` : "4 a 12 letras o números, sin espacios."}</p></div>
      <label className="flex items-center justify-between text-sm">Aprobar a mano a cada socio nuevo<Switch checked={f.approval} onCheckedChange={(v) => setF({ ...f, approval: v })} /></label></div>}
    {step === 1 && <div><h1 className="mb-4 text-2xl font-bold">Elige tu plan</h1>
      <div className="mb-4 inline-flex rounded-full border border-border p-1 text-sm">{(["month", "year"] as const).map((b) => <button key={b} onClick={() => setF({ ...f, billing: b })} className={cn("rounded-full px-3 py-1", f.billing === b ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{b === "month" ? "Mensual" : "Anual (2 meses gratis)"}</button>)}</div>
      <div className="grid gap-3">{SAAS_PLANS.map((p) => <button key={p.id} disabled={!!promo?.plan_id && promo.plan_id !== p.id} onClick={() => setF({ ...f, plan: p.id, facilities: p.facilities && f.facilities })} className={cn("rounded-xl border p-4 text-left disabled:opacity-40", f.plan === p.id ? "border-primary bg-primary/10" : "border-border bg-card")}>
        <div className="flex justify-between"><span className="font-semibold">{p.name}</span><span className="font-bold">{promo && (!promo.plan_id || promo.plan_id === p.id) && promo.discount_pct > 0 ? <><s className="mr-2 font-normal text-muted-foreground">{f.billing === "month" ? p.month : p.year} €</s>{discounted((f.billing === "month" ? p.month : p.year) * 100, promo.discount_pct) / 100} €/{f.billing === "month" ? "mes" : "año"}</> : f.billing === "month" ? `${p.month} €/mes` : `${p.year} €/año`}</span></div>
        <p className="mt-1 text-sm text-muted-foreground">{p.features.slice(0, 4).join(" · ")}</p></button>)}</div>
      <div className="mt-4 rounded-xl border border-border p-3"><Label>¿Tienes un código?</Label><div className="mt-1 flex gap-2"><Input className="font-mono uppercase" value={promoText} onChange={(e) => setPromoText(e.target.value.toUpperCase())} placeholder="CODIGO" /><Button variant="secondary" disabled={promoText.trim().length < 3} onClick={applyPromo}>Aplicar</Button></div>
        {promo && <p className="mt-2 text-sm text-primary">{promo.code}: {promo.discount_pct}% de descuento {promo.duration_months ? `durante ${promo.duration_months} mes(es)` : "para siempre"}{promo.plan_id ? ` · solo plan ${getPlan(promo.plan_id as SaasPlanId).name}` : ""} <button className="ml-2 text-xs text-muted-foreground underline" onClick={() => { setPromo(null); setPromoText(""); }}>Quitar</button></p>}</div>
      <p className="mt-3 text-xs text-muted-foreground">{TRIAL_DAYS} días gratis. No pedimos tarjeta todavía.</p></div>}
    {step === 2 && <div className="grid gap-4"><h1 className="text-2xl font-bold">La marca de tu box</h1>
      <ThemeSelector value={f.theme} onChange={theme => setF({ ...f, theme })} />
      <div><LogoUpload tenant={null} onUploaded={url => setF({ ...f, logo: url })} /><Label>Logo (enlace https a la imagen)</Label><Input value={f.logo} onChange={(e) => setF({ ...f, logo: e.target.value })} placeholder="https://…/logo.png" />{f.logo && !isValidLogoUrl(f.logo) && <p className="mt-1 text-xs text-destructive">Debe empezar por https://</p>}</div>
      <div className="rounded-xl border border-border bg-card p-6 text-center"><p className="mb-3 text-xs text-muted-foreground">Así verán tus socios el acceso</p>{f.logo && isValidLogoUrl(f.logo) ? <BrandImage url={f.logo} alt="Logo" className="mx-auto h-14 object-contain" /> : <p className="text-2xl font-bold">{f.name || "Tu box"}</p>}<Button className="mt-4" size="sm">Entrar</Button></div></div>}
    {step === 3 && <div className="grid gap-4"><h1 className="text-2xl font-bold">Ajustes básicos</h1>
      <fieldset><legend className="mb-3 font-semibold">Actividades de tu gimnasio · {activities.length}{plan.maxActivityTypes === null ? " seleccionadas" : ` / ${plan.maxActivityTypes}`}</legend><div className="grid max-h-96 grid-cols-2 gap-2 overflow-y-auto">{DEFAULT_ACTIVITIES.map(name => <label key={name} className={cn("flex items-center gap-3 rounded-lg border p-3", activities.includes(name) ? "border-primary bg-primary/10" : "border-border")}><Checkbox aria-label={name} checked={activities.includes(name)} disabled={!activities.includes(name) && plan.maxActivityTypes !== null && activities.length >= plan.maxActivityTypes} onCheckedChange={checked => setActivities(current => checked ? [...current, name] : current.filter(n => n !== name))}/><ActivityMark name={name} className="h-8 w-8"/><span className="text-sm">{name}</span></label>)}</div>{!validActivitySelection(activities, plan.maxActivityTypes) && <p role="alert" className="mt-2 text-sm text-destructive">Selecciona al menos una actividad, sin superar el límite de tu plan.</p>}</fieldset>
      <div><Label>Redondeo de discos (kg)</Label><Input type="number" step="0.5" value={f.rounding} onChange={(e) => setF({ ...f, rounding: Number(e.target.value) || 2.5 })} /></div>
      <div><Label>Horas antes para cancelar clases con pocos asistentes</Label><Input type="number" value={f.cancelHours} onChange={(e) => setF({ ...f, cancelHours: Number(e.target.value) || 0 })} /></div>
      <div><Label>Mínimo de asistentes por clase</Label><Input type="number" value={f.minAttendees} onChange={(e) => setF({ ...f, minAttendees: Number(e.target.value) || 0 })} /></div>
      <label className="flex items-center justify-between text-sm"><span>Reserva de espacios (sauna, pádel){!plan.facilities && <span className="block text-xs text-muted-foreground">Disponible en Pro y Elite</span>}</span><Switch disabled={!plan.facilities} checked={f.facilities} onCheckedChange={(v) => setF({ ...f, facilities: v })} /></label></div>}
    {step === 4 && created && <div className="text-center"><Check className="mx-auto h-12 w-12 text-primary" /><h1 className="mt-3 text-2xl font-bold">¡{f.name} está listo!</h1><p className="mt-2 text-muted-foreground">Comparte este enlace con tus socios:</p>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-card p-3"><span className="flex-1 truncate font-mono text-sm">{link}</span><Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(link); toast.success("Enlace copiado"); }}><Copy />Copiar</Button></div>
      <ul className="mt-6 space-y-2 text-left text-sm">{["Crea tu horario fijo de clases", "Configura las cuotas de tus socios", "Invita a tus coaches con el código", "Comparte el enlace o ponlo en el mostrador"].map((t) => <li key={t} className="rounded-lg border border-border p-3">☐ {t}</li>)}</ul>
      <Button className="mt-6" onClick={() => { setTenantId(created.id); setView("box"); navigate({ to: "/admin" }); }}>Ir a la gestión de mi box</Button></div>}
    {step < 4 && <div className="mt-8 flex justify-between"><Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Atrás</Button>
      {step < 3 ? <Button disabled={!canNext} onClick={() => setStep(step + 1)}>Siguiente</Button> : <Button disabled={busy || !canNext} onClick={create}>{busy ? "Creando…" : "Crear gimnasio"}</Button>}</div>}
  </Shell>;
}
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-brand"><header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5"><Link to="/"><Logo /></Link></header><main className="mx-auto max-w-2xl px-5 pb-16">{children}</main></div>;
}
