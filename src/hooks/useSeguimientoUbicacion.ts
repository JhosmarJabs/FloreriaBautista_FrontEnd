import { useCallback, useEffect, useRef, useState } from 'react';
import type { Coordenadas } from '../utils/geo';

export type EstadoSeguimiento =
  | 'inactivo'
  | 'buscando'
  | 'ok'
  | 'denegado'
  | 'no-disponible'
  | 'timeout'
  /** Sin API de geolocalización o sin contexto seguro (p. ej. página servida por HTTP). */
  | 'sin-api';

export interface PosicionSeguimiento {
  pos: Coordenadas;
  /** Precisión en metros. */
  precision: number;
  rumboGps: number | null;
  velocidad: number | null;
  /** Se actualiza con cada lectura, aunque las coordenadas no cambien. */
  marca: number;
}

const OPCIONES: PositionOptions = { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 };

/**
 * Seguimiento de la ubicación con `watchPosition`. La posición vive solo en el estado de React:
 * no se guarda en ningún almacenamiento, no va a la consola ni a ninguna URL. Se pide solo al
 * llamar `iniciar()` (una acción del cliente) y se detiene sola al desmontar.
 */
export function useSeguimientoUbicacion() {
  const [estado, setEstado] = useState<EstadoSeguimiento>('inactivo');
  const [lectura, setLectura] = useState<PosicionSeguimiento | null>(null);
  /** `true` si el último TIMEOUT llegó con una posición previa («Buscando señal…»). */
  const [sinSenal, setSinSenal] = useState(false);
  const idRef = useRef<number | null>(null);
  const hayLecturaRef = useRef(false);

  const detener = useCallback(() => {
    if (idRef.current !== null) {
      // Se lee en el momento: el Tester puede sustituir navigator.geolocation en consola.
      navigator.geolocation?.clearWatch?.(idRef.current);
      idRef.current = null;
    }
  }, []);

  const iniciar = useCallback(() => {
    detener();
    hayLecturaRef.current = false;
    setLectura(null);
    setSinSenal(false);
    if (!window.isSecureContext || !('geolocation' in navigator) || !navigator.geolocation) {
      setEstado('sin-api');
      return;
    }
    setEstado('buscando');
    idRef.current = navigator.geolocation.watchPosition(
      (p) => {
        hayLecturaRef.current = true;
        setSinSenal(false);
        setEstado('ok');
        setLectura({
          pos: { latitud: p.coords.latitude, longitud: p.coords.longitude },
          precision: p.coords.accuracy,
          rumboGps: typeof p.coords.heading === 'number' && Number.isFinite(p.coords.heading) ? p.coords.heading : null,
          velocidad: typeof p.coords.speed === 'number' && Number.isFinite(p.coords.speed) ? p.coords.speed : null,
          marca: Date.now(),
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          // Sin reintentos automáticos.
          detener();
          setEstado('denegado');
        } else if (err.code === err.TIMEOUT) {
          if (hayLecturaRef.current) setSinSenal(true); // conserva la última posición
          else setEstado('timeout');
        } else if (hayLecturaRef.current) {
          setSinSenal(true);
        } else {
          setEstado('no-disponible');
        }
      },
      OPCIONES,
    );
  }, [detener]);

  const terminar = useCallback(() => {
    detener();
    setEstado('inactivo');
    setLectura(null);
    setSinSenal(false);
  }, [detener]);

  useEffect(() => detener, [detener]);

  return { estado, lectura, sinSenal, iniciar, detener, terminar };
}
