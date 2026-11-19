export function facilitySlots(day: string, opens: string, closes: string, minutes: number) {
  if (minutes <= 0) return [];
  const time = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));
  const slots: { start: string; end: string; label: string }[] = [];
  for (let t = time(opens); t + minutes <= time(closes); t += minutes) {
    const stamp = (n: number) => `${day}T${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}:00`;
    slots.push({ start: stamp(t), end: stamp(t + minutes), label: `${stamp(t).slice(11,16)}–${stamp(t + minutes).slice(11,16)}` });
  }
  return slots;
}
export function overlaps(start: string, end: string, rows: { starts_at: string; ends_at: string }[]) {
  return rows.some(r => new Date(r.starts_at).getTime() < new Date(end).getTime() && new Date(r.ends_at).getTime() > new Date(start).getTime());
}