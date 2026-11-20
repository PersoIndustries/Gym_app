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

export function canReserveFacility(plan: MembershipPlan | null, startsAt: Date, endsAt: Date): boolean {
  return !!plan && plan.facility_booking_enabled !== false && canAccessFacility(plan.facility_windows ?? [], startsAt, endsAt);
}

/** Decide si una cuota permite apuntarse a una clase. Pura: reutilizable en servidor/RLS más adelante. */
export function canAccessClass(plan: MembershipPlan | null, gymClass: GymClass, bookedThisWeek = 0, trialUsed = plan?.trial_used ?? 0): AccessResult {
  if (!plan) return { allowed: false, reason: "Sin cuota activa" };
  if (plan.classes_enabled === false) return { allowed: false, reason: "Tu cuota no permite clases" };
  if (plan.trial_class_limit != null && trialUsed >= plan.trial_class_limit) return { allowed: false, reason: "Has agotado las clases de prueba" };
  const day = new Date(gymClass.starts_at).getDay();
  if (!plan.allowed_weekdays.includes(day)) return { allowed: false, reason: `Tu cuota "${plan.name}" no incluye este día` };
  if (plan.allowed_activity_type_ids.length > 0 && !plan.allowed_activity_type_ids.includes(gymClass.activity_type_id))
    return { allowed: false, reason: `Tu cuota "${plan.name}" no incluye esta actividad` };
  if (plan.weekly_class_limit !== null && bookedThisWeek >= plan.weekly_class_limit)
    return { allowed: false, reason: "Has alcanzado el límite semanal de clases" };
  return { allowed: true };
}

export function canAccessEvent(plan: MembershipPlan | null, event: { starts_at: string; activity_type_ids: string[] }): AccessResult {
  if (!plan) return { allowed: false, reason: "Sin cuota activa" };
  if (plan.classes_enabled === false) return { allowed: false, reason: "Tu cuota no permite participar en actividades" };
  if (!plan.allowed_weekdays.includes(new Date(event.starts_at).getDay())) return { allowed: false, reason: "Tu cuota no incluye este día" };
  if (plan.allowed_activity_type_ids.length > 0 && (event.activity_type_ids.length === 0 || event.activity_type_ids.some(id => !plan.allowed_activity_type_ids.includes(id)))) return { allowed: false, reason: "Tu cuota no incluye esta actividad" };
  return { allowed: true };
}

/** Combina varias cuotas activas sumando derechos: basta con que una permita el día, la actividad o la franja. */
export function mergePlans(plans: MembershipPlan[]): MembershipPlan | null {
  const first = plans[0];
  if (!first) return null;
  if (plans.length === 1) return first;
  const cls = plans.filter(p => p.classes_enabled !== false);
  const unlimited = cls.some(p => p.weekly_class_limit === null);
  const allTrial = cls.length > 0 && cls.every(p => p.trial_class_limit != null);
  return {
    ...first,
    id: plans.map(p => p.id).join("+"),
    name: plans.map(p => p.name).join(" + "),
    price_cents: plans.reduce((s, p) => s + p.price_cents, 0),
    classes_enabled: cls.length > 0,
    facility_booking_enabled: plans.some(p => p.facility_booking_enabled !== false),
    allowed_weekdays: [...new Set(cls.flatMap(p => p.allowed_weekdays))].sort(),
    allowed_activity_type_ids: cls.some(p => p.allowed_activity_type_ids.length === 0) ? [] : [...new Set(cls.flatMap(p => p.allowed_activity_type_ids))],
    weekly_class_limit: unlimited || cls.length === 0 ? null : cls.reduce((s, p) => s + (p.weekly_class_limit ?? 0), 0),
    trial_class_limit: allTrial ? cls.reduce((s, p) => s + (p.trial_class_limit ?? 0), 0) : null,
    facility_windows: plans.flatMap(p => p.facility_windows ?? []),
  };
}
