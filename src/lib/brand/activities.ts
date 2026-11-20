export type ActivityMode = "wod" | "cardio" | "studio" | "open";
export const MODE_LABEL: Record<ActivityMode, string> = { wod: "WOD / cargas", cardio: "Cardio / distancia", studio: "Sesión dirigida", open: "Libre / sin programación" };
export const MODE_HELP: Record<ActivityMode, string> = {
  wod: "Fases, ejercicios, bloques AMRAP/EMOM y pesos según RM.",
  cardio: "Distancia, ritmo, duración y recorrido.",
  studio: "Foco de la sesión, material y descripción.",
  open: "Solo horario y aforo, sin entreno publicado.",
};
export const ACTIVITY_CATALOG: readonly { name: string; mode: ActivityMode }[] = [
  ["CrossFit","wod"],["Halterofilia","wod"],["Hyrox","wod"],["Funcional","wod"],["HIIT","wod"],["Powerlifting","wod"],["Gimnásticos","wod"],["Kettlebells","wod"],
  ["Running","cardio"],["Trail running","cardio"],["Spinning","cardio"],["Remo","cardio"],["Natación","cardio"],
  ["Pilates","studio"],["Yoga","studio"],["Movilidad","studio"],["Stretching","studio"],["Zumba","studio"],["Baile","studio"],["Body pump","studio"],["Boxeo","studio"],["Kickboxing","studio"],
  ["Open Box","open"],["Entrenamiento personal","open"],
].map(([name, mode]) => ({ name: name as string, mode: mode as ActivityMode }));
export const DEFAULT_ACTIVITIES = ACTIVITY_CATALOG.map(a => a.name);
export type ActivityName = string;
export function activityMode(name: string, stored?: string | null): ActivityMode {
  if (stored === "wod" || stored === "cardio" || stored === "studio" || stored === "open") return stored;
  return ACTIVITY_CATALOG.find(a => a.name.toLowerCase() === name.toLowerCase())?.mode ?? "wod";
}
export type ActivitySymbol = "strength" | "running" | "cycling" | "hyrox" | "pilates" | "dance" | "event" | "water" | "combat" | "open";
export function activitySymbol(name: string): ActivitySymbol {
  const key = name.toLowerCase();
  if (/evento|event|carrera|race|competition/.test(key)) return "event";
  if (/running|run|trail/.test(key)) return "running";
  if (/spinning|spining|cicl/.test(key)) return "cycling";
  if (/remo|nataci|swim|row/.test(key)) return "water";
  if (/box|kick|mma|combat/.test(key) && !/open box/.test(key)) return "combat";
  if (/open box|libre|personal/.test(key)) return "open";
  if (/hyrox|hiit/.test(key)) return "hyrox";
  if (/pilates|yoga|movilidad|stretch/.test(key)) return "pilates";
  if (/zumba|dance|baile/.test(key)) return "dance";
  return "strength";
}
export function validActivitySelection(names: readonly string[], max: number | null) {
  return names.length > 0 && new Set(names).size === names.length && (max === null || names.length <= max) && names.every(n => DEFAULT_ACTIVITIES.includes(n));
}
