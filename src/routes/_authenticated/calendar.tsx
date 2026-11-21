import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { GymCalendar } from "@/components/GymCalendar";
import { EventsBrowser } from "@/components/events/EventsBrowser";
import { isBoxStaff, useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/calendar")({ head: pageHead("Calendarios", "Calendario de tu box, de gestión y de la comunidad: clases, cierres, eventos y carreras."), component: CalendarPage });

type Tab = "box" | "staff" | "events";
function CalendarPage() {
  const { role, tenantId } = useSession();
  const staff = isBoxStaff(role);
  const [tab, setTab] = useState<Tab>(staff ? "staff" : "box");
  const tabs: [Tab, string][] = [["box", "Mi box"], ...(staff ? [["staff", "Gestión"] as [Tab, string]] : []), ["events", "Eventos"]];
  return <AppShell title="Calendarios">
    <div role="tablist" className="mb-4 flex w-full rounded-lg bg-muted p-1 sm:w-auto sm:inline-flex">{tabs.map(([k, l]) => <Button key={k} role="tab" aria-selected={tab === k} size="sm" className="h-8 flex-1" variant={tab === k ? "default" : "ghost"} onClick={() => setTab(k)}>{l}</Button>)}</div>
    {tab !== "events" ? <GymCalendar key={tab} staff={tab === "staff"} /> : <EventsBrowser tenant={tenantId} />}
  </AppShell>;
}

