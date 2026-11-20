import { describe, expect, it } from "vitest";
import { canAccessClass, canAccessFacility, canAccessEvent } from "./membership";
import type { GymClass, MembershipPlan } from "@/lib/domain/types";

const base: MembershipPlan = { id: "p", tenant_id: "t", name: "Entre semana", price_cents: 0, allowed_weekdays: [1, 2, 3, 4, 5], allowed_activity_type_ids: [], weekly_class_limit: null };
const cls = (iso: string, act = "wod"): GymClass => ({ id: "c", tenant_id: "t", activity_type_id: act, title: "WOD", coach: "x", starts_at: iso, ends_at: iso, capacity: 10, booked: 0 });

describe("canAccessClass", () => {
  it("weekday plan allows a Monday class", () => {
    expect(canAccessClass(base, cls("2026-11-23T09:00:00")).allowed).toBe(true);
  });
  it("weekday plan blocks a Saturday class", () => {
    expect(canAccessClass(base, cls("2026-11-21T09:00:00")).allowed).toBe(false);
  });
  it("blocks activities outside the plan", () => {
    expect(canAccessClass({ ...base, allowed_activity_type_ids: ["wod"] }, cls("2026-11-23T09:00:00", "hiit")).allowed).toBe(false);
  });
  it("blocks when weekly limit reached", () => {
    expect(canAccessClass({ ...base, weekly_class_limit: 3 }, cls("2026-11-23T09:00:00"), 3).allowed).toBe(false);
  });
  it("no plan means no access", () => {
    expect(canAccessClass(null, cls("2026-11-23T09:00:00")).allowed).toBe(false);
  });
});

describe("Saturday facilities until midday", () => {
 const windows = [{weekday:6,from:"08:00",to:"12:00"}];
 it("allows a Saturday slot ending at 12:00",()=>expect(canAccessFacility(windows,new Date("2026-11-21T11:00:00"),new Date("2026-11-21T12:00:00"))).toBe(true));
 it("rejects a Saturday slot extending past 12:00",()=>expect(canAccessFacility(windows,new Date("2026-11-21T11:30:00"),new Date("2026-11-21T12:30:00"))).toBe(false));
 it("does not grant Saturday classes with facility access",()=>expect(canAccessClass(base,cls("2026-11-21T11:00:00")).allowed).toBe(false));
});

describe("event membership", () => {
 const event = { starts_at: "2026-11-23T09:00:00", activity_type_ids: ["running"] };
 it("requires a quota for event participation", () => expect(canAccessEvent(null, event).allowed).toBe(false));
 it("does not grant running to a CrossFit-only quota", () => expect(canAccessEvent({ ...base, allowed_activity_type_ids: ["crossfit"] }, event).allowed).toBe(false));
 it("allows included activities", () => expect(canAccessEvent({ ...base, allowed_activity_type_ids: ["running"] }, event).allowed).toBe(true));
});
