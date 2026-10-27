import { useState, useRef, useCallback, useEffect } from 'react';
import { DatasetStore } from '../services/datasetStore';

export interface DatasetConfig<T> {
  cargarTodo: () => Promise<{ items: T[]; sincronizadoEn: string }>;
  cargarDelta?: (desde: string) => Promise<{ items: T[]; sincronizadoEn: string }>;
  /** `false` = la fila está dada de baja: el delta y los parches la quitan del conjunto. */
  estaActivo?: (item: T) => boolean;
  getId: (item: T) => string;
  /**
   * Nombre del conjunto en el almacén (`datasetStore`). Con `clave`, el conjunto
   * sobrevive a la navegación: al volver a la pantalla se muestra al instante y solo
   * se pide el delta. Sin `clave` vive únicamente en el componente.
   */
  clave?: string;
  /** Con `clave`: además de la memoria, guarda el conjunto en el navegador (sobrevive a F5). */
  persistir?: boolean;
}

export interface DatasetResult<T> {
  datos: T[];
  /** `true` solo mientras no hay datos que mostrar (carga completa inicial o forzada). */
  cargando: boolean;
  /** `true` mientras corre un delta; la tabla no se vacía. */
  sincronizando: boolean;
  error: string | null;
  recargarCompleto: () => Promise<void>;
  sincronizarDelta: () => Promise<void>;
  aplicarParche: (item: T) => void;
  eliminarLocal: (id: string) => void;
}

/** El servidor rechazó la marca `desde` (400): hay que volver a la carga completa. */
function esMarcaInvalida(err: any): boolean {
  return err?.status === 400;
}

export function useDatasetEnMemoria<T>(config: DatasetConfig<T>): DatasetResult<T> {
  const { clave, persistir = false } = config;

  // Con `clave`, el conjunto puede estar ya en el almacén: se arranca con él.
  const guardado = useRef<{ items: T[]; sincronizadoEn: string } | null | undefined>(undefined);
  if (guardado.current === undefined) {
    guardado.current = clave ? DatasetStore.leer<T>(clave, persistir) : null;
  }

  const [datos, setDatos] = useState<T[]>(guardado.current?.items ?? []);
  const [cargando, setCargando] = useState(!guardado.current);
  const [sincronizando, setSincronizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const datosRef = useRef<T[]>(guardado.current?.items ?? []);
  const sincronizadoEnRef = useRef<string | null>(guardado.current?.sincronizadoEn ?? null);
  const cargadoRef = useRef(!!guardado.current);
  const montadoRef = useRef(true);
  const deltaEnCursoRef = useRef(false);
  /** Cada carga completa invalida los deltas que estaban en vuelo. */
  const generacionRef = useRef(0);

  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  /** Deja el conjunto en el estado, en la referencia y (con `clave`) en el almacén. */
  const confirmar = useCallback((items: T[], marca: string | null) => {
    datosRef.current = items;
    if (marca !== null) sincronizadoEnRef.current = marca;
    if (clave && sincronizadoEnRef.current) {
      DatasetStore.guardar(clave, items, sincronizadoEnRef.current, persistir);
    }
    if (montadoRef.current) setDatos(items);
  }, [clave, persistir]);

  const recargarCompleto = useCallback(async () => {
    const generacion = ++generacionRef.current;
    if (montadoRef.current) {
      setCargando(true);
      setError(null);
    }
    try {
      const res = await config.cargarTodo();
      if (generacion !== generacionRef.current) return;
      cargadoRef.current = true;
      confirmar(res.items, res.sincronizadoEn);
    } catch (err: any) {
      if (generacion === generacionRef.current && montadoRef.current) {
        setError(err.message || 'Error al cargar datos');
      }
    } finally {
      if (generacion === generacionRef.current && montadoRef.current) setCargando(false);
    }
  }, [config.cargarTodo, confirmar]);

  const sincronizarDelta = useCallback(async () => {
    if (!sincronizadoEnRef.current || !config.cargarDelta) {
      return recargarCompleto();
    }
    // Un segundo «Actualizar» mientras hay un delta en curso se ignora.
    if (deltaEnCursoRef.current) return;
    deltaEnCursoRef.current = true;
    const generacion = generacionRef.current;
    if (montadoRef.current) {
      setSincronizando(true);
      setError(null);
    }
    try {
      const res = await config.cargarDelta(sincronizadoEnRef.current);
      if (generacion !== generacionRef.current) return;
      const mapa = new Map<string, T>(datosRef.current.map(item => [config.getId(item), item]));
      for (const item of res.items) {
        const id = config.getId(item);
        if (config.estaActivo && !config.estaActivo(item)) mapa.delete(id);
        else mapa.set(id, item);
      }
      confirmar(Array.from(mapa.values()), res.sincronizadoEn);
    } catch (err: any) {
      if (esMarcaInvalida(err)) {
        // La marca guardada ya no es válida: se vuelve a una carga completa.
        deltaEnCursoRef.current = false;
        if (montadoRef.current) setSincronizando(false);
        return recargarCompleto();
      }
      // Cualquier otro fallo conserva la tabla y se avisa.
      if (montadoRef.current) setError(err.message || 'Error al sincronizar');
    } finally {
      deltaEnCursoRef.current = false;
      if (montadoRef.current) setSincronizando(false);
    }
  }, [config.cargarDelta, config.getId, config.estaActivo, confirmar, recargarCompleto]);

  const aplicarParche = useCallback((item: T) => {
    const id = config.getId(item);
    const prev = datosRef.current;
    const idx = prev.findIndex(d => config.getId(d) === id);
    const baja = !!config.estaActivo && !config.estaActivo(item);
    let next: T[];
    if (baja) {
      next = idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
    } else if (idx >= 0) {
      next = [...prev];
      next[idx] = item;
    } else {
      next = [...prev, item];
    }
    confirmar(next, null);
  }, [config.getId, config.estaActivo, confirmar]);

  const eliminarLocal = useCallback((id: string) => {
    confirmar(datosRef.current.filter(d => config.getId(d) !== id), null);
  }, [config.getId, confirmar]);

  useEffect(() => {
    if (!cargadoRef.current) {
      recargarCompleto();
    } else if (guardado.current) {
      // Se abrió con el conjunto del almacén: solo se pide lo que cambió desde entonces.
      guardado.current = null;
      sincronizarDelta();
    }
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { datos, cargando, sincronizando, error, recargarCompleto, sincronizarDelta, aplicarParche, eliminarLocal };
}
