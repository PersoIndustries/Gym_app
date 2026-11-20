export const DEFAULT_ACTIVITIES = ["CrossFit", "Running", "Spinning", "Hyrox", "Pilates", "Zumba", "Halterofilia", "Open Box"] as const;
export type ActivityName = typeof DEFAULT_ACTIVITIES[number];
export function activitySymbol(name: string): "strength" | "running" | "cycling" | "hyrox" | "pilates" | "dance" | "event" {
  const key = name.toLowerCase();
  if (/evento|event|carrera|race|competition/.test(key)) return "event";
  if (/running|run/.test(key)) return "running";
  if (/spinning|spining|cicl/.test(key)) return "cycling";
  if (/hyrox/.test(key)) return "hyrox";
  if (/pilates|yoga/.test(key)) return "pilates";
  if (/zumba|dance/.test(key)) return "dance";
  return "strength";
}
export function validActivitySelection(names: readonly string[], max: number | null) {
  return names.length > 0 && new Set(names).size === names.length && (max === null || names.length <= max) && names.every(n => DEFAULT_ACTIVITIES.some(a => a === n));
}