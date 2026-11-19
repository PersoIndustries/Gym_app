import { describe, it, expect } from "vitest";
import { facilitySlots, overlaps } from "./facility-slots";
describe("Reservas de espacios", () => {
  it("no ofrece una reserva que exceda el cierre al mediodía", () => {
    expect(facilitySlots("2026-11-21", "10:00", "12:00", 60).map(s => s.label)).toEqual(["10:00–11:00", "11:00–12:00"]);
  });
  it("detecta solapamiento y permite franjas consecutivas", () => {
    const rows = [{ starts_at: "2026-11-21T10:00:00", ends_at: "2026-11-21T11:00:00" }];
    expect(overlaps("2026-11-21T10:30:00", "2026-11-21T11:30:00", rows)).toBe(true);
    expect(overlaps("2026-11-21T11:00:00", "2026-11-21T12:00:00", rows)).toBe(false);
  });
});