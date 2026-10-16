import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { RESPONSABLE, dato } from "@/lib/legal";

export const metadata: Metadata = { title: "Aviso de privacidad · GainLine" };

/**
 * Aviso de privacidad integral (docs/coaches.md §8.3), con lo que pide la Ley
 * Federal de Protección de Datos Personales en Posesión de los Particulares
 * publicada en el DOF el 20 de marzo de 2025. Borrador para revisión de un
 * abogado. Si cambia lo que la app guarda o con quién lo comparte, esto se
 * actualiza en el mismo commit y cambia `LEGAL_ACTUALIZADO`.
 */
export default function PrivacidadPage() {
  const correo = dato(RESPONSABLE.correo);
  return (
    <LegalPage
      titulo="Aviso de privacidad"
      secciones={[
        {
          titulo: "Quién es responsable de tus datos",
          cuerpo: (
            <p>
              {dato(RESPONSABLE.nombre)}, con domicilio en {dato(RESPONSABLE.domicilio)}, es responsable del tratamiento
              de los datos personales que se recaban en GainLine, una aplicación hecha por ElBeFit. Para cualquier
              asunto de privacidad escribe a {correo}.
            </p>
          ),
        },
        {
          titulo: "Qué datos recabamos",
          cuerpo: (
            <>
              <ul>
                <li>
                  <strong>De tu cuenta:</strong> nombre de usuario, contraseña (se guarda cifrada y nadie puede leerla),
                  nombre visible y, si la subes, tu foto de perfil.
                </li>
                <li>
                  <strong>De tus entrenamientos:</strong> rutinas, series (peso, repeticiones o tiempo), sesiones,
                  natación, notas, metas semanales, ejercicios propios con su foto y, si lo registras, tu peso corporal.
                </li>
                <li>
                  <strong>De uso:</strong> la suscripción de tu navegador para mandarte notificaciones, si las activas, y
                  tus preferencias (idioma, tema, recordatorio).
                </li>
                <li>
                  <strong>Si eres coach:</strong> el nombre de tu marca y tu código para invitar. Cuando se active el
                  cobro, los datos de pago los recaba y guarda Stripe; nosotros no guardamos tu tarjeta.
                </li>
              </ul>
              <p>No pedimos correo, teléfono ni ubicación.</p>
              <p>
                <strong>Datos que podrían ser sensibles:</strong> tu peso corporal y tu información de entrenamiento
                pueden considerarse relacionados con tu salud. Los tratamos sólo con tu consentimiento expreso, que das
                al crear tu cuenta y al registrarlos, y los puedes borrar cuando quieras.
              </p>
            </>
          ),
        },
        {
          titulo: "Para qué los usamos",
          cuerpo: (
            <>
              <ul>
                <li>Darte el servicio: tu cuenta, tus rutinas, tu registro y tu progreso.</li>
                <li>Que tu coach, si tienes uno, vea tus entrenamientos y te arme rutinas.</li>
                <li>El ranking, los retos, el XP y las medallas de tu grupo.</li>
                <li>Mandarte las notificaciones que actives (recordatorios, comentarios de tu coach, avisos de tu grupo).</li>
                <li>Cobrarle su plan a los coaches.</li>
                <li>Proteger tu cuenta, por ejemplo bloqueando el acceso tras varios intentos fallidos.</li>
              </ul>
              <p>
                No usamos tus datos para publicidad ni los vendemos o rentamos. No hay finalidades secundarias.
              </p>
            </>
          ),
        },
        {
          titulo: "Con quién se comparten",
          cuerpo: (
            <ul>
              <li>
                <strong>Tu coach</strong>, sólo mientras entrenes con él: ve tus sesiones con sus series y notas, tus
                rutinas, tus metas y tu progreso. No ve tu peso corporal. Si dejas a tu coach, o él te quita de su
                grupo, deja de verlos al momento.
              </li>
              <li>
                <strong>Los demás alumnos de tu grupo</strong> ven tu nombre visible, tu foto, tu XP, tu rango, tus
                medallas y tus números del ranking (días, series, carga y metros). Puedes salir del ranking en Perfil.
              </li>
              <li>
                <strong>Proveedores que los procesan por nuestra cuenta:</strong> Vercel (donde vive la aplicación),
                Neon (la base de datos), los servicios de notificaciones de tu navegador (Apple, Google o Mozilla) para
                entregarte los avisos y, para los coaches, Stripe para los pagos. Algunos están en Estados Unidos.
              </li>
            </ul>
          ),
        },
        {
          titulo: "Tus derechos (ARCO) y cómo retirar tu consentimiento",
          cuerpo: (
            <>
              <p>
                Puedes acceder a tus datos, rectificarlos, cancelarlos u oponerte a su uso, y retirar tu consentimiento.
                Muchas cosas las haces tú desde la app: corregir o borrar series, cambiar tu nombre visible, quitar tu
                foto, salir del ranking, dejar a tu coach y descargar tu historial en CSV.
              </p>
              <p>
                Para lo demás, incluido borrar tu cuenta, escribe a {correo} con tu nombre de usuario y qué derecho
                quieres ejercer. Te respondemos en los plazos que marca la ley.
              </p>
            </>
          ),
        },
        {
          titulo: "Cookies y almacenamiento en tu teléfono",
          cuerpo: (
            <p>
              Usamos una cookie para mantener tu sesión, otra para tu idioma y, si entras por la liga de un coach, una
              que dura una hora para recordar su código. En tu teléfono se guardan tus preferencias (tema y sonido) y,
              si te quedas sin señal, las series pendientes de subir y las páginas para verlas sin conexión. No usamos
              cookies de terceros ni de publicidad.
            </p>
          ),
        },
        {
          titulo: "Cuánto tiempo los guardamos",
          cuerpo: <p>Mientras tengas tu cuenta. Si pides borrarla, se borran tus datos con ella.</p>,
        },
        {
          titulo: "Menores de edad",
          cuerpo: <p>GainLine es para mayores de 18 años, o menores con permiso de su madre, padre o tutor.</p>,
        },
        {
          titulo: "Cambios a este aviso",
          cuerpo: (
            <p>
              Cualquier cambio se publica en esta página con su fecha. Si es importante, también te avisamos dentro de
              la app.
            </p>
          ),
        },
        {
          titulo: "Autoridad",
          cuerpo: (
            <p>
              Si crees que tu derecho a la protección de tus datos fue vulnerado, puedes acudir a la Secretaría
              Anticorrupción y Buen Gobierno, la autoridad en la materia desde la ley de 2025.
            </p>
          ),
        },
      ]}
    />
  );
}
