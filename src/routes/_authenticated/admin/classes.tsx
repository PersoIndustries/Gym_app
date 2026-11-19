import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { CLASSES } from "@/lib/data/mock";
import { pageHead } from "@/lib/seo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/classes")({ head: pageHead("Clases", "Gestión de clases."), component: AdminClasses });
function AdminClasses() {
  return (
    <AppShell title="Clases" action={<Button size="sm" onClick={() => toast("Crear clase: pendiente de conectar con la base de datos")}>Nueva</Button>}>
      <div className="space-y-2">{CLASSES.slice(0, 14).map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <div><p className="font-medium">{c.title}</p><p className="text-xs capitalize text-muted-foreground">{new Date(c.starts_at).toLocaleString("es-ES", { weekday: "short", hour: "2-digit", minute: "2-digit" })} · {c.coach}</p></div>
          <span className="font-display">{c.booked}/{c.capacity}</span>
        </div>))}</div>
    </AppShell>
  );
}
