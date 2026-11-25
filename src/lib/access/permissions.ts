// Mirror of SQL has_tenant_permission(): admin has everything; a coach without
// a custom role keeps default coach permissions; with a role, only its permissions.
// Legacy umbrella permissions (classes.manage, attendance.manage) imply their granular children.
export const PERMISSIONS = [
  { key: "classes.manage", group: "Clases", label: "Gestión completa de clases y WOD", help: "Incluye todos los permisos de clases, WOD y ejercicios." },
  { key: "classes.create_delete", group: "Clases", label: "Crear y borrar clases", help: "Añadir o eliminar clases del calendario." },
  { key: "classes.edit_any", group: "Clases", label: "Editar cualquier clase", help: "Cambiar horario o aforo de todas las clases." },
  { key: "classes.edit_own", group: "Clases", label: "Editar sus clases", help: "Solo las clases donde es el profesor." },
  { key: "classes.assign_coach", group: "Clases", label: "Asignar profesor", help: "Cambiar o sustituir el profesor de una clase." },
  { key: "classes.cancel", group: "Clases", label: "Cancelar clases", help: "Cancelar o reactivar sesiones." },
  { key: "wod.manage_any", group: "WOD", label: "Programar cualquier WOD", help: "Editar el entrenamiento de todas las clases." },
  { key: "wod.manage_own", group: "WOD", label: "Programar sus WOD", help: "Solo el entrenamiento de sus clases." },
  { key: "exercises.manage", group: "WOD", label: "Biblioteca de ejercicios", help: "Crear y editar ejercicios del box." },
  { key: "attendance.manage", group: "Asistencia", label: "Asistencia completa", help: "Incluye todos los permisos de asistencia." },
  { key: "attendance.manage_any", group: "Asistencia", label: "Pasar lista en cualquier clase", help: "Ideal para recepción o suplencias." },
  { key: "attendance.manage_own", group: "Asistencia", label: "Pasar lista en sus clases", help: "Solo en las clases que imparte." },
  { key: "attendance.add_participant", group: "Asistencia", label: "Apuntar socios", help: "Inscribir socios manualmente en una clase." },
  { key: "members.view", group: "Comunidad", label: "Ver socios", help: "Consultar el listado de socios y sus cuotas." },
  { key: "events.manage", group: "Comunidad", label: "Proponer eventos", help: "Crear eventos del box (el admin los aprueba)." },
] as const;
export type Permission = (typeof PERMISSIONS)[number]["key"];
export const PERMISSION_GROUPS = ["Clases", "WOD", "Asistencia", "Comunidad"] as const;
export const COACH_DEFAULT: Permission[] = PERMISSIONS.map((p) => p.key);

function implied(perms: readonly string[], perm: string): boolean {
  if (perms.includes(perm)) return true;
  if (perms.includes("classes.manage") && (perm.startsWith("classes.") || perm.startsWith("wod.") || perm === "exercises.manage")) return true;
  if (perms.includes("attendance.manage") && perm.startsWith("attendance.")) return true;
  return false;
}

export function hasPermission(role: "athlete" | "coach" | "admin" | null, customPerms: readonly string[] | null, perm: Permission): boolean {
  if (role === "admin") return true;
  if (role !== "coach") return false;
  return customPerms === null ? true : implied(customPerms, perm);
}
