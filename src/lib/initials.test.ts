import { describe, expect, it } from "vitest";
import { initials } from "./initials";
describe("iniciales del avatar", () => {
  it("nombre y apellido", () => expect(initials("ana garcía")).toBe("AG"));
  it("usa el último apellido", () => expect(initials("Juan Carlos Pérez López")).toBe("JL"));
  it("solo nombre", () => expect(initials("Marta")).toBe("M"));
  it("sin nombre", () => expect(initials("")).toBe("?"));
});
