export interface SummaryClass { id: string; status: string; capacity: number; ends_at: string }
export interface SummaryCounts { going: number; maybe: number }
/** Resumen mensual para staff: clases dadas, canceladas, asistencia media (Voy) y ocupación (Voy+Dudas sobre aforo). */
export function monthSummary(classes: SummaryClass[], counts: Record<string, SummaryCounts>, now = new Date()) {
  const cancelled = classes.filter(c => c.status === "cancelled").length;
  const done = classes.filter(c => c.status !== "cancelled" && new Date(c.ends_at) <= now);
  const active = classes.filter(c => c.status !== "cancelled");
  const going = active.reduce((s, c) => s + (counts[c.id]?.going ?? 0), 0);
  const seats = active.reduce((s, c) => s + c.capacity, 0);
  const taken = active.reduce((s, c) => s + (counts[c.id]?.going ?? 0) + (counts[c.id]?.maybe ?? 0), 0);
  return { total: classes.length, done: done.length, cancelled, avgGoing: active.length ? Math.round((going / active.length) * 10) / 10 : 0, occupancy: seats ? Math.round((taken / seats) * 100) : 0 };
}
