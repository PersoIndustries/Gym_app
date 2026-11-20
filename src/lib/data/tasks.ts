import type { RoadmapItem, TaskPriority } from "@/lib/domain/types";

export const PRIORITIES: { p: TaskPriority; label: string; weight: number }[] = [
  { p: "urgent", label: "Urgente", weight: 4 },
  { p: "high", label: "Alta", weight: 3 },
  { p: "medium", label: "Media", weight: 2 },
  { p: "low", label: "Baja", weight: 1 },
];
export const priorityWeight = (p?: TaskPriority) => PRIORITIES.find((x) => x.p === (p ?? "medium"))!.weight;

/** Más prioritarias primero; a igual prioridad, orden manual. */
export function sortTasks(items: RoadmapItem[]): RoadmapItem[] {
  return [...items].sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority) || a.sort_order - b.sort_order);
}

/** Copia una tarea: nuevo id, vuelve a Pendiente y se coloca al final. */
export function duplicateTask(item: RoadmapItem, all: RoadmapItem[], id: string): RoadmapItem {
  return { ...item, id, title: `${item.title} (copia)`, status: "pending", tags: [...(item.tags ?? [])], sort_order: Math.max(0, ...all.map((i) => i.sort_order)) + 1 };
}

/** Mueve una tarea arriba/abajo dentro de su columna intercambiando sort_order. */
export function moveTask(items: RoadmapItem[], id: string, dir: -1 | 1): RoadmapItem[] {
  const it = items.find((i) => i.id === id); if (!it) return items;
  const col = items.filter((i) => i.status === it.status).sort((a, b) => a.sort_order - b.sort_order);
  const idx = col.findIndex((i) => i.id === id); const other = col[idx + dir]; if (!other) return items;
  return items.map((i) => (i.id === it.id ? { ...i, sort_order: other.sort_order } : i.id === other.id ? { ...i, sort_order: it.sort_order } : i));
}

/** Reconcile delivered requests, including explicitly copied tasks, without replacing user notes. */
export function syncDeliveredTasks(items: RoadmapItem[], seed: RoadmapItem[]) {
  const requested = ["F2 · Cancelación automática por mínimo", "F1 · Recuperar y cambiar contraseña (usuario y admin)", "Marca · Subida de logo a almacenamiento", "Social · Foto post-clase con el WOD para redes", "Clases · Logo por tipo de clase"];
  let changed = false;
  const next = items.map(item => {
    const canonical = item.title.replace(/(?: \(copia\))+$/, "");
    const delivered = seed.find(r => r.title === canonical && r.status === "done");
    if (!delivered || !requested.includes(canonical) || (item.status === "done" && item.description === delivered.description)) return item;
    changed = true; return { ...item, status: "done" as const, description: delivered.description };
  });
  return changed ? next : items;
}
