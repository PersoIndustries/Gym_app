import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ActivityLogos } from "@/components/ActivityLogos";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/activities")({ head: pageHead("Actividades", "Actividades del box, modos y logos."), component: () => <AppShell title="Actividades"><ActivityLogos /></AppShell> });
