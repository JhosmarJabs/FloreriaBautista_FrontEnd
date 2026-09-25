import { useState, useRef, useCallback, useEffect } from 'react';

export interface DatasetConfig<T> {
  cargarTodo: () => Promise<{ items: T[]; sincronizadoEn: string }>;
  cargarDelta?: (desde: string) => Promise<{ items: T[]; sincronizadoEn: string }>;
  estaActivo?: (item: T) => boolean;
  getId: (item: T) => string;
}

export interface DatasetResult<T> {
  datos: T[];
  cargando: boolean;
  error: string | null;
  recargarCompleto: () => Promise<void>;
  sincronizarDelta: () => Promise<void>;
  aplicarParche: (item: T) => void;
  eliminarLocal: (id: string) => void;
}

export function useDatasetEnMemoria<T>(config: DatasetConfig<T>): DatasetResult<T> {
  const [datos, setDatos] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sincronizadoEnRef = useRef<string | null>(null);
  const cargadoRef = useRef(false);

  const recargarCompleto = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await config.cargarTodo();
      setDatos(res.items);
      sincronizadoEnRef.current = res.sincronizadoEn;
      cargadoRef.current = true;
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setCargando(false);
    }
  }, [config.cargarTodo]);

  const sincronizarDelta = useCallback(async () => {
    if (!sincronizadoEnRef.current || !config.cargarDelta) {
      return recargarCompleto();
    }
    setCargando(true);
    setError(null);
    try {
      const res = await config.cargarDelta(sincronizadoEnRef.current);
      if (res.items.length > 0) {
        setDatos(prev => {
          const mapa = new Map(prev.map(item => [config.getId(item), item]));
          for (const item of res.items) {
            mapa.set(config.getId(item), item);
          }
          return Array.from(mapa.values());
        });
      }
      sincronizadoEnRef.current = res.sincronizadoEn;
    } catch (err: any) {
      setError(err.message || 'Error al sincronizar');
    } finally {
      setCargando(false);
    }
  }, [config.cargarDelta, config.getId, recargarCompleto]);

  const aplicarParche = useCallback((item: T) => {
    const id = config.getId(item);
    setDatos(prev => {
      const idx = prev.findIndex(d => config.getId(d) === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [...prev, item];
    });
  }, [config.getId]);

  const eliminarLocal = useCallback((id: string) => {
    setDatos(prev => prev.filter(d => config.getId(d) !== id));
  }, [config.getId]);

  useEffect(() => {
    if (!cargadoRef.current) {
      recargarCompleto();
    }
  }, [recargarCompleto]);

  return { datos, cargando, error, recargarCompleto, sincronizarDelta, aplicarParche, eliminarLocal };
}
