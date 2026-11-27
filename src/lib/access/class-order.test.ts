import { describe, expect, it } from "vitest";
import { recentFinished, sortForAthlete } from "./class-state";
const now = new Date("2026-11-27T18:00:00Z");
const c = (id: string, h: number) => ({ id, status: "scheduled", starts_at: `2026-11-27T${String(h).padStart(2,"0")}:00:00Z`, ends_at: `2026-11-27T${String(h+1).padStart(2,"0")}:00:00Z` });
const list = [c("m7", 7), c("m9", 9), c("e19", 19), c("e20", 20)];
const mine = { m9: { intent: "going", status: "booked" } };
describe("Orden de clases del socio", () => {
  it("pone las próximas arriba y las pasadas sin participar al final", () => expect(sortForAthlete(list, mine, now).map(x => x.id)).toEqual(["e19", "e20", "m9", "m7"]));
  it("ofrece foto finish de la última clase en la que participó", () => expect(recentFinished(list, mine, now)?.id).toBe("m9"));
  it("no ofrece foto finish si no participó", () => expect(recentFinished(list, {}, now)).toBeUndefined());
});
