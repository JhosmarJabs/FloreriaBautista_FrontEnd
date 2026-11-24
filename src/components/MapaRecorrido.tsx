import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Crosshair, Maximize2, Minus, Plus } from 'lucide-react';
import type { RedVial, Ruta } from '../utils/rutaOffline';

export interface UsuarioEnMapa {
  x: number;
  y: number;
  /** Precisión en metros. */
  precision: number;
  /** Rumbo en grados (0 = norte) o null si no se conoce. */
  rumbo: number | null;
}

interface Props {
  red: RedVial | null;
  ruta: Ruta | null;
  usuario: UsuarioEnMapa | null;
  /** Posición de la sucursal en metros (x al este, y al norte). */
  destino: { x: number; y: number };
  /** Resumen en texto para lectores de pantalla. */
  descripcion: string;
  className?: string;
}

// Lienzo nominal: el SVG ocupa el contenedor con `slice` y todo se dibuja en estas unidades.
const ANCHO = 400;
const ALTO = 300;
const ALCANCE_MIN = 120;
const ALCANCE_MAX = 7000;
const ALCANCE_INICIAL = 700;

const ESCALAS_M = [20, 50, 100, 200, 500, 1000, 2000];

/**
 * Mapa propio en SVG: las calles de la red guardada, la ruta, la sucursal y el cliente. Sin imágenes
 * de mapa (teselas), sin bibliotecas y con el norte siempre arriba. Funciona sin Internet.
 */
export default function MapaRecorrido({ red, ruta, usuario, destino, descripcion, className }: Props) {
  const [alcance, setAlcance] = useState(ALCANCE_INICIAL); // metros visibles en el lado corto
  const [centroLibre, setCentroLibre] = useState<{ x: number; y: number } | null>(null);
  const [seguir, setSeguir] = useState(true);
  const arrastre = useRef<{ x: number; y: number; cx: number; cy: number; id: number } | null>(null);
  const contenedor = useRef<HTMLDivElement | null>(null);
  const [animar] = useState(
    () => typeof window === 'undefined' || !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  const centro = useMemo(() => {
    if (seguir) return usuario ? { x: usuario.x, y: usuario.y } : { x: destino.x, y: destino.y };
    return centroLibre ?? { x: destino.x, y: destino.y };
  }, [seguir, centroLibre, usuario, destino.x, destino.y]);

  const escala = ALTO / alcance; // unidades del lienzo por metro
  const aX = (x: number) => ANCHO / 2 + (x - centro.x) * escala;
  const aY = (y: number) => ALTO / 2 - (y - centro.y) * escala;

  // Calles visibles: una sola ruta de trazo (rápida incluso con miles de aristas).
  const trazoCalles = useMemo(() => {
    if (!red) return '';
    const mx = (ANCHO / 2 / escala) * 1.9;
    const my = (ALTO / 2 / escala) * 1.9;
    const partes: string[] = [];
    for (const ar of red.aristas) {
      const x0 = red.x[ar.a];
      const y0 = red.y[ar.a];
      const x1 = red.x[ar.b];
      const y1 = red.y[ar.b];
      if (
        (x0 < centro.x - mx && x1 < centro.x - mx) || (x0 > centro.x + mx && x1 > centro.x + mx) ||
        (y0 < centro.y - my && y1 < centro.y - my) || (y0 > centro.y + my && y1 > centro.y + my)
      ) continue;
      partes.push(
        `M${(ANCHO / 2 + (x0 - centro.x) * escala).toFixed(1)} ${(ALTO / 2 - (y0 - centro.y) * escala).toFixed(1)}` +
          `L${(ANCHO / 2 + (x1 - centro.x) * escala).toFixed(1)} ${(ALTO / 2 - (y1 - centro.y) * escala).toFixed(1)}`,
      );
    }
    return partes.join('');
  }, [red, centro.x, centro.y, escala]);

  const trazoRuta = useMemo(() => {
    if (!ruta) return '';
    return ruta.puntos
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${(ANCHO / 2 + (x - centro.x) * escala).toFixed(1)} ${(ALTO / 2 - (y - centro.y) * escala).toFixed(1)}`)
      .join('');
  }, [ruta, centro.x, centro.y, escala]);

  const verTodo = useCallback(() => {
    const xs = [destino.x];
    const ys = [destino.y];
    if (usuario) {
      xs.push(usuario.x);
      ys.push(usuario.y);
    }
    if (ruta) {
      for (const [x, y] of ruta.puntos) {
        xs.push(x);
        ys.push(y);
      }
    }
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = Math.max(maxX - minX, 80) * (ALTO / ANCHO); // ajusta al lado corto del lienzo
    const h = Math.max(maxY - minY, 80);
    setCentroLibre({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 });
    setAlcance(Math.min(ALCANCE_MAX, Math.max(ALCANCE_MIN, Math.max(w, h) * 1.35)));
    setSeguir(false);
  }, [destino.x, destino.y, usuario, ruta]);

  const centrarEnMi = () => {
    setSeguir(true);
    setAlcance((a) => Math.min(a, 900));
  };

  const acercar = (factor: number) => setAlcance((a) => Math.min(ALCANCE_MAX, Math.max(ALCANCE_MIN, a * factor)));

  // Arrastre con puntero: desplaza el mapa y desactiva «seguirme» hasta pulsar «Centrar en mí».
  const alPresionar = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    arrastre.current = { x: e.clientX, y: e.clientY, cx: centro.x, cy: centro.y, id: e.pointerId };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a || a.id !== e.pointerId || !contenedor.current) return;
    const r = contenedor.current.getBoundingClientRect();
    const px = Math.max(r.width / ANCHO, r.height / ALTO); // píxeles de pantalla por unidad del lienzo (slice)
    const dx = (e.clientX - a.x) / px / escala;
    const dy = (e.clientY - a.y) / px / escala;
    if (Math.abs(e.clientX - a.x) + Math.abs(e.clientY - a.y) < 4) return;
    setSeguir(false);
    setCentroLibre({ x: a.cx - dx, y: a.cy + dy });
  };
  const alSoltar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (arrastre.current?.id === e.pointerId) arrastre.current = null;
  };

  // Teclado: flechas desplazan, + y − acercan.
  const alTeclear = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const paso = alcance * 0.2;
    const mover = (dx: number, dy: number) => {
      e.preventDefault();
      setSeguir(false);
      setCentroLibre({ x: centro.x + dx, y: centro.y + dy });
    };
    if (e.key === 'ArrowLeft') mover(-paso, 0);
    else if (e.key === 'ArrowRight') mover(paso, 0);
    else if (e.key === 'ArrowUp') mover(0, paso);
    else if (e.key === 'ArrowDown') mover(0, -paso);
    else if (e.key === '+' || e.key === '=') acercar(0.7);
    else if (e.key === '-') acercar(1 / 0.7);
  };

  // Escala gráfica: la barra más larga que quepa en ~35 % del ancho.
  const barraM = [...ESCALAS_M].reverse().find((m) => m * escala <= ANCHO * 0.35) ?? ESCALAS_M[0];
  const barraPx = barraM * escala;

  const ux = usuario ? aX(usuario.x) : 0;
  const uy = usuario ? aY(usuario.y) : 0;
  const radioPrecision = usuario ? Math.min(usuario.precision * escala, 120) : 0;

  const boton =
    'w-11 h-11 rounded-xl bg-white/95 border border-slate-200 text-[#1a3b5b] shadow-sm flex items-center justify-center hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]';

  return (
    <div
      ref={contenedor}
      className={`relative overflow-hidden rounded-[22px] border border-slate-200 bg-[#eef3f8] select-none touch-none ${className ?? ''}`}
      onPointerDown={alPresionar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
      onKeyDown={alTeclear}
      tabIndex={0}
      aria-label="Mapa del recorrido. Usa las flechas para moverlo y más o menos para acercar."
    >
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        role="img"
        aria-label={descripcion}
      >
        <rect width={ANCHO} height={ALTO} fill="#eef3f8" />
        {trazoCalles && (
          <path d={trazoCalles} fill="none" stroke="#c3cfdc" strokeWidth={1.4} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        )}
        {trazoRuta && (
          <>
            <path d={trazoRuta} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <path d={trazoRuta} fill="none" stroke="#1a3b5b" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </>
        )}

        {/* Sucursal */}
        <g transform={`translate(${aX(destino.x)} ${aY(destino.y)})`}>
          <path d="M0 0 C-9 -12 -11 -17 -11 -21 a11 11 0 1 1 22 0 c0 4 -2 9 -11 21z" fill="#D4AF37" stroke="#1a3b5b" strokeWidth={1.8} transform="translate(0 0)" />
          <circle cx={0} cy={-21} r={4.2} fill="#1a3b5b" />
        </g>

        {/* Cliente */}
        {usuario && (
          <g transform={`translate(${ux} ${uy})`}>
            <circle r={radioPrecision} fill="#2563eb" fillOpacity={0.14} stroke="#2563eb" strokeOpacity={0.35} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            {usuario.rumbo !== null && (
              <path
                d="M0 -26 L10 -4 L0 -9 L-10 -4 Z"
                fill="#2563eb"
                fillOpacity={0.55}
                transform={`rotate(${usuario.rumbo})`}
                style={animar ? { transition: 'transform 0.2s linear' } : undefined}
              />
            )}
            <circle r={7} fill="#2563eb" stroke="#fff" strokeWidth={2.5} />
          </g>
        )}

        {/* Escala gráfica */}
        <g transform={`translate(12 ${ALTO - 14})`}>
          <path d={`M0 0 H${barraPx} M0 -4 V4 M${barraPx} -4 V4`} stroke="#1a3b5b" strokeWidth={1.6} fill="none" vectorEffect="non-scaling-stroke" />
          <text x={barraPx + 6} y={4} fontSize={11} fontWeight={700} fill="#1a3b5b" stroke="#fff" strokeWidth={3} paintOrder="stroke">
            {barraM >= 1000 ? `${barraM / 1000} km` : `${barraM} m`}
          </text>
        </g>
      </svg>

      {/* Norte arriba */}
      <div
        className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/95 border border-slate-200 shadow-sm flex flex-col items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <span className="text-[10px] font-black leading-none text-[#ff7f7d]">N</span>
        <span className="block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-l-transparent border-r-transparent border-b-[#1a3b5b]" />
      </div>

      {/* Controles */}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        <button type="button" className={boton} onClick={() => acercar(0.7)} aria-label="Acercar el mapa">
          <Plus className="w-5 h-5" />
        </button>
        <button type="button" className={boton} onClick={() => acercar(1 / 0.7)} aria-label="Alejar el mapa">
          <Minus className="w-5 h-5" />
        </button>
        <button type="button" className={boton} onClick={verTodo} aria-label="Ver toda la ruta">
          <Maximize2 className="w-5 h-5" />
        </button>
        {usuario && !seguir && (
          <button type="button" className={boton} onClick={centrarEnMi} aria-label="Centrar en mí">
            <Crosshair className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Atribución (ODbL) */}
      <p className="absolute bottom-1 right-2 text-[10px] font-semibold text-slate-600 bg-white/80 rounded px-1 pointer-events-none">
        © colaboradores de OpenStreetMap
      </p>
    </div>
  );
}
