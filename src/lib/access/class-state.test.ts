import { describe, expect, it } from "vitest";
import { classState, isUpcomingEnrollment } from "./class-state";
const c = { starts_at: "2026-11-19T10:00:00Z", ends_at: "2026-11-19T11:00:00Z", status: "scheduled" };
describe("Class lifecycle", () => {
 it("is pending before the start", () => expect(classState(c,new Date("2026-11-19T09:59:00Z"))).toBe("pending"));
 it("is live from start until end", () => expect(classState(c,new Date("2026-11-19T10:00:00Z"))).toBe("live"));
 it("is finished at the end", () => expect(classState(c,new Date("2026-11-19T11:00:00Z"))).toBe("finished"));
 it("never shows No voy in my classes", () => expect(isUpcomingEnrollment(c,{intent:"not_going",status:"declined"},new Date("2026-11-19T09:00:00Z"))).toBe(false));
 it("keeps Dudas in my classes", () => expect(isUpcomingEnrollment(c,{intent:"maybe",status:"booked"},new Date("2026-11-19T09:00:00Z"))).toBe(true));
});