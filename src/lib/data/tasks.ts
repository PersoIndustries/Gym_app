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
