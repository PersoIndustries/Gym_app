// Datos de ejemplo. Sustituir por consultas a Supabase en src/lib/data/repo.ts.
import type { ActivityType, GymClass, Member, MembershipPlan, RoadmapItem, Tenant } from "@/lib/domain/types";

export const TENANTS: Tenant[] = [
  { id: "t1", name: "Iron Harbor CrossFit", slug: "iron-harbor", city: "Valencia", status: "active", members: 184 },
  { id: "t2", name: "Norte HIIT Studio", slug: "norte-hiit", city: "Bilbao", status: "trial", members: 62 },
  { id: "t3", name: "Club Atlántico", slug: "club-atlantico", city: "A Coruña", status: "active", members: 410 },
  { id: "t4", name: "Box 41", slug: "box-41", city: "Madrid", status: "paused", members: 37 },
];
export const CURRENT_TENANT: Tenant = TENANTS[0]!;
export const INVITE_CODES: Record<string, string> = { IRON24: "t1", NORTE: "t2" };

export const ACTIVITIES: ActivityType[] = [
  { id: "wod", tenant_id: "t1", name: "CrossFit WOD", kind: "class" },
  { id: "hiit", tenant_id: "t1", name: "HIIT", kind: "class" },
  { id: "oly", tenant_id: "t1", name: "Halterofilia", kind: "class" },
  { id: "open", tenant_id: "t1", name: "Open Box", kind: "class" },
];

export const PLANS: MembershipPlan[] = [
  { id: "p-week", tenant_id: "t1", name: "Entre semana", price_cents: 6500, allowed_weekdays: [1, 2, 3, 4, 5], allowed_activity_type_ids: [], weekly_class_limit: null },
  { id: "p-full", tenant_id: "t1", name: "Completa", price_cents: 8500, allowed_weekdays: [0, 1, 2, 3, 4, 5, 6], allowed_activity_type_ids: [], weekly_class_limit: null },
  { id: "p-weekend", tenant_id: "t1", name: "Weekend", price_cents: 3500, allowed_weekdays: [0, 6], allowed_activity_type_ids: ["wod", "open"], weekly_class_limit: 2 },
];

export const MEMBERS: Member[] = [
  { id: "u1", tenant_id: "t1", name: "Lucía Martín", email: "lucia@example.com", role: "athlete", plan_id: "p-week" },
  { id: "u2", tenant_id: "t1", name: "Diego Sanz", email: "diego@example.com", role: "coach", plan_id: "p-full" },
  { id: "u3", tenant_id: "t1", name: "Marta Ruiz", email: "marta@example.com", role: "admin", plan_id: "p-full" },
  { id: "u4", tenant_id: "t1", name: "Pablo Gil", email: "pablo@example.com", role: "athlete", plan_id: "p-weekend" },
  { id: "u5", tenant_id: "t1", name: "Irene Vega", email: "irene@example.com", role: "athlete", plan_id: null },
];

function buildWeek(): GymClass[] {
  const now = new Date();
  const monday = new Date(now); monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const slots: [number, string, string, string][] = [
    [7, "wod", "WOD Mañana", "Diego"], [9, "hiit", "HIIT 45", "Ana"], [13, "oly", "Halterofilia", "Diego"],
    [18, "wod", "WOD Tarde", "Marta"], [19, "wod", "WOD Tarde", "Diego"], [20, "hiit", "HIIT Night", "Ana"],
  ];
  const out: GymClass[] = [];
  for (let d = 0; d < 7; d++) {
    const day = new Date(monday); day.setDate(monday.getDate() + d);
    const weekend = d >= 5;
    const list = weekend ? [[10, "wod", "Team WOD", "Marta"], [11, "open", "Open Box", "—"]] as typeof slots : slots;
    list.forEach(([h, act, title, coach], i) => {
      const s = new Date(day); s.setHours(h, 0, 0, 0);
      const e = new Date(s); e.setMinutes(60);
      out.push({ id: `c-${d}-${i}`, tenant_id: "t1", activity_type_id: act, title, coach, starts_at: s.toISOString(), ends_at: e.toISOString(), capacity: 16, booked: (d * 3 + i * 5) % 17 });
    });
  }
  return out;
}
export const CLASSES = buildWeek();

export const MAIN_LIFTS = ["Back Squat", "Front Squat", "Deadlift", "Clean", "Snatch", "Clean & Jerk", "Bench Press", "Strict Press"];

// Roadmap según el documento de producto (fases 0-7). Formato: título|descripción|estado|prioridad|etiquetas
export const ROADMAP_SEED: RoadmapItem[] = [
  "F0 · Arquitectura multi-tenant y modelo de datos|Tablas con tenant_id, RLS y roles separados.|done|urgent|Fase 0,DB",
  "F0 · Auth email/contraseña y sesiones|Alta, login y rutas privadas.|done|urgent|Fase 0,Auth",
  "F0 · Login con Google|Activar proveedor Google en Supabase y botón en /auth.|pending|high|Fase 0,Auth",
  "F0 · Tests de aislamiento entre boxes|Comprobar que un socio nunca ve datos de otro box.|pending|urgent|Fase 0,Seguridad",
  "F0 · RGPD y privacy by design|Registro de tratamientos, DPA por box, minimización.|pending|high|Fase 0,Legal",
  "F0 · CI/CD, entornos y monitorización|Entornos separados, logs y alertas.|pending|medium|Fase 0,Infra",
  "F1 · Roles reales y box activo|Roles desde tenant_members/platform_roles, selector de box.|done|urgent|Fase 1,Multi-tenant",
  "F1 · Adhesión con código (directa o con aprobación)|Solicitudes pendientes para el admin.|done|high|Fase 1,Onboarding",
  "F1 · Biblioteca de ejercicios del box|Ejercicios propios ligados a un RM.|done|urgent|Fase 1,Clases",
  "F1 · WOD con kilos según RM|% del RM redondeado al disco del box.|done|urgent|Fase 1,Clases",
  "F1 · RMs del atleta en base de datos|personal_records por usuario.|done|high|Fase 1,Atleta",
  "F1 · Tutorial guiado de bienvenida|Primeros pasos tras unirse a un box.|pending|medium|Fase 1,Onboarding",
  "F1 · Tres calendarios|Público, socio (filtrado por cuota) y staff.|in_progress|high|Fase 1,Calendario",
  "F1 · Cuotas reales (user_memberships)|Sustituir la cuota demo y aplicar reglas por actividad.|pending|urgent|Fase 1,Cuotas",
  "F1 · Pagos: suscripciones, facturas y devoluciones (Stripe)|Conectar la consola de facturas a cobros reales.|pending|high|Fase 1,Pagos",
  "F1 · Recuperar y cambiar contraseña (usuario y admin)|Flujo de reset por email.|pending|high|Fase 1,Auth",
  "F1 · Notificaciones email + centro en la app|Recordatorios, riesgo de cancelación, avisos admin.|pending|high|Fase 1,Notificaciones",
  "F2 · Asistencia voy/dudas/voy seguro|Con aforo, mínimo y lista de espera.|done|urgent|Fase 2,Clases",
  "F2 · Cancelación automática por mínimo|Tarea programada cada 15 min. Falta programar la llamada.|in_progress|urgent|Fase 2,Jobs",
  "F2 · Reservas de instalaciones|Pistas, sauna; aceptación manual o automática.|pending|medium|Fase 2,Instalaciones",
  "F2 · Cierres del gym bloquean calendario|Correlación de cierres con clases e instalaciones.|pending|medium|Fase 2,Calendario",
  "F3 · Eventos y carreras|Calendario público, apuntarse, busco pareja.|pending|low|Fase 3,Comunidad",
  "F4 · Hardening, caché, WAF y rate limiting|Revisión ISO 27001.|pending|low|Fase 4,Seguridad",
  "F5 · SEO, branding y media kits||pending|low|Fase 5,Growth",
  "F6 · Chat light por evento||pending|low|Fase 6,Comunidad",
  "F7 · Apps nativas e integraciones||pending|low|Fase 7,Escalado",
  "Abierto · Pricing, KPIs y unit economics|Definir precios, métricas de éxito y costes (sección 9 del documento).|pending|high|Negocio",
].map((r, i) => { const [title = "", description = "", status = "pending", priority = "medium", tags = ""] = r.split("|"); return { id: `r${i + 1}`, title, description, status: status as RoadmapItem["status"], priority: priority as NonNullable<RoadmapItem["priority"]>, tags: tags.split(",").filter(Boolean), notes: "", due: null, sort_order: i + 1 }; });
