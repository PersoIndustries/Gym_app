# Códigos promocionales, permisos Admin/Profesor y Perfil por secciones

## 1. Códigos de invitación con descuento (Super Admin)
- Nueva sección **Códigos** en la consola Super Admin (web-first, tabla densa).
- Cada código: texto (ej. `JUAN20`), plan permitido (Starter/Pro/Elite o cualquiera), % de descuento, duración del descuento (primer mes, N meses, para siempre), usos máximos, fecha de caducidad, activo/pausado.
- **Influencer / afiliado** opcional: nombre, correo y % de retribución. Solo lo ve el Super Admin.
- Métricas por código: usos máximos, usos hechos, usos restantes, gimnasios creados, ingreso mensual generado (tras descuento), retribución estimada para el influencer. Arriba, totales y ranking de códigos.
- En **/empezar** (paso Plan) aparece "¿Tienes un código?". Se valida, muestra el precio rebajado y, si el código fija un plan, lo preselecciona y bloquea el resto.
- El canje es atómico en la base de datos: no se puede pasar del máximo ni usar un código caducado aunque se manipule el navegador.

## 2. Separar Admin y Profesor dentro del gimnasio
**Profesor puede:** gestionar clases y WOD, asistencias, añadir asistentes, ver socios (solo lectura), ver calendario, y **solicitar** eventos.
**Profesor no puede:** marca/logo/tema, ajustes del box, cuotas y precios, socios y roles, espacios (crear/configurar/aprobar), horario fijo, cierres del gimnasio, plan/pago.
- Solicitudes de eventos: el profesor crea un evento que queda "Pendiente de aprobación"; el admin ve una bandeja para aceptar o rechazar (con motivo). Solo los aprobados son visibles para socios.
- El menú de Gestión oculta lo que el profesor no puede usar, y además la base de datos lo bloquea.

## 3. Perfil con submenú
Pestañas en Perfil (móvil: lista de accesos; escritorio: menú lateral):
- **Mi perfil:** foto, nombre completo, alias (nuevo), correo (cambio con confirmación por email).
- **Mi nivel:** nivel general, nivel por ejercicio y mis RMs.
- **Privacidad y cuenta:** ocultar asistencia, cambio de contraseña, **Solicitar ayuda al gimnasio** (mensaje que llega al admin del box).
- **Mis datos (solo profesores/admins):** clases impartidas este mes, pendientes este mes, total asistentes, media de asistencia por clase, % de ocupación, próximas clases y histórico por meses.

## Dudas abiertas
- Tu mensaje se cortó en "pensado para un…". Asumo que el perfil del coach está pensado para su trabajo diario (agenda y resumen de rendimiento). Dime si querías algo más.
- Asumo que la retribución del influencer se calcula sobre lo que paga el gimnasio cada mes, sin pagos reales por ahora.

## Detalles técnicos
- Tablas: `promo_codes` (code único, plan_id nullable, discount_pct, duration_months nullable, max_uses, uses, expires_at, active, affiliate_name, affiliate_email, commission_pct) y `promo_redemptions` (code_id, tenant_id, owner_id, plan_id, discount_pct, price_after_cents). RLS: solo `is_platform_admin`. Validación pública vía RPC `check_promo_code(code, plan)` que devuelve solo descuento/plan, nunca afiliado.
- `create_gym_with_plan` recibe `_promo text`; bloquea fila (`for update`), valida y registra canje; `tenant_subscriptions` añade `discount_pct`, `discount_until`.
- Nuevo helper SQL `is_tenant_admin`; políticas de `tenant_settings`, `membership_plans`, `facilities`, `class_templates`, `gym_events`, `tenant_members` (escritura), `tenant_invites`, `change_facility_reservation` pasan de `{coach,admin}` a `{admin}`. Clases, WOD, asistencias y niveles siguen `{coach,admin}`.
- `community_events.status` añade `pending`/`rejected`; trigger fuerza `pending` si lo crea un coach; solo admin puede aprobar.
- `profiles.alias`; tabla `help_requests` (tenant_id, user_id, subject, message, status) con RLS propio/admin.
- Estadísticas del coach vía RPC `coach_stats(_tenant, _month)`.
- Pruebas: lógica de precio con descuento y límites de uso en `saas-plans.test.ts`; ampliar `tenant_isolation.sql` con códigos, ayuda y comprobaciones de que un coach no puede editar ajustes/cuotas/espacios.
