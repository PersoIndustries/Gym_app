import { describe, expect, it } from "vitest";
import { viewOptions } from "./views";

describe("selector de vista", () => {
  it("un atleta solo tiene una vista (no se muestra el selector)", () =>
    expect(viewOptions([{ tenant_id: "t", role: "athlete", tenant_name: "Box" }], null)).toHaveLength(1));
  it("un coach puede entrar como usuario o como coach", () =>
    expect(viewOptions([{ tenant_id: "t", role: "coach", tenant_name: "Box" }], null).map((o) => o.mode)).toEqual(["athlete", "staff"]));
  it("super admin añade la consola", () =>
    expect(viewOptions([{ tenant_id: "t", role: "admin", tenant_name: "Box" }], "super_admin").map((o) => o.mode)).toEqual(["athlete", "staff", "console"]));
});
