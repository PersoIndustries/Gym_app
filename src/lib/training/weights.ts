/** Kilos recomendados a partir del RM del atleta y el % pautado, redondeados al disco más cercano. */
export function recommendedKg(rmKg: number | null | undefined, percent: number | null | undefined, roundingKg = 2.5): number | null {
  if (!rmKg || !percent || rmKg <= 0 || percent <= 0) return null;
  const step = roundingKg > 0 ? roundingKg : 0.5;
  return Math.round(((rmKg * percent) / 100) / step) * step;
}

/** Texto para el atleta: "5x5 @75% → 82,5 kg". */
export function describeLoad(sets: number | null, reps: string | null, percent: number | null, kg: number | null): string {
  const scheme = sets && reps ? `${sets}x${reps}` : reps ?? "";
  const pct = percent ? ` @${percent}%` : "";
  const load = kg !== null ? ` → ${kg.toLocaleString("es-ES")} kg` : "";
  return `${scheme}${pct}${load}`.trim();
}
