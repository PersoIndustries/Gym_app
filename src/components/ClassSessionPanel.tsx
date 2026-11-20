import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateClass, type ClassSession } from "@/lib/data/box";
import type { ActivityMode } from "@/lib/brand/activities";

const hasContent = (s: ClassSession) => Object.entries(s).some(([k, v]) => k !== "published" && v !== null && v !== undefined && v !== "");
export function ClassSessionPanel({ classId, mode, session, staff, onDone }: { classId: string; mode: Exclude<ActivityMode, "wod">; session: ClassSession; staff: boolean; onDone: () => void }) {
  const [open, setOpen] = useState(false); const [f, setF] = useState<ClassSession>(session); const [busy, setBusy] = useState(false);
  if (mode === "open") return <p className="mt-6 text-sm text-muted-foreground">Sesión libre: sin entreno programado, solo horario y aforo.</p>;
  const filled = hasContent(session);
  if (!filled && !staff) return <p className="mt-6 text-sm text-muted-foreground">El profesor aún no ha publicado la sesión.</p>;
  const rows: [string, string | null | undefined][] = mode === "cardio"
    ? [["Distancia", session.distance_km ? `${session.distance_km.toLocaleString("es-ES")} km` : null], ["Ritmo", session.pace ? `${session.pace} min/km` : null], ["Duración", session.duration]]
    : [["Foco", session.focus], ["Duración", session.duration], ["Material", session.equipment]];
  const save = async () => { setBusy(true); try { await updateClass(classId, { session: f }); onDone(); setOpen(false); toast.success("Sesión guardada"); } catch { toast.error("No se pudo guardar la sesión"); } finally { setBusy(false); } };
  const field = (k: keyof ClassSession, label: string, ph = "") => <label className="text-sm">{label}<Input placeholder={ph} value={String(f[k] ?? "")} onChange={e => setF({ ...f, [k]: e.target.value })} /></label>;
  return <section className="mt-6 rounded-xl border border-border bg-card p-4">
    <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-semibold">{mode === "cardio" ? "Sesión de cardio" : "Sesión"}</h2>{staff && <Button size="sm" variant="outline" onClick={() => { setF(session); setOpen(true); }}><Pencil className="mr-1 h-4 w-4" />{filled ? "Editar" : "Programar"}</Button>}</div>
    {filled ? <>
      <dl className="grid grid-cols-3 gap-2">{rows.filter(([, v]) => v).map(([k, v]) => <div key={k} className="rounded-lg bg-muted/50 p-2"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-display text-lg font-bold break-words">{v}</dd></div>)}</dl>
      {session.description && <p className="mt-3 whitespace-pre-line text-sm">{session.description}</p>}
      {session.route_url && /^https:\/\//.test(session.route_url) && <a className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline" href={session.route_url} target="_blank" rel="noreferrer">Ver recorrido<ExternalLink className="h-3 w-3" /></a>}
    </> : <p className="text-sm text-muted-foreground">Aún sin programar. Los alumnos no verán esta sección hasta que la rellenes.</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{mode === "cardio" ? "Programar cardio" : "Programar sesión"}</DialogTitle></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">{mode === "cardio" ? <>
        <label className="text-sm">Distancia (km)<Input inputMode="decimal" value={f.distance_km ?? ""} onChange={e => { const v = e.target.value.replace(",", "."); setF({ ...f, distance_km: v ? Number(v) : null }); }} /></label>
        {field("pace", "Ritmo (min/km)", "5:30")}{field("duration", "Duración", "45 min")}{field("route_url", "Enlace al recorrido (https)", "https://strava.com/…")}
      </> : <>{field("focus", "Foco", "Core y glúteos")}{field("duration", "Duración", "50 min")}<div className="sm:col-span-2">{field("equipment", "Material", "Esterilla, gomas")}</div></>}
        <label className="text-sm sm:col-span-2">Descripción<Textarea rows={4} value={f.description ?? ""} onChange={e => setF({ ...f, description: e.target.value })} /></label></div>
      <Button disabled={busy || (!!f.route_url && !/^https:\/\//.test(f.route_url))} onClick={save}>Guardar sesión</Button></DialogContent></Dialog>
  </section>;
}
