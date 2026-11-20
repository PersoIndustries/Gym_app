export function parsePlanValues(price: string, weekly: string, trial: string) {
  const priceNumber = Number(price);
  if (!price.trim() || !Number.isFinite(priceNumber) || priceNumber < 0) throw new Error("Introduce un precio válido (0 para una cuota gratuita)");
  const limit = (value: string) => {
    if (!value.trim()) return null;
    const n = Number(value);
    if (!Number.isSafeInteger(n) || n < 0) throw new Error("Los límites deben ser enteros desde 0");
    return n;
  };
  return { price_cents: Math.round(priceNumber * 100), weekly_class_limit: limit(weekly), trial_class_limit: limit(trial) };
}