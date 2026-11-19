# Calendarios, eventos/carreras, niveles por ejercicio y reservas activables

## 1. Los tres calendarios (según el documento)
Una página "Calendario" con pestañas, reutilizando el mismo calendario (semana / mes):
- **Comunidad (público):** eventos y carreras abiertas de todos los boxes y de la plataforma. Visible sin iniciar sesión en `/eventos`, con enlace compartible por evento.
- **Mi box (socio):** clases filtradas por su cuota + cierres/vacaciones + eventos internos del box.
- **Gestión (coach/admin):** lo mismo con herramientas: asignar coach, asistencia completa y un **resumen mensual** (clases dadas, canceladas, asistencia media, ocupación).
Filtros por tipo: clases, eventos, carreras, cierres.

## 2. Eventos y carreras
Dos alcances:
- **Internos del box:** solo los ven los socios (ej. "Open interno", quedada, seminario).
- **Comunidad:** publicados por un box (o por la plataforma) para todo el mundo (ej. Hyrox, competición por parejas).

Cada evento tiene: título, tipo (competición, carrera, quedada, seminario, social), fechas, lugar, descripción, enlace/inscripción externa, precio orientativo, plazas, formato (individual / parejas / equipos), categorías (RX, Scaled, Masters…) y actividades relacionadas (para el **anuncio segmentado**: se destaca a socios cuya cuota incluye esa actividad).

Participación (mejora de la idea):
- Estados: **Voy / Me interesa / No voy**, visibles entre compañeros del box (respetando "ocultar identidad" → Anónimo).
- **"Busco pareja/equipo"**: marca visible con la categoría; lista de compañeros que también buscan para emparejarse.
- **Invitar a un compañero** del box al evento.
- "Quién va de mi box" en eventos de la comunidad (solo ves a gente de tu box).
- Si un evento interno bloquea el box, se reutiliza el sistema de cierres existente.
- Recordatorios y chat quedan para fases posteriores (se añaden al roadmap).

Gestión: admins/coaches crean eventos internos y pueden publicarlos en comunidad; el Super Admin modera la comunidad (ocultar/destacar eventos).

## 3. Niveles por ejercicio en el WOD
En cada ejercicio el profesor puede añadir **variantes por nivel**: p. ej. RX hombre 60 kg / RX mujer 40 kg, Open, Scaled, Masters.
- Niveles configurables por box (por defecto: RX ♂, RX ♀, Scaled ♂, Scaled ♀).
- Cada nivel puede llevar peso fijo, % de RM, repeticiones o nota propia.
- El socio ve todos los niveles y puede marcar su nivel preferido en el perfil para que se le resalte (y su peso calculado si es por % RM).

## 4. Reservas de instalaciones activables
- En Ajustes del box (admin): interruptor **"Reservas de instalaciones activas"**.
- Desactivado: los socios no ven la sección ni el acceso en el menú, y el sistema rechaza reservas nuevas (no solo se oculta). El staff sigue viendo la configuración para prepararla.
- Opcionalmente, activar/desactivar cada espacio individualmente (sauna, pádel…).

## Detalles técnicos
- Migración:
  - `tenant_settings.facilities_enabled boolean default false`; `facilities.active boolean default true`; `request_facility` y `validate_facility_booking` rechazan si está desactivado; RLS de `facilities` para atletas filtra por ambos.
  - `events` (tenant_id nullable para eventos de plataforma, scope `box|community`, kind, format, categories text[], activity_type_ids uuid[], location, url, price_cents, capacity, starts/ends, status, featured). RLS: community visible a anon; box solo a miembros; escritura coach/admin del box o staff de plataforma.
  - `event_participants` (event_id, user_id, tenant_id del usuario, intent going|interested|not_going, looking_for_partner, category, note). Lectura limitada a compañeros del mismo box; RPC `event_attendees` aplicando anonimato.
  - `event_invites` (from, to, event) mismo box.
  - `tenant_levels` (nombre, orden) y `wod_item_levels` (wod_item_id, level_id, load_kg, percent_rm, reps, notes); `profiles.preferred_level_id`. Triggers de mismo box.
  - Extender `tenant_isolation.sql` con eventos, participantes, niveles y reservas desactivadas.
- Frontend: `src/lib/data/events.ts`; `GymCalendar` acepta eventos y modo resumen mensual; rutas `calendar.tsx` (pestañas), `events.$eventId.tsx`, pública `eventos.tsx` y `eventos.$id.tsx` con OG; `admin/events.tsx`; ajustes en admin; editor de niveles en `class.$classId.tsx`; menú oculta "Espacios" según ajuste.
- Pruebas: reglas puras de visibilidad de eventos, selección de nivel/peso y bloqueo de reservas desactivadas.
