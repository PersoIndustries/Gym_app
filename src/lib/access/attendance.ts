export type Intent = "going" | "maybe" | "not_going";
export const INTENTS: Intent[] = ["going", "maybe", "not_going"];
export const INTENT_LABEL: Record<Intent, string> = { going: "Voy", maybe: "Dudas", not_going: "No voy" };

export interface ClassRules { starts_at: string; capacity: number; min_attendees: number; cancel_hours_before: number; status: string }
export interface Counts { going: number; maybe: number; not_going: number; waitlist: number }

/** Confirmados = "Voy" (las dudas no cuentan para el mínimo). */
export const confirmed = (c: Counts) => c.going;
/** Plazas ocupadas = "Voy" + "Dudas"; "No voy" no ocupa plaza. */
export const occupied = (c: Counts) => c.going + c.maybe;

/** Se cancela si estamos dentro de la ventana de X horas y no hay mínimo de confirmados. */
export function shouldAutoCancel(cls: ClassRules, c: Counts, now = new Date()): boolean {
  if (cls.status !== "scheduled") return false;
  const start = new Date(cls.starts_at).getTime();
  const windowStart = start - cls.cancel_hours_before * 3600_000;
  return now.getTime() >= windowStart && now.getTime() < start && confirmed(c) < cls.min_attendees;
}

/** Aviso previo: falta poco para la ventana y aún no hay mínimo. */
export function atRisk(cls: ClassRules, c: Counts, now = new Date()): boolean {
  if (cls.status !== "scheduled" || confirmed(c) >= cls.min_attendees) return false;
  const start = new Date(cls.starts_at).getTime();
  return now.getTime() < start && start - now.getTime() <= (cls.cancel_hours_before + 12) * 3600_000;
}

export const isFull = (cls: ClassRules, c: Counts) => occupied(c) >= cls.capacity;

/** La persona permanece visible; solo se anonimiza su identidad. */
export function canSeeAttendee(viewer: { id: string; isStaff: boolean }, attendee: { id: string; hidden: boolean }) {
  return true;
}
