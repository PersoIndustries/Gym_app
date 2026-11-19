import { describe, expect, it } from "vitest";
import { canSeeEvent, facilitiesVisible, isRelevantForPlan, preferredVariant } from "./events";

describe("eventos", () => {
  it("un evento de comunidad publicado lo ve cualquiera, incluso sin sesión", () => {
    expect(canSeeEvent({ scope: "community", status: "published", tenant_id: "A" }, [])).toBe(true);
  });
  it("un evento interno solo lo ven socios de ese box", () => {
    const e = { scope: "box", status: "published", tenant_id: "A" };
    expect(canSeeEvent(e, ["B"])).toBe(false);
    expect(canSeeEvent(e, ["A"])).toBe(true);
  });
  it("un evento de comunidad oculto no lo ve gente de otro box", () => {
    expect(canSeeEvent({ scope: "community", status: "hidden", tenant_id: "A" }, ["B"])).toBe(false);
  });
  it("anuncio segmentado: solo destaca si la cuota incluye la actividad", () => {
    expect(isRelevantForPlan(["hyrox"], ["crossfit"])).toBe(false);
    expect(isRelevantForPlan(["hyrox"], ["hyrox", "crossfit"])).toBe(true);
    expect(isRelevantForPlan(["hyrox"], [])).toBe(true);
  });
});

describe("reservas activables", () => {
  it("si el admin las desactiva, un socio no las ve", () => expect(facilitiesVisible(false, false)).toBe(false));
  it("el staff las sigue viendo para configurarlas", () => expect(facilitiesVisible(false, true)).toBe(true));
});

describe("niveles por ejercicio", () => {
  const v = [{ level: "RX ♂", load_kg: 60, percent_rm: null, reps: null }, { level: "RX ♀", load_kg: 40, percent_rm: null, reps: null }];
  it("resalta el peso del nivel preferido", () => expect(preferredVariant(v, "RX ♀")?.load_kg).toBe(40));
  it("sin nivel preferido no resalta ninguno", () => expect(preferredVariant(v, null)).toBeNull());
});
