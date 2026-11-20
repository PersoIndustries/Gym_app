import { describe, expect, it } from "vitest";
import { mergePlans, canAccessClass, canReserveFacility } from "./membership";
import type { MembershipPlan } from "@/lib/domain/types";

const base: MembershipPlan = { id: "a", tenant_id: "t", name: "L-V", price_cents: 3000, allowed_weekdays: [1,2,3,4,5], allowed_activity_type_ids: [], weekly_class_limit: 3, classes_enabled: true, facility_booking_enabled: false, trial_class_limit: null, facility_windows: [] };
const weekend: MembershipPlan = { ...base, id: "b", name: "Finde acceso", price_cents: 1000, classes_enabled: false, facility_booking_enabled: true, allowed_weekdays: [], weekly_class_limit: 0, facility_windows: [{ weekday: 6, from: "08:00", to: "12:00" }] };
const cls = (day: string) => ({ id: "c", tenant_id: "t", activity_type_id: "x", title: "WOD", coach: "", starts_at: day, ends_at: day, capacity: 10, booked: 0 });

describe("multi-cuota", () => {
  it("sin cuotas no hay plan", () => expect(mergePlans([])).toBeNull());
  it("una cuota de solo acceso no añade días de clase", () => expect(canAccessClass(mergePlans([base, weekend]), cls("2026-11-21T09:00:00")).allowed).toBe(false));
  it("la cuota de finde permite reservar el sábado por la mañana", () => expect(canReserveFacility(mergePlans([base, weekend]), new Date("2026-11-21T09:00:00"), new Date("2026-11-21T10:00:00"))).toBe(true));
  it("sigue permitiendo clases entre semana", () => expect(canAccessClass(mergePlans([base, weekend]), cls("2026-11-23T09:00:00")).allowed).toBe(true));
  it("los límites semanales se suman", () => expect(mergePlans([base, { ...base, id: "c", weekly_class_limit: 2 }])?.weekly_class_limit).toBe(5));
});
