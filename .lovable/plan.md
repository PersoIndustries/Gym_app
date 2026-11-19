# BoxFlow — Siguiente iteración: multi-gimnasio real + clases completas

## Diagnóstico (estado actual vs. documento)
- La base de datos multi-gimnasio existe (14 tablas con aislamiento por box), pero **la app no la usa**: clases, socios, cuotas, gimnasios y facturas son datos de ejemplo, y el rol se elige con el selector "Demo".
- Las clases solo tienen título, coach, hora y aforo. Faltan el **diferenciador principal** del documento: biblioteca de ejercicios, WOD con kilos calculados según el RM de cada atleta, estados de asistencia ("voy / dudas / voy seguro"), mínimo de confirmados y cancelación automática.
- El roadmap tiene 8 tareas genéricas sin prioridad que no siguen las fases del documento.

## Prioridades (orden recomendado)

```text
P0  Multi-gimnasio real      -> sin esto nada de lo demás es real
P0  Clases + WOD + pesos RM  -> diferenciador principal
P1  Asistencia, aforo, mínimo y cancelación automática
P1  Tres calendarios (público / socio / staff)
P2  Pagos, facturas y devoluciones con Stripe
P2  Notificaciones (email + centro en la app)
P3  Instalaciones, eventos, comunidad, hardening, SEO
```

## Esta iteración (lo que construiré)

### 1. Multi-gimnasio real
- El rol sale de la base de datos (miembro del box o super admin), se retira el selector "Demo".
- **Contexto de box activo**: si perteneces a varios boxes, eliges cuál en la cabecera; todo se filtra por él.
- Unirse con código con dos modos: **directo** o **con aprobación** del admin (solicitudes pendientes en el panel).
- Super Admin crea boxes reales, con su código y primer admin; la ficha de gestión pasa a leer datos reales.
- Pruebas de aislamiento: un socio de un box nunca ve datos de otro.

### 2. Clases del box (gran iteración)
- **Biblioteca de ejercicios** propia del box: nombre, categoría, si usa carga, y a qué RM se refiere (p. ej. Thruster → Front Squat).
- **Plantillas de clase** semanales (día, hora, actividad, coach, aforo, mínimo) que generan las clases de la semana; editar y cancelar sesiones sueltas.
- **Editor de WOD** dentro de cada clase: bloques (calentamiento, fuerza, metcon), ejercicios con series/reps y % del RM.
- **Kilos personalizados**: el atleta ve "Back Squat 5x5 @75% → 82,5 kg" según su RM, redondeado al disco más cercano. Si no tiene RM, se le invita a registrarlo.
- **Asistencia**: voy / dudas / voy seguro; contador de confirmados frente al mínimo y aforo; lista de espera cuando está llena.
- **Cancelación automática**: si a X horas de la clase no se alcanza el mínimo, se cancela y queda marcada. Se comprueba de forma programada.
- **Privacidad**: el socio puede ocultar su asistencia a otros socios (staff siempre la ve).
- Vista staff: lista de asistentes, marcar quién vino, asignar coach, resumen mensual.

### 3. Roadmap reordenado según el documento
- Sustituyo las 8 tareas por las del documento, por fases (0 a 7), con prioridad, etiquetas y notas, marcando como hechas las ya construidas.

## Fuera de esta iteración (quedan en el roadmap)
Stripe y devoluciones reales, notificaciones email/push, login con Google, instalaciones, eventos/carreras, chat, RGPD documental, hardening.

## Preguntas abiertas que no bloquean
- Horas antes para la cancelación automática: uso **4 h** por defecto, configurable por box.
- Redondeo de kilos: uso **2,5 kg** por defecto, configurable por box.

## Detalles técnicos
- Migración nueva: `exercises`, `class_templates`, `wods`, `wod_items` (exercise_id, sets, reps, percent_rm, rm_lift), `class_enrollments.intent` (going/maybe/sure) + `attended`, `classes.min_attendees`, `cancel_hours_before`, `status`, `tenant_invites.requires_approval`, `tenant_join_requests`, `profiles.hide_attendance`, `tenant_settings` (rounding_kg). Todas con `tenant_id`, GRANTs y RLS con `is_tenant_member`/`has_tenant_role`; super admin vía `is_platform_admin`.
- `src/lib/data/*` pasa de mock a consultas con el cliente de Supabase (TanStack Query); las pantallas no cambian su forma de leer.
- `SessionProvider` lee `tenant_members` y `platform_roles`; el box activo vive en la sesión y se envía en cada consulta.
- Lógica pura y con tests: `src/lib/training/weights.ts` (kilos según % RM y redondeo) y `src/lib/access/attendance.ts` (¿se cancela?, ¿lista de espera?, ¿puede ver asistentes?).
- Cancelación automática: ruta programada en `/api/public/cron/cancel-classes`, verificada con secreto, que se llama periódicamente.
- Acciones de Super Admin (crear box, borrar usuario) en funciones del servidor que primero comprueban el rol en base de datos.
- Actualizar `docs/ARCHITECTURE.md` y `AGENTS.md`.
