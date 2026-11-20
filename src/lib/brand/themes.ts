/** Temas cerrados de marca del box: el gimnasio elige uno, nunca colores sueltos. */
export const THEMES = [
  { id: "lime", label: "Grafito y lima", hint: "Oscuro · clásico" },
  { id: "amber", label: "Negro y amarillo", hint: "Oscuro · industrial" },
  { id: "crimson", label: "Negro y rojo", hint: "Oscuro · competición" },
  { id: "cobalt", label: "Acero y azul", hint: "Oscuro · técnico" },
  { id: "chalk", label: "Blanco y carbono", hint: "Claro · minimalista" },
  { id: "mint", label: "Menta y coral", hint: "Claro · aurora suave" },
  { id: "aurora", label: "Aurora boreal", hint: "Oscuro · aurora esmeralda y cian" },
  { id: "solar", label: "Aurora solar", hint: "Oscuro · aurora amarilla y rosa" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "lime";
export const resolveTheme = (v?: string | null): ThemeId => (THEMES.some((t) => t.id === v) ? (v as ThemeId) : DEFAULT_THEME);
/** Solo se aceptan logos servidos por https. */
export const isValidLogoUrl = (v: string) => /^https:\/\/\S+$/.test(v.trim());
