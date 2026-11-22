import { describe, expect, it } from "vitest";
import { canChangeMember, filterMembers, type MemberRow } from "./members";

const rows: MemberRow[] = [
  { id: "1", user_id: "a", name: "Lucía Martín", role: "athlete", status: "active", quotas: 1 },
  { id: "2", user_id: "b", name: "Diego Sanz", role: "coach", status: "active", quotas: 0 },
  { id: "3", user_id: "c", name: "Marta Ruiz", role: "admin", status: "active", quotas: 0 },
  { id: "4", user_id: "d", name: "Pablo Gil", role: "athlete", status: "suspended", quotas: 1 },
];
const all = { q: "", role: "all", state: "all" } as const;

describe("filtro de socios", () => {
  it("busca por nombre sin distinguir mayúsculas", () => expect(filterMembers(rows, { ...all, q: "lucía" }).map(r => r.id)).toEqual(["1"]));
  it("filtra profesores", () => expect(filterMembers(rows, { ...all, role: "coach" }).map(r => r.id)).toEqual(["2"]));
  it("filtra suspendidos", () => expect(filterMembers(rows, { ...all, state: "suspended" }).map(r => r.id)).toEqual(["4"]));
  it("filtra sin cuota", () => expect(filterMembers(rows, { ...all, state: "no_quota" }).map(r => r.id)).toEqual(["2", "3"]));
});
describe("cambios de socio", () => {
  it("nadie se cambia a sí mismo", () => expect(canChangeMember(rows[0]!, "a", rows)).toBe(false));
  it("no se puede tocar al único admin", () => expect(canChangeMember(rows[2]!, "a", rows)).toBe(false));
  it("con otro admin activo sí", () => expect(canChangeMember(rows[2]!, "a", [...rows, { ...rows[2]!, id: "5", user_id: "e" }])).toBe(true));
});
