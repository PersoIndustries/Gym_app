import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { QuotaAccessCodes } from "@/components/QuotaAccessCodes";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/codes")({ head: pageHead("Códigos de acceso", "Invitaciones al box con cuota automática."), component: () => <AppShell title="Códigos de acceso"><QuotaAccessCodes /></AppShell> });
