import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { RESPONSABLE, dato } from "@/lib/legal";
import { fmtNumber } from "@/lib/format";
import { DIAS_PRUEBA, PLANES, PRECIO_ANUAL_COACH } from "@/lib/planes";

export const metadata: Metadata = { title: "Términos · GainLine" };

/**
 * Términos de servicio (docs/coaches.md §8.3). Borrador para revisión de un
 * abogado. Los precios salen de `src/lib/planes.ts`, el mismo lugar que la
 * página de coaches, para que nunca digan cosas distintas.
 */
export default function TerminosPage() {
  return (
    <LegalPage
      titulo="Términos"
      secciones={[
        {
          titulo: "Qué es GainLine",
          cuerpo: (
            <p>
              GainLine es una aplicación para registrar tus entrenamientos. Los coaches la usan para armar rutinas a sus
              alumnos y darles seguimiento. La ofrece {dato(RESPONSABLE.nombre)} y está hecha por ElBeFit. Al crear tu
              cuenta aceptas estos términos y el <Link href="/privacidad" className="font-semibold text-accent">aviso de privacidad</Link>.
            </p>
          ),
        },
        {
          titulo: "Tu cuenta",
          cuerpo: (
            <ul>
              <li>Una cuenta por persona. Eres responsable de lo que pase con tu usuario y contraseña.</li>
              <li>
                No pedimos correo, así que <strong>no hay forma de recuperar una contraseña olvidada</strong>. Guárdala
                bien.
              </li>
              <li>GainLine es para mayores de 18 años, o menores con permiso de su madre, padre o tutor.</li>
            </ul>
          ),
        },
        {
          titulo: "No es consejo médico",
          cuerpo: (
            <p>
              GainLine, y lo que te indique tu coach a través de ella, no sustituye la opinión de un médico. Consulta a
              uno antes de empezar o cambiar tu entrenamiento, sobre todo si tienes alguna condición de salud. Entrenas
              bajo tu propio riesgo. GainLine no es responsable de las indicaciones que te dé un coach.
            </p>
          ),
        },
        {
          titulo: "Alumnos",
          cuerpo: (
            <p>
              Usar GainLine como alumno es gratis. Si te unes a un coach, él puede ver tus entrenamientos mientras
              entrenes con él y armarte rutinas. Puedes dejarlo cuando quieras desde Perfil. Lo que acuerdes con tu coach
              (sus clases, sus cobros) es entre ustedes.
            </p>
          ),
        },
        {
          titulo: "Coaches y su plan",
          cuerpo: (
            <ul>
              <li>
                El plan Coach cuesta ${PLANES.coach.precio} al mes, hasta {PLANES.coach.cupo} alumnos. Con más alumnos
                cuesta ${PLANES.coach_plus.precio} al mes. El plan anual de Coach cuesta ${fmtNumber(PRECIO_ANUAL_COACH)}.
                Precios en pesos mexicanos, con IVA incluido.
              </li>
              <li>
                Empiezas con {DIAS_PRUEBA} días de prueba. Después se cobra automáticamente a tu tarjeta cada mes (o cada
                año, en el plan anual).
              </li>
              <li>
                Si un cobro falla, tienes 7 días para actualizar tu pago. Después se bloquea tu panel de coach; tus
                alumnos siguen entrenando con lo que ya tienen.
              </li>
              <li>
                Puedes cancelar cuando quieras. La cancelación toma efecto al terminar el periodo que ya pagaste; no hay
                reembolsos de periodos parciales.
              </li>
              <li>Si los precios cambian, te avisamos con al menos 30 días de anticipación.</li>
              <li>
                Eres responsable de lo que indicas a tus alumnos y del uso que das a sus datos: sólo para entrenarlos, y
                nunca para algo que ellos no esperarían.
              </li>
            </ul>
          ),
        },
        {
          titulo: "Tus datos",
          cuerpo: (
            <p>
              Tu historial es tuyo. Si cambias de coach o dejas de tenerlo, lo conservas. Cómo cuidamos tus datos está en
              el <Link href="/privacidad" className="font-semibold text-accent">aviso de privacidad</Link>.
            </p>
          ),
        },
        {
          titulo: "Uso aceptable",
          cuerpo: (
            <ul>
              <li>No intentes entrar a cuentas ajenas ni a datos que no te corresponden.</li>
              <li>No uses nombres, fotos o comentarios ofensivos, ni la app para mandar publicidad o spam.</li>
              <li>No intentes dañar, saturar o copiar el servicio.</li>
            </ul>
          ),
        },
        {
          titulo: "El servicio",
          cuerpo: (
            <p>
              Hacemos lo posible para que GainLine funcione siempre, pero se ofrece tal como está y puede tener fallas o
              interrupciones. Podemos cambiar o quitar funciones; si el cambio es importante, lo avisamos antes.
            </p>
          ),
        },
        {
          titulo: "Suspensión y baja",
          cuerpo: (
            <p>
              Puedes dejar de usar GainLine cuando quieras y pedir que se borre tu cuenta. Podemos suspender una cuenta
              que no respete estos términos.
            </p>
          ),
        },
        {
          titulo: "Responsabilidad",
          cuerpo: (
            <p>
              En lo que la ley permita, nuestra responsabilidad frente a un coach se limita a lo que haya pagado en los
              últimos tres meses, y no respondemos por daños indirectos. Nada de esto limita los derechos que te dan las
              leyes de protección al consumidor.
            </p>
          ),
        },
        {
          titulo: "Ley aplicable y contacto",
          cuerpo: (
            <p>
              Estos términos se rigen por las leyes de México. Para cualquier duda o aclaración escribe a{" "}
              {dato(RESPONSABLE.correo)}.
            </p>
          ),
        },
      ]}
    />
  );
}
