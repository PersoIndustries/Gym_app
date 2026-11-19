import { createFileRoute, Link } from "@tanstack/react-router";
import { RealTenants } from "@/components/platform/RealTenants";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/_authenticated/create-gym")({ head: pageHead("Crear gimnasio", "Alta de gimnasios en BoxFlow."), component: CreateGym });
function CreateGym() { const { platformRole } = useSession(); return <main className="mx-auto max-w-5xl p-6"><div className="mb-8 flex items-center justify-between"><h1 className="text-2xl font-bold">Crear gimnasio</h1><Button asChild variant="ghost"><Link to="/">Inicio</Link></Button></div>{platformRole === "super_admin" ? <RealTenants /> : <p className="text-muted-foreground">Solo el Super Admin puede dar de alta gimnasios.</p>}</main>; }
