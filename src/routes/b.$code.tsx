import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";

export const Route = createFileRoute("/b/$code")({
  head: ({ params }) => ({ meta: [
    { title: `Únete a tu box (${params.code.toUpperCase()}) — BoxFlow` },
    { name: "description", content: "Entra con tu cuenta BoxFlow o Google y únete a tu box en un paso." },
    { property: "og:title", content: "Únete a tu box en BoxFlow" },
    { property: "og:description", content: "Reserva clases, ve el WOD y tus pesos según tus RMs." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: BoxEntry,
});

/** Puerta de entrada de un box concreto: misma cuenta para todos los boxes, guarda el código y continúa al acceso. */
function BoxEntry() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const go = () => { sessionStorage.setItem("bf.pendingCode", code.toUpperCase()); navigate({ to: "/auth" }); };
  return (
    <div className="grid min-h-screen place-items-center bg-hero px-5">
      <div className="w-full max-w-sm space-y-5 text-center">
        <Logo />
        <h1 className="text-3xl font-bold">Te han invitado a un box</h1>
        <p className="text-muted-foreground">Código <span className="font-mono text-primary">{code.toUpperCase()}</span>. Usa tu cuenta de siempre: una sola cuenta sirve para todos tus boxes.</p>
        <Button size="lg" className="w-full" onClick={go}>Continuar</Button>
      </div>
    </div>
  );
}
