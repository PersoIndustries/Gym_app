import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, DoorOpen, Trophy, Eye, Home, ListChecks, LogOut, Settings2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isBoxStaff, useSession } from "@/lib/auth/session";
import { settingsQuery } from "@/lib/data/box";
import { facilitiesVisible } from "@/lib/access/events";
import { Logo } from "./Logo";
import { useApplyTheme } from "@/lib/brand/use-box-theme";
import { RoleSwitcher } from "./RoleSwitcher";

/** Shell mobile-first para atletas y staff del box: barra inferior en móvil, sidebar en escritorio. */
export function AppShell({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const { role, realRole, boxMode, setBoxMode, tenantName, tenantId } = useSession();
  const { data: settings } = useQuery(settingsQuery(tenantId));
  const showSpaces = facilitiesVisible(!!settings?.facilities_enabled, isBoxStaff(role));
  const brand = settings as { theme_preset?: string; logo_url?: string | null } | null | undefined;
  useApplyTheme(brand?.theme_preset);
  const canToggle = realRole === "coach" || realRole === "admin";
  const toggle = () => { const m = boxMode === "athlete" ? "staff" : "athlete"; setBoxMode(m); navigate({ to: m === "staff" ? "/admin" : "/dashboard" }); };
  const navigate = useNavigate();
  const items = [
    { to: "/dashboard" as const, label: "Inicio", icon: Home },
    { to: "/calendar" as const, label: "Calendario", icon: CalendarDays },
    { to: "/my-classes" as const, label: "Mis clases", icon: ListChecks },
    { to: "/events" as const, label: "Eventos", icon: Trophy },
    ...(showSpaces ? [{ to: "/spaces" as const, label: "Espacios", icon: DoorOpen }] : []),
    ...(isBoxStaff(role) ? [{ to: "/admin" as const, label: "Gestión", icon: Settings2 }] : []),
    { to: "/profile" as const, label: "Perfil", icon: User },
  ];
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); };

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <Link to="/" aria-label="Inicio de desarrollo">{brand?.logo_url ? <img src={brand.logo_url} alt={tenantName ?? "Logo del box"} className="h-10 max-w-[10rem] object-contain" /> : <Logo />}</Link>
        <p className="mt-1 text-xs text-muted-foreground">{tenantName ?? "BoxFlow"}</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent text-primary" }}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
        </nav>
        {canToggle && <button onClick={toggle} className="mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent"><Eye className="h-4 w-4" />{boxMode === "athlete" ? "Volver a vista staff" : "Ver como usuario del gym"}</button>}
        <RoleSwitcher className="mb-2" />
        <button onClick={signOut} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent"><LogOut className="h-4 w-4" />Salir</button>
      </aside>
      <div className="flex-1 pb-safe md:pb-8">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8 md:py-5">
          <div>
            <p className="text-xs text-muted-foreground md:hidden">{tenantName ?? "BoxFlow"}</p>
            <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
          </div>
          <div className="flex items-center gap-2">{action}{canToggle && <button onClick={toggle} aria-label="Cambiar vista" className="rounded-md p-2 text-muted-foreground md:hidden"><Eye className="h-5 w-5" /></button>}<RoleSwitcher className="w-36 md:hidden" /></div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-5 md:px-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
        {items.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground" activeProps={{ className: "text-primary" }}>
            <Icon className="h-5 w-5" />{label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
