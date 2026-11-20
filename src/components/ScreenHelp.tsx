import { useLocation } from "@tanstack/react-router";
import { InfoHelp } from "@/components/InfoHelp";

const topics: { prefix: string; label: string; text: string }[] = [
  { prefix: "/admin/plans", label: "Cuotas y códigos", text: "Las cuotas separan el acceso a instalaciones, el permiso de reservarlas y las clases incluidas. Los códigos de acceso pueden asignar una cuota automáticamente. Las cuotas de socios son distintas del plan de suscripción de BoxFlow." },
  { prefix: "/admin/members", label: "Socios y permisos", text: "El admin asigna cuotas y roles. Los profesores gestionan clases y asistencia, pero no los ajustes del gimnasio. Un alumno sin cuota activa espera hasta que el gimnasio le dé acceso." },
  { prefix: "/admin/classes", label: "Horario y clases", text: "El horario fijo sirve para generar clases de cada semana; una clase ya generada se edita por separado. Dentro de cada clase puedes preparar fases, bloques, ejercicios y niveles. Solo los confirmados con Voy cuentan para el mínimo." },
  { prefix: "/admin/gym-calendar", label: "Vacaciones y cierres", text: "Un cierre bloquea clases y reservas que coincidan con su horario. Los eventos informativos no bloquean la actividad del gimnasio. Las fechas y horas determinan qué días aparecen como cerrados." },
  { prefix: "/admin", label: "Gestión del gimnasio", text: "El admin configura cuotas, marca, tipos de clases, horarios y espacios. Los profesores gestionan clases, asistentes y proponen eventos para que el admin los apruebe. Desactivar reservas oculta Espacios para todos." },
  { prefix: "/class/", label: "Clase y WOD", text: "Tu cuota determina si puedes participar. Voy y Dudas cuentan para tus límites; No voy libera la plaza. Los entrenos vacíos no se muestran. Los pesos pueden calcularse con tu RM o estar indicados por nivel." },
  { prefix: "/calendar", label: "Calendarios", text: "El día seleccionado muestra sus clases y eventos debajo. Un día marcado como cerrado puede incluir un cierre parcial: consulta sus horas. Tus límites y días de clases son independientes de las franjas de instalaciones." },
  { prefix: "/my-classes", label: "Mis clases", text: "Aquí están tus clases con Voy o Dudas, también si estás en lista de espera. No voy no aparece en este listado y libera tu plaza. Si la clase está llena, el gimnasio te pasa automáticamente cuando queda una plaza." },
  { prefix: "/spaces", label: "Espacios y reservas", text: "Para reservar necesitas una cuota activa, permiso de reserva y una franja de acceso que incluya toda la duración. La reserva puede requerir aprobación del gimnasio. El acceso por sí solo no garantiza una plaza ni controla puertas físicas." },
  { prefix: "/events", label: "Eventos y carreras", text: "Los eventos pueden ser internos del gimnasio o de la comunidad. Tu participación depende de la cuota y las actividades incluidas. Las propuestas de profesores deben ser aprobadas por el admin antes de publicarse." },
  { prefix: "/profile", label: "Perfil y niveles", text: "El nivel general se utiliza cuando no has elegido uno para un ejercicio. Tu RM es el máximo de una repetición, usado para calcular cargas. Ocultar asistencia mantiene tu plaza visible como Anónimo." },
  { prefix: "/dashboard", label: "Tu gimnasio", text: "Tu cuota activa determina los días, actividades y límites de participación. Consulta sus condiciones en Perfil. Si necesitas cambiar el acceso, contacta con el admin de tu gimnasio." },
  { prefix: "/codes", label: "Promociones de BoxFlow", text: "Estos códigos descuentan el plan de un nuevo gimnasio, no asignan cuotas a socios. Los usos y la caducidad limitan la promoción. Las comisiones de afiliados son informativas; no se realizan pagos automáticos." },
  { prefix: "/dev", label: "Tareas de desarrollo", text: "La prioridad indica el orden de trabajo y el estado distingue pendientes, en curso y hechas. Puedes copiar tareas para compartirlas. Las tareas y operaciones de plataforma aún incluyen datos de desarrollo." },
  { prefix: "/metrics", label: "Métricas de plataforma", text: "Las métricas operativas de plataforma aún usan datos de desarrollo y no son cifras de facturación verificadas." },
  { prefix: "/platform", label: "Clientes de plataforma", text: "Los datos operativos y de facturación de esta consola aún incluyen ejemplos de desarrollo. No equivalen a cobros o facturas emitidas." },
];

export function ScreenHelp() {
  const { pathname } = useLocation();
  const topic = topics.find(t => pathname.startsWith(t.prefix));
  return topic ? <InfoHelp label={topic.label}>{topic.text}</InfoHelp> : null;
}