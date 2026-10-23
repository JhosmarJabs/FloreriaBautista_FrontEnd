// Cancelar un pedido exige motivo (el backend responde 400 sin él). Mismo patrón
// de window.prompt que la cancelación de solicitudes de abasto.

export const MOTIVO_CANCELACION_OBLIGATORIO = 'El motivo de la cancelación es obligatorio.';

/**
 * Pide el motivo de la cancelación. Devuelve null si se cerró el cuadro (no se
 * cancela nada) y el texto recortado en otro caso, que puede quedar vacío.
 */
export const pedirMotivoCancelacion = (aviso?: string): string | null => {
  const pregunta = '¿Por qué se cancela el pedido?';
  const texto = window.prompt(aviso ? `${aviso}\n\n${pregunta}` : pregunta);
  return texto === null ? null : texto.trim();
};
