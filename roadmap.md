# Mejoras durante desarrollo
- [ ] Actualizar socios por plan (100/500/ilimitado) y tipos de clase (5/15/ilimitado), con límites SQL y pruebas.
- [ ] Ampliar temas cerrados con fondos claros y aurora, vista previa en alta y gestión.
- [x] Privacidad con asistente anónimo y avatar de interrogación.
- [x] Peso pulsable con RM, porcentaje y edición del RM.
- [x] Profesor añade asistentes y cambia nombre/vista de la clase.
- [x] Alternativas como fases/ejercicios añadidos; edición y borrado con lápiz.
- [x] Gestión de profesores desde socios.
- [x] Reserva de espacios: disponibilidad, aprobación, cancelación y gestión.
- [x] Pruebas de privacidad, permisos y reservas: 40 pruebas, 74 checks de aislamiento y 11 de clases/reservas.
- [x] Inicio temporal con accesos a boxes y creación de gimnasio.
- [x] Foto del coach, estados temporales y colores de asistencia; ocultar «No voy» en Mis clases.
- [x] Calendario mensual y semanal más informativo para usuarios y staff.
- [x] Ejercicios personalizados, fases nuevas y alternativas; series/repeticiones claras.
- [x] Coach desde listado y estado explícito del horario fijo.
- [x] Cuotas reales configurables, asignación a alumnos y franjas de acceso a instalaciones.
- [x] Vacaciones y cierres visibles del gimnasio.
- [x] Pruebas de reglas (38) y aislamiento entre boxes (58); inicio verificado en móvil/escritorio.
- [ ] Verificar los flujos con sesión: Supabase externo no permite obtener una sesión de prueba.
# Entrada, alta de gimnasio y marca
- [x] Temas cerrados por box (lima actual, amarillo, rojo, azul) + logo.
- [x] Acceso del socio tematizado en /b/código y /auth.
- [x] Landing SaaS B2B en la raíz (para dueños de box).
- [x] Precios y planes SaaS (Starter/Pro/Elite, prueba 14 días).
- [x] Asistente de alta de gimnasio autoservicio (cuenta → box → plan → marca).
- [ ] Suscripción SaaS real del box (pasarela de pago).
- [ ] QR del enlace (el checklist inicial y la subida de logo están implementados).
- [x] Foto post-clase con el WOD superpuesto: recorte vertical, filtro, logos del gym y de la clase, descarga para redes.
- [x] Logo por tipo de clase (admin) visible en clase, listado y calendario; simplificar el calendario.
# Tareas
- [x] Cancelación SQL cada 15 minutos: cron activo, ejecución real verificada.
- [x] Recuperación por email y cambio de contraseña con contraseña actual (74 pruebas pasan; entrega del email sin verificar).
- [x] Logos WebP optimizados a 512 px, almacenamiento privado, marca y tipos de clase.
- [x] Editor post-clase: recorte 9:16, filtros, WOD personalizado, marcas y descarga PNG 1080×1920 verificados.
- [x] Seguridad de logos y cancelación: MEDIA_CANCEL_OK y TENANT_ISOLATION_OK (110 comprobaciones), sin conservar datos de prueba.
- [ ] Logos subidos en acceso público: bloqueado por la política del workspace; permitir buckets públicos y cambiar gym-logos a público.
- [ ] Validar recepción de email de recuperación y flujos autenticados: Supabase externo no permite sesión de prueba administrada.
- [x] Copiar tareas al portapapeles (todas, filtradas, seleccionadas) y repaso de hechas.

## Códigos, roles y perfil
- [x] Códigos promocionales con descuento, usos y afiliados (Super Admin)
- [x] Separación Admin / Profesor y solicitudes de eventos
- [x] Perfil por secciones y "Mis datos" del profesor
