import { describe, it, expect } from "vitest";
import { expandGroups, groupWindows } from "./window-groups";

describe("window groups", () => {
  it("Mon-Fri block plus Saturday morning expands to 6 day windows", () => {
    const w = expandGroups([{ days: [1, 2, 3, 4, 5], from: "07:00", to: "22:00" }, { days: [6], from: "08:00", to: "12:00" }]);
    expect(w).toHaveLength(6);
    expect(w.find(x => x.weekday === 6)).toEqual({ weekday: 6, from: "08:00", to: "12:00" });
  });
  it("groups saved windows with the same hours", () => {
    const g = groupWindows([{ weekday: 1, from: "07:00", to: "22:00" }, { weekday: 2, from: "07:00", to: "22:00" }, { weekday: 6, from: "08:00", to: "12:00" }]);
    expect(g).toEqual([{ days: [1, 2], from: "07:00", to: "22:00" }, { days: [6], from: "08:00", to: "12:00" }]);
  });
});
