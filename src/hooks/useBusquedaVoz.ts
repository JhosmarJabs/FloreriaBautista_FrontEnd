import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerEstado } from '../services/estadoConexion';

export type EstadoVoz =
  | 'reposo'
  | 'escuchando'
  | 'procesando'
  | 'ok'
  | 'sin-voz'
  | 'sin-microfono'
  | 'denegado'
  | 'requiere-internet'
  | 'error-red'
  | 'error';

interface Opciones {
  /**
   * Elige, entre las alternativas del reconocimiento (la más probable primero), la que se usará.
   * Se usa para preferir la primera que produzca resultados en el catálogo.
   */
  elegir?: (alternativas: string[]) => string;
  /** Texto parcial mientras se habla (se refleja en la caja de búsqueda). */
  alParcial?: (texto: string) => void;
  /** Texto final dictado (tal cual se dijo). */
  alTexto?: (texto: string) => void;
}

interface Capacidad {
  /** Idioma con reconocimiento en el dispositivo disponible, o null. */
  local: string | null;
  /** Idioma descargable para usarlo en el dispositivo, o null. */
  instalable: string | null;
}

const IDIOMAS = ['es-MX', 'es-US', 'es-ES'];
const LIMITE_ESCUCHA_MS = 10_000;
const IDIOMA_NUBE = 'es-MX';

/** Se lee en el momento: el navegador (o una prueba) puede definirlo después de cargar la página. */
function obtenerConstructor(): ReconocimientoVozConstructor | null {
  if (typeof window === 'undefined' || !window.isSecureContext) return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

async function detectarCapacidad(Ctor: ReconocimientoVozConstructor): Promise<Capacidad> {
  const sin: Capacidad = { local: null, instalable: null };
  if (typeof Ctor.available !== 'function') return sin;
  let instalable: string | null = null;
  for (const lang of IDIOMAS) {
    try {
      const r = await Ctor.available({ langs: [lang], processLocally: true });
      if (r === 'available') return { local: lang, instalable: null };
      if (r === 'downloadable' && !instalable) instalable = lang;
    } catch {
      /* sin capacidad local en este idioma: nunca rompe la búsqueda */
    }
  }
  return { local: null, instalable };
}

/**
 * Búsqueda por voz con la Web Speech API y degradación por capacidades (no por navegador).
 * - Con reconocimiento en el dispositivo disponible para español, funciona sin Internet.
 * - Si no, necesita Internet (el audio lo procesa el servicio del navegador) y lo avisa.
 * El texto dictado solo se usa para filtrar en el navegador: no va al backend ni se guarda.
 */
export function useBusquedaVoz(opciones: Opciones = {}) {
  const [estado, setEstado] = useState<EstadoVoz>('reposo');
  const [parcial, setParcial] = useState('');
  const [texto, setTexto] = useState('');
  const [capacidad, setCapacidad] = useState<Capacidad>({ local: null, instalable: null });
  const [instalando, setInstalando] = useState(false);
  const [, forzar] = useState(0);

  const opcionesRef = useRef(opciones);
  opcionesRef.current = opciones;
  const recRef = useRef<ReconocimientoVoz | null>(null);
  const estadoRef = useRef<EstadoVoz>('reposo');
  const parcialRef = useRef('');
  const finalizadoRef = useRef(false);
  const temporizadorRef = useRef<number | null>(null);
  const soloNubeRef = useRef(false);
  const modoLocalRef = useRef(false);
  const [modoLocal, setModoLocal] = useState(false);

  const ponerEstado = useCallback((e: EstadoVoz) => {
    estadoRef.current = e;
    setEstado(e);
  }, []);

  const soportada = obtenerConstructor() !== null;

  // Capacidad en el dispositivo (para «Usar la voz también sin Internet»). Errores = sin capacidad.
  useEffect(() => {
    const Ctor = obtenerConstructor();
    if (!Ctor) {
      // Una prueba puede instalar el reconocimiento con la página ya cargada: se reevalúa al volver al foco.
      const reevaluar = () => forzar((n) => n + 1);
      window.addEventListener('focus', reevaluar);
      document.addEventListener('visibilitychange', reevaluar);
      return () => {
        window.removeEventListener('focus', reevaluar);
        document.removeEventListener('visibilitychange', reevaluar);
      };
    }
    let vivo = true;
    void detectarCapacidad(Ctor).then((c) => vivo && setCapacidad(c));
    return () => {
      vivo = false;
    };
  }, [soportada]);

  const limpiarTemporizador = () => {
    if (temporizadorRef.current !== null) {
      window.clearTimeout(temporizadorRef.current);
      temporizadorRef.current = null;
    }
  };

  const cerrarRec = useCallback(() => {
    limpiarTemporizador();
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onstart = null;
      try { rec.abort(); } catch { /* ya terminado */ }
    }
  }, []);

  const finalizar = useCallback(
    (dicho: string) => {
      if (finalizadoRef.current) return;
      finalizadoRef.current = true;
      limpiarTemporizador();
      const t = dicho.trim();
      if (!t) {
        ponerEstado('sin-voz');
        return;
      }
      ponerEstado('procesando');
      setTexto(t);
      opcionesRef.current.alTexto?.(t);
      ponerEstado('ok');
    },
    [ponerEstado],
  );

  const iniciar = useCallback(() => {
    const Ctor = obtenerConstructor();
    if (!Ctor) return;
    cerrarRec();
    finalizadoRef.current = false;
    parcialRef.current = '';
    setParcial('');
    setTexto('');

    const sinRed = !navigator.onLine || obtenerEstado().sinConexion;
    const local = !soloNubeRef.current ? capacidad.local : null;
    // Sin red y sin reconocimiento en el dispositivo: no se inicia (nunca una escucha que fallará).
    if (sinRed && !local) {
      modoLocalRef.current = false;
      setModoLocal(false);
      ponerEstado('requiere-internet');
      return;
    }

    let rec: ReconocimientoVoz;
    try {
      rec = new Ctor();
    } catch {
      ponerEstado('error');
      return;
    }
    modoLocalRef.current = !!local;
    setModoLocal(!!local);
    rec.lang = local ?? IDIOMA_NUBE;
    if (local) rec.processLocally = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.continuous = false;

    rec.onresult = (e) => {
      let dicho = '';
      for (let i = 0; i < e.results.length; i++) dicho += e.results[i][0]?.transcript ?? '';
      parcialRef.current = dicho;
      setParcial(dicho);
      opcionesRef.current.alParcial?.(dicho);
      const ultimo = e.results[e.results.length - 1];
      if (ultimo?.isFinal) {
        // Entre las alternativas del resultado final, la primera que produzca resultados en el catálogo.
        const alternativas: string[] = [];
        for (let k = 0; k < ultimo.length; k++) {
          const a = ultimo[k]?.transcript;
          if (a) alternativas.push(a.trim());
        }
        const principal = alternativas[0] ?? dicho;
        const elegir = opcionesRef.current.elegir;
        let elegida = principal;
        if (elegir && alternativas.length > 1) elegida = elegir(alternativas) || principal;
        // El resto de resultados finales previos (frases largas) se conservan delante.
        const previos: string[] = [];
        for (let i = 0; i < e.results.length - 1; i++) previos.push(e.results[i][0]?.transcript ?? '');
        finalizar(`${previos.join(' ')} ${elegida}`.trim());
      }
    };
    rec.onerror = (e) => {
      limpiarTemporizador();
      finalizadoRef.current = true;
      switch (e.error) {
        case 'not-allowed':
        case 'service-not-allowed': ponerEstado('denegado'); break;
        case 'audio-capture': ponerEstado('sin-microfono'); break;
        case 'no-speech': ponerEstado('sin-voz'); break;
        case 'network': ponerEstado('error-red'); break;
        case 'aborted': ponerEstado('reposo'); break;
        case 'language-not-supported':
          soloNubeRef.current = true; // en adelante solo nube
          ponerEstado('error');
          break;
        default: ponerEstado('error');
      }
    };
    rec.onend = () => {
      limpiarTemporizador();
      // Terminó sin resultado final: si hubo texto parcial se usa; si no, «no te escuchamos».
      if (estadoRef.current === 'escuchando' && !finalizadoRef.current) {
        if (parcialRef.current.trim()) finalizar(parcialRef.current);
        else {
          finalizadoRef.current = true;
          ponerEstado('sin-voz');
        }
      }
    };

    recRef.current = rec;
    ponerEstado('escuchando');
    try {
      rec.start();
    } catch {
      cerrarRec();
      ponerEstado('error');
      return;
    }
    // Tiempo máximo de escucha: 10 s.
    temporizadorRef.current = window.setTimeout(() => {
      try { recRef.current?.stop(); } catch { /* ya terminado */ }
    }, LIMITE_ESCUCHA_MS);
  }, [capacidad.local, cerrarRec, finalizar, ponerEstado]);

  /** Detiene la escucha. Con texto parcial se usa lo dicho; sin él, vuelve a reposo. */
  const detener = useCallback(() => {
    if (estadoRef.current !== 'escuchando') return;
    if (parcialRef.current.trim()) {
      const dicho = parcialRef.current;
      cerrarRec();
      finalizar(dicho);
    } else {
      finalizadoRef.current = true;
      cerrarRec();
      ponerEstado('reposo');
    }
  }, [cerrarRec, finalizar, ponerEstado]);

  /** Vuelve a reposo (cierra el panel). */
  const reiniciar = useCallback(() => {
    finalizadoRef.current = true;
    cerrarRec();
    ponerEstado('reposo');
    setParcial('');
  }, [cerrarRec, ponerEstado]);

  /** Descarga el reconocimiento en español para usarlo sin Internet. Solo desde un toque y con red. */
  const instalar = useCallback(async () => {
    const Ctor = obtenerConstructor();
    const lang = capacidad.instalable;
    if (!Ctor || !lang || typeof Ctor.install !== 'function') return;
    setInstalando(true);
    try {
      await Ctor.install({ langs: [lang], processLocally: true });
    } catch {
      /* mensaje breve y sigue en modo nube */
    }
    try {
      setCapacidad(await detectarCapacidad(Ctor));
    } finally {
      setInstalando(false);
    }
  }, [capacidad.instalable]);

  // Limpia al desmontar o al cambiar de ruta.
  useEffect(() => cerrarRec, [cerrarRec]);

  return {
    soportada,
    estado,
    parcial,
    texto,
    /** `true` si la escucha en curso (o la última) se procesa en el dispositivo. */
    modoLocal,
    /** Hay reconocimiento en el dispositivo disponible para español. */
    localDisponible: capacidad.local !== null,
    /** El navegador puede descargar el reconocimiento en español. */
    instalable: capacidad.instalable !== null && capacidad.local === null,
    instalando,
    iniciar,
    detener,
    reiniciar,
    instalar,
  };
}

export type BusquedaVoz = ReturnType<typeof useBusquedaVoz>;
