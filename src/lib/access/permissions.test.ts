import { describe, expect, it } from "vitest";
import { hasPermission } from "./permissions";
describe("hasPermission", () => {
  it("admin always allowed", () => expect(hasPermission("admin", [], "classes.manage")).toBe(true));
  it("coach without custom role keeps default permissions", () => expect(hasPermission("coach", null, "classes.manage")).toBe(true));
  it("coach with role lacking permission is denied", () => expect(hasPermission("coach", ["attendance.manage"], "classes.manage")).toBe(false));
  it("coach with role including permission is allowed", () => expect(hasPermission("coach", ["classes.manage"], "classes.manage")).toBe(true));
  it("athlete never allowed", () => expect(hasPermission("athlete", null, "members.view")).toBe(false));
});
