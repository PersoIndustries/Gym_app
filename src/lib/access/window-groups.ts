import type { FacilityWindow } from "./membership";

export type WindowGroup = { days: number[]; from: string; to: string };

/** Groups single-day windows that share the same hours into one editable block. */
export function groupWindows(windows: FacilityWindow[]): WindowGroup[] {
  const groups: WindowGroup[] = [];
  for (const w of windows) {
    const g = groups.find(x => x.from === w.from && x.to === w.to);
    if (g) { if (!g.days.includes(w.weekday)) g.days.push(w.weekday); }
    else groups.push({ days: [w.weekday], from: w.from, to: w.to });
  }
  return groups;
}

/** Expands blocks back into one window per day (deduplicated). */
export function expandGroups(groups: WindowGroup[]): FacilityWindow[] {
  const out: FacilityWindow[] = [];
  for (const g of groups) for (const d of g.days) {
    if (!out.some(w => w.weekday === d && w.from === g.from && w.to === g.to)) out.push({ weekday: d, from: g.from, to: g.to });
  }
  return out;
}
