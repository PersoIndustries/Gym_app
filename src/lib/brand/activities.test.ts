import { describe, expect, it } from "vitest";
import { validActivitySelection } from "./activities";
describe("gym activity selection", () => {
  const five = ["CrossFit", "Running", "Spinning", "Hyrox", "Pilates"];
  it("Starter allows five selected activities", () => expect(validActivitySelection(five, 5)).toBe(true));
  it("Starter rejects a sixth activity", () => expect(validActivitySelection([...five, "Zumba"], 5)).toBe(false));
  it("requires an activity", () => expect(validActivitySelection([], null)).toBe(false));
  it("rejects duplicate activities", () => expect(validActivitySelection(["CrossFit", "CrossFit"], 15)).toBe(false));
});