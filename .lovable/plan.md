# BoxFlow — base SaaS multi-tenant (sin Lovable Cloud)

## Enfoque
App mobile-first con datos de ejemplo detrás de una capa de "repositorios". Hoy leen datos mock; mañana se cambian por consultas a tu Supabase externo sin tocar las pantallas. Auth simulada con la misma interfaz que Supabase Auth.

## Decisiones asumidas (corrígeme si alguna no encaja)
- Un usuario pertenece a un solo box a la vez (tabla puente `tenant_members` para permitir varios en el futuro).
- Rol por box (`athlete`, `coach`, `admin`) en `tenant_members`; `super_admin`/`developer` en tabla aparte `platform_roles` (nunca en el perfil, por seguridad).
- Código de invitación: un código por box (reutilizable, con caducidad opcional y rol asignado), tabla `tenant_invites`.
- Cuotas: el box define planes (`membership_plans`) con reglas (días de semana, tipos de actividad permitidos); el usuario tiene una `user_memberships` activa.
- Nombre: BoxFlow. Dark mode por defecto con toggle.

## Pantallas y rutas
- `/` landing, `/login`, `/signup`, `/join` (introducir código de invitación)
- `/dashboard` — cambia según rol
- `/calendar` — clases de la semana del box (bloqueadas si tu cuota no las cubre)
- `/my-classes` — clases apuntadas
- `/profile` — ficha y RMs (back squat, front squat, deadlift, clean, snatch, jerk, bench, press…)
- `/admin`, `/admin/classes`, `/admin/members`, `/admin/plans` — solo admin/coach
- `/platform` — tenants (super admin). **Web-first**: layout de escritorio con sidebar fijo, tablas densas, filtros y paneles laterales; en móvil solo se adapta (sin barra inferior).
- `/dev` — Roadmap (también web-first, vista tablero/tabla) con las 8 tareas iniciales, estado pendiente / en progreso / hecha (persistido en el navegador hasta conectar Supabase)
- Atleta y admin del box: navegación inferior en móvil, sidebar en escritorio. Super Admin: consola web propia. Selector de "rol demo" para probar cada vista.

## Diseño
Deportivo-profesional: fondo grafito oscuro, acento verde lima eléctrico, tipografía Space Grotesk (titulares) + IBM Plex Sans (texto). Tarjetas compactas, objetivos táctiles grandes.

## Detalles técnicos
- Tu proyecto Supabase externo ya está conectado: el cliente generado se usa para Auth real; las tablas se crean con la migración y los repos mock quedan como alternativa hasta tener datos.
- `src/lib/domain/types.ts`: tipos que espejan el esquema SQL.
- `src/lib/data/` : interfaces de repositorio + implementación mock; `src/lib/auth/` AuthProvider con interfaz tipo Supabase.
- `src/lib/access/membership.ts`: función pura `canAccessClass(plan, class)` + tests vitest.
- `supabase/migrations/0001_init.sql`: tablas `tenants, profiles, tenant_members, platform_roles, tenant_invites, membership_plans, user_memberships, activity_types, classes, class_enrollments, facilities, facility_reservations, roadmap_items, personal_records`, con GRANTs, RLS activado, funciones `is_tenant_member`, `has_tenant_role`, `is_platform_admin` (security definer) y políticas por `tenant_id`; seed del roadmap.
- `docs/ARCHITECTURE.md` + `AGENTS.md`: decisiones y pasos para conectar Supabase (variables `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`, aplicar migración, cambiar repos mock por los de Supabase).
- PWA: solo manifest + iconos (instalable), sin service worker por ahora.
- Fuera de alcance: lógica de reservas de instalaciones, notificaciones.
