# Acceso multi-box, selector de vista y asistencia simplificada

## 1. Selector de vista al entrar (coaches y admins)
- Tras iniciar sesión, si la persona tiene rol coach/admin en algún box (o es Super Admin), se abre un modal: **"¿Cómo quieres entrar?"**
  - **Como usuario del gym** (calendario, reservas, mis RMs).
  - **Como coach / admin** (panel de gestión del box).
  - **Consola de plataforma** (solo Super Admin).
- Casilla "Recordar mi elección" (se guarda en el dispositivo); siempre se puede cambiar desde el menú de cuenta.
- Si tiene varios boxes, el modal muestra también el box a elegir.
- La vista elegida solo cambia lo que se ve; los permisos reales siguen viniendo de la base de datos (un atleta nunca puede elegir "admin").

## 2. Una sola cuenta, varias puertas de entrada
Recomendación: **una única cuenta por persona** (mismo email/Google) que sirve para todos los boxes. No se crean usuarios separados por box.
- `/auth` — acceso general (atletas, staff, Super Admin).
- `/b/{codigo-box}` — página de entrada con la marca del box (logo, nombre). Inicia sesión con el mismo sistema y, al volver, deja ese box activo o crea la solicitud de adhesión si aún no es socio.
- Tras el login: 0 boxes -> pantalla "Unirme a un box"; 1 box -> directo; varios -> selector (modal del punto 1).
- Preparado para Google y otros proveedores: todos vuelven a una página pública (`/auth`) que lee el box de destino guardado y redirige. Mismo email = misma cuenta.

## 3. Asistencia: solo Voy / Dudas / No voy
- Botones en calendario y detalle de clase: **Voy**, **Dudas**, **No voy**.
- Se elimina "Voy seguro". "No voy" libera la plaza (y promueve a la lista de espera) pero queda registrado para que el coach lo vea.
- Aforo y cancelación automática: cuentan "Voy" + "Dudas"; el mínimo para no cancelar cuenta solo "Voy".

## Detalles técnicos
- Migración: intents `going | maybe | not_going`; convertir `sure` -> `going`; actualizar `book_class`, `class_attendance`, `class_attendees` y la función de auto-cancelación (min = going). Los contadores devuelven `{ going, maybe, not_going, waitlist }`.
- Actualizar `src/lib/access/attendance.ts`, `src/lib/training/rules.ts` y sus tests (llena = going+maybe; no cancela si going >= mínimo; not_going no ocupa plaza).
- `SessionProvider`: añadir `viewMode` (`athlete | staff | platform`) persistido en localStorage, validado contra roles reales; `AppShell` filtra navegación según vista.
- Nuevo componente `ViewPickerDialog` mostrado tras `SIGNED_IN` cuando hay más de una vista posible.
- Nueva ruta pública `src/routes/b.$code.tsx` (SSR, head con nombre del box) que guarda `pendingBox` en sessionStorage y lleva a `/auth`; tras sesión, `join`/activación automática.
- Google: `signInWithOAuth` con `redirectTo` a `/auth` (proyecto Supabase propio: hay que añadir las URLs en el panel de Supabase y activar el proveedor); se documentará en `docs/ARCHITECTURE.md`.
