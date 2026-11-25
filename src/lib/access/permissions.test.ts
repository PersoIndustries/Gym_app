import { describe, expect, it } from "vitest";
import { hasPermission } from "./permissions";
describe("hasPermission", () => {
  it("admin always allowed", () => expect(hasPermission("admin", [], "classes.manage")).toBe(true));
  it("coach without custom role keeps default permissions", () => expect(hasPermission("coach", null, "classes.manage")).toBe(true));
  it("coach with role lacking permission is denied", () => expect(hasPermission("coach", ["attendance.manage"], "classes.manage")).toBe(false));
  it("coach with role including permission is allowed", () => expect(hasPermission("coach", ["classes.manage"], "classes.manage")).toBe(true));
  it("athlete never allowed", () => expect(hasPermission("athlete", null, "members.view")).toBe(false));
});

import { hasPermission as hp } from "./permissions";
import { test as t, expect as e } from "vitest";
t("classes.manage implies granular class and WOD permissions", () => {
  e(hp("coach", ["classes.manage"], "wod.manage_own")).toBe(true);
  e(hp("coach", ["classes.manage"], "attendance.manage_own")).toBe(false);
});
t("granular own permission does not grant any", () => {
  e(hp("coach", ["wod.manage_own"], "wod.manage_any")).toBe(false);
});
