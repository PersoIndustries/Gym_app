import { BrandImage } from "@/components/BrandImage";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, DoorOpen, Trophy, Eye, Home, ListChecks, LogOut, Settings2, User, Clock3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { myPlanQuery } from "@/lib/data/gym";
import { needsMembershipWait } from "@/lib/access/content";
import { supabase } from "@/integrations/supabase/client";
import { isBoxStaff, useSession } from "@/lib/auth/session";
import { settingsQuery } from "@/lib/data/box";
import { facilitiesVisible } from "@/lib/access/events";
import { Logo } from "./Logo";
import { useApplyTheme } from "@/lib/brand/use-box-theme";
import { RoleSwitcher } from "./RoleSwitcher";

/** Shell mobile-first para atletas y staff del box: barra inferior en móvil, sidebar en escritorio. */
export function AppShell({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const { role, realRole, boxMode, setBoxMode, tenantName, tenantId, user } = useSession();
  const quota = useQuery(myPlanQuery(tenantId, user?.id));
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

  if (tenantId && role === "athlete" && quota.isPending) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Comprobando tu acceso…</div>;
  if (needsMembershipWait(role, !!tenantId, !!quota.data)) return <div className="flex min-h-screen flex-col bg-background px-6"><header className="mx-auto flex w-full max-w-lg items-center justify-between py-6"><Logo/><Button variant="ghost" onClick={signOut}><LogOut className="h-4 w-4"/>Salir</Button></header><main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center pb-24 text-center"><Clock3 className="mb-5 h-12 w-12 text-primary"/><p className="mb-2 text-sm text-muted-foreground">{tenantName}</p><h1 className="text-2xl font-bold">Tu acceso está pendiente</h1><p className="mt-3 max-w-sm text-muted-foreground">Espera a que tu gimnasio te asigne una cuota activa para entrar.</p>{quota.isError && <p role="alert" className="mt-3 text-sm text-destructive">No se pudo comprobar tu cuota. Inténtalo de nuevo.</p>}<Button className="mt-6" variant="outline" disabled={quota.isFetching} onClick={() => quota.refetch()}><RefreshCw className="h-4 w-4"/>Comprobar acceso</Button>{canToggle && <Button className="mt-3" variant="ghost" onClick={toggle}><Eye className="h-4 w-4"/>Volver a gestión</Button>}</main></div>;

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <Link to="/dev-home" aria-label="Inicio de desarrollo">{brand?.logo_url ? <BrandImage url={brand.logo_url} alt={tenantName ?? "Logo del box"} className="h-10 max-w-[10rem] object-contain" /> : <Logo />}</Link>
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
