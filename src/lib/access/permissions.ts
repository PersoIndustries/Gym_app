// Mirror of SQL has_tenant_permission(): admin has everything; a coach without
// a custom role keeps default coach permissions; with a role, only its permissions.
export const PERMISSIONS = [
  { key: "classes.manage", label: "Programar clases y WOD", help: "Crear, editar y borrar clases y entrenamientos." },
  { key: "attendance.manage", label: "Pasar asistencia", help: "Marcar quién vino y añadir asistentes." },
  { key: "members.view", label: "Ver socios", help: "Consultar el listado de socios y sus cuotas." },
  { key: "events.manage", label: "Proponer eventos", help: "Crear eventos del box (el admin los aprueba)." },
] as const;
export type Permission = (typeof PERMISSIONS)[number]["key"];
export const COACH_DEFAULT: Permission[] = PERMISSIONS.map((p) => p.key);

export function hasPermission(role: "athlete" | "coach" | "admin" | null, customPerms: readonly string[] | null, perm: Permission): boolean {
  if (role === "admin") return true;
  if (role !== "coach") return false;
  return customPerms === null ? true : customPerms.includes(perm);
}
