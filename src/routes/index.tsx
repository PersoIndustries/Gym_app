import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Building2, Plus, CalendarDays, Code2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { useSession } from "@/lib/auth/session";
import { tenantLinksQuery } from "@/lib/data/gym";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/")({ head: pageHead("Inicio de desarrollo", "Accesos temporales a gimnasios y gestión de BoxFlow."), component: DevelopmentHome });
function DevelopmentHome() {
 const { user, memberships, setTenantId, setView } = useSession();
 const { data: tenants = [], isError } = useQuery({ ...tenantLinksQuery(), enabled: !!user });
 return <div className="min-h-screen bg-background"><header className="mx-auto flex max-w-5xl items-center justify-between border-b border-border px-5 py-5"><Logo /><Button asChild variant="secondary"><Link to={user ? "/dashboard" : "/auth"}>{user ? "Abrir mi box" : "Entrar"}<ArrowUpRight /></Link></Button></header>
 <main className="mx-auto max-w-5xl px-5 py-10"><p className="text-xs font-semibold uppercase text-warning">Desarrollo · temporal</p><h1 className="mt-3 text-4xl font-bold">BoxFlow</h1><div className="mt-8 flex flex-wrap gap-2"><Button asChild><Link to="/create-gym"><Plus />Crear gimnasio</Link></Button><Button asChild variant="secondary"><Link to="/join"><Building2 />Unirme a un box</Link></Button><Button asChild variant="secondary"><Link to="/calendar"><CalendarDays />Calendario</Link></Button><Button asChild variant="outline"><Link to="/platform"><Users />Super Admin</Link></Button><Button asChild variant="outline"><Link to="/dev"><Code2 />Desarrollo</Link></Button></div>
 <section className="mt-10 border-t border-border pt-6"><h2 className="text-xl font-semibold">Gimnasios</h2>{!user && <div className="mt-4"><Button asChild variant="outline"><Link to="/b/$code" params={{code:"IRON24"}}>Iron Harbor CrossFit <ArrowUpRight /></Link></Button><p className="mt-4 text-sm text-muted-foreground">Entra para ver los gimnasios a los que tienes acceso.</p></div>}{isError && <p role="alert" className="mt-4 text-destructive">No se pudieron cargar los gimnasios.</p>}
 <div className="mt-4 grid gap-3 sm:grid-cols-2">{tenants.map(t => { const member = memberships.some(m => m.tenant_id === t.id); const code = t.tenant_invites[0]?.code; return <div key={t.id} className="rounded-lg border border-border bg-card p-5"><Building2 className="h-6 w-6 text-primary"/><h3 className="mt-3 font-semibold">{t.name}</h3><p className="mt-1 text-sm text-muted-foreground">{t.city ?? ""}</p><div className="mt-4 flex gap-2">{member && <Button asChild size="sm"><Link to="/dashboard" onClick={() => {setTenantId(t.id);setView("box");}}>Abrir box<ArrowUpRight /></Link></Button>}{code && <Button asChild size="sm" variant="outline"><Link to="/b/$code" params={{code}}>Acceso {code}</Link></Button>}</div></div>; })}</div></section></main></div>;
}
