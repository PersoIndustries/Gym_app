import type { GymClass, MembershipPlan } from "@/lib/domain/types";

export type AccessResult = { allowed: true } | { allowed: false; reason: string };

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
