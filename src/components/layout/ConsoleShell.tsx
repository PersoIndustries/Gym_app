import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BarChart3, Building2, Code2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";
import { RoleSwitcher } from "./RoleSwitcher";

/** Consola web-first para Super Admin / Developer: sidebar fijo, contenido ancho y denso. */
export function ConsoleShell({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  const navigate = useNavigate();
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); };
  const items = [{ to: "/platform", label: "Gimnasios", icon: Building2 }, { to: "/metrics", label: "Métricas", icon: BarChart3 }, { to: "/dev", label: "Dev / Roadmap", icon: Code2 }] as const;
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-3 lg:w-64 lg:p-5">
        <div className="hidden lg:block"><Logo /><p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Consola plataforma</p></div>
        <nav className="mt-2 flex flex-1 flex-col gap-1 lg:mt-8">
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} title={label} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent text-primary" }}>
              <Icon className="h-4 w-4 shrink-0" /><span className="hidden lg:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block"><RoleSwitcher className="mb-2" /></div>
        <button onClick={signOut} title="Salir" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent"><LogOut className="h-4 w-4" /><span className="hidden lg:inline">Salir</span></button>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-6 py-6 lg:px-10">
          <div><h1 className="text-2xl font-bold lg:text-3xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div>
          <div className="flex items-center gap-2">{action}<div className="lg:hidden"><RoleSwitcher className="w-40" /></div></div>
        </header>
        <main className="px-6 py-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
