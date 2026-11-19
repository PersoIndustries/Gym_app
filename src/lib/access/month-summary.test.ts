import { describe, expect, it } from "vitest";
import { monthSummary } from "./month-summary";
describe("resumen mensual", () => {
  it("cuenta canceladas aparte y calcula ocupación con Voy+Dudas", () => {
    const now = new Date("2026-11-20T12:00:00Z");
    const r = monthSummary([
      { id: "a", status: "scheduled", capacity: 10, ends_at: "2026-11-10T10:00:00Z" },
      { id: "b", status: "scheduled", capacity: 10, ends_at: "2026-11-25T10:00:00Z" },
      { id: "c", status: "cancelled", capacity: 10, ends_at: "2026-11-05T10:00:00Z" },
    ], { a: { going: 6, maybe: 2 }, b: { going: 2, maybe: 0 }, c: { going: 1, maybe: 0 } }, now);
    expect(r).toEqual({ total: 3, done: 1, cancelled: 1, avgGoing: 4, occupancy: 50 });
  });
});
