export function needsMembershipWait(role: string, hasTenant: boolean, hasPlan: boolean) {
  return hasTenant && role === "athlete" && !hasPlan;
}
export function visibleWorkoutPhases<T extends { key: string; groups?: { key: string }[] }>(phases: T[], items: { block: string; group_key?: string | null }[], staff: boolean) {
  return staff ? phases : phases.filter(p => items.some(w => w.block === p.key || p.groups?.some(g => g.key === w.group_key)));
}