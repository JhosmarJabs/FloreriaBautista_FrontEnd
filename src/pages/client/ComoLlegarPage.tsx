import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowUp, Car, Check, CheckCircle2, Compass, CornerUpLeft, CornerUpRight, ExternalLink, Flag,
  Footprints, Loader2, Lock, MapPin, Navigation, Phone, RefreshCw, Route as RutaIcono, ShieldCheck, SignalLow,
  TriangleAlert, Undo2, WifiOff,
} from 'lucide-react';
import { CmsService } from '../../services/cmsService';
import { SiteSettings } from '../../types';
import { groupHorarios } from '../../utils/horarios';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSeguimientoUbicacion } from '../../hooks/useSeguimientoUbicacion';
import { useBrujula } from '../../hooks/useBrujula';
import MapaRecorrido, { UsuarioEnMapa } from '../../components/MapaRecorrido';
import {
  Coordenadas, coordenadasValidas, distanciaKm, formatearDistancia, rumboCardinal, rumboGrados, urlRutaMaps,
} from '../../utils/geo';
import {
  Avance, Giro, Indicacion, LECTURAS_DESVIO, ModoRuta, PRECISION_BAJA_M, PuntoEnRed, RADIO_LLEGADA_M, RedVial,
  RedVialJson, Ruta, TOLERANCIA_DESTINO_M, UMBRAL_DESVIO_M, aMetros, avance, calcularRuta, cargarRedVial,
  formatearMetros, generarIndicaciones, puntoMasCercano,
} from '../../utils/rutaOffline';

const URL_RED_VIAL = '/mapa-sucursal/red-vial.json';
const NOMBRE_POR_DEFECTO = 'Florería Bautista';

type EstadoFlecha = 'fuera-zona' | 'lejos-calle' | 'sin-camino' | 'desactualizado' | 'sin-red';
type EstadoError = 'denegado' | 'apagada' | 'timeout' | 'sin-https' | 'sin-api' | 'sin-sucursal';

type Vista =
  | { estado: 'inicio' }
  | { estado: 'buscando' }
  | {
      estado: 'en-ruta' | 'recalculando';
      ruta: Ruta;
      indicaciones: Indicacion[];
      av: Avance;
      precision: number;
      sinSenal: boolean;
    }
  | { estado: EstadoFlecha; distanciaM: number; rumbo: number; precision: number; sinSenal: boolean }
  | { estado: 'llegada' }
  | { estado: EstadoError };

const ESTADOS_ACTIVOS = ['en-ruta', 'recalculando', 'fuera-zona', 'lejos-calle', 'sin-camino', 'desactualizado', 'sin-red'];

const ERRORES: Record<EstadoError, { t: string; d: string; reintento: string | null; maps: boolean; icono: React.ReactNode }> = {
  denegado: {
    t: 'No tenemos permiso para usar tu ubicación',
    d: 'Para guiarte, permite la ubicación desde el candado de la barra de direcciones (Configuración del sitio → Ubicación → Permitir) y vuelve a intentarlo.',
    reintento: 'Ya lo permití, intentar de nuevo',
    maps: true,
    icono: <Lock className="w-7 h-7" />,
  },
  apagada: {
    t: 'La ubicación de tu teléfono está apagada',
    d: 'Activa la ubicación (GPS) en los ajustes rápidos de tu teléfono y vuelve a intentarlo.',
    reintento: 'Intentar de nuevo',
    maps: true,
    icono: <MapPin className="w-7 h-7" />,
  },
  timeout: {
    t: 'No pudimos ubicarte',
    d: 'La señal del GPS tardó demasiado. Sal a un lugar abierto o junto a una ventana y vuelve a intentarlo.',
    reintento: 'Reintentar',
    maps: false,
    icono: <SignalLow className="w-7 h-7" />,
  },
  'sin-https': {
    t: 'Tu ubicación no está disponible en esta dirección',
    d: 'Abre la tienda con https para usar tu ubicación. La dirección y el horario sí los puedes ver.',
    reintento: null,
    maps: true,
    icono: <Lock className="w-7 h-7" />,
  },
  'sin-api': {
    t: 'Tu navegador no puede darnos tu ubicación',
    d: 'Prueba con otro navegador o con la aplicación de mapas de tu teléfono. La dirección y el horario sí los puedes ver.',
    reintento: null,
    maps: true,
    icono: <MapPin className="w-7 h-7" />,
  },
  'sin-sucursal': {
    t: 'No tenemos la ubicación de la sucursal',
    d: 'Por ahora no podemos guiarte. Esta es la dirección para que la busques:',
    reintento: null,
    maps: false,
    icono: <MapPin className="w-7 h-7" />,
  },
};

// ── Piezas visuales ────────────────────────────────────────────────────────────────────────────
function IconoGiro({ giro, className }: { giro: Giro; className?: string }) {
  const c = className ?? 'w-12 h-12';
  switch (giro) {
    case 'derecha': return <CornerUpRight className={c} strokeWidth={2.6} aria-hidden="true" />;
    case 'izquierda': return <CornerUpLeft className={c} strokeWidth={2.6} aria-hidden="true" />;
    case 'vuelta-u': return <Undo2 className={c} strokeWidth={2.6} aria-hidden="true" />;
    case 'glorieta': return <RefreshCw className={c} strokeWidth={2.6} aria-hidden="true" />;
    case 'llegada': return <Flag className={c} strokeWidth={2.6} aria-hidden="true" />;
    default: return <ArrowUp className={c} strokeWidth={2.6} aria-hidden="true" />;
  }
}

function Aviso({ tipo, children }: { tipo: 'info' | 'ambar'; children: React.ReactNode }) {
  const clases = tipo === 'ambar'
    ? 'bg-amber-50 border-amber-200 text-amber-900'
    : 'bg-[#e2f0fd] border-blue-200 text-[#1a3b5b]';
  return (
    <div role="status" className={`flex gap-2.5 items-start rounded-2xl border px-3.5 py-3 text-[14.5px] font-semibold leading-snug ${clases}`}>
      {children}
    </div>
  );
}

const botonBase =
  'w-full min-h-[48px] rounded-2xl px-4 font-extrabold text-[15px] inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] disabled:opacity-55 disabled:cursor-not-allowed';
const botonAzul = `${botonBase} bg-[#1a3b5b] text-white hover:bg-[#15324c]`;
const botonOro = `${botonBase} bg-[#D4AF37] text-[#1a3b5b] hover:bg-[#c29f2f]`;
const botonBorde = `${botonBase} bg-white text-[#1a3b5b] border-2 border-slate-200 hover:bg-slate-50`;

function SelectorModo({ modo, onChange, grande }: { modo: ModoRuta; onChange: (m: ModoRuta) => void; grande?: boolean }) {
  if (grande) {
    return (
      <div className="grid grid-cols-2 gap-2.5 my-3.5" role="group" aria-label="Cómo vas a llegar">
        {([['pie', 'A pie', 'Por cualquier calle', Footprints], ['auto', 'En auto', 'Respeta los sentidos', Car]] as const).map(
          ([id, titulo, nota, Icono]) => (
            <button
              key={id}
              type="button"
              aria-pressed={modo === id}
              onClick={() => onChange(id)}
              className={`min-h-[92px] rounded-2xl border-2 p-3 text-left flex flex-col justify-center gap-1 ${
                modo === id ? 'border-[#1a3b5b] bg-[#e2f0fd] shadow-[inset_0_0_0_1px_#1a3b5b]' : 'border-slate-200 bg-white'
              }`}
            >
              <Icono className="w-6 h-6 text-[#1a3b5b]" aria-hidden="true" />
              <b className="text-base text-[#1a3b5b]">{titulo}</b>
              <span className="text-[12.5px] font-semibold text-slate-600">{nota}</span>
            </button>
          ),
        )}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100" role="group" aria-label="Cómo vas a llegar">
      {([['pie', 'A pie', Footprints], ['auto', 'En auto', Car]] as const).map(([id, titulo, Icono]) => (
        <button
          key={id}
          type="button"
          aria-pressed={modo === id}
          onClick={() => onChange(id)}
          className={`min-h-[44px] rounded-xl font-extrabold text-sm inline-flex items-center justify-center gap-1.5 ${
            modo === id ? 'bg-white text-[#1a3b5b] shadow-sm' : 'text-slate-600'
          }`}
        >
          <Icono className="w-4 h-4" aria-hidden="true" /> {titulo}
        </button>
      ))}
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────────────────────
export default function ComoLlegarPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const enLinea = useOnlineStatus();
  const seguimiento = useSeguimientoUbicacion();
  const brujula = useBrujula();

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [settingsListo, setSettingsListo] = useState(false);
  const [red, setRed] = useState<RedVial | null>(null);
  const [redListo, setRedListo] = useState(false);

  const [iniciado, setIniciado] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [modo, setModo] = useState<ModoRuta>('pie');
  const [vista, setVista] = useState<Vista>({ estado: 'inicio' });
  const [anuncio, setAnuncio] = useState('');
  const [recalculando, setRecalculando] = useState(false);

  const rutaRef = useRef<{ ruta: Ruta; indicaciones: Indicacion[]; modo: ModoRuta } | null>(null);
  const tramoRef = useRef(0);
  const desviosRef = useRef(0);
  const destinoPuntoRef = useRef<{ modo: ModoRuta; punto: PuntoEnRed | null } | null>(null);
  const autoInicioRef = useRef(false);
  const indiceAnunciadoRef = useRef<number | null>(null);

  useEffect(() => {
    const anterior = document.title;
    document.title = 'Ir a la sucursal — Florería Bautista';
    return () => {
      document.title = anterior;
    };
  }, []);

  // Datos: la sucursal del CMS y la red de calles guardada (ambas salen del service worker sin Internet).
  useEffect(() => {
    let vivo = true;
    CmsService.getSettings()
      .then((s) => vivo && setSettings(s))
      .catch(() => { /* sin CMS: se usa el destino de la red de calles */ })
      .finally(() => vivo && setSettingsListo(true));
    fetch(URL_RED_VIAL)
      .then((r) => {
        if (!r.ok) throw new Error(`red vial ${r.status}`);
        return r.json() as Promise<RedVialJson>;
      })
      .then((json) => vivo && setRed(cargarRedVial(json)))
      .catch(() => { /* sin red de calles: modo flecha */ })
      .finally(() => vivo && setRedListo(true));
    return () => {
      vivo = false;
    };
  }, []);

  const cargaCompleta = settingsListo && redListo;
  const coordsCms = coordenadasValidas(settings?.latitud, settings?.longitud);
  const coordsRed = red ? coordenadasValidas(red.destino.latitud, red.destino.longitud) : null;
  const destino: Coordenadas | null = coordsCms ?? coordsRed;
  const desactualizada = !!(coordsCms && coordsRed && distanciaKm(coordsCms, coordsRed) * 1000 > TOLERANCIA_DESTINO_M);
  const redUsable = red && !desactualizada ? red : null;
  const nombreSucursal = NOMBRE_POR_DEFECTO;
  const direccion = settings?.direccion?.trim() || '';
  const horarioTexto = groupHorarios(settings?.horarios ?? []).map((g) => `${g.label}: ${g.value}`).join(' · ');
  const urlMaps = destino ? urlRutaMaps(destino) : null; // solo el destino: nunca la posición del cliente

  useEffect(() => {
    if (cargaCompleta && desactualizada) {
      // Sin la posición del cliente en el mensaje.
      console.warn('La red de calles guardada no corresponde a las coordenadas actuales de la sucursal.');
    }
  }, [cargaCompleta, desactualizada]);

  const limpiarRuta = () => {
    rutaRef.current = null;
    tramoRef.current = 0;
    desviosRef.current = 0;
    destinoPuntoRef.current = null;
    indiceAnunciadoRef.current = null;
  };

  const iniciar = useCallback(() => {
    limpiarRuta();
    setTerminado(false);
    setIniciado(true);
    setVista({ estado: 'buscando' });
    seguimiento.iniciar();
    // En iOS la brújula pide un toque propio; en el resto empieza sola.
    if (!brujula.necesitaPermiso) void brujula.activar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seguimiento.iniciar, brujula.necesitaPermiso, brujula.activar]);

  const terminar = useCallback(() => {
    seguimiento.terminar();
    brujula.desactivar();
    limpiarRuta();
    setIniciado(false);
    setTerminado(true);
    setRecalculando(false);
    setVista({ estado: 'inicio' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seguimiento.terminar, brujula.desactivar]);

  // Entrada desde «Ir a la sucursal»: empieza sola (la acción del cliente fue el botón). Nunca al cargar otra página.
  useEffect(() => {
    if (autoInicioRef.current || !cargaCompleta || !destino) return;
    if (params.get('iniciar') !== '1') return;
    autoInicioRef.current = true;
    iniciar();
  }, [cargaCompleta, destino, params, iniciar]);

  // Errores del seguimiento → pantallas propias.
  useEffect(() => {
    if (!iniciado) return;
    const e = seguimiento.estado;
    if (e === 'denegado') setVista({ estado: 'denegado' });
    else if (e === 'no-disponible') setVista({ estado: 'apagada' });
    else if (e === 'timeout') setVista({ estado: 'timeout' });
    else if (e === 'sin-api') setVista({ estado: window.isSecureContext ? 'sin-api' : 'sin-https' });
    else if (e === 'buscando') setVista({ estado: 'buscando' });
  }, [seguimiento.estado, iniciado]);

  // Cada lectura de ubicación: avance, desvío, recálculo y llegada.
  const lectura = seguimiento.lectura;
  useEffect(() => {
    if (!iniciado || !lectura || !destino) return;
    const { pos, precision } = lectura;
    const sinSenal = seguimiento.sinSenal;
    const metros = distanciaKm(pos, destino) * 1000;
    const rumbo = rumboGrados(pos, destino);

    if (metros <= RADIO_LLEGADA_M) {
      seguimiento.detener();
      brujula.desactivar();
      setVista({ estado: 'llegada' });
      return;
    }
    const flecha = (estado: EstadoFlecha) => {
      rutaRef.current = null;
      setVista({ estado, distanciaM: metros, rumbo, precision, sinSenal });
    };
    if (desactualizada) return flecha('desactualizado');
    if (!redUsable) return flecha('sin-red');
    if (metros > redUsable.radioM) return flecha('fuera-zona');

    const { x, y } = aMetros(redUsable, pos);
    let actual = rutaRef.current && rutaRef.current.modo === modo ? rutaRef.current : null;
    let recalculo = false;

    if (actual) {
      const av = avance(actual.ruta, actual.indicaciones, x, y, tramoRef.current);
      const umbral = Math.max(UMBRAL_DESVIO_M, precision);
      if (precision > PRECISION_BAJA_M) {
        // Ubicación aproximada: no se recalcula por desvío mientras dure.
        desviosRef.current = 0;
      } else if (av.desvio > umbral) {
        desviosRef.current += 1;
        if (desviosRef.current >= LECTURAS_DESVIO) {
          actual = null;
          recalculo = true;
        }
      } else {
        desviosRef.current = 0;
      }
      // Una sola lectura fuera de la ruta no mueve la pantalla ni recalcula: se conserva lo que se veía.
      if (actual && desviosRef.current > 0 && precision <= PRECISION_BAJA_M) return;
    }

    if (!actual) {
      const origen = puntoMasCercano(redUsable, x, y, modo);
      if (!origen) return flecha('lejos-calle');
      if (!destinoPuntoRef.current || destinoPuntoRef.current.modo !== modo) {
        const d = aMetros(redUsable, destino);
        destinoPuntoRef.current = { modo, punto: puntoMasCercano(redUsable, d.x, d.y, modo, 400) };
      }
      const destinoPunto = destinoPuntoRef.current.punto;
      const ruta = destinoPunto ? calcularRuta(redUsable, origen, destinoPunto, modo) : null;
      if (!ruta) return flecha('sin-camino');
      actual = { ruta, indicaciones: generarIndicaciones(ruta, redUsable, nombreSucursal), modo };
      rutaRef.current = actual;
      tramoRef.current = 0;
      desviosRef.current = 0;
      indiceAnunciadoRef.current = null;
      if (recalculo) setRecalculando(true);
    }

    const av = avance(actual.ruta, actual.indicaciones, x, y, tramoRef.current);
    tramoRef.current = av.tramo;
    if (av.restante <= RADIO_LLEGADA_M) {
      seguimiento.detener();
      brujula.desactivar();
      setVista({ estado: 'llegada' });
      return;
    }
    setVista({
      estado: 'en-ruta', ruta: actual.ruta, indicaciones: actual.indicaciones, av, precision, sinSenal,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectura, seguimiento.sinSenal, modo, redUsable, destino?.latitud, destino?.longitud, desactualizada, iniciado]);

  // «Recalculando…» se ve unos segundos.
  useEffect(() => {
    if (!recalculando) return;
    const t = window.setTimeout(() => setRecalculando(false), 2500);
    return () => window.clearTimeout(t);
  }, [recalculando]);

  // Anuncios accesibles: solo al cambiar de indicación, recalcular, cambiar de modo, llegar o de estado.
  const estadoVista = vista.estado;
  const indiceVista = vista.estado === 'en-ruta' || vista.estado === 'recalculando' ? vista.av.indice : null;
  useEffect(() => {
    if (!iniciado) return;
    if (estadoVista === 'llegada') setAnuncio(`Llegaste a ${nombreSucursal}`);
    else if (recalculando) setAnuncio('Te saliste de la ruta. Recalculando.');
    else if (estadoVista === 'en-ruta' && vista.estado === 'en-ruta') {
      if (indiceAnunciadoRef.current !== indiceVista) {
        indiceAnunciadoRef.current = indiceVista;
        const sig = vista.indicaciones[Math.min(vista.av.indice + 1, vista.indicaciones.length - 1)];
        setAnuncio(`${sig.texto} en ${formatearMetros(vista.av.aSiguiente)}`);
      }
    } else if (estadoVista === 'fuera-zona') setAnuncio('Estás fuera de la zona del recorrido por calles. Sigue la flecha.');
    else if (estadoVista === 'lejos-calle') setAnuncio('Acércate a una calle para ver el recorrido.');
    else if (estadoVista === 'sin-camino') setAnuncio('No encontramos un camino por calles. Sigue la flecha.');
    else if (estadoVista === 'desactualizado') setAnuncio('El mapa guardado no corresponde a la ubicación actual de la sucursal.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoVista, indiceVista, recalculando, iniciado, modo]);

  // Pantalla encendida mientras se guía.
  const guiando = iniciado && ESTADOS_ACTIVOS.includes(estadoVista);
  useEffect(() => {
    if (!guiando) return;
    let sentinel: { release?: () => Promise<void> } | null = null;
    let vivo = true;
    const pedir = async () => {
      try {
        const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release?: () => Promise<void> }> } };
        const s = await nav.wakeLock?.request('screen');
        if (!vivo) await s?.release?.();
        else sentinel = s ?? null;
      } catch { /* sin aviso si no existe o se rechaza */ }
    };
    void pedir();
    const alVolver = () => {
      if (document.visibilityState === 'visible') void pedir();
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      vivo = false;
      document.removeEventListener('visibilitychange', alVolver);
      void sentinel?.release?.().catch(() => undefined);
    };
  }, [guiando]);

  const volver = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/nosotros');
  };

  const cambiarModo = (m: ModoRuta) => {
    if (m === modo) return;
    setModo(m);
    if (iniciado) {
      setAnuncio(m === 'pie' ? 'Ruta a pie' : 'Ruta en auto');
      setRecalculando(true);
    }
  };

  // ── Derivados para dibujar ───────────────────────────────────────────────────────────────────
  const destinoXY = useMemo(() => (redUsable && destino ? aMetros(redUsable, destino) : { x: 0, y: 0 }), [redUsable, destino]);
  const rumboVista = brujula.rumbo;
  const posUsuario = lectura && redUsable ? aMetros(redUsable, lectura.pos) : null;
  const rumboFlecha = lectura && destino ? rumboGrados(lectura.pos, destino) : null;
  const usuarioMapa: UsuarioEnMapa | null = posUsuario && lectura
    ? { x: posUsuario.x, y: posUsuario.y, precision: lectura.precision, rumbo: rumboVista ?? lectura.rumboGps }
    : null;
  const rutaMapa = vista.estado === 'en-ruta' || vista.estado === 'recalculando' ? vista.ruta : null;
  const enCurso = vista.estado === 'en-ruta' || vista.estado === 'recalculando';
  const esFlecha = ['fuera-zona', 'lejos-calle', 'sin-camino', 'desactualizado', 'sin-red'].includes(vista.estado);
  const esError = vista.estado in ERRORES;
  // En el teléfono el mapa solo estorba cuando no hay ruta; en escritorio queda a la vista.
  const ocultarMapaMovil = esFlecha || esError || vista.estado === 'buscando';
  const descripcionMapa = (() => {
    if (vista.estado === 'en-ruta' || vista.estado === 'recalculando') {
      return `Mapa: estás a ${formatearMetros(vista.av.restante)} de la florería por una ruta de ${formatearMetros(vista.ruta.largoTotal)}.`;
    }
    if (esFlecha && 'distanciaM' in vista) return `Mapa: estás a ${formatearMetros(vista.distanciaM)} de la florería en línea recta.`;
    return 'Mapa de las calles cercanas a la florería.';
  })();

  const origenNombre = 'la página anterior';

  // ── Bloques ───────────────────────────────────────────────────────────────────────────────────
  const botonMaps = (estilo: string) =>
    urlMaps ? (
      enLinea ? (
        <a href={urlMaps} target="_blank" rel="noopener noreferrer" className={`${estilo} no-underline`}>
          <ExternalLink className="w-4 h-4" aria-hidden="true" /> Abrir en Google Maps
        </a>
      ) : (
        <div>
          <button type="button" disabled className={estilo}>
            <WifiOff className="w-4 h-4" aria-hidden="true" /> Abrir en Google Maps
          </button>
          <p className="mt-1.5 text-[13px] font-semibold text-slate-600 text-center">Disponible con Internet</p>
        </div>
      )
    ) : null;

  const tarjetaInicio = (
    <div className="bg-white rounded-[22px] p-[18px] border border-slate-200">
      <h2 className="text-[21px] font-extrabold text-[#1a3b5b]">{nombreSucursal}</h2>
      <p className="text-slate-600 text-[14.5px] leading-snug mt-1">
        {direccion || 'Consulta la dirección en Contacto.'}
        {horarioTexto && (<><br />{horarioTexto}</>)}
      </p>
      {terminado && (
        <div className="mt-3"><Aviso tipo="info"><Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> Recorrido terminado. Ya no usamos tu ubicación.</Aviso></div>
      )}
      <p className="mt-3.5 font-extrabold text-[#1a3b5b]">¿Cómo vienes?</p>
      <SelectorModo modo={modo} onChange={cambiarModo} grande />
      <button type="button" className={`${botonOro} min-h-[56px] text-[17px]`} onClick={iniciar}>
        <Navigation className="w-5 h-5" aria-hidden="true" /> Iniciar recorrido
      </button>
      <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-slate-600">
        <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Tu ubicación no sale de tu teléfono
      </p>
    </div>
  );

  const dial = (rumboDestino: number, distanciaM: number) => {
    const conBrujula = rumboVista !== null;
    const giroDial = conBrujula ? -rumboVista! : 0;
    return (
      <section className="rounded-[22px] bg-[#1a3b5b] text-white p-[18px]" aria-label="Brújula hacia la sucursal">
        <div className="flex flex-col items-center text-center gap-2">
          {brujula.necesitaPermiso && !brujula.activa ? (
            <div className="relative w-[210px] h-[210px] rounded-full border-[3px] border-[#D4AF37]/55 grid place-items-center bg-[radial-gradient(circle,#24496d_0,#1a3b5b_70%)]">
              <Compass className="w-16 h-16 text-[#D4AF37]" aria-hidden="true" />
            </div>
          ) : (
            <div
              className="relative w-[210px] h-[210px] rounded-full border-[3px] border-[#D4AF37]/55 grid place-items-center bg-[radial-gradient(circle,#24496d_0,#1a3b5b_70%)] motion-safe:transition-transform motion-safe:duration-200"
              style={{ transform: `rotate(${giroDial}deg)` }}
              aria-hidden="true"
            >
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[13px] font-black text-[#ff7f7d]">N</span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[13px] font-black text-slate-300">S</span>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] font-black text-slate-300">E</span>
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] font-black text-slate-300">O</span>
              <svg viewBox="0 0 48 48" className="w-[110px] h-[110px]" style={{ transform: `rotate(${rumboDestino}deg)` }}>
                <path d="M24 3 L39 41 L24 32 L9 41Z" fill="#D4AF37" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          <div className="text-[44px] font-black leading-none tracking-tight">{formatearMetros(distanciaM)}</div>
          <p className="text-[16px] text-[#dbe6f1]">
            en línea recta, hacia el <b className="text-white">{rumboCardinal(rumboDestino)}</b>
          </p>
          {brujula.necesitaPermiso && !brujula.activa ? (
            <>
              <button type="button" className={`${botonOro} max-w-xs`} onClick={() => void brujula.activar()}>
                <Compass className="w-5 h-5" aria-hidden="true" /> Activar brújula
              </button>
              <p className="text-[13px] text-[#dbe6f1]">Tu iPhone pide permiso para que la flecha apunte a la florería.</p>
              {brujula.permisoDenegado && <p className="text-[13px] text-amber-200">No se activó la brújula: la flecha apunta respecto al norte.</p>}
            </>
          ) : conBrujula ? (
            <p className="text-[13px] text-[#dbe6f1]">Gira con el teléfono: la flecha apunta a la florería.</p>
          ) : (
            <p className="text-[13px] text-[#dbe6f1]">
              {brujula.sinBrujula || !brujula.activa
                ? 'Tu equipo no tiene brújula: la N marca el norte y la flecha, hacia dónde está la florería.'
                : 'Buscando la brújula…'}
            </p>
          )}
        </div>
      </section>
    );
  };

  const flechaAvisos = (v: Extract<Vista, { estado: EstadoFlecha }>) => (
    <>
      {v.estado === 'fuera-zona' && (
        <Aviso tipo="info"><RutaIcono className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> El recorrido por calles empieza a {formatearDistancia((redUsable?.radioM ?? 3000) / 1000)} de la florería. Cuando entres a esa zona, la ruta aparece sola.</Aviso>
      )}
      {v.estado === 'sin-red' && (
        <Aviso tipo="info"><MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> El mapa de calles no está disponible en este momento. Sigue la flecha.</Aviso>
      )}
      {v.estado === 'lejos-calle' && (
        <Aviso tipo="info"><MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> Acércate a una calle para ver el recorrido. Mientras, sigue la flecha.</Aviso>
      )}
      {v.estado === 'sin-camino' && (
        <Aviso tipo="ambar"><TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> No encontramos un camino por calles{modo === 'auto' ? ' en auto' : ''}; sigue la flecha.</Aviso>
      )}
      {v.estado === 'desactualizado' && (
        <Aviso tipo="ambar"><TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> El mapa guardado no corresponde a la ubicación actual de la sucursal. Sigue la flecha hacia la dirección vigente.</Aviso>
      )}
      {v.sinSenal && (
        <Aviso tipo="ambar"><SignalLow className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> Buscando señal… usamos tu última posición.</Aviso>
      )}
    </>
  );

  const principal = (() => {
    if (vista.estado === 'inicio') {
      // Mientras carga o si no hay sucursal, lo muestran el aviso de carga y el bloque «sin-sucursal».
      if (!cargaCompleta || !destino) return null;
      return tarjetaInicio;
    }
    if (vista.estado === 'buscando') {
      return (
        <div className="bg-white rounded-[22px] p-[18px] border border-slate-200 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#1a3b5b]" aria-hidden="true" />
          <h2 className="mt-2 text-[21px] font-extrabold text-[#1a3b5b]">Buscando tu ubicación…</h2>
          <p className="text-slate-600 text-[14.5px] leading-snug">Si el navegador te lo pide, permite la ubicación. Puede tardar unos segundos bajo techo.</p>
          <button type="button" className={`${botonBorde} mt-3.5`} onClick={terminar}>Cancelar</button>
        </div>
      );
    }
    if (vista.estado === 'en-ruta' || vista.estado === 'recalculando') {
      if (recalculando || vista.estado === 'recalculando') {
        return (
          <section className="rounded-3xl bg-[#1a3b5b] text-white p-[18px] shadow-xl" aria-label="Indicación actual">
            <p className="text-[11.5px] font-black tracking-[0.14em] uppercase text-[#D4AF37] mb-2.5">Te saliste de la ruta</p>
            <div className="flex gap-4 items-center">
              <div className="w-[76px] h-[76px] rounded-[20px] bg-[#D4AF37] text-[#1a3b5b] grid place-items-center shrink-0">
                <RefreshCw className="w-12 h-12 animate-spin" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-[26px] font-extrabold leading-tight">Recalculando…</div>
                <div className="text-[17px] text-[#dbe6f1] font-semibold mt-1.5">Trazamos otra ruta desde donde estás, también sin Internet</div>
              </div>
            </div>
          </section>
        );
      }
      const { indicaciones, av } = vista;
      const sig = indicaciones[Math.min(av.indice + 1, indicaciones.length - 1)];
      const llegando = sig.giro === 'llegada';
      const calleActual = indicaciones[av.indice].calle;
      return (
        <>
          <section className="rounded-3xl bg-[#1a3b5b] text-white p-[18px] shadow-xl" aria-label="Indicación actual">
            <p className="text-[11.5px] font-black tracking-[0.14em] uppercase text-[#D4AF37] mb-2.5">Siguiente indicación</p>
            <div className="flex gap-4 items-center">
              <div className="w-[76px] h-[76px] rounded-[20px] bg-[#D4AF37] text-[#1a3b5b] grid place-items-center shrink-0">
                <IconoGiro giro={sig.giro} className="w-12 h-12" />
              </div>
              <div className="min-w-0">
                <div className="text-[42px] font-black leading-none tracking-tight">En {formatearMetros(av.aSiguiente)}</div>
                <div className="text-[17px] text-[#dbe6f1] font-semibold mt-1.5">
                  {llegando ? 'llegas a' : sig.giro === 'derecha' ? 'gira a la derecha en' : sig.giro === 'izquierda' ? 'gira a la izquierda en' : sig.giro === 'vuelta-u' ? 'da vuelta en U en' : sig.giro === 'glorieta' ? 'entra a la glorieta' : 'sigue por'}
                </div>
                <div className="text-[26px] font-extrabold leading-tight break-words">{llegando ? nombreSucursal : sig.giro === 'glorieta' ? '' : sig.calle}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-white/15">
              <div><small className="block text-[12px] font-bold uppercase tracking-wider text-[#b8c7d8]">Faltan</small><b className="text-xl font-black">{formatearMetros(av.restante)}</b></div>
              <div className="min-w-0"><small className="block text-[12px] font-bold uppercase tracking-wider text-[#b8c7d8]">Vas por</small><b className="text-xl font-black break-words">{calleActual}</b></div>
            </div>
          </section>
          {vista.precision > PRECISION_BAJA_M && (
            <Aviso tipo="ambar"><TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> Ubicación aproximada (±{Math.round(vista.precision)} m). La ruta no se recalcula mientras dure.</Aviso>
          )}
          {vista.sinSenal && (
            <Aviso tipo="ambar"><SignalLow className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> Buscando señal… usamos tu última posición.</Aviso>
          )}
        </>
      );
    }
    if (esFlecha && 'distanciaM' in vista) {
      const v = vista as Extract<Vista, { estado: EstadoFlecha }>;
      return (
        <>
          {dial(v.rumbo, v.distanciaM)}
          {flechaAvisos(v)}
          {(v.estado === 'fuera-zona' || v.estado === 'desactualizado' || v.estado === 'sin-red') && botonMaps(botonAzul)}
          {v.estado === 'sin-camino' && modo === 'auto' && (
            <button type="button" className={botonAzul} onClick={() => cambiarModo('pie')}>
              <Footprints className="w-5 h-5" aria-hidden="true" /> Probar la ruta a pie
            </button>
          )}
        </>
      );
    }
    if (vista.estado === 'llegada') {
      return (
        <section className="rounded-3xl border-2 border-[#D4AF37] bg-gradient-to-br from-[#fff8e1] to-white p-5 text-center" role="status">
          <div className="w-[72px] h-[72px] rounded-full bg-[#D4AF37] text-[#1a3b5b] grid place-items-center mx-auto mb-2.5">
            <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-[26px] font-black text-[#1a3b5b] mb-2">Llegaste a {nombreSucursal}</h2>
          {direccion && <p className="font-bold text-slate-700">{direccion}</p>}
          {(horarioTexto || settings?.telefono) && (
            <p className="text-slate-700 flex flex-wrap items-center justify-center gap-x-2">
              {horarioTexto && <span>{horarioTexto}</span>}
              {settings?.telefono && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" aria-hidden="true" />{settings.telefono}</span>}
            </p>
          )}
          <p className="text-[13px] text-slate-600 mt-1">Ya no usamos tu ubicación.</p>
        </section>
      );
    }
    return null;
  })();

  const errorKey: EstadoError | null = esError ? (vista.estado as EstadoError) : cargaCompleta && !destino ? 'sin-sucursal' : null;
  const bloqueError = errorKey ? (
    <section className="bg-white rounded-[22px] p-[18px] border border-slate-200" role="alert">
      <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-700 border border-amber-200 grid place-items-center mb-2.5">
        {ERRORES[errorKey].icono}
      </div>
      <h2 className="text-[21px] font-extrabold text-[#1a3b5b]">{ERRORES[errorKey].t}</h2>
      <p className="text-slate-600 text-[14.5px] leading-snug mt-1">{errorKey === 'denegado' ? 'Para guiarte necesitamos tu ubicación. Así la activas:' : ERRORES[errorKey].d}</p>
      {errorKey === 'denegado' && (
        <ol className="list-decimal pl-5 mt-3 mb-1 text-slate-700 text-[14.5px] leading-relaxed space-y-0.5">
          <li>Toca el candado junto a la dirección de la página.</li>
          <li>Entra a «Permisos» o «Configuración del sitio».</li>
          <li>En «Ubicación», elige «Permitir».</li>
        </ol>
      )}
      {errorKey === 'sin-sucursal' && (
        <p className="mt-2.5 font-bold text-[#1a3b5b]">{direccion || 'Consulta la dirección en Contacto.'}{horarioTexto && (<><br />{horarioTexto}</>)}</p>
      )}
      <div className="flex flex-col gap-2.5 mt-3.5">
        {ERRORES[errorKey].reintento && (
          <button type="button" className={botonAzul} onClick={iniciar}>
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> {ERRORES[errorKey].reintento}
          </button>
        )}
        {ERRORES[errorKey].maps && botonMaps(botonBorde)}
      </div>
    </section>
  ) : null;

  const lineaTiempo = enCurso && (vista.estado === 'en-ruta' || vista.estado === 'recalculando') ? (
    <ol className="bg-white border border-slate-200 rounded-[22px] overflow-hidden" aria-label="Indicaciones">
      <li className="flex justify-between px-4 pt-3.5 pb-1.5 font-black text-[#1a3b5b]" aria-hidden="true">
        <span>Indicaciones</span>
        <span className="text-slate-600 font-bold">Ruta {modo === 'pie' ? 'a pie' : 'en auto'} · {formatearMetros(vista.ruta.largoTotal)}</span>
      </li>
      {vista.indicaciones.map((p, j) => {
        const k = vista.av.indice;
        const hecho = j < k;
        const actual = j === k;
        return (
          <li
            key={`${j}-${p.inicio}`}
            aria-current={actual ? 'step' : undefined}
            className={`relative grid grid-cols-[36px_1fr_auto] gap-2.5 items-center px-4 py-3 font-bold ${actual ? 'bg-[#e2f0fd] text-slate-800' : hecho ? 'text-slate-500' : 'text-slate-800'}`}
          >
            <span className={`w-9 h-9 rounded-full grid place-items-center border-2 relative z-[1] ${actual ? 'bg-[#1a3b5b] border-[#1a3b5b] text-[#D4AF37]' : hecho ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-300 text-[#1a3b5b]'}`}>
              {hecho ? <Check className="w-[18px] h-[18px]" aria-hidden="true" /> : <IconoGiro giro={p.giro} className="w-[18px] h-[18px]" />}
            </span>
            <span className="min-w-0 break-words">
              {p.texto}
              {actual && <span className="ml-1.5 inline-block whitespace-nowrap align-middle text-[11px] font-black bg-[#D4AF37] text-[#1a3b5b] px-1.5 py-px rounded-full">Vas aquí</span>}
            </span>
            <span className="text-[13px] text-slate-600 whitespace-nowrap">{p.giro === 'llegada' ? '' : formatearMetros(p.distancia)}</span>
          </li>
        );
      })}
    </ol>
  ) : null;

  const puedeTerminar = enCurso || esFlecha;
  const enLlegada = vista.estado === 'llegada';
  const mostrarMapa = !!redUsable;

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-4">
      <main className={`max-w-[1320px] mx-auto px-3 ${enLlegada ? 'flex flex-col' : 'grid grid-cols-1'} gap-3 min-[900px]:grid min-[900px]:grid-cols-[440px_minmax(0,1fr)] min-[900px]:grid-rows-[auto_auto_auto_1fr] min-[900px]:gap-x-5`}>
        <div className="flex items-center gap-2.5 min-w-0 min-[900px]:col-start-1">
          <button
            type="button"
            onClick={volver}
            aria-label={`Volver a ${origenNombre}`}
            className="w-11 h-11 shrink-0 rounded-xl border border-slate-200 bg-white text-[#1a3b5b] grid place-items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <h1 className="font-serif font-black text-[22px] leading-tight text-[#1a3b5b]">Ir a la sucursal</h1>
            <p className="text-[13px] font-semibold text-slate-600 truncate">{nombreSucursal}{direccion ? ` · ${direccion}` : ''}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 min-[900px]:col-start-1">
          {principal}
          {bloqueError}
          {!cargaCompleta && vista.estado === 'inicio' && (
            <div className="bg-white rounded-[22px] p-[18px] border border-slate-200 text-center text-slate-600" role="status">
              <Loader2 className="w-6 h-6 mx-auto animate-spin" aria-hidden="true" /> Cargando…
            </div>
          )}
        </div>

        {mostrarMapa && redUsable && (
          <div className={`${ocultarMapaMovil ? 'hidden min-[900px]:block' : ''} min-[900px]:col-start-2 min-[900px]:row-start-1 min-[900px]:row-span-4 min-[900px]:sticky min-[900px]:top-24 min-[900px]:h-[calc(100vh-7rem)] min-[900px]:self-start`}>
            <MapaRecorrido
              red={redUsable}
              ruta={rutaMapa}
              usuario={usuarioMapa}
              destino={destinoXY}
              descripcion={descripcionMapa}
              className="h-[300px] min-[900px]:h-full"
            />
          </div>
        )}

        <div className="min-[900px]:col-start-1">
          {(enCurso || vista.estado === 'sin-camino') && <SelectorModo modo={modo} onChange={cambiarModo} />}
        </div>

        <div className={`${enLlegada ? 'contents min-[900px]:flex' : 'flex'} flex-col gap-3 min-[900px]:col-start-1`}>
          {lineaTiempo}
          {puedeTerminar && (
            <div className="sticky bottom-0 z-[4] pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] bg-gradient-to-b from-transparent to-[#f0f7ff] to-30% min-[900px]:static min-[900px]:bg-none min-[900px]:pb-10">
              <button type="button" className={botonBorde} onClick={terminar}>Terminar recorrido</button>
            </div>
          )}
          {enLlegada && (
            <div className="sticky bottom-0 z-[4] pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] bg-gradient-to-b from-transparent to-[#f0f7ff] to-30% min-[900px]:static min-[900px]:bg-none min-[900px]:pb-10">
              <button type="button" className={botonOro} onClick={terminar}>
                <Check className="w-5 h-5" aria-hidden="true" /> Terminar recorrido
              </button>
            </div>
          )}
        </div>
      </main>

      <div className="sr-only" aria-live="polite" role="status">{anuncio}</div>
    </div>
  );
}
