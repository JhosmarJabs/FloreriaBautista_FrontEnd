/**
 * Genera la red de calles de la zona de la sucursal para el recorrido «Ir a la sucursal»
 * sin Internet (PWA del cliente). Se ejecuta A MANO, una sola vez, y NO forma parte del build:
 *
 *   npx tsx scripts/generar-red-vial-sucursal.ts [--lat <lat> --lng <lng>] [--radio 3000] [--nombre "Florería Bautista"]
 *
 * Por defecto toma destino y radio de `src/constants/sucursal.ts`; `--lat/--lng` solo los
 * sustituyen para una prueba puntual (el script lo avisa). Regenerar cada vez que cambien las
 * coordenadas de la sucursal.
 *
 * Fuente: Overpass API de OpenStreetMap (una sola consulta). Datos © colaboradores de
 * OpenStreetMap (ODbL): la atribución debe verse en la página.
 *
 * FORMATO de `public/mapa-sucursal/red-vial.json` (version 2):
 *   version, generadoEn (ISO), fuente, destino {latitud, longitud, nombre}, radioM,
 *   nombres:  string[]                       nombres de calle (índice 0 = sin nombre)
 *   nodos:    number[]                       plana y por DELTAS: [lat0, lng0, dLat1, dLng1, ...] en grados * 1e6
 *                                            (cada nodo = el anterior + su delta; el primero es absoluto)
 *   aristas:  number[]                       plana, de 4 en 4: [a, b, banderas, nombre, ...]
 *     a, b          índices de nodos; la arista va de a hacia b (la longitud se calcula al cargar)
 *     banderas      bits: 1 = a pie a->b, 2 = a pie b->a, 4 = en auto a->b, 8 = en auto b->a, 16 = glorieta
 *     nombre        índice en `nombres`
 *   Los puntos de forma que no cambian el dibujo más de 3 m se fusionan (misma calle y mismas banderas).
 *   Si el archivo supera 400 KB el script avisa y sugiere bajar el radio (no recorta en silencio).
 *   Si Overpass falla o responde vacío, sale con error SIN sobrescribir el archivo anterior.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UBICACION_SUCURSAL } from '../src/constants/sucursal.ts';

const CARPETA = dirname(fileURLToPath(import.meta.url));
const SALIDA = resolve(CARPETA, '../public/mapa-sucursal/red-vial.json');
const PRESUPUESTO_BYTES = 400 * 1024;
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

const TIPOS = [
  'motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link',
  'tertiary', 'tertiary_link', 'unclassified', 'residential', 'living_street', 'service', 'pedestrian',
  'footway', 'path', 'steps', 'track',
];
const SOLO_PEATON = new Set(['footway', 'path', 'steps', 'pedestrian']);
const SOLO_AUTO = new Set(['motorway', 'motorway_link']);

function argumento(nombre: string): string | undefined {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

interface ElementoOsm {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  tags?: Record<string, string>;
}

const lat0 = Number(argumento('lat') ?? UBICACION_SUCURSAL.latitud);
const lng0 = Number(argumento('lng') ?? UBICACION_SUCURSAL.longitud);
const radio = Number(argumento('radio') ?? UBICACION_SUCURSAL.radioZonaM);
const nombreDestino = argumento('nombre') ?? UBICACION_SUCURSAL.nombre;

if (!Number.isFinite(lat0) || !Number.isFinite(lng0) || !Number.isFinite(radio)) {
  console.error('Coordenadas o radio no válidos.');
  process.exit(1);
}
if (argumento('lat') || argumento('lng')) {
  console.warn('AVISO: se usan --lat/--lng en lugar de src/constants/sucursal.ts (solo para una prueba puntual).');
}
if (!UBICACION_SUCURSAL.confirmada) {
  console.warn('AVISO: coordenadas de desarrollo (confirmada: false). No publicar este archivo en producción.');
}

const RAD = Math.PI / 180;
const M_POR_GRADO = 6371000 * RAD;
const metros = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const dy = (bLat - aLat) * M_POR_GRADO;
  const dx = (bLng - aLng) * M_POR_GRADO * Math.cos(((aLat + bLat) / 2) * RAD);
  return Math.hypot(dx, dy);
};

async function consultarOverpass(): Promise<{ elements: ElementoOsm[] }> {
  const consulta =
    `[out:json][timeout:90];way["highway"~"^(${TIPOS.join('|')})$"](around:${radio},${lat0},${lng0});(._;>;);out body;`;
  let ultimoError = 'sin respuesta';
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'red-vial-sucursal/1.0' },
        body: `data=${encodeURIComponent(consulta)}`,
        signal: AbortSignal.timeout(90_000),
      });
      if (!res.ok) {
        ultimoError = `${url} respondió ${res.status}`;
        continue;
      }
      return await res.json();
    } catch (e) {
      ultimoError = `${url}: ${(e as Error).message}`;
    }
  }
  throw new Error(`Overpass no respondió (${ultimoError}).`);
}

async function principal() {
  const datos = await consultarOverpass();
  const nodosOsm = new Map<number, ElementoOsm>();
  const vias: ElementoOsm[] = [];
  for (const e of datos.elements ?? []) {
    if (e.type === 'node') nodosOsm.set(e.id, e);
    else if (e.type === 'way' && (e.nodes?.length ?? 0) > 1) vias.push(e);
  }
  if (vias.length === 0) throw new Error('Overpass respondió sin calles: no se sobrescribe el archivo anterior.');

  const nombres: string[] = [''];
  const indiceNombre = new Map<string, number>([['', 0]]);
  const idxNombre = (n: string | undefined) => {
    const k = (n ?? '').trim();
    if (!indiceNombre.has(k)) {
      indiceNombre.set(k, nombres.length);
      nombres.push(k);
    }
    return indiceNombre.get(k)!;
  };

  const nodos: Array<[number, number]> = [];
  const idxNodo = new Map<number, number>();
  const usarNodo = (id: number) => {
    let i = idxNodo.get(id);
    if (i === undefined) {
      const n = nodosOsm.get(id)!;
      i = nodos.length;
      idxNodo.set(id, i);
      nodos.push([Math.round(n.lat! * 1e6), Math.round(n.lon! * 1e6)]);
    }
    return i;
  };

  const aristas: Array<[number, number, number, number, number]> = [];
  let sinNombre = 0;
  let sentidos = 0;
  for (const via of vias) {
    const t = via.tags ?? {};
    const tipo = t.highway;
    const privado = t.access === 'no' || t.access === 'private';
    const peatonOk = !SOLO_AUTO.has(tipo) && t.foot !== 'no' && !(privado && t.foot !== 'yes');
    const autoOk = !SOLO_PEATON.has(tipo) && t.motor_vehicle !== 'no' && !(privado && t.motor_vehicle !== 'yes');
    if (!peatonOk && !autoOk) continue;
    const glorieta = t.junction === 'roundabout' || t.junction === 'circular';
    let sentido = 0; // 0 doble, 1 solo ida, -1 solo vuelta
    if (['yes', '1', 'true'].includes(t.oneway) || glorieta) sentido = 1;
    else if (t.oneway === '-1') sentido = -1;
    if (sentido !== 0) sentidos++;
    if (!t.name) sinNombre++;
    const nombre = idxNombre(t.name ?? t.ref);
    const lista = via.nodes!;
    for (let i = 0; i + 1 < lista.length; i++) {
      const A = nodosOsm.get(lista[i]);
      const B = nodosOsm.get(lista[i + 1]);
      if (!A || !B) continue;
      // Fuera de la zona (con margen): no se guarda.
      if (metros(lat0, lng0, A.lat!, A.lon!) > radio * 1.1 && metros(lat0, lng0, B.lat!, B.lon!) > radio * 1.1) continue;
      let banderas = 0;
      if (peatonOk) banderas |= 1 | 2; // a pie: los dos sentidos (incluso en calles de un solo sentido)
      if (autoOk) {
        if (sentido >= 0) banderas |= 4;
        if (sentido <= 0) banderas |= 8;
      }
      if (glorieta) banderas |= 16;
      const long = Math.max(1, Math.round(metros(A.lat!, A.lon!, B.lat!, B.lon!)));
      aristas.push([usarNodo(lista[i]), usarNodo(lista[i + 1]), long, banderas, nombre]);
    }
  }

  // Descarta componentes desconectadas pequeñas (< 20 nodos).
  const padre = nodos.map((_, i) => i);
  const raiz = (x: number): number => {
    while (padre[x] !== x) {
      padre[x] = padre[padre[x]];
      x = padre[x];
    }
    return x;
  };
  for (const [a, b] of aristas) padre[raiz(a)] = raiz(b);
  const tamano = new Map<number, number>();
  nodos.forEach((_, i) => tamano.set(raiz(i), (tamano.get(raiz(i)) ?? 0) + 1));
  const grandes = aristas.filter(([a]) => (tamano.get(raiz(a)) ?? 0) >= 20);
  if (grandes.length === 0) throw new Error('Ninguna componente de calles es suficientemente grande.');

  // Fusiona puntos de forma (nodos de grado 2, misma calle y banderas) que no cambian el dibujo más de 3 m.
  type Ar = { a: number; b: number; f: number; n: number };
  let lista: Ar[] = grandes.map(([a, b, , f, n]) => ({ a, b, f, n }));
  const xy = (i: number): [number, number] => [
    (nodos[i][1] / 1e6 - lng0) * M_POR_GRADO * Math.cos(lat0 * RAD),
    (nodos[i][0] / 1e6 - lat0) * M_POR_GRADO,
  ];
  const desviacion = (p: number, a: number, b: number) => {
    const [px, py] = xy(p), [ax, ay] = xy(a), [bx, by] = xy(b);
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  };
  const invertir = (f: number) => (f & 16) | ((f & 1) << 1) | ((f & 2) >> 1) | ((f & 4) << 1) | ((f & 8) >> 1);
  for (let ronda = 0; ronda < 50; ronda++) {
    const incidentes = new Map<number, number[]>();
    lista.forEach((e, i) => {
      for (const n of [e.a, e.b]) incidentes.set(n, [...(incidentes.get(n) ?? []), i]);
    });
    const quitar = new Set<number>();
    const agregar: Ar[] = [];
    const tocados = new Set<number>();
    for (const [nodo, idx] of incidentes) {
      if (idx.length !== 2 || idx[0] === idx[1]) continue;
      if (tocados.has(idx[0]) || tocados.has(idx[1])) continue;
      const e1 = lista[idx[0]];
      let e2 = lista[idx[1]];
      // Orienta e1 como (x -> nodo) y e2 como (nodo -> y).
      let a1 = e1.a, f1 = e1.f;
      if (e1.b !== nodo) { a1 = e1.b; f1 = invertir(e1.f); }
      let b2 = e2.b, f2 = e2.f;
      if (e2.a !== nodo) { b2 = e2.a; f2 = invertir(e2.f); }
      if (f1 !== f2 || e1.n !== e2.n || a1 === b2) continue;
      if (desviacion(nodo, a1, b2) > 3) continue;
      quitar.add(idx[0]);
      quitar.add(idx[1]);
      tocados.add(idx[0]);
      tocados.add(idx[1]);
      agregar.push({ a: a1, b: b2, f: f1, n: e1.n });
    }
    if (agregar.length === 0) break;
    lista = lista.filter((_, i) => !quitar.has(i)).concat(agregar);
  }

  // Reindexa los nodos que quedaron en uso (en orden de primer uso, para que los deltas sean pequeños).
  const nuevo = new Map<number, number>();
  const nodosFinal: Array<[number, number]> = [];
  const usar = (i: number) => {
    let n = nuevo.get(i);
    if (n === undefined) {
      n = nodosFinal.length;
      nuevo.set(i, n);
      nodosFinal.push(nodos[i]);
    }
    return n;
  };
  const aristasPlano: number[] = [];
  for (const e of lista) aristasPlano.push(usar(e.a), usar(e.b), e.f, e.n);
  const nodosPlano: number[] = [];
  nodosFinal.forEach(([la, lo], i) => {
    if (i === 0) nodosPlano.push(la, lo);
    else nodosPlano.push(la - nodosFinal[i - 1][0], lo - nodosFinal[i - 1][1]);
  });
  const aristasFinal = { length: aristasPlano.length / 4 };

  const salida = {
    version: 2,
    generadoEn: new Date().toISOString(),
    fuente: '© colaboradores de OpenStreetMap (ODbL)',
    destino: { latitud: lat0, longitud: lng0, nombre: nombreDestino },
    radioM: radio,
    nombres,
    nodos: nodosPlano,
    aristas: aristasPlano,
  };
  const texto = JSON.stringify(salida);
  const bytes = Buffer.byteLength(texto);
  if (bytes > PRESUPUESTO_BYTES) {
    console.error(
      `El archivo pesa ${(bytes / 1024).toFixed(0)} KB (límite ${PRESUPUESTO_BYTES / 1024} KB). ` +
        `No se escribió. Prueba con un radio menor, p. ej. --radio ${Math.round(radio * 0.8)}.`,
    );
    process.exit(2);
  }
  mkdirSync(dirname(SALIDA), { recursive: true });
  writeFileSync(SALIDA, texto);
  console.log(`Red vial escrita en ${SALIDA}`);
  console.log(`  destino ${lat0}, ${lng0} · radio ${radio} m · nodos ${nodosFinal.length} · aristas ${aristasFinal.length}`);
  console.log(`  tamaño ${(bytes / 1024).toFixed(1)} KB · vías sin nombre ${sinNombre}/${vias.length} · vías de un solo sentido ${sentidos}`);
}

principal().catch((e) => {
  console.error(`ERROR: ${(e as Error).message}`);
  process.exit(1);
});
