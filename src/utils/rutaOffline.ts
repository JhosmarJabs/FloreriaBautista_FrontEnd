// Motor de ruta que corre EN EL DISPOSITIVO (sin Internet, sin servidores de rutas).
// Funciones puras: sin React ni DOM. La red de calles (`public/mapa-sucursal/red-vial.json`) la genera
// `scripts/generar-red-vial-sucursal.ts`; aquí se decodifica, se calcula la ruta más corta (A*) y se
// convierte en indicaciones paso a paso. La posición del cliente nunca sale de estas funciones.
import type { Coordenadas } from './geo';

export type ModoRuta = 'pie' | 'auto';

// ── Constantes con nombre (plan, Paso 3) ───────────────────────────────────────────────────────
/** Más lejos que esto de cualquier calle = fuera de la red. */
export const MAX_DIST_A_CALLE_M = 150;
/** Desvío de la ruta a partir del cual se recalcula (o la precisión, si es mayor). */
export const UMBRAL_DESVIO_M = 40;
/** Lecturas seguidas fuera del umbral antes de recalcular. */
export const LECTURAS_DESVIO = 2;
/** A esta distancia de la sucursal se da por llegado. */
export const RADIO_LLEGADA_M = 30;
/** Precisión peor que esta = «ubicación aproximada». Igual que ContactPage. */
export const PRECISION_BAJA_M = 100;
/** Si el CMS dice una sucursal a más de esto de la red guardada, la red está desactualizada. */
export const TOLERANCIA_DESTINO_M = 150;

const TAMANO_CELDA_M = 200;
const DISTANCIA_MINIMA_ENTRE_MANIOBRAS_M = 15;
const M_POR_GRADO = (6371000 * Math.PI) / 180;

const B_PIE_AB = 1;
const B_PIE_BA = 2;
const B_AUTO_AB = 4;
const B_AUTO_BA = 8;
const B_GLORIETA = 16;

// ── Tipos ──────────────────────────────────────────────────────────────────────────────────────
export interface RedVialJson {
  version: number;
  generadoEn?: string;
  fuente?: string;
  destino: { latitud: number; longitud: number; nombre?: string };
  radioM: number;
  nombres: string[];
  /** Plana y por deltas: [lat0, lng0, dLat1, dLng1, ...] en grados * 1e6. */
  nodos: number[];
  /** Plana, de 4 en 4: [a, b, banderas, nombre, ...]. */
  aristas: number[];
}

export interface Arista {
  a: number;
  b: number;
  banderas: number;
  nombre: number;
  /** Longitud en metros (calculada al cargar). */
  largo: number;
}

interface Arco {
  hasta: number;
  arista: number;
  largo: number;
}

export interface RedVial {
  destino: Coordenadas & { nombre?: string };
  radioM: number;
  fuente: string;
  nombres: string[];
  /** Posición de cada nodo en metros respecto a la sucursal (x al este, y al norte). */
  x: Float64Array;
  y: Float64Array;
  aristas: Arista[];
  /** Arcos de salida de cada nodo, por modo. */
  arcos: Record<ModoRuta, Arco[][]>;
  /** Grado de cada nodo (cuántas aristas distintas concurren). */
  grado: Uint8Array;
  celdas: Map<string, number[]>;
  cosLat0: number;
}

export interface PuntoEnRed {
  arista: number;
  /** Posición a lo largo de la arista, 0 = nodo a, 1 = nodo b. */
  t: number;
  x: number;
  y: number;
  /** Distancia de la posición original a la calle, en m. */
  distancia: number;
}

export interface Tramo {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  largo: number;
  nombre: number;
  /** Nodo de la red en el que empieza este tramo (-1 = punto proyectado de origen). */
  nodo: number;
  glorieta: boolean;
}

export interface Ruta {
  modo: ModoRuta;
  tramos: Tramo[];
  /** Distancia acumulada al inicio de cada tramo. */
  acumulado: number[];
  largoTotal: number;
  puntos: Array<[number, number]>;
}

export type Giro = 'sigue' | 'derecha' | 'izquierda' | 'vuelta-u' | 'glorieta' | 'llegada';

export interface Indicacion {
  giro: Giro;
  calle: string;
  /** Texto completo, p. ej. «Gira a la derecha en Calle Hidalgo». */
  texto: string;
  /** Distancia de este paso hasta el siguiente (m). */
  distancia: number;
  /** Distancia desde el inicio de la ruta hasta la maniobra (m). */
  inicio: number;
  x: number;
  y: number;
  /** Rumbos antes y después de la maniobra (internos, para fusionar maniobras muy seguidas). */
  rumboEntrada?: number;
  rumboSalida?: number;
}

export interface Avance {
  /** Distancia recorrida sobre la ruta (m). */
  recorrido: number;
  restante: number;
  /** Índice de la indicación vigente (la maniobra que sigue). */
  indice: number;
  /** Distancia hasta la siguiente maniobra (m). */
  aSiguiente: number;
  /** Distancia de la posición a la ruta (m). */
  desvio: number;
  tramo: number;
  /** Posición proyectada sobre la ruta. */
  x: number;
  y: number;
}

// ── Utilidades ─────────────────────────────────────────────────────────────────────────────────
export function aMetros(red: RedVial, c: Coordenadas): { x: number; y: number } {
  return {
    x: (c.longitud - red.destino.longitud) * M_POR_GRADO * red.cosLat0,
    y: (c.latitud - red.destino.latitud) * M_POR_GRADO,
  };
}

export function aCoordenadas(red: RedVial, x: number, y: number): Coordenadas {
  return {
    latitud: red.destino.latitud + y / M_POR_GRADO,
    longitud: red.destino.longitud + x / (M_POR_GRADO * red.cosLat0),
  };
}

/** Rumbo en grados (0 = norte, 90 = este) del vector (dx, dy) en metros. */
export function rumboXY(dx: number, dy: number): number {
  return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
}

/** Diferencia de rumbos normalizada a (-180, 180]; positiva = a la derecha. */
function giroEntre(r1: number, r2: number): number {
  let d = (r2 - r1 + 540) % 360 - 180;
  if (d === -180) d = 180;
  return d;
}

function claveCelda(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

// ── Carga de la red ────────────────────────────────────────────────────────────────────────────
export function cargarRedVial(json: RedVialJson): RedVial {
  const cosLat0 = Math.cos((json.destino.latitud * Math.PI) / 180);
  const nodosN = json.nodos.length / 2;
  const x = new Float64Array(nodosN);
  const y = new Float64Array(nodosN);
  let lat = 0;
  let lng = 0;
  for (let i = 0; i < nodosN; i++) {
    lat += json.nodos[2 * i];
    lng += json.nodos[2 * i + 1];
    x[i] = (lng / 1e6 - json.destino.longitud) * M_POR_GRADO * cosLat0;
    y[i] = (lat / 1e6 - json.destino.latitud) * M_POR_GRADO;
  }

  const aristas: Arista[] = [];
  const arcos: Record<ModoRuta, Arco[][]> = {
    pie: Array.from({ length: nodosN }, () => []),
    auto: Array.from({ length: nodosN }, () => []),
  };
  const grado = new Uint8Array(nodosN);
  const celdas = new Map<string, number[]>();

  for (let k = 0; k + 3 < json.aristas.length; k += 4) {
    const a = json.aristas[k];
    const b = json.aristas[k + 1];
    const banderas = json.aristas[k + 2];
    const nombre = json.aristas[k + 3];
    const largo = Math.hypot(x[b] - x[a], y[b] - y[a]);
    const idx = aristas.length;
    aristas.push({ a, b, banderas, nombre, largo });
    if (grado[a] < 255) grado[a]++;
    if (grado[b] < 255) grado[b]++;
    if (banderas & B_PIE_AB) arcos.pie[a].push({ hasta: b, arista: idx, largo });
    if (banderas & B_PIE_BA) arcos.pie[b].push({ hasta: a, arista: idx, largo });
    if (banderas & B_AUTO_AB) arcos.auto[a].push({ hasta: b, arista: idx, largo });
    if (banderas & B_AUTO_BA) arcos.auto[b].push({ hasta: a, arista: idx, largo });

    // Cuadrícula espacial: la arista entra en cada celda que cubre su caja.
    const cx0 = Math.floor(Math.min(x[a], x[b]) / TAMANO_CELDA_M);
    const cx1 = Math.floor(Math.max(x[a], x[b]) / TAMANO_CELDA_M);
    const cy0 = Math.floor(Math.min(y[a], y[b]) / TAMANO_CELDA_M);
    const cy1 = Math.floor(Math.max(y[a], y[b]) / TAMANO_CELDA_M);
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const k2 = claveCelda(cx, cy);
        const l = celdas.get(k2);
        if (l) l.push(idx);
        else celdas.set(k2, [idx]);
      }
    }
  }

  return {
    destino: json.destino,
    radioM: json.radioM,
    fuente: json.fuente ?? '© colaboradores de OpenStreetMap (ODbL)',
    nombres: json.nombres,
    x,
    y,
    aristas,
    arcos,
    grado,
    celdas,
    cosLat0,
  };
}

function permiteModo(banderas: number, modo: ModoRuta): boolean {
  return modo === 'pie' ? (banderas & (B_PIE_AB | B_PIE_BA)) !== 0 : (banderas & (B_AUTO_AB | B_AUTO_BA)) !== 0;
}

// ── Punto más cercano ──────────────────────────────────────────────────────────────────────────
/**
 * Proyecta (px, py), en metros, sobre la arista más cercana utilizable en `modo`. `null` si la
 * calle más cercana está a más de `maxDistancia`.
 */
export function puntoMasCercano(
  red: RedVial,
  px: number,
  py: number,
  modo: ModoRuta,
  maxDistancia = MAX_DIST_A_CALLE_M,
): PuntoEnRed | null {
  const radioCeldas = Math.max(1, Math.ceil(maxDistancia / TAMANO_CELDA_M));
  const cx = Math.floor(px / TAMANO_CELDA_M);
  const cy = Math.floor(py / TAMANO_CELDA_M);
  let mejor: PuntoEnRed | null = null;
  const vistas = new Set<number>();
  for (let i = cx - radioCeldas; i <= cx + radioCeldas; i++) {
    for (let j = cy - radioCeldas; j <= cy + radioCeldas; j++) {
      const lista = red.celdas.get(claveCelda(i, j));
      if (!lista) continue;
      for (const idx of lista) {
        if (vistas.has(idx)) continue;
        vistas.add(idx);
        const ar = red.aristas[idx];
        if (!permiteModo(ar.banderas, modo)) continue;
        const ax = red.x[ar.a];
        const ay = red.y[ar.a];
        const dx = red.x[ar.b] - ax;
        const dy = red.y[ar.b] - ay;
        const l2 = dx * dx + dy * dy;
        const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
        const qx = ax + t * dx;
        const qy = ay + t * dy;
        const d = Math.hypot(px - qx, py - qy);
        if (d <= maxDistancia && (!mejor || d < mejor.distancia)) {
          mejor = { arista: idx, t, x: qx, y: qy, distancia: d };
        }
      }
    }
  }
  return mejor;
}

// ── Ruta (A*) ──────────────────────────────────────────────────────────────────────────────────
class MonticuloMin {
  private datos: Array<[number, number]> = [];
  get tamano() {
    return this.datos.length;
  }
  push(prioridad: number, valor: number) {
    const d = this.datos;
    d.push([prioridad, valor]);
    let i = d.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (d[p][0] <= d[i][0]) break;
      [d[p], d[i]] = [d[i], d[p]];
      i = p;
    }
  }
  pop(): [number, number] | undefined {
    const d = this.datos;
    if (d.length === 0) return undefined;
    const tope = d[0];
    const ultimo = d.pop()!;
    if (d.length > 0) {
      d[0] = ultimo;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < d.length && d[l][0] < d[m][0]) m = l;
        if (r < d.length && d[r][0] < d[m][0]) m = r;
        if (m === i) break;
        [d[m], d[i]] = [d[i], d[m]];
        i = m;
      }
    }
    return tope;
  }
}

/**
 * Ruta más corta entre dos puntos ya proyectados sobre la red. En `'auto'` respeta los sentidos.
 * Devuelve `null` si no hay camino.
 */
export function calcularRuta(red: RedVial, origen: PuntoEnRed, destino: PuntoEnRed, modo: ModoRuta): Ruta | null {
  const N = red.x.length;
  const ORIGEN = N;
  const DESTINO = N + 1;
  const arcos = red.arcos[modo];
  const banderasModo = (b: number, haciaB: boolean) =>
    modo === 'pie' ? (haciaB ? b & B_PIE_AB : b & B_PIE_BA) : haciaB ? b & B_AUTO_AB : b & B_AUTO_BA;

  const aO = red.aristas[origen.arista];
  const aD = red.aristas[destino.arista];

  // Salidas desde el origen proyectado hacia los extremos de su arista.
  const salidasO: Array<{ hasta: number; costo: number }> = [];
  if (banderasModo(aO.banderas, true)) salidasO.push({ hasta: aO.b, costo: (1 - origen.t) * aO.largo });
  if (banderasModo(aO.banderas, false)) salidasO.push({ hasta: aO.a, costo: origen.t * aO.largo });
  // Entradas al destino proyectado desde los extremos de su arista.
  const entradasD = new Map<number, number>();
  if (banderasModo(aD.banderas, true)) entradasD.set(aD.a, Math.min(entradasD.get(aD.a) ?? Infinity, destino.t * aD.largo));
  if (banderasModo(aD.banderas, false)) entradasD.set(aD.b, Math.min(entradasD.get(aD.b) ?? Infinity, (1 - destino.t) * aD.largo));

  // Mismo tramo de calle: directo si el sentido lo permite.
  let directo: number | null = null;
  if (origen.arista === destino.arista) {
    const avanza = destino.t >= origen.t;
    if (banderasModo(aO.banderas, avanza)) directo = Math.abs(destino.t - origen.t) * aO.largo;
  }

  const g = new Float64Array(N + 2).fill(Infinity);
  const previo = new Int32Array(N + 2).fill(-1);
  const heur = (n: number) => (n === DESTINO ? 0 : Math.hypot(red.x[n] - destino.x, red.y[n] - destino.y));
  const abiertos = new MonticuloMin();
  const cerrado = new Uint8Array(N + 2);
  g[ORIGEN] = 0;
  abiertos.push(Math.hypot(origen.x - destino.x, origen.y - destino.y), ORIGEN);
  if (directo !== null) {
    g[DESTINO] = directo;
    previo[DESTINO] = ORIGEN;
  }

  while (abiertos.tamano > 0) {
    const [f, u] = abiertos.pop()!;
    if (cerrado[u]) continue;
    if (u === DESTINO) break;
    if (f > g[DESTINO]) break; // ya hay un camino mejor que cualquier otro posible
    cerrado[u] = 1;
    const relajar = (v: number, costo: number) => {
      const ng = g[u] + costo;
      if (ng < g[v]) {
        g[v] = ng;
        previo[v] = u;
        abiertos.push(ng + heur(v), v);
      }
    };
    if (u === ORIGEN) {
      for (const s of salidasO) relajar(s.hasta, s.costo);
    } else {
      for (const arco of arcos[u]) relajar(arco.hasta, arco.largo);
      const c = entradasD.get(u);
      if (c !== undefined) relajar(DESTINO, c);
    }
  }
  if (!Number.isFinite(g[DESTINO])) return null;

  // Reconstruye la secuencia de nodos.
  const secuencia: number[] = [];
  for (let n = DESTINO; n !== -1; n = previo[n]) secuencia.push(n);
  secuencia.reverse();

  const tramos: Tramo[] = [];
  const empuja = (
    x0: number, y0: number, x1: number, y1: number, arista: number, nodo: number,
  ) => {
    const largo = Math.hypot(x1 - x0, y1 - y0);
    if (largo < 0.01) return;
    const ar = red.aristas[arista];
    tramos.push({ x0, y0, x1, y1, largo, nombre: ar.nombre, nodo, glorieta: (ar.banderas & B_GLORIETA) !== 0 });
  };
  // Posición de cada elemento de la secuencia y arista que los une.
  const pos = (n: number): [number, number] =>
    n === ORIGEN ? [origen.x, origen.y] : n === DESTINO ? [destino.x, destino.y] : [red.x[n], red.y[n]];
  for (let i = 0; i + 1 < secuencia.length; i++) {
    const u = secuencia[i];
    const v = secuencia[i + 1];
    let arista: number;
    if (u === ORIGEN && v === DESTINO) arista = origen.arista;
    else if (u === ORIGEN) arista = origen.arista;
    else if (v === DESTINO) arista = destino.arista;
    else {
      // Arista real entre dos nodos: la más corta que los une en este modo.
      let mejor = -1;
      let mejorLargo = Infinity;
      for (const arco of arcos[u]) {
        if (arco.hasta === v && arco.largo < mejorLargo) {
          mejor = arco.arista;
          mejorLargo = arco.largo;
        }
      }
      arista = mejor;
    }
    const [x0, y0] = pos(u);
    const [x1, y1] = pos(v);
    empuja(x0, y0, x1, y1, arista, u === ORIGEN ? -1 : u);
  }
  if (tramos.length === 0) {
    // Origen y destino en el mismo punto: un tramo mínimo para que exista ruta.
    const ar = red.aristas[destino.arista];
    tramos.push({
      x0: origen.x, y0: origen.y, x1: destino.x, y1: destino.y, largo: 0, nombre: ar.nombre, nodo: -1,
      glorieta: (ar.banderas & B_GLORIETA) !== 0,
    });
  }

  const acumulado: number[] = [];
  let suma = 0;
  for (const t of tramos) {
    acumulado.push(suma);
    suma += t.largo;
  }
  const puntos: Array<[number, number]> = [[tramos[0].x0, tramos[0].y0]];
  for (const t of tramos) puntos.push([t.x1, t.y1]);
  return { modo, tramos, acumulado, largoTotal: suma, puntos };
}

// ── Indicaciones ───────────────────────────────────────────────────────────────────────────────
const SIN_NOMBRE = 'la calle sin nombre';

function nombreCalle(red: RedVial, idx: number): string {
  return red.nombres[idx] || SIN_NOMBRE;
}

export function generarIndicaciones(ruta: Ruta, red: RedVial, nombreDestino = 'Florería Bautista'): Indicacion[] {
  const { tramos, acumulado } = ruta;
  const lista: Indicacion[] = [];
  const primero = tramos[0];
  const calle0 = nombreCalle(red, primero.nombre);
  lista.push({
    giro: 'sigue', calle: calle0, texto: `Sigue por ${calle0}`, distancia: 0, inicio: 0, x: primero.x0, y: primero.y0,
  });
  for (let i = 0; i + 1 < tramos.length; i++) {
    const t1 = tramos[i];
    const t2 = tramos[i + 1];
    const nodo = t2.nodo;
    const interseccion = nodo >= 0 && red.grado[nodo] > 2;
    const cambiaNombre = t1.nombre !== t2.nombre;
    const giro = giroEntre(rumboXY(t1.x1 - t1.x0, t1.y1 - t1.y0), rumboXY(t2.x1 - t2.x0, t2.y1 - t2.y0));
    const abs = Math.abs(giro);
    const entraGlorieta = t2.glorieta && !t1.glorieta;
    const nuevaCalle = cambiaNombre && (t2.nombre !== 0 || t1.nombre !== 0);
    if (!entraGlorieta && !nuevaCalle && !(interseccion && abs >= 30) && abs <= 150) continue;
    const calle = nombreCalle(red, t2.nombre);
    let tipo: Giro;
    let texto: string;
    if (entraGlorieta) {
      tipo = 'glorieta';
      texto = 'Entra a la glorieta';
    } else if (abs > 150) {
      tipo = 'vuelta-u';
      texto = `Da vuelta en U en ${calle}`;
    } else if (abs >= 30) {
      tipo = giro > 0 ? 'derecha' : 'izquierda';
      texto = `Gira a la ${giro > 0 ? 'derecha' : 'izquierda'} en ${calle}`;
    } else {
      tipo = 'sigue';
      texto = `Sigue por ${calle}`;
    }
    lista.push({
      giro: tipo, calle, texto, distancia: 0, inicio: acumulado[i + 1], x: t2.x0, y: t2.y0,
      rumboEntrada: rumboXY(t1.x1 - t1.x0, t1.y1 - t1.y0), rumboSalida: rumboXY(t2.x1 - t2.x0, t2.y1 - t2.y0),
    });
  }
  const ultimo = tramos[tramos.length - 1];
  lista.push({
    giro: 'llegada', calle: nombreDestino, texto: `Llegaste a ${nombreDestino}`, distancia: 0,
    inicio: ruta.largoTotal, x: ultimo.x1, y: ultimo.y1,
  });
  // Dos maniobras a menos de 15 m una de otra (cruces mal dibujados en el mapa) se funden en una sola.
  for (let k = 1; k + 1 < lista.length; ) {
    const a = lista[k];
    const b = lista[k + 1];
    const separacion = b.inicio - a.inicio;
    if (separacion < DISTANCIA_MINIMA_ENTRE_MANIOBRAS_M && b.giro !== 'llegada' && a.giro !== 'glorieta' && b.giro !== 'glorieta'
      && a.rumboEntrada !== undefined && b.rumboSalida !== undefined) {
      const giro = giroEntre(a.rumboEntrada, b.rumboSalida);
      const abs = Math.abs(giro);
      let fusion: Indicacion;
      if (abs > 150) {
        fusion = { ...b, giro: 'vuelta-u', texto: `Da vuelta en U en ${b.calle}`, inicio: a.inicio, x: a.x, y: a.y, rumboEntrada: a.rumboEntrada };
      } else if (abs >= 30) {
        fusion = {
          ...b, giro: giro > 0 ? 'derecha' : 'izquierda', inicio: a.inicio, x: a.x, y: a.y, rumboEntrada: a.rumboEntrada,
          texto: `Gira a la ${giro > 0 ? 'derecha' : 'izquierda'} en ${b.calle}`,
        };
      } else {
        fusion = { ...b, giro: 'sigue', texto: `Sigue por ${b.calle}`, inicio: a.inicio, x: a.x, y: a.y, rumboEntrada: a.rumboEntrada };
      }
      lista.splice(k, 2, fusion);
      continue;
    }
    k++;
  }
  // «Sigue por X» justo después de seguir por X no dice nada nuevo.
  for (let k = lista.length - 2; k >= 1; k--) {
    if (lista[k].giro === 'sigue' && lista[k - 1].calle === lista[k].calle) lista.splice(k, 1);
  }
  for (let i = 0; i + 1 < lista.length; i++) lista[i].distancia = lista[i + 1].inicio - lista[i].inicio;
  return lista;
}

// ── Avance sobre la ruta ───────────────────────────────────────────────────────────────────────
/**
 * Proyecta la posición (px, py) sobre la ruta. `desdeTramo` (el tramo del avance anterior) evita
 * saltar hacia atrás en rutas que se cruzan consigo mismas.
 */
export function avance(ruta: Ruta, indicaciones: Indicacion[], px: number, py: number, desdeTramo = 0): Avance {
  const evaluar = (desde: number) => {
    let mejorD = Infinity;
    let mejorI = desde;
    let mejorT = 0;
    for (let i = desde; i < ruta.tramos.length; i++) {
      const t = ruta.tramos[i];
      const dx = t.x1 - t.x0;
      const dy = t.y1 - t.y0;
      const l2 = dx * dx + dy * dy;
      const u = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - t.x0) * dx + (py - t.y0) * dy) / l2));
      const d = Math.hypot(px - (t.x0 + u * dx), py - (t.y0 + u * dy));
      if (d < mejorD - 0.5) {
        mejorD = d;
        mejorI = i;
        mejorT = u;
      }
    }
    return { d: mejorD, i: mejorI, u: mejorT };
  };
  let r = evaluar(Math.max(0, desdeTramo - 1));
  if (r.d > UMBRAL_DESVIO_M) {
    const global = evaluar(0);
    if (global.d < r.d) r = global;
  }
  const t = ruta.tramos[r.i];
  const recorrido = ruta.acumulado[r.i] + r.u * t.largo;
  const restante = Math.max(0, ruta.largoTotal - recorrido);
  // La indicación vigente es la última maniobra YA pasada; «aSiguiente» mide hasta la que viene.
  let idx = 0;
  for (let k = 0; k < indicaciones.length; k++) if (indicaciones[k].inicio <= recorrido + 0.5) idx = k;
  const siguiente = Math.min(idx + 1, indicaciones.length - 1);
  return {
    recorrido,
    restante,
    indice: idx,
    aSiguiente: Math.max(0, indicaciones[siguiente].inicio - recorrido),
    desvio: r.d,
    tramo: r.i,
    x: t.x0 + r.u * (t.x1 - t.x0),
    y: t.y0 + r.u * (t.y1 - t.y0),
  };
}

/** Texto de distancia en metros: «120 m» / «1.2 km». */
export function formatearMetros(m: number): string {
  if (m < 1000) return `${Math.max(0, Math.round(m / 5) * 5 || Math.round(m))} m`;
  return `${(m / 1000).toLocaleString('es-MX', { maximumFractionDigits: 1 })} km`;
}
