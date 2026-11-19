import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveEvent, type CommunityEvent } from "@/lib/data/events";
import { EVENT_FORMAT_LABEL, EVENT_KIND_LABEL } from "@/lib/access/events";

const local = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

/** Crear/editar evento o carrera. tenant=null → evento de plataforma (siempre comunidad). */
export function EventEditor({ tenant, event, activities = [] }: { tenant: string | null; event?: CommunityEvent; activities?: { id: string; name: string }[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const start = new Date(Date.now() + 7 * 864e5);
  const [f, setF] = useState(() => ({
    title: event?.title ?? "", description: event?.description ?? "", location: event?.location ?? "", url: event?.url ?? "",
    kind: event?.kind ?? "competition", format: event?.format ?? "individual", community: tenant ? event?.scope === "community" : true,
    starts_at: local(event?.starts_at ?? start.toISOString()), ends_at: local(event?.ends_at ?? new Date(start.getTime() + 4 * 36e5).toISOString()),
    price: event?.price_cents != null ? String(event.price_cents / 100) : "", capacity: event?.capacity != null ? String(event.capacity) : "",
    categories: (event?.categories ?? ["RX", "Scaled"]).join(", "), activity_type_ids: event?.activity_type_ids ?? [],
  }));
  const save = useMutation({
    mutationFn: () => saveEvent(tenant, event?.id ?? null, {
      title: f.title, description: f.description || null, location: f.location || null, url: f.url || null, kind: f.kind, format: f.format,
      scope: f.community ? "community" : "box", starts_at: new Date(f.starts_at).toISOString(), ends_at: new Date(f.ends_at).toISOString(),
      price_cents: f.price ? Math.round(Number(f.price.replace(",", ".")) * 100) : null, capacity: f.capacity ? Number(f.capacity) : null,
      categories: f.categories.split(",").map(s => s.trim()).filter(Boolean), activity_type_ids: f.activity_type_ids,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["community-events"] }); qc.invalidateQueries({ queryKey: ["community-event"] }); setOpen(false); toast.success("Evento guardado"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo guardar"),
  });
  return <>
    <Button size="sm" variant={event ? "outline" : "default"} onClick={() => setOpen(true)}>{event ? <><Pencil className="mr-1 h-4 w-4" />Editar</> : <><Plus className="mr-1 h-4 w-4" />Evento</>}</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{event ? "Editar evento" : "Nuevo evento o carrera"}</DialogTitle></DialogHeader>
      <label className="text-sm">Título<Input value={f.title} placeholder="Open interno, HYROX Madrid…" onChange={e => setF({ ...f, title: e.target.value })} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">Tipo<Select value={f.kind} onValueChange={kind => setF({ ...f, kind })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EVENT_KIND_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></label>
        <label className="text-sm">Formato<Select value={f.format} onValueChange={format => setF({ ...f, format })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EVENT_FORMAT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></label>
        <label className="text-sm">Inicio<Input type="datetime-local" value={f.starts_at} onChange={e => setF({ ...f, starts_at: e.target.value })} /></label>
        <label className="text-sm">Fin<Input type="datetime-local" value={f.ends_at} onChange={e => setF({ ...f, ends_at: e.target.value })} /></label>
        <label className="text-sm">Precio orientativo (€)<Input inputMode="decimal" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></label>
        <label className="text-sm">Plazas<Input type="number" min="1" value={f.capacity} onChange={e => setF({ ...f, capacity: e.target.value })} /></label>
      </div>
      <label className="text-sm">Lugar<Input value={f.location} onChange={e => setF({ ...f, location: e.target.value })} /></label>
      <label className="text-sm">Enlace de inscripción<Input type="url" placeholder="https://" value={f.url} onChange={e => setF({ ...f, url: e.target.value })} /></label>
      <label className="text-sm">Categorías (separadas por comas)<Input value={f.categories} onChange={e => setF({ ...f, categories: e.target.value })} /></label>
      <label className="text-sm">Descripción<Textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></label>
      {activities.length > 0 && <fieldset className="text-sm"><legend className="mb-1">Anunciar a socios de</legend><div className="flex flex-wrap gap-2">{activities.map(a => { const on = f.activity_type_ids.includes(a.id); return <Button key={a.id} type="button" size="sm" variant={on ? "default" : "outline"} onClick={() => setF({ ...f, activity_type_ids: on ? f.activity_type_ids.filter(x => x !== a.id) : [...f.activity_type_ids, a.id] })}>{a.name}</Button>; })}</div><p className="mt-1 text-xs text-muted-foreground">Sin selección: se anuncia a todo el box.</p></fieldset>}
      {tenant && <label className="flex items-center justify-between gap-3 text-sm">Publicar en la comunidad (visible para todos)<Switch checked={f.community} onCheckedChange={community => setF({ ...f, community })} /></label>}
      <Button disabled={save.isPending || !f.title.trim()} onClick={() => save.mutate()}>Guardar evento</Button>
    </DialogContent></Dialog>
  </>;
}
