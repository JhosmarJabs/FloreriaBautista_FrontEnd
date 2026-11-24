import { useCallback, useEffect, useRef, useState } from 'react';

type EventoOrientacion = DeviceOrientationEvent & { webkitCompassHeading?: number };
type ConPermiso = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

const MUESTRAS = 5;
const INTERVALO_MIN_MS = 100; // ~10 actualizaciones por segundo
const ESPERA_SIN_BRUJULA_MS = 2000;

function promedioCircular(grados: number[]): number {
  let s = 0;
  let c = 0;
  for (const g of grados) {
    s += Math.sin((g * Math.PI) / 180);
    c += Math.cos((g * Math.PI) / 180);
  }
  return ((Math.atan2(s, c) * 180) / Math.PI + 360) % 360;
}

/**
 * Brújula del dispositivo. Android Chrome: `deviceorientationabsolute`. iOS Safari: pide permiso
 * dentro de un toque (`activar()`) y usa `webkitCompassHeading`. Las computadoras no la tienen:
 * sin eventos en 2 s, `sinBrujula = true`.
 */
export function useBrujula() {
  const [rumbo, setRumbo] = useState<number | null>(null);
  const [activa, setActiva] = useState(false);
  const [sinBrujula, setSinBrujula] = useState(false);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const muestras = useRef<number[]>([]);
  const ultimo = useRef(0);
  const quitar = useRef<(() => void) | null>(null);
  const temporizador = useRef<number | null>(null);

  const necesitaPermiso =
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as ConPermiso).requestPermission === 'function';

  const desactivar = useCallback(() => {
    quitar.current?.();
    quitar.current = null;
    if (temporizador.current !== null) {
      window.clearTimeout(temporizador.current);
      temporizador.current = null;
    }
    setActiva(false);
  }, []);

  const escuchar = useCallback(() => {
    if (quitar.current) return;
    muestras.current = [];
    setSinBrujula(false);

    const manejar = (e: Event) => {
      const ev = e as EventoOrientacion;
      let grados: number | null = null;
      if (typeof ev.webkitCompassHeading === 'number') {
        grados = ev.webkitCompassHeading;
      } else if (typeof ev.alpha === 'number' && (e.type === 'deviceorientationabsolute' || ev.absolute === true)) {
        const angulo = typeof screen !== 'undefined' && screen.orientation ? screen.orientation.angle : 0;
        grados = (360 - ev.alpha + angulo + 720) % 360;
      }
      // Lecturas nulas o absurdas no se usan.
      if (grados === null || !Number.isFinite(grados)) return;
      if (temporizador.current !== null) {
        window.clearTimeout(temporizador.current);
        temporizador.current = null;
      }
      const ahora = performance.now();
      muestras.current.push(grados);
      if (muestras.current.length > MUESTRAS) muestras.current.shift();
      if (ahora - ultimo.current < INTERVALO_MIN_MS) return;
      ultimo.current = ahora;
      setRumbo(promedioCircular(muestras.current));
    };

    // Android entrega el evento absoluto; iOS entrega `deviceorientation` con `webkitCompassHeading`.
    window.addEventListener('deviceorientationabsolute', manejar);
    window.addEventListener('deviceorientation', manejar);
    quitar.current = () => {
      window.removeEventListener('deviceorientationabsolute', manejar);
      window.removeEventListener('deviceorientation', manejar);
    };
    setActiva(true);
    // Sin eventos en 2 s: computadora o teléfono sin magnetómetro.
    temporizador.current = window.setTimeout(() => {
      temporizador.current = null;
      setSinBrujula(true);
    }, ESPERA_SIN_BRUJULA_MS);
  }, []);

  /** En iOS debe llamarse desde un toque del cliente. En los demás, empieza a escuchar sin permiso. */
  const activar = useCallback(async () => {
    setPermisoDenegado(false);
    const ctor = typeof DeviceOrientationEvent !== 'undefined' ? (DeviceOrientationEvent as ConPermiso) : null;
    if (ctor?.requestPermission) {
      try {
        const r = await ctor.requestPermission();
        if (r !== 'granted') {
          setPermisoDenegado(true);
          return;
        }
      } catch {
        setPermisoDenegado(true);
        return;
      }
    }
    escuchar();
  }, [escuchar]);

  useEffect(() => desactivar, [desactivar]);

  return { rumbo, activa, sinBrujula, necesitaPermiso, permisoDenegado, activar, desactivar };
}
