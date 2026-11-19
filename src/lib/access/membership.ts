import type { GymClass, MembershipPlan } from "@/lib/domain/types";

export type AccessResult = { allowed: true } | { allowed: false; reason: string };
export interface FacilityWindow { weekday: number; from: string; to: string }

export function canAccessFacility(windows: FacilityWindow[], startsAt: Date, endsAt: Date): boolean {
  if (endsAt <= startsAt || startsAt.toDateString() !== endsAt.toDateString()) return false;
  const from = startsAt.getHours() * 60 + startsAt.getMinutes();
  const to = endsAt.getHours() * 60 + endsAt.getMinutes();
  const minutes = (value: string) => { const [h,m] = value.split(":").map(Number); return (h ?? 0)*60+(m ?? 0); };
  return windows.some(w => w.weekday === startsAt.getDay() && from >= minutes(w.from) && to <= minutes(w.to));
}

/** Decide si una cuota permite apuntarse a una clase. Pura: reutilizable en servidor/RLS más adelante. */
export function canAccessClass(plan: MembershipPlan | null, gymClass: GymClass, bookedThisWeek = 0): AccessResult {
  if (!plan) return { allowed: false, reason: "Sin cuota activa" };
  const day = new Date(gymClass.starts_at).getDay();
  if (!plan.allowed_weekdays.includes(day)) return { allowed: false, reason: `Tu cuota "${plan.name}" no incluye este día` };
  if (plan.allowed_activity_type_ids.length > 0 && !plan.allowed_activity_type_ids.includes(gymClass.activity_type_id))
    return { allowed: false, reason: `Tu cuota "${plan.name}" no incluye esta actividad` };
  if (plan.weekly_class_limit !== null && bookedThisWeek >= plan.weekly_class_limit)
    return { allowed: false, reason: "Has alcanzado el límite semanal de clases" };
  return { allowed: true };
}
