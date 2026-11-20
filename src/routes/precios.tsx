import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { PricingCards } from "@/components/marketing/PricingCards";
import { SAAS_PLANS } from "@/lib/access/saas-plans";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/precios")({ head: pageHead("Precios", "Starter 10 €, Pro 25 € y Elite 50 € al mes. Prueba 14 días gratis."), component: Pricing });
const yes = (v: boolean) => (v ? "Sí" : "—");
const lim = (v: number | null) => (v === null ? "Ilimitado" : String(v));
const ROWS: [string, (p: (typeof SAAS_PLANS)[number]) => string][] = [
  ["Gimnasios", (p) => String(p.maxGyms)], ["Socios por gimnasio", (p) => lim(p.maxMembers)], ["Tipos de clase por gimnasio", (p) => lim(p.maxActivityTypes)], ["Coaches/staff", (p) => lim(p.maxStaff)], ["Cuotas de socio", (p) => lim(p.maxMemberPlans)],
  ["Reserva de espacios", (p) => yes(p.facilities)], ["Métricas avanzadas", (p) => yes(p.advancedMetrics)], ["Dominio personalizado", (p) => (p.customDomain ? "Próximamente" : "—")],
];
function Pricing() {
  return <div className="min-h-screen bg-background"><header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><Link to="/"><Logo /></Link><Button asChild variant="ghost"><Link to="/auth">Entrar</Link></Button></header>
    <main className="mx-auto max-w-6xl px-5 py-10"><h1 className="mb-2 text-center text-4xl font-bold">Elige tu plan</h1><p className="mb-10 text-center text-muted-foreground">Sin permanencia. Cambia de plan cuando tu box crezca.</p><PricingCards />
      <div className="mt-14 overflow-x-auto rounded-xl border border-border"><table className="w-full text-sm"><thead className="bg-muted"><tr><th className="p-3 text-left">Comparativa</th>{SAAS_PLANS.map((p) => <th key={p.id} className="p-3">{p.name}</th>)}</tr></thead>
        <tbody>{ROWS.map(([l, f]) => <tr key={l} className="border-t border-border"><td className="p-3">{l}</td>{SAAS_PLANS.map((p) => <td key={p.id} className="p-3 text-center">{f(p)}</td>)}</tr>)}</tbody></table></div>
    </main></div>;
}
