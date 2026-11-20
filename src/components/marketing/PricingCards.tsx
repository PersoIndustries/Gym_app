import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAAS_PLANS, TRIAL_DAYS } from "@/lib/access/saas-plans";
import { cn } from "@/lib/utils";

export function PricingCards() {
  const [yearly, setYearly] = useState(false);
  return <div>
    <div className="mb-6 flex justify-center"><div className="inline-flex rounded-full border border-border bg-card p-1 text-sm">
      {[false, true].map((y) => <button key={String(y)} onClick={() => setYearly(y)} className={cn("rounded-full px-4 py-1.5", yearly === y ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{y ? "Anual · 2 meses gratis" : "Mensual"}</button>)}
    </div></div>
    <div className="grid gap-4 md:grid-cols-3">{SAAS_PLANS.map((p) => <div key={p.id} className={cn("flex flex-col rounded-2xl border bg-card p-6", p.id === "pro" ? "border-primary shadow-lg" : "border-border")}>
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{p.tagline}</p>
      <h3 className="mt-2 text-2xl font-bold">{p.name}</h3>
      <p className="mt-3"><span className="text-4xl font-bold">{yearly ? p.year : p.month} €</span><span className="text-muted-foreground">/{yearly ? "año" : "mes"}</span></p>
      <ul className="mt-5 flex-1 space-y-2 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{f}</li>)}</ul>
      <Button asChild className="mt-6" variant={p.id === "pro" ? "default" : "secondary"}><Link to="/empezar" search={{ plan: p.id }}>Probar {TRIAL_DAYS} días gratis</Link></Button>
    </div>)}</div>
  </div>;
}
