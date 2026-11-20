import { describe, expect, it } from "vitest";
import { SAAS_PLANS, canAddMember, canCreateGym, getPlan, isValidCode, suggestCode } from "./saas-plans";
describe("planes SaaS", () => {
  it("precios 10/25/50 € al mes", () => expect(SAAS_PLANS.map((p) => p.month)).toEqual([10, 25, 50]));
  it("anual con 2 meses gratis", () => SAAS_PLANS.forEach((p) => expect(p.year).toBe(p.month * 10)));
  it("solo Elite permite varios gimnasios", () => { expect(canCreateGym(getPlan("pro"), 1)).toBe(false); expect(canCreateGym(getPlan("elite"), 2)).toBe(true); expect(canCreateGym(getPlan("elite"), 3)).toBe(false); });
  it("Starter limita a 50 socios, Elite ilimitado", () => { expect(canAddMember(getPlan("starter"), 50)).toBe(false); expect(canAddMember(getPlan("pro"), 199)).toBe(true); expect(canAddMember(getPlan("elite"), 10000)).toBe(true); });
  it("espacios solo en Pro y Elite", () => expect(SAAS_PLANS.filter((p) => p.facilities).map((p) => p.id)).toEqual(["pro", "elite"]));
  it("dominio personalizado solo Elite", () => expect(SAAS_PLANS.filter((p) => p.customDomain).map((p) => p.id)).toEqual(["elite"]));
  it("código sugerido válido", () => { expect(isValidCode(suggestCode("Box Ñandú Norte"))).toBe(true); expect(isValidCode("ab")).toBe(false); });
});
