import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { BoxSettings } from "@/components/admin/BoxSettings";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/settings")({ head: pageHead("Ajustes", "Instalaciones y niveles del WOD."), component: () => <AppShell title="Ajustes"><BoxSettings /></AppShell> });
