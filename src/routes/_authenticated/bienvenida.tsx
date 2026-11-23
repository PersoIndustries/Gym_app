import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Dumbbell, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { useSession } from "@/lib/auth/session";
import { authDestination } from "@/lib/auth/flow";
import { pageHead } from "@/lib/seo";
import { AccountAccess } from "@/components/layout/AccountAccess";

export const Route = createFileRoute("/_authenticated/bienvenida")({ head: pageHead("Bienvenido a Meowscle", "Únete a tu gimnasio con su código o crea tu propio box."), component: Welcome });

function Welcome() {
  const { loading, user, realRole, platformRole } = useSession();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user && (realRole || platformRole)) void navigate({ ...authDestination({}, realRole, platformRole), replace: true });
  }, [loading, user, realRole, platformRole, navigate]);
  return <main className="grid min-h-screen place-items-center bg-hero px-5 py-10"><div className="w-full max-w-lg">
    <header className="flex items-center justify-between"><Logo /><AccountAccess /></header><h1 className="mt-8 text-3xl font-bold">Bienvenido a Meowscle</h1>
    {loading || realRole || platformRole ? <p className="mt-6 text-muted-foreground">Preparando tu acceso…</p> : <div className="mt-8 grid gap-4">
      <Button asChild variant="outline" className="h-auto justify-start gap-4 whitespace-normal p-5 text-left"><Link to="/join"><Dumbbell className="size-6 shrink-0 text-primary" /><span className="flex-1"><span className="block text-lg font-semibold">Tengo un código de mi gimnasio</span><span className="block text-sm font-normal text-muted-foreground">Unirme a mi box</span></span><ArrowRight className="size-5 shrink-0" /></Link></Button>
      <Button asChild variant="outline" className="h-auto justify-start gap-4 whitespace-normal p-5 text-left"><Link to="/empezar" search={{ plan: "pro" }}><Building2 className="size-6 shrink-0 text-primary" /><span className="flex-1"><span className="block text-lg font-semibold">Quiero crear un gimnasio</span><span className="block text-sm font-normal text-muted-foreground">Dar de alta mi box</span></span><ArrowRight className="size-5 shrink-0" /></Link></Button>
    </div>}
  </div></main>;
}