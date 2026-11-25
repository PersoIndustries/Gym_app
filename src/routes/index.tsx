import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Dumbbell, Palette, ShieldCheck, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { PricingCards } from "@/components/marketing/PricingCards";
import { pageHead } from "@/lib/seo";
import { AccountAccess } from "@/components/layout/AccountAccess";

export const Route = createFileRoute("/")({ head: pageHead("Software para boxes de CrossFit", "Clases, WOD con kilos según tu RM, asistencia, cuotas y reservas para tu box. Desde 10 €/mes."), component: Landing });
const FEATURES = [
  { i: CalendarDays, t: "Clases y asistencia", d: "Asistiré o no asistiré, aforo, lista de espera y cancelación automática por mínimo." },
  { i: Dumbbell, t: "WOD con kilos por RM", d: "Cada atleta ve su peso según su RM y su nivel: RX, Scaled u Open." },
  { i: Users, t: "Socios y cuotas", d: "Cuotas por días, actividades y franjas de acceso a instalaciones." },
  { i: Trophy, t: "Eventos y comunidad", d: "Competiciones internas y carreras de la comunidad, con búsqueda de pareja." },
  { i: Palette, t: "Tu marca", d: "Tu logo y un tema de colores en el acceso de tus socios." },
  { i: ShieldCheck, t: "Datos aislados", d: "Cada box tiene sus datos protegidos y separados de los demás." },
];
function Landing() {
  return <div className="min-h-screen bg-background">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><Logo /><nav className="flex items-center gap-2"><Button asChild variant="ghost"><Link to="/precios">Precios</Link></Button><AccountAccess /><Button asChild><Link to="/empezar" search={{ plan: "pro" }}>Crear mi gimnasio</Link></Button></nav></header>
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">Para dueños de box</p>
      <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-bold leading-tight md:text-6xl">Gestiona tu box. Tus atletas entrenan con su peso exacto.</h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Horarios, WOD, reservas, cuotas y comunidad en una sola app con la marca de tu gimnasio.</p>
      <div className="mt-8 flex justify-center gap-3"><Button asChild size="lg"><Link to="/empezar" search={{ plan: "pro" }}>Empezar 14 días gratis</Link></Button><Button asChild size="lg" variant="secondary"><Link to="/precios">Ver precios</Link></Button></div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-20 sm:grid-cols-2 lg:grid-cols-3">{FEATURES.map(({ i: I, t, d }) => <div key={t} className="rounded-xl border border-border bg-card p-6"><I className="h-6 w-6 text-primary" /><h2 className="mt-3 font-semibold">{t}</h2><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>)}</section>
    <section className="mx-auto max-w-6xl px-5 pb-24"><h2 className="mb-8 text-center text-3xl font-bold">Precios claros</h2><PricingCards /></section>
    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground"><Link to="/eventos" className="hover:text-foreground">Comunidad</Link> · <Link to="/terminos" className="hover:text-foreground">Términos</Link> · <Link to="/privacidad" className="hover:text-foreground">Privacidad</Link></footer>
  </div>;
}
