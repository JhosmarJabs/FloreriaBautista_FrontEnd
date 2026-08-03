// Extrae un mensaje legible para el usuario a partir de los errores que lanzan
// los servicios. El backend responde con cuerpos tipo:
//   {"status":400,"message":"No se puede cambiar de 'EN_RUTA' a 'CANCELADO'."}
// y AdminService los envuelve como `Error <status>: <cuerpo>`. Esta función
// desenvuelve ese formato y devuelve solo el `message`, decodificando además
// las secuencias unicode escapadas (' -> ').
export function extractApiError(err: unknown, fallback = 'Ocurrió un error inesperado'): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  if (!raw) return fallback;

  // Buscar un objeto JSON dentro del texto (ej. `Error 400: {"message":"..."}`)
  const jsonStart = raw.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart));
      const msg = parsed?.message ?? parsed?.error ?? parsed?.detail;
      if (typeof msg === 'string' && msg.trim()) return msg.trim();
    } catch {
      // no era JSON válido; continuar con el texto crudo
    }
  }

  return raw.trim() || fallback;
}
