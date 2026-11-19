import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GymCalendar } from "@/components/GymCalendar";
import { isBoxStaff, useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/_authenticated/calendar")({ head: pageHead("Calendario del gimnasio", "Clases por semana y mes, vacaciones y cierres de tu gimnasio."), component: CalendarPage });
function CalendarPage() { const { role } = useSession(); return <AppShell title="Calendario del gimnasio"><GymCalendar staff={isBoxStaff(role)} /></AppShell>; }
