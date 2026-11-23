import { BrandImage } from "@/components/BrandImage";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/layout/Logo";
import { brandingByCodeQuery, useApplyTheme } from "@/lib/brand/use-box-theme";

export const Route = createFileRoute("/b/$code")({
  head: ({ params }) => ({ meta: [
    { title: `Únete a tu box (${params.code.toUpperCase()}) — Meowscle` },
    { name: "description", content: "Entra con tu cuenta Meowscle o Google y únete a tu box en un paso." },
    { property: "og:title", content: "Únete a tu box en Meowscle" },
    { property: "og:description", content: "Reserva clases, ve el WOD y tus pesos según tus RMs." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: BoxEntry,
});

/** Puerta de entrada de un box concreto: misma cuenta para todos los boxes, guarda el código y continúa al acceso. */
function BoxEntry() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { data: brand, isLoading } = useQuery(brandingByCodeQuery(code));
  useApplyTheme(brand?.theme_preset);
  const go = () => { navigate({ to: "/auth", search: { code: code.toUpperCase() } }); };
  return (
    <div className="grid min-h-screen place-items-center bg-hero px-5">
      <div className="w-full max-w-sm space-y-5 text-center">
        {brand?.logo_url ? <BrandImage url={brand.logo_url} alt={brand.name} className="mx-auto h-20 max-w-[14rem] object-contain" /> : <div className="flex justify-center"><Logo /></div>}
        <h1 className="text-3xl font-bold">{brand ? `Bienvenido a ${brand.name}` : isLoading ? "…" : "Te han invitado a un box"}</h1>
        {!isLoading && !brand && <p role="alert" className="text-sm text-destructive">No encontramos un box activo con este código. Pídeselo de nuevo a tu gimnasio.</p>}
        <p className="text-muted-foreground">Código <span className="font-mono text-primary">{code.toUpperCase()}</span>. Usa tu cuenta de siempre: una sola cuenta sirve para todos tus boxes.</p>
        <Button size="lg" className="w-full" disabled={!brand} onClick={go}>Entrar o crear cuenta</Button>
        <p className="text-xs text-muted-foreground">Funciona con Meowscle</p>
      </div>
    </div>
  );
}
