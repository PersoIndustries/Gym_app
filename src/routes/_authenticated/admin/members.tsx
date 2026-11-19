import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { MEMBERS, PLANS } from "@/lib/data/mock";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/members")({ head: pageHead("Socios", "Socios del box."), component: Members });
function Members() {
  return (
    <AppShell title="Socios">
      <div className="space-y-2">{MEMBERS.map((m) => (
        <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <div className="min-w-0"><p className="truncate font-medium">{m.name}</p><p className="truncate text-xs text-muted-foreground">{m.email}</p></div>
          <div className="flex shrink-0 gap-1.5"><Badge variant="secondary">{m.role}</Badge><Badge variant={m.plan_id ? "outline" : "destructive"}>{PLANS.find((p) => p.id === m.plan_id)?.name ?? "Sin cuota"}</Badge></div>
        </div>))}</div>
    </AppShell>
  );
}
