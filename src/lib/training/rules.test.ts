import { describe, expect, it } from "vitest";
import { recommendedKg, describeLoad } from "./weights";
import { atRisk, canSeeAttendee, isFull, shouldAutoCancel } from "@/lib/access/attendance";

describe("pesos según RM", () => {
  it("75% de 110 kg redondea a 82,5 kg con discos de 2,5", () => expect(recommendedKg(110, 75)).toBe(82.5));
  it("redondea al múltiplo más cercano", () => expect(recommendedKg(100, 73)).toBe(72.5));
  it("respeta redondeo de 1 kg", () => expect(recommendedKg(100, 73, 1)).toBe(73));
  it("sin RM no hay recomendación", () => expect(recommendedKg(null, 75)).toBeNull());
  it("texto para el atleta", () => expect(describeLoad(5, "5", 75, 82.5)).toBe("5x5 @75% → 82,5 kg"));
});

describe("asistencia y cancelación", () => {
  const start = new Date("2026-11-20T18:00:00Z");
  const cls = { starts_at: start.toISOString(), capacity: 2, min_attendees: 3, cancel_hours_before: 4, status: "scheduled" };
  const two = { sure: 1, going: 1, maybe: 5, waitlist: 0 };
  it("se cancela a 3 h si no hay 3 confirmados (las dudas no cuentan)", () =>
    expect(shouldAutoCancel(cls, two, new Date("2026-11-20T15:00:00Z"))).toBe(true));
  it("no se cancela a 5 h", () => expect(shouldAutoCancel(cls, two, new Date("2026-11-20T13:00:00Z"))).toBe(false));
  it("no se cancela con el mínimo", () => expect(shouldAutoCancel(cls, { sure: 3, going: 0, maybe: 0, waitlist: 0 }, new Date("2026-11-20T15:00:00Z"))).toBe(false));
  it("aviso de riesgo antes de la ventana", () => expect(atRisk(cls, two, new Date("2026-11-20T08:00:00Z"))).toBe(true));
  it("llena cuenta también las dudas", () => expect(isFull(cls, { sure: 0, going: 1, maybe: 1, waitlist: 0 })).toBe(true));
  it("socio no ve a quien se oculta; staff sí", () => {
    expect(canSeeAttendee({ id: "a", isStaff: false }, { id: "b", hidden: true })).toBe(false);
    expect(canSeeAttendee({ id: "a", isStaff: true }, { id: "b", hidden: true })).toBe(true);
    expect(canSeeAttendee({ id: "b", isStaff: false }, { id: "b", hidden: true })).toBe(true);
  });
});
