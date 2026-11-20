import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { BrandSettings } from "@/components/admin/BoxSettings";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/brand")({ head: pageHead("Tu marca", "Logo y tema del box."), component: () => <AppShell title="Tu marca"><BrandSettings /></AppShell> });
