import { describe, expect, it } from "vitest";
import { upcomingEvents } from "./EventsBrowser";
const ev = (id: string, s: string, e: string, status = "published") => ({ id, starts_at: s, ends_at: e, status }) as never;
describe("upcomingEvents", () => {
  it("orders nearest first and drops past/unpublished", () => {
    const now = new Date("2026-11-21T00:00:00Z");
    const r = upcomingEvents([ev("far", "2027-01-01", "2027-01-01"), ev("past", "2026-10-01", "2026-10-01"), ev("near", "2026-11-25", "2026-11-25"), ev("pend", "2026-11-22", "2026-11-22", "pending")], now);
    expect(r.map((e: { id: string }) => e.id)).toEqual(["near", "far"]);
  });
});
