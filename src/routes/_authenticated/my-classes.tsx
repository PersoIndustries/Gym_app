import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { ClassCard } from "@/components/ClassCard";
import { EMPTY_COUNTS, classesQuery } from "@/lib/data/box";
import { useClassActions } from "@/lib/data/use-class-actions";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";
import { isUpcomingEnrollment } from "@/lib/access/class-state";
import { coachesQuery } from "@/lib/data/gym";

export const Route = createFileRoute("/_authenticated/my-classes")({ head: pageHead("Mis clases", "Clases a las que te has apuntado."), component: MyClasses });
function MyClasses() {
  const { tenantId } = useSession();
  const a = useQuery(classesQuery(tenantId, 0)); const b = useQuery(classesQuery(tenantId, 1));
  const { data: coaches = [] } = useQuery(coachesQuery(tenantId));
  const { book, leave, busy } = useClassActions();
  const all = [a.data, b.data].flatMap((d) => (d ? d.classes.filter((c) => isUpcomingEnrollment(c, d.mine[c.id])).map((c) => ({ c, d })) : []));
  return (
    <AppShell title="Mis clases">
      {all.length === 0 ? <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No tienes clases próximas.</p> :
        <div className="space-y-2">{all.map(({ c, d }) => <div key={c.id}><p className="mb-1 text-xs capitalize text-muted-foreground">{new Date(c.starts_at).toLocaleDateString("es-ES", { weekday: "long", day: "numeric" })}</p>
          <ClassCard c={c} coachAvatar={coaches.find(p => p.user_id === c.coach_id)?.avatar_url} counts={d.counts[c.id] ?? EMPTY_COUNTS} mine={d.mine[c.id]} busy={busy} onIntent={(intent) => book.mutate({ id: c.id, intent })} onLeave={() => leave.mutate(c.id)} /></div>)}</div>}
    </AppShell>
  );
}
