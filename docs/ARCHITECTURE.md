# BoxFlow — Arquitectura

## Multi-tenancy
- Cada fila de negocio lleva `tenant_id`. RLS usa `is_tenant_member`, `has_tenant_role` (security definer).
- Roles del box en `tenant_members.role` (athlete/coach/admin). Roles de plataforma en `platform_roles` (super_admin/developer). Nunca en `profiles`.
- Alta en un box: `rpc('join_tenant_with_code', { _code })` valida `tenant_invites` (caducidad, usos).

## Estado actual
- Auth: Supabase Auth real. Roles reales (`tenant_members`, `platform_roles`); `RoleSwitcher` solo cambia de box / consola.
- Reales: clases, plantillas, WOD (`wod_items`), ejercicios, RMs, asistencia, socios, cuotas asignadas, solicitudes, códigos, ajustes, vacaciones y cierres (`gym_events`).
- RPCs: `book_class`, `leave_class`, `class_attendance`, `class_attendees`, `generate_week_classes`, `review_join_request`, `create_tenant`, `cancel_underfilled_classes` (solo service role).
- Cancelación automática: `POST /api/public/cron/cancel-classes` con `Authorization: Bearer $CRON_SECRET` cada 15 min.
- Siguen mock: facturas/operaciones de plataforma, métricas, roadmap (localStorage). Cobros de cuotas y pantalla de reserva de instalaciones aún no están implementados.
- Reglas de cuota: `src/lib/access/membership.ts` (`canAccessClass`, con tests).

## Pasos para pasar a datos reales
1. Crear un tenant + invite en SQL y asignarte `super_admin` en `platform_roles`.
2. Sustituir lecturas de `mock.ts` por consultas con `supabase` (RLS ya filtra por tenant).
3. Leer rol real en `SessionProvider` y retirar `RoleSwitcher`.
4. Cambiar `useBookings`, RMs y roadmap a `class_enrollments`, `personal_records`, `roadmap_items`.

## UI
- Atleta/staff: `AppShell` mobile-first (barra inferior + sidebar en escritorio).
- Super Admin / Dev: `ConsoleShell` web-first (sidebar fijo, tablas densas).

## Acceso y vistas
- Una cuenta por persona para todos los boxes. `/auth` es el acceso general; `/b/{codigo}` guarda el código y tras entrar se une automáticamente vía `/join`.
- Google: `signInWithOAuth` vuelve a `/auth`. En el panel de Supabase: activar el proveedor Google y añadir `{origen}/auth` (preview y publicado) en Redirect URLs.
- Coach/admin/super admin eligen vista al entrar (`ViewPickerDialog`); la vista "usuario del gym" solo baja permisos en la UI, nunca los sube.
- Asistencia: `going` (Voy), `maybe` (Dudas), `not_going` (No voy, estado `declined`, no ocupa plaza). Mínimo = solo "Voy".
- Inicio `/` temporal de desarrollo: enlaces a los boxes visibles bajo RLS, creación de gimnasio (solo Super Admin), consolas y calendarios.
- `GymCalendar`: semana con columnas de coach/admin, mes, detalle diario y eventos. Las fotos del profesor salen de `coach_id` y `box_coaches`; los nombres antiguos sin cuenta asignada muestran iniciales.
- Fases ordenadas en `classes.phases`, alternativas en cada fase y en `wod_items.alternatives`.
- Cuotas reales: precio, días de clases, actividades, límite semanal y franjas independientes de instalaciones. Perfil e inicio muestran la cuota asignada; solo admin la modifica.
- Reservar valida cuota en SQL, en horario Europe/Madrid; instalaciones pueden permitir sábado hasta mediodía sin permitir clases ese día. Staff está exento de cuotas para operar.
- Cierres bloqueantes cancelan clases solapadas y evitan generarlas; borrar un cierre no reactiva clases automáticamente.

## Prueba de aislamiento entre boxes
`supabase/tests/tenant_isolation.sql` crea dos boxes temporales y actúa como atleta y admin del box A contra el box B (lecturas, ediciones, borrados, inserciones y trucos de tenant cruzado). Ejecutarla en el editor SQL: debe terminar con `TENANT_ISOLATION_OK: N checks` (no deja datos). Repetir tras cada migración que toque RLS.
