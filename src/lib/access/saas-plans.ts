/** Planes SaaS de BoxFlow. Espejo de la tabla saas_plans (los límites se aplican en SQL). */
export type SaasPlanId = "starter" | "pro" | "elite";
export interface SaasPlan { id: SaasPlanId; name: string; month: number; year: number; maxGyms: number; maxMembers: number | null; maxStaff: number | null; maxMemberPlans: number | null; facilities: boolean; customDomain: boolean; advancedMetrics: boolean; tagline: string; features: string[] }
export const SAAS_PLANS: SaasPlan[] = [
  { id: "starter", name: "Starter", month: 10, year: 100, maxGyms: 1, maxMembers: 50, maxStaff: 2, maxMemberPlans: 3, facilities: false, customDomain: false, advancedMetrics: false, tagline: "Para boxes que empiezan", features: ["1 gimnasio", "Hasta 50 socios", "2 coaches/staff", "Clases, WOD, RMs y asistencia", "3 cuotas de socio", "Tema base y logo", "Métricas básicas"] },
  { id: "pro", name: "Pro", month: 25, year: 250, maxGyms: 1, maxMembers: 200, maxStaff: 10, maxMemberPlans: null, facilities: true, customDomain: false, advancedMetrics: true, tagline: "El más elegido", features: ["1 gimnasio", "Hasta 200 socios", "10 coaches/staff", "Cuotas ilimitadas", "Reserva de espacios (sauna, pádel)", "Crear eventos y carreras", "4 temas + logo", "Métricas avanzadas"] },
  { id: "elite", name: "Elite", month: 50, year: 500, maxGyms: 3, maxMembers: null, maxStaff: null, maxMemberPlans: null, facilities: true, customDomain: true, advancedMetrics: true, tagline: "Multi-sede y marca propia", features: ["Hasta 3 gimnasios", "Socios y staff ilimitados", "Todo lo de Pro", "Eventos destacados en la comunidad", "Comparativa entre sedes", "Dominio personalizado (próximamente)", "Onboarding asistido"] },
];
export const TRIAL_DAYS = 14;
export const getPlan = (id: SaasPlanId) => SAAS_PLANS.find((p) => p.id === id)!;
export const canAddMember = (p: SaasPlan, current: number) => p.maxMembers === null || current < p.maxMembers;
export const canAddStaff = (p: SaasPlan, current: number) => p.maxStaff === null || current < p.maxStaff;
export const canCreateGym = (p: SaasPlan, owned: number) => owned < p.maxGyms;
export const pricePerMember = (p: SaasPlan, members: number) => Math.round((p.month / Math.max(1, members)) * 100) / 100;
/** Código de acceso sugerido a partir del nombre: letras/números, 4-12, en mayúsculas. */
export const suggestCode = (name: string) => { const base = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8); return (base.length >= 2 ? base : "BOX") + String(new Date().getFullYear()).slice(2); };
export const isValidCode = (c: string) => /^[A-Z0-9]{4,12}$/.test(c.trim().toUpperCase());

/** Códigos promocionales (espejo de promo_codes / create_gym_with_plan). */
export interface PromoLike { active: boolean; expires_at: string | null; max_uses: number | null; uses: number; plan_id: string | null }
export const promoUsable = (c: PromoLike, plan: SaasPlanId, now = new Date()) =>
  c.active && (!c.expires_at || new Date(c.expires_at) > now) && (c.max_uses === null || c.uses < c.max_uses) && (!c.plan_id || c.plan_id === plan);
export const discounted = (cents: number, pct: number) => Math.round((cents * (100 - Math.min(100, Math.max(0, pct)))) / 100);
export const commission = (cents: number, pct: number) => Math.round((cents * pct) / 100);
export const remainingUses = (c: Pick<PromoLike, "max_uses" | "uses">) => (c.max_uses === null ? null : Math.max(0, c.max_uses - c.uses));
