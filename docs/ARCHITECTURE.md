# BoxFlow — Arquitectura

## Multi-tenancy
- Cada fila de negocio lleva `tenant_id`. RLS usa `is_tenant_member`, `has_tenant_role` (security definer).
- Roles del box en `tenant_members.role` (athlete/coach/admin). Roles de plataforma en `platform_roles` (super_admin/developer). Nunca en `profiles`.
- Alta en un box: `rpc('join_tenant_with_code', { _code })` valida `tenant_invites` (caducidad, usos).

## Estado actual
- Auth: Supabase Auth real (email + contraseña). Páginas privadas bajo `src/routes/_authenticated/`.
- Datos: mock en `src/lib/data/mock.ts`; reservas, RMs y roadmap en localStorage (`useLocalState`).
- Rol: selector "Demo" (`RoleSwitcher`) hasta leer `tenant_members`/`platform_roles`.
- Reglas de cuota: `src/lib/access/membership.ts` (`canAccessClass`, con tests).

## Pasos para pasar a datos reales
1. Crear un tenant + invite en SQL y asignarte `super_admin` en `platform_roles`.
2. Sustituir lecturas de `mock.ts` por consultas con `supabase` (RLS ya filtra por tenant).
3. Leer rol real en `SessionProvider` y retirar `RoleSwitcher`.
4. Cambiar `useBookings`, RMs y roadmap a `class_enrollments`, `personal_records`, `roadmap_items`.

## UI
- Atleta/staff: `AppShell` mobile-first (barra inferior + sidebar en escritorio).
- Super Admin / Dev: `ConsoleShell` web-first (sidebar fijo, tablas densas).
