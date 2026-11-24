import type { SiteSettings } from '../types';
import { VARIABLES_LEGALES } from '../constants/legal';

/**
 * Texto de las páginas legales: reemplazo de variables {{...}} y división en bloques.
 * El contenido es texto plano (sin HTML ni markdown): línea en blanco = párrafo nuevo,
 * línea que empieza con «- » = viñeta. React escapa el resultado, no hay riesgo de XSS.
 */

export type BloqueTexto =
  | { tipo: 'parrafo'; texto: string }
  | { tipo: 'lista'; items: string[] };

const NOMBRE_RESPALDO = 'Florería Bautista';
const DIRECCION_RESPALDO = 'San Felipe Orizatlán, Hidalgo';
// Respaldo para un dato suelto (p. ej. la tarjeta «Responsable»: «Teléfono: consúltalo en…»).
const CONTACTO_RESPALDO = 'consúltalo en la página de Contacto';
const EN_CONTACTO = 'que aparece en la página de Contacto';

const limpio = (v?: string | null) => (v ?? '').trim();

type VariableLegal = (typeof VARIABLES_LEGALES)[number];
type VariableContacto = 'telefono' | 'correo' | 'correoPrivacidad';
const SUSTANTIVO: Record<VariableContacto, string> = { telefono: 'teléfono', correo: 'correo', correoPrivacidad: 'correo' };

/** Datos de contacto capturados en el CMS ('' si faltan). correoPrivacidad usa el correo si no tiene propio. */
function contactoReal(settings?: Partial<SiteSettings> | null): Record<VariableContacto, string> {
  const correo = limpio(settings?.correo);
  return { telefono: limpio(settings?.telefono), correo, correoPrivacidad: limpio(settings?.correoPrivacidad) || correo };
}

/** Valores de cada variable con sus respaldos legibles (nunca queda vacío ni «{{…}}»). */
export function valoresVariables(settings?: Partial<SiteSettings> | null): Record<VariableLegal, string> {
  const nombreTienda = limpio(settings?.nombreTienda) || NOMBRE_RESPALDO;
  const c = contactoReal(settings);
  return {
    nombreTienda,
    razonSocial: limpio(settings?.razonSocial) || nombreTienda,
    direccion: limpio(settings?.direccion) || DIRECCION_RESPALDO,
    telefono: c.telefono || CONTACTO_RESPALDO,
    correo: c.correo || CONTACTO_RESPALDO,
    correoPrivacidad: c.correoPrivacidad || CONTACTO_RESPALDO,
  };
}

const PATRON_VARIABLE = /\{\{\s*([^{}]*?)\s*\}\}/g;
const V = (n: string) => `\\{\\{\\s*(${n})\\s*\\}\\}`;
const CONTACTO = 'telefono|correoPrivacidad|correo';
// «al {{telefono}} o {{correo}}» con los dos datos vacíos: se dice una sola vez.
const PATRON_PAR = new RegExp(`(^|[^\\p{L}])(al|a)\\s+${V(CONTACTO)}\\s+o\\s+${V(CONTACTO)}`, 'giu');
// Preposición + dato de contacto: «al {{telefono}}», «a {{correo}}», «o {{correo}}».
const PATRON_PREPOSICION = new RegExp(`(^|[^\\p{L}])(al|a|o)\\s+${V(CONTACTO)}`, 'giu');

// Frases de los textos por defecto que nombran razón social y tienda juntas.
const FRASES_SIN_RAZON_SOCIAL: [RegExp, string][] = [
  [new RegExp(`${V('razonSocial')},\\s*que opera la tienda\\s+${V('nombreTienda')},`, 'g'), '{{nombreTienda}},'],
  [new RegExp(`${V('razonSocial')}\\s+opera la tienda en línea\\s+${V('nombreTienda')},\\s*una florería`, 'g'), '{{nombreTienda}} es una florería'],
  [new RegExp(`${V('razonSocial')}\\s*\\(«\\s*${V('nombreTienda')}\\s*»\\)`, 'g'), '{{nombreTienda}}'],
];

const conMayuscula = (original: string, nuevo: string) =>
  original[0] === original[0].toUpperCase() ? nuevo[0].toUpperCase() + nuevo.slice(1) : nuevo;

/**
 * Reemplaza las variables conocidas; una desconocida se deja tal cual.
 * Si falta un teléfono o un correo, la frase se reescribe con su preposición para que se lea bien
 * («llámanos al teléfono que aparece en la página de Contacto», nunca «al el teléfono…»).
 */
export function reemplazarVariables(texto: string, settings?: Partial<SiteSettings> | null): string {
  const c = contactoReal(settings);
  const falta = (n: string) => !c[n as VariableContacto];

  // Sin razón social capturada se usa el nombre de la tienda: evita «Florería Bautista («Florería Bautista»)».
  let resultado = limpio(settings?.razonSocial)
    ? texto
    : FRASES_SIN_RAZON_SOCIAL.reduce((t, [patron, reemplazo]) => t.replace(patron, reemplazo), texto);

  resultado = resultado.replace(PATRON_PAR, (completo, antes: string, prep: string, n1: string, n2: string) => {
    if (!falta(n1) || !falta(n2)) return completo;
    const s1 = SUSTANTIVO[n1 as VariableContacto], s2 = SUSTANTIVO[n2 as VariableContacto];
    const frase = s1 === s2 ? `al ${s1} ${EN_CONTACTO}` : `al ${s1} o al ${s2} que aparecen en la página de Contacto`;
    return antes + conMayuscula(prep, frase);
  });

  resultado = resultado.replace(PATRON_PREPOSICION, (completo, antes: string, prep: string, n: string, pos: number, todo: string) => {
    if (!falta(n)) return completo;
    // «por teléfono al {{telefono}}» → «por teléfono al número…», sin repetir la palabra.
    const previo = todo.slice(Math.max(0, pos - 20), pos + antes.length);
    const sustantivo = n === 'telefono' && /tel[eé]fono\s*$/i.test(previo) ? 'número'
      : n !== 'telefono' && /correo\s*$/i.test(previo) ? 'dirección' : SUSTANTIVO[n as VariableContacto];
    const frase = `${prep.toLowerCase() === 'o' ? 'o al' : 'al'} ${sustantivo} ${EN_CONTACTO}`
      .replace(/^al dirección/, 'a la dirección').replace(/^o al dirección/, 'o a la dirección');
    return antes + conMayuscula(prep, frase);
  });

  const valores = valoresVariables(settings) as Record<string, string>;
  return resultado.replace(PATRON_VARIABLE, (completo, nombre: string) => {
    if (nombre in SUSTANTIVO && falta(nombre)) return `el ${SUSTANTIVO[nombre as VariableContacto]} ${EN_CONTACTO}`;
    return Object.prototype.hasOwnProperty.call(valores, nombre) ? valores[nombre] : completo;
  });
}

/** Nombres de variables {{x}} que no están en la lista permitida (para validar en el panel). */
export function variablesDesconocidas(texto: string): string[] {
  const permitidas = new Set<string>(VARIABLES_LEGALES);
  const halladas = new Set<string>();
  for (const m of texto.matchAll(PATRON_VARIABLE)) {
    if (!permitidas.has(m[1])) halladas.add(m[1]);
  }
  return [...halladas];
}

/** Divide un cuerpo en párrafos y listas. Las líneas seguidas de un párrafo se unen con salto simple. */
export function dividirEnBloques(cuerpo: string): BloqueTexto[] {
  const lineas = cuerpo.replace(/\r\n?/g, '\n').split('\n');
  const bloques: BloqueTexto[] = [];
  let parrafo: string[] = [];
  let lista: string[] = [];

  const cerrarParrafo = () => {
    if (parrafo.length) bloques.push({ tipo: 'parrafo', texto: parrafo.join('\n') });
    parrafo = [];
  };
  const cerrarLista = () => {
    if (lista.length) bloques.push({ tipo: 'lista', items: lista });
    lista = [];
  };

  for (const linea of lineas) {
    if (linea.trim() === '') {
      cerrarParrafo();
      cerrarLista();
    } else if (linea.startsWith('- ')) {
      cerrarParrafo();
      lista.push(linea.slice(2).trim());
    } else {
      cerrarLista();
      parrafo.push(linea.trim());
    }
  }
  cerrarParrafo();
  cerrarLista();
  return bloques;
}
