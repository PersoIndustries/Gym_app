import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { LegalPage, LEGAL_ADDRESS, LEGAL_EMAIL, LEGAL_ENTITY } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/terminos")({ head: pageHead("Términos de uso", "Condiciones de uso de Meowscle, la plataforma de gestión de gimnasios y boxes de Jardiper S.C."), component: Terms });

function Terms() {
  const mail = <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>;
  return (
    <LegalPage title="Términos de uso" updated="24 de noviembre de 2026">
      <section><h2>1. Aceptación de los términos</h2><p>Al acceder y usar Meowscle aceptas estos términos de uso. Si no estás de acuerdo con alguno de ellos, no debes usar el servicio. Meowscle es un servicio de {LEGAL_ENTITY}, con domicilio en {LEGAL_ADDRESS}.</p></section>
      <section><h2>2. Descripción del servicio</h2><p>Meowscle es una plataforma para gestionar gimnasios y boxes: clases, reservas, entrenamientos, marcas personales, cuotas, espacios, eventos y comunicación entre el gimnasio y sus socios.</p></section>
      <section><h2>3. Tipos de usuario</h2><ul><li><strong>Gimnasios</strong> (administradores): contratan un plan y gestionan su gimnasio, su equipo y sus socios.</li><li><strong>Profesores</strong>: gestionan clases, entrenamientos y asistencia según los permisos que les dé su gimnasio.</li><li><strong>Socios</strong>: se unen a un gimnasio con su código o enlace y usan la app según la cuota que les asigne el gimnasio.</li></ul><p>Cada gimnasio es responsable de los datos de sus socios que gestiona en la plataforma, de sus cuotas y de su relación con ellos.</p></section>
      <section><h2>4. Registro y cuenta</h2><p>Puedes registrarte con correo y contraseña o con tu cuenta de Google. Te comprometes a:</p><ul><li>Dar información veraz, actual y completa.</li><li>Mantenerla actualizada.</li><li>Proteger tu contraseña y responder de lo que ocurra en tu cuenta.</li><li>Avisarnos de inmediato de cualquier uso no autorizado.</li></ul></section>
      <section><h2>5. Uso aceptable</h2><p>No puedes usar el servicio para:</p><ul><li>Incumplir la ley aplicable.</li><li>Infringir derechos de propiedad intelectual de terceros.</li><li>Publicar contenido ofensivo, difamatorio o ilegal (incluidas fotos o logos).</li><li>Intentar acceder sin permiso a datos de otros gimnasios, usuarios o sistemas.</li><li>Interferir en el funcionamiento normal del servicio.</li></ul></section>
      <section><h2>6. Salud y actividad física</h2><p>Meowscle es una herramienta de gestión y no da consejo médico. Los entrenamientos, cargas y porcentajes los programa tu gimnasio. Practica actividad física según tu estado de salud y consulta a un profesional si tienes dudas.</p></section>
      <section><h2>7. Planes y pagos</h2><p>Los gimnasios pueden contratar distintos planes; precios y características están en la página de <Link to="/precios">precios</Link>. Los pagos se procesan con proveedores de pago autorizados. Las cuotas que paga un socio a su gimnasio son una relación entre ambos, ajena a {LEGAL_ENTITY}.</p></section>
      <section><h2>8. Propiedad intelectual</h2><p>El software, textos, gráficos y la marca Meowscle son propiedad exclusiva de {LEGAL_ENTITY}. Los logos y contenidos que sube cada gimnasio siguen siendo suyos; nos das permiso para mostrarlos dentro del servicio.</p></section>
      <section><h2>9. Privacidad</h2><p>Tratamos tus datos según nuestra <Link to="/privacidad">política de privacidad</Link>. Al usar el servicio aceptas ese tratamiento.</p></section>
      <section><h2>10. Limitación de responsabilidad</h2><p>El servicio se ofrece "tal cual", sin garantías de ningún tipo. No garantizamos que funcione sin interrupciones, de forma segura o sin errores. En ningún caso responderemos de daños indirectos, incidentales, especiales o consecuentes derivados del uso o imposibilidad de uso del servicio.</p></section>
      <section><h2>11. Cancelación y baja</h2><p>Puedes cancelar tu suscripción o pedir la baja de tu cuenta en cualquier momento. Podemos suspender o cerrar el acceso si incumples estos términos. Un gimnasio también puede suspender o retirar el acceso de sus socios.</p></section>
      <section><h2>12. Política de reembolsos</h2><p>{LEGAL_ENTITY} ofrece reembolsos a los gimnasios con estas condiciones:</p><ul><li>Máximo 7 días desde el pago para pedirlo.</li><li>Máximo 15 días para errores de pago (anual en vez de mensual).</li><li>No haber agotado los límites del plan.</li><li>En pagos mensuales, solo del mes en curso.</li><li>Debe existir un problema grave y demostrable con la aplicación.</li><li>Solo aplica al periodo de facturación en curso.</li></ul></section>
      <section><h2>13. Cambios en los términos</h2><p>Podemos modificar estos términos. Avisaremos de los cambios importantes por correo o en la app. Seguir usando el servicio después supone aceptarlos.</p></section>
      <section><h2>14. Ley aplicable</h2><p>Estos términos se rigen por la ley española. Para cualquier conflicto, las partes se someten a los juzgados y tribunales que correspondan según la normativa aplicable.</p></section>
      <section><h2>15. Contacto</h2><p>Para cualquier duda escríbenos a {mail}. {LEGAL_ENTITY}, {LEGAL_ADDRESS}.</p></section>
    </LegalPage>
  );
}
