/** Temas cerrados de marca del box: el gimnasio elige uno, nunca colores sueltos. */
export const THEMES = [
  { id: "lime", label: "Grafito y lima", hint: "El estilo BoxFlow", swatch: ["oklch(0.17 0.008 260)", "oklch(0.89 0.2 128)"] },
  { id: "amber", label: "Negro y amarillo", hint: "Clásico de box industrial", swatch: ["oklch(0.16 0.005 80)", "oklch(0.86 0.17 90)"] },
  { id: "crimson", label: "Negro y rojo", hint: "Potencia y competición", swatch: ["oklch(0.16 0.008 20)", "oklch(0.62 0.22 25)"] },
  { id: "cobalt", label: "Acero y azul", hint: "Limpio y técnico", swatch: ["oklch(0.17 0.015 250)", "oklch(0.68 0.17 245)"] },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "lime";
export const resolveTheme = (v?: string | null): ThemeId => (THEMES.some((t) => t.id === v) ? (v as ThemeId) : DEFAULT_THEME);
/** Solo se aceptan logos servidos por https. */
export const isValidLogoUrl = (v: string) => /^https:\/\/\S+$/.test(v.trim());
