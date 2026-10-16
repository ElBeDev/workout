/**
 * Los datos del responsable para el aviso de privacidad y los términos
 * (docs/coaches.md §8.3). Los da el dueño; no se inventan. Mientras falte
 * alguno, /terminos y /privacidad enseñan arriba que son un borrador.
 */
export const RESPONSABLE = {
  /** Nombre completo o razón social de quien ofrece GainLine. */
  nombre: "",
  /** Domicilio para oír y recibir notificaciones. */
  domicilio: "",
  /** Correo para derechos ARCO, privacidad y soporte. */
  correo: "",
};

/** Fecha de la última versión de los dos documentos (YYYY-MM-DD). */
export const LEGAL_ACTUALIZADO = "2026-10-15";

export function legalCompleto(): boolean {
  return Boolean(RESPONSABLE.nombre && RESPONSABLE.domicilio && RESPONSABLE.correo);
}

/** Lo que va en el texto mientras falte un dato: visible a propósito. */
export function dato(valor: string): string {
  return valor || "[pendiente]";
}
