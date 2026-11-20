import { describe, expect, it } from "vitest";
import { THEMES, isValidLogoUrl, resolveTheme } from "./themes";
describe("temas de box", () => {
  it("conserva los temas clásicos", () => { for (const id of ["lime", "amber", "crimson", "cobalt"]) expect(resolveTheme(id)).toBe(id); });
  it("acepta los nuevos temas cerrados", () => { for (const id of ["chalk", "mint", "aurora", "solar"]) { expect(THEMES.some(t => t.id === id)).toBe(true); expect(resolveTheme(id)).toBe(id); } });
  it("un tema desconocido vuelve al actual", () => { expect(resolveTheme("rosa")).toBe("lime"); expect(resolveTheme(null)).toBe("lime"); expect(resolveTheme("amber")).toBe("amber"); });
  it("logo solo por https", () => { expect(isValidLogoUrl("https://x.com/l.png")).toBe(true); expect(isValidLogoUrl("http://x.com/l.png")).toBe(false); expect(isValidLogoUrl("javascript:alert(1)")).toBe(false); });
});
