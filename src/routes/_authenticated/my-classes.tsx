import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ClassCard } from "@/components/ClassCard";
import { CLASSES } from "@/lib/data/mock";
import { useBookings } from "@/lib/data/bookings";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/my-classes")({ head: pageHead("Mis clases", "Tus reservas."), component: MyClasses });

function MyClasses() {
  const { ids, toggle } = useBookings();
  const mine = CLASSES.filter((c) => ids.includes(c.id));
  return (
    <AppShell title="Mis clases">
      {mine.length === 0 ? <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No tienes clases reservadas.</p> :
        <div className="space-y-2">{mine.map((c) => <div key={c.id}><p className="mb-1 text-xs capitalize text-muted-foreground">{new Date(c.starts_at).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })}</p><ClassCard c={c} booked onToggle={() => toggle(c.id)} /></div>)}</div>}
    </AppShell>
  );
}
