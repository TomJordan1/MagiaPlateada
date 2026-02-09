/**
 * constants.ts
 * ----------------
 * Constantes compartidas de la aplicacion.
 * Centraliza textos y estilos que se repiten en varios componentes
 * para evitar duplicacion y facilitar cambios globales.
 */

/**
 * Mapeo de estado del experto -> clase de color CSS
 * Se usa en ResultsScreen y ProfileScreen para pintar las badges.
 */
export const COLOR_POR_ESTADO: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  busy: "bg-amber-100 text-amber-800",
  unavailable: "bg-red-100 text-red-800",
}

/**
 * Mapeo de estado del experto -> etiqueta en espanol
 * Convierte el valor interno (ingles) al texto visible para el usuario.
 */
export const ETIQUETA_ESTADO: Record<string, string> = {
  available: "Disponible",
  busy: "Ocupado",
  unavailable: "No disponible",
}

/**
 * Convierte el valor de modalidad a texto legible para el usuario.
 */
export function textoModalidad(modalidad: string): string {
  switch (modalidad) {
    case "presencial":
      return "Presencial"
    case "remoto":
      return "Remoto"
    case "ambos":
      return "Presencial y Remoto"
    default:
      return modalidad
  }
}

/** Edad minima para registrarse como experto en la plataforma */
export const EDAD_MINIMA_EXPERTO = 50

/** Dias por defecto para el seguimiento post-servicio */
export const DIAS_SEGUIMIENTO_DEFECTO = 7

/**
 * Opciones de periodo para el seguimiento post-servicio.
 * Se muestran en el NotificationOverlay para que el usuario elija
 * cuando quiere ser notificado.
 */
export const OPCIONES_SEGUIMIENTO = [
  { label: "En 3 dias", days: 3 },
  { label: "En 1 semana", days: 7 },
  { label: "En 2 semanas", days: 14 },
  { label: "En 1 mes", days: 30 },
]

/**
 * Etiquetas descriptivas para cada calificacion con estrellas (1-5).
 * Se muestra debajo del componente StarRating tras seleccionar.
 */
export const ETIQUETA_CALIFICACION: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente",
}
