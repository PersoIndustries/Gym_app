import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROADMAP_SEED } from "@/lib/data/mock";
import { useLocalState } from "@/lib/data/local-store";
import { PRIORITIES, syncDeliveredTasks, duplicateTask, moveTask, sortTasks } from "@/lib/data/tasks";
import { useSession } from "@/lib/auth/session";
import type { RoadmapItem, RoadmapStatus, TaskPriority } from "@/lib/domain/types";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

const COLS: { s: RoadmapStatus; label: string }[] = [{ s: "pending", label: "Pendiente" }, { s: "in_progress", label: "En progreso" }, { s: "done", label: "Hecho" }];
const PRIO_CLASS: Record<TaskPriority, string> = { urgent: "bg-destructive text-destructive-foreground", high: "bg-primary text-primary-foreground", medium: "bg-secondary text-secondary-foreground", low: "bg-muted text-muted-foreground" };
const prioLabel = (p?: TaskPriority) => PRIORITIES.find((x) => x.p === (p ?? "medium"))!.label;

export const Route = createFileRoute("/_authenticated/dev")({ head: pageHead("Dev / Roadmap", "Tareas de la plataforma con prioridades."), component: Dev });

function Dev() {
  const { platformRole } = useSession();
  const [items, setItems] = useLocalState<RoadmapItem[]>("bf.roadmap.v2", ROADMAP_SEED);
  // Añade tareas nuevas del plan sin pisar las editadas en este navegador.
  useEffect(() => { setItems((cur) => { const missing = ROADMAP_SEED.filter((r) => !cur.some((c) => c.id === r.id || c.title === r.title)); return missing.length ? [...cur, ...missing] : cur; }); }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const [title, setTitle] = useState("");
  const [q, setQ] = useState("");
  const [prio, setPrio] = useState<"all" | TaskPriority>("all");
  const [sortMode, setSortMode] = useState<"priority" | "manual">("priority");
  const [editing, setEditing] = useState<RoadmapItem | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  // Las tareas del plan marcadas como hechas se actualizan si en este navegador siguen con el título original.
  useEffect(() => { setItems((cur) => { let changed = false; const next = cur.map((c) => { const seed = ROADMAP_SEED.find((r) => r.id === c.id && r.title === c.title); if (seed?.status === "done" && c.status !== "done") { changed = true; return { ...c, status: "done" as const }; } return c; }); return changed ? next : cur; }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setItems(cur => syncDeliveredTasks(cur, ROADMAP_SEED)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!platformRole) return <Navigate to="/dashboard" />;

  const save = (it: RoadmapItem) => setItems(items.some((i) => i.id === it.id) ? items.map((i) => (i.id === it.id ? it : i)) : [...items, it]);
  const add = (e: FormEvent) => { e.preventDefault(); if (!title.trim()) return; save({ id: crypto.randomUUID(), title: title.trim(), description: "", status: "pending", priority: "medium", tags: [], notes: "", sort_order: Math.max(0, ...items.map((i) => i.sort_order)) + 1 }); setTitle(""); };
  const copy = (i: RoadmapItem) => { setItems([...items, duplicateTask(i, items, crypto.randomUUID())]); toast.success("Tarea duplicada"); };
  const copyText = async (i: RoadmapItem) => { await navigator.clipboard.writeText(`[${prioLabel(i.priority)}] ${i.title}\n${i.description}${i.notes ? `\n\nNotas: ${i.notes}` : ""}`); toast.success("Copiada al portapapeles"); };
  const copyMany = async (list: RoadmapItem[], label: string) => { if (!list.length) { toast.error("No hay tareas para copiar"); return; } await navigator.clipboard.writeText(tasksToText(list)); toast.success(`${list.length} tareas copiadas (${label})`); };
  const toggleSel = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const remove = (id: string) => { if (confirm("¿Eliminar esta tarea?")) setItems(items.filter((i) => i.id !== id)); };

  const visible = items.filter((i) => (prio === "all" || (i.priority ?? "medium") === prio) && (i.title + i.description + (i.tags ?? []).join(" ")).toLowerCase().includes(q.toLowerCase()));
  const ordered = (s: RoadmapStatus) => { const col = visible.filter((i) => i.status === s); return sortMode === "priority" ? sortTasks(col) : col.sort((a, b) => a.sort_order - b.sort_order); };
  const done = items.filter((i) => i.status === "done").length;
  const urgent = items.filter((i) => i.priority === "urgent" && i.status !== "done").length;

  return (
    <ConsoleShell title="Dev / Roadmap" subtitle={`${done} de ${items.length} hechas · ${urgent} urgentes abiertas`}
      action={<form onSubmit={add} className="flex gap-2"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nueva tarea…" className="w-64" /><Button type="submit">Añadir</Button></form>}>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por texto o etiqueta…" className="w-72" />
        <Select value={prio} onValueChange={(v) => setPrio(v as typeof prio)}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas las prioridades</SelectItem>{PRIORITIES.map((p) => <SelectItem key={p.p} value={p.p}>{p.label}</SelectItem>)}</SelectContent></Select>
        <Select value={sortMode} onValueChange={(v) => setSortMode(v as typeof sortMode)}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="priority">Ordenar por prioridad</SelectItem><SelectItem value="manual">Orden manual</SelectItem></SelectContent></Select>
        <span className="ml-auto flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => copyMany(sortTasks(items), "todas")}><Copy />Copiar todas</Button>
          <Button variant="secondary" size="sm" onClick={() => copyMany(sortTasks(visible), "filtradas")}><Copy />Copiar filtradas</Button>
          <Button size="sm" disabled={!selected.length} onClick={() => copyMany(items.filter((i) => selected.includes(i.id)), "seleccionadas")}><Copy />Copiar seleccionadas ({selected.length})</Button>
        </span>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {COLS.map(({ s, label }) => (
          <section key={s} className="rounded-xl border border-border bg-sidebar p-4">
            <h2 className="mb-3 flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-muted-foreground">{label}<span>{ordered(s).length}</span></h2>
            <div className="space-y-2">{ordered(s).map((i) => (
              <article key={i.id} className="group rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <input type="checkbox" aria-label="Seleccionar tarea" className="mt-1 accent-primary" checked={selected.includes(i.id)} onChange={() => toggleSel(i.id)} />
                  <button onClick={() => setEditing(i)} className="text-left font-medium hover:text-primary">{i.title}</button>
                  <span className={cn("shrink-0 rounded px-2 py-0.5 text-xs font-semibold", PRIO_CLASS[i.priority ?? "medium"])}>{prioLabel(i.priority)}</span>
                </div>
                {i.description && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{i.description}</p>}
                {(i.tags?.length || i.due) ? <div className="mt-2 flex flex-wrap gap-1">{i.tags?.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}{i.due && <Badge variant="secondary">Vence {i.due}</Badge>}</div> : null}
                <div className="mt-3 flex flex-wrap items-center gap-1">
                  {COLS.map((c) => <button key={c.s} onClick={() => save({ ...i, status: c.s })} className={cn("rounded px-2 py-1 text-xs", c.s === i.status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{c.label}</button>)}
                  <span className="ml-auto flex gap-0.5">
                    {sortMode === "manual" && <><IconBtn t="Subir" on={() => setItems(moveTask(items, i.id, -1))}><ArrowUp /></IconBtn><IconBtn t="Bajar" on={() => setItems(moveTask(items, i.id, 1))}><ArrowDown /></IconBtn></>}
                    <IconBtn t="Editar" on={() => setEditing(i)}><Pencil /></IconBtn>
                    <IconBtn t="Duplicar" on={() => copy(i)}><Copy /></IconBtn>
                    <IconBtn t="Copiar texto" on={() => copyText(i)}><span className="text-[10px] font-bold">TXT</span></IconBtn>
                    <IconBtn t="Eliminar" on={() => remove(i.id)}><Trash2 /></IconBtn>
                  </span>
                </div>
              </article>))}</div>
          </section>))}
      </div>
      {editing && <EditDialog item={editing} onClose={() => setEditing(null)} onSave={(it) => { save(it); setEditing(null); toast.success("Tarea guardada"); }} />}
    </ConsoleShell>
  );
}

const STATUS_LABEL: Record<RoadmapStatus, string> = { pending: "Pendiente", in_progress: "En progreso", done: "Hecho" };
/** Texto plano para pegar las tareas en el chat, agrupadas por estado. */
function tasksToText(list: RoadmapItem[]) {
  return COLS.map(({ s }) => { const col = list.filter((i) => i.status === s); if (!col.length) return ""; return `## ${STATUS_LABEL[s]} (${col.length})\n` + col.map((i) => `- [${prioLabel(i.priority)}] ${i.title}${i.description ? `\n  ${i.description}` : ""}${i.notes ? `\n  Notas: ${i.notes}` : ""}${i.tags?.length ? `\n  Etiquetas: ${i.tags.join(", ")}` : ""}`).join("\n"); }).filter(Boolean).join("\n\n");
}

function IconBtn({ t, on, children }: { t: string; on: () => void; children: React.ReactNode }) {
  return <button title={t} aria-label={t} onClick={on} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">{children}</button>;
}

function EditDialog({ item, onClose, onSave }: { item: RoadmapItem; onClose: () => void; onSave: (i: RoadmapItem) => void }) {
  const [d, setD] = useState({ ...item, priority: item.priority ?? "medium", tagsText: (item.tags ?? []).join(", ") });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Editar tarea</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div><Label>Título</Label><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Prioridad</Label><Select value={d.priority} onValueChange={(v) => setD({ ...d, priority: v as TaskPriority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((p) => <SelectItem key={p.p} value={p.p}>{p.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Estado</Label><Select value={d.status} onValueChange={(v) => setD({ ...d, status: v as RoadmapStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COLS.map((c) => <SelectItem key={c.s} value={c.s}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Fecha límite</Label><Input type="date" value={d.due ?? ""} onChange={(e) => setD({ ...d, due: e.target.value || null })} /></div>
          </div>
          <div><Label>Descripción</Label><Textarea rows={4} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></div>
          <div><Label>Notas técnicas / criterios de aceptación</Label><Textarea rows={5} value={d.notes ?? ""} onChange={(e) => setD({ ...d, notes: e.target.value })} /></div>
          <div><Label>Etiquetas (separadas por comas)</Label><Input value={d.tagsText} onChange={(e) => setD({ ...d, tagsText: e.target.value })} placeholder="Backend, UI, Pagos" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => { const { tagsText, ...rest } = d; onSave({ ...rest, title: rest.title.trim() || item.title, tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean) }); }}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
