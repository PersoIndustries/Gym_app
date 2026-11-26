import { describe, expect, it } from "vitest";
import { classPermissions, hasClassManagement, hasPermission, type Permission } from "./permissions";
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

const check = (permissions: string[]) => (permission: Permission) => hasPermission("coach", permissions, permission);
it("own class editing does not allow editing another teacher's class", () => {
  expect(classPermissions(check(["classes.edit_own"]), "teacher-a", "teacher-a").edit).toBe(true);
  expect(classPermissions(check(["classes.edit_own"]), "teacher-a", "teacher-b").edit).toBe(false);
});
it("own WOD programming never grants another class or an unassigned class", () => {
  expect(classPermissions(check(["wod.manage_own"]), "teacher-a", "teacher-a").wod).toBe(true);
  expect(classPermissions(check(["wod.manage_own"]), "teacher-a", "teacher-b").wod).toBe(false);
  expect(classPermissions(check(["wod.manage_own"]), null, null).wod).toBe(false);
});
it("own attendance is limited to the assigned teacher", () => {
  expect(classPermissions(check(["attendance.manage_own"]), "teacher-a", "teacher-a").attendance).toBe(true);
  expect(classPermissions(check(["attendance.manage_own"]), "teacher-a", "teacher-b").attendance).toBe(false);
});
it("editing and creating do not grant teacher assignment", () => {
  expect(classPermissions(check(["classes.edit_any", "classes.create_delete"]), "teacher-a", "teacher-a").assignCoach).toBe(false);
  expect(classPermissions(check(["classes.assign_coach"]), "teacher-a", "teacher-b").assignCoach).toBe(true);
});
it("adding participants does not grant attendance marking", () => {
  const permissions = classPermissions(check(["attendance.add_participant"]), "teacher-a", "teacher-a");
  expect(permissions.addParticipant).toBe(true);
  expect(permissions.attendance).toBe(false);
});
it("granular permissions open class management without the legacy umbrella", () => {
  expect(hasClassManagement(check(["wod.manage_own"]))).toBe(true);
  expect(hasClassManagement(check(["members.view"]))).toBe(false);
});
it("legacy permissions keep independent class and attendance rights", () => {
  const permissions = classPermissions(check(["classes.manage", "attendance.manage"]), "teacher-a", "teacher-b");
  expect(Object.values(permissions).every(Boolean)).toBe(true);
});
