# Tareas, planes SaaS y alta de gimnasio

## 1. Tareas (Dev / Roadmap)
- Botón "Copiar todas" y "Copiar filtradas" en la cabecera: copia al portapapeles una lista en texto (estado, prioridad, título, descripción, notas, etiquetas) lista para pegármela.
- Casillas para seleccionar varias tareas y "Copiar seleccionadas".
- Repaso de tareas: marcar como hechas las ya construidas (tests de aislamiento, cuotas reales, reservas de instalaciones, cierres del gym, eventos y carreras, tres calendarios, asistencia, cancelación por mínimo parcial). Las tareas guardadas en tu navegador se actualizan a su nuevo estado si no las has editado tú.

## 2. Planes SaaS (precios propuestos)
| | Starter 10 €/mes | Pro 25 €/mes | Elite 50 €/mes |
|---|---|---|---|
| Gimnasios | 1 | 1 | Hasta 3 (multi-sede) |
| Socios activos | 50 | 200 | Ilimitados |
| Coaches/staff | 2 | 10 | Ilimitados |
| Clases, WOD, RMs, asistencia | Sí | Sí | Sí |
| Cuotas de socios | 3 | Ilimitadas | Ilimitadas |
| Reserva de espacios (sauna, pádel) | No | Sí | Sí |
| Eventos internos y comunidad | Ver | Crear | Crear + destacados |
| Temas y logo | Tema base | 4 temas + logo | 4 temas + logo |
| Métricas | Básicas | Avanzadas | Avanzadas + comparativa sedes |
| Dominio personalizado | No | No | Sí (próximamente) |
| Soporte | Email | Prioritario | Prioritario + onboarding |

- Anual con 2 meses gratis (100 / 250 / 500 €/año). Prueba de 14 días en Pro.
- Cálculo: a 10 € por box con ~50 socios son 0,20 €/socio; coste de infraestructura estimado <1 €/box, margen alto. Los límites empujan a subir de plan cuando el box crece.
- Los límites se aplican de verdad en la base de datos (al añadir socios, coaches, gimnasios o activar espacios), no solo en pantalla.
- Sin cobro real todavía: el plan queda como "en prueba"; el cobro se conecta en una tarea aparte.

## 3. Página principal y precios
- `/` pasa a ser la web comercial para dueños de box: propuesta, funciones, precios y botón "Crear mi gimnasio". La página de desarrollo actual se mueve a `/dev-home`.
- `/precios` con la tabla anterior y conmutador mensual/anual.

## 4. Alta de gimnasio paso a paso (`/empezar`)
1. Cuenta: registro o inicio de sesión.
2. Datos del box: nombre, ciudad, código de acceso (sugerido automáticamente), aprobación de socios sí/no.
3. Plan: Starter / Pro / Elite (prueba 14 días).
4. Marca: tema (lima, amarillo, rojo, azul) con vista previa del acceso del socio y logo (URL https; la subida de archivo sigue pendiente).
5. Básicos: redondeo de discos, horas de cancelación, mínimo de asistentes, activar espacios (solo si el plan lo permite).
6. Listo: enlace del box `/b/código`, copiar enlace y checklist (crear horario, cuotas, invitar coaches).
- Cualquier usuario registrado puede crear su gimnasio y queda como admin; el límite de gimnasios lo marca su plan. Super Admin sigue pudiendo crear desde su consola.

## Detalles técnicos
- Nueva tabla `saas_plans` (catálogo, lectura pública) y `tenant_subscriptions` (tenant_id, plan, estado trial/active, fin de prueba), con grants y RLS por `is_tenant_member`/admin.
- Nueva función `create_gym_with_plan(...)` (security definer) que crea tenant, invitación, ajustes, tema, suscripción y te añade como admin; comprueba el límite de gimnasios del plan.
- Triggers de límite en `tenant_members` (socios/coaches) y en `tenant_settings.facilities_enabled`.
- Lógica de límites pura en `src/lib/access/saas-plans.ts` con pruebas (10/25/50 €, 1/1/3 gimnasios, 50/200/ilimitados socios, espacios solo Pro/Elite).
- Extender `supabase/tests/tenant_isolation.sql` con las tablas nuevas.
- Como tu Supabase es externo, tendrás que aplicar la migración en tu proyecto antes de probar el alta.
