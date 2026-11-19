import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EventEditor } from "./EventEditor";
import { fmtEventDate } from "./EventCard";
import { moderateEvent, moderationEventsQuery } from "@/lib/data/events";

/** Moderación de la comunidad (Super Admin): destacar, ocultar y publicar eventos de plataforma. */
export function CommunityModeration() {
  const qc = useQueryClient();
  const { data = [] } = useQuery(moderationEventsQuery());
  const m = useMutation({ mutationFn: (v: { id: string; status?: string; featured?: boolean }) => moderateEvent(v.id, v), onSuccess: () => qc.invalidateQueries({ queryKey: ["community-events"] }), onError: (e) => toast.error(e instanceof Error ? e.message : String(e)) });
  return <section className="mt-10">
    <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Eventos de la comunidad</h2><EventEditor tenant={null} /></div>
    <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="p-3">Evento</th><th className="p-3">Publicado por</th><th className="p-3">Fecha</th><th className="p-3">Estado</th><th className="p-3 text-right">Acciones</th></tr></thead>
      <tbody>{data.map(e => <tr key={e.id} className="border-t border-border"><td className="p-3 font-medium">{e.featured && <Star className="mr-1 inline h-3.5 w-3.5 text-primary" />}{e.title}</td><td className="p-3 text-muted-foreground">{e.tenants?.name ?? "Plataforma"}</td><td className="p-3">{fmtEventDate(e)}</td><td className="p-3">{e.status === "published" ? "Publicado" : "Oculto"}</td>
        <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => m.mutate({ id: e.id, featured: !e.featured })}>{e.featured ? "Quitar destacado" : "Destacar"}</Button><Button size="sm" variant="ghost" aria-label={e.status === "published" ? "Ocultar" : "Publicar"} onClick={() => m.mutate({ id: e.id, status: e.status === "published" ? "hidden" : "published" })}>{e.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></td></tr>)}
        {!data.length && <tr><td colSpan={5} className="p-4 text-muted-foreground">Sin eventos.</td></tr>}</tbody></table></div>
  </section>;
}
