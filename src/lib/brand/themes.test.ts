import { describe, expect, it } from "vitest";
import { THEMES, isValidLogoUrl, resolveTheme } from "./themes";
describe("temas de box", () => {
  it("incluye el tema actual y el amarillo", () => { expect(THEMES.map((t) => t.id)).toEqual(["lime", "amber", "crimson", "cobalt"]); });
  it("un tema desconocido vuelve al actual", () => { expect(resolveTheme("rosa")).toBe("lime"); expect(resolveTheme(null)).toBe("lime"); expect(resolveTheme("amber")).toBe("amber"); });
  it("logo solo por https", () => { expect(isValidLogoUrl("https://x.com/l.png")).toBe(true); expect(isValidLogoUrl("http://x.com/l.png")).toBe(false); expect(isValidLogoUrl("javascript:alert(1)")).toBe(false); });
});
