/** Reglas puras de eventos, niveles y reservas; la base de datos las aplica igual. */
export type EventScope = "box" | "community";
export type EventIntent = "going" | "interested" | "not_going";
export const EVENT_INTENT_LABEL: Record<EventIntent, string> = { going: "Voy", interested: "Me interesa", not_going: "No voy" };
export const EVENT_KIND_LABEL: Record<string, string> = { competition: "Competición", race: "Carrera", meetup: "Quedada", seminar: "Seminario", social: "Social" };
export const EVENT_FORMAT_LABEL: Record<string, string> = { individual: "Individual", pairs: "Parejas", teams: "Equipos" };

export interface EventLike { scope: EventScope | string; status: string; tenant_id: string | null; activity_type_ids?: string[] }

/** ¿Puede ver este evento alguien de estos boxes? (sin sesión: memberTenants = []) */
export function canSeeEvent(e: EventLike, memberTenants: string[]): boolean {
  if (e.scope === "community" && e.status === "published") return true;
  return !!e.tenant_id && memberTenants.includes(e.tenant_id);
}

/** Anuncio segmentado: destacar si la cuota del socio incluye alguna actividad del evento (o la cuota no restringe). */
export function isRelevantForPlan(eventActivities: string[], planActivities: string[] | null): boolean {
  if (!eventActivities.length) return true;
  if (!planActivities) return false;
  if (!planActivities.length) return true;
  return eventActivities.some(a => planActivities.includes(a));
}

/** Socios normales solo ven reservas si el box las activa y el espacio está activo; staff siempre. */
export function facilitiesVisible(enabled: boolean, staff: boolean): boolean { return staff || enabled; }

export interface LevelVariant { level: string; load_kg: number | null; percent_rm: number | null; reps: string | null }
/** Variante del nivel preferido del socio, si existe. */
export function preferredVariant<T extends LevelVariant>(variants: T[], preferred: string | null | undefined): T | null {
  return (preferred && variants.find(v => v.level === preferred)) || null;
}
