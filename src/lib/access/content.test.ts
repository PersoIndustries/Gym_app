import { expect, it } from "vitest";
import { needsMembershipWait, visibleWorkoutPhases } from "./content";
it("an athlete without quota waits instead of viewing the gym", () => expect(needsMembershipWait("athlete", true, false)).toBe(true));
it("an athlete with quota sees the gym", () => expect(needsMembershipWait("athlete", true, true)).toBe(false));
it("administrators without quota can assign memberships", () => expect(needsMembershipWait("admin", true, false)).toBe(false));
it("coaches without quota keep management access", () => expect(needsMembershipWait("coach", true, false)).toBe(false));
it("no workout means no phase headings for athletes", () => expect(visibleWorkoutPhases([{ key: "warmup" }, { key: "strength" }], [], false)).toEqual([]));
it("athletes see only phases containing workout items", () => expect(visibleWorkoutPhases([{ key: "warmup" }, { key: "strength" }], [{ block: "strength" }], false)).toEqual([{ key: "strength" }]));