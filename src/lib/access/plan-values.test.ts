import { describe, expect, it } from "vitest";
import { parsePlanValues } from "./plan-values";
describe("quota values", () => {
  it("accepts a monthly price of 0 euros", () => expect(parsePlanValues("0", "", "").price_cents).toBe(0));
  it("accepts a weekly limit of 0 classes", () => expect(parsePlanValues("10", "0", "").weekly_class_limit).toBe(0));
  it("keeps a total trial allowance of 3 classes distinct from weekly allowance of 2", () => expect(parsePlanValues("0", "2", "3")).toEqual({ price_cents: 0, weekly_class_limit: 2, trial_class_limit: 3 }));
  it("rejects negative prices", () => expect(() => parsePlanValues("-1", "", "")).toThrow());
  it("rejects fractional class limits", () => expect(() => parsePlanValues("0", "1.5", "")).toThrow());
});