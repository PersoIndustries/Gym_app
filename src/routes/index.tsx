import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { CalendarDays, ShieldCheck, Trophy, Waves } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "BoxFlow — Gestión para boxes y gimnasios" },
    { name: "description", content: "Clases, cuotas, RMs e instalaciones para boxes de CrossFit, HIIT y gimnasios." },
    { property: "og:title", content: "BoxFlow — Gestión para boxes y gimnasios" },
    { property: "og:description", content: "Clases, cuotas, RMs e instalaciones para boxes de CrossFit, HIIT y gimnasios." },
  ] }),
  component: Landing,
});

function Landing() {
  const features = [
    { icon: CalendarDays, t: "Calendario de clases", d: "Reserva en dos toques desde el móvil." },
    { icon: ShieldCheck, t: "Cuotas con reglas", d: "Entre semana, completa o weekend: cada una abre sus clases." },
    { icon: Trophy, t: "Tus RMs", d: "Lleva el registro de tus levantamientos principales." },
    { icon: Waves, t: "Instalaciones", d: "Pádel, tenis o sauna en el mismo sitio. Próximamente." },
  ];
  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><Logo /><Button asChild variant="ghost"><Link to="/auth">Entrar</Link></Button></header>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 md:pt-24">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Para boxes, HIIT y clubs</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.05] md:text-7xl">Tu box, organizado de la reserva al PR.</h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">Clases, cuotas y atletas en una sola app. Pensada para el móvil de tus socios y la mesa de tu equipo.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg" className="shadow-glow"><Link to="/auth">Empezar</Link></Button><Button asChild size="lg" variant="secondary"><Link to="/auth">Tengo un código</Link></Button></div>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: I, t, d }) => (
            <div key={t} className="rounded-xl border border-border bg-card/70 p-5"><I className="h-5 w-5 text-primary" /><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}
