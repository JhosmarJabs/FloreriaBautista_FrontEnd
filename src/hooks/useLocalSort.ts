import { useMemo, useState, useCallback } from 'react';
import { normalizar, coincideTexto } from '../utils/textSearch';

export type SortOrder = 'asc' | 'desc' | null;

export interface SortConfig {
  field: string;
  order: SortOrder;
}

export interface UseLocalSortConfig<T> {
  datos: T[];
  busqueda?: string;
  camposBusqueda?: (keyof T)[];
  filtros?: ((item: T) => boolean)[];
  pageSize?: number;
}

export interface UseLocalSortResult<T> {
  datosPaginados: T[];
  datosFiltrados: T[];
  totalFiltrados: number;
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  sortConfig: SortConfig;
  toggleSort: (field: string) => void;
  resetSort: () => void;
}

function comparar(a: any, b: any, order: 'asc' | 'desc'): number {
  const va = a ?? '';
  const vb = b ?? '';

  if (typeof va === 'string' && typeof vb === 'string') {
    const cmp = normalizar(va).localeCompare(normalizar(vb), 'es');
    return order === 'asc' ? cmp : -cmp;
  }

  if (typeof va === 'number' && typeof vb === 'number') {
    return order === 'asc' ? va - vb : vb - va;
  }

  if (va instanceof Date && vb instanceof Date) {
    return order === 'asc' ? va.getTime() - vb.getTime() : vb.getTime() - va.getTime();
  }

  const sa = String(va);
  const sb = String(vb);
  const cmp = sa.localeCompare(sb, 'es');
  return order === 'asc' ? cmp : -cmp;
}

export function useLocalSort<T extends Record<string, any>>(
  config: UseLocalSortConfig<T>
): UseLocalSortResult<T> {
  const { datos, busqueda = '', camposBusqueda = [], filtros = [], pageSize = 100 } = config;

  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: '', order: null });
  const [page, setPage] = useState(1);

  const toggleSort = useCallback((field: string) => {
    setSortConfig(prev => {
      if (prev.field !== field) return { field, order: 'asc' };
      if (prev.order === 'asc') return { field, order: 'desc' };
      return { field: '', order: null };
    });
    setPage(1);
  }, []);

  const resetSort = useCallback(() => {
    setSortConfig({ field: '', order: null });
    setPage(1);
  }, []);

  const datosFiltrados = useMemo(() => {
    let resultado = datos;

    if (busqueda.trim()) {
      resultado = resultado.filter(item =>
        camposBusqueda.some(campo => coincideTexto(String(item[campo] ?? ''), busqueda))
      );
    }

    for (const filtro of filtros) {
      resultado = resultado.filter(filtro);
    }

    return resultado;
  }, [datos, busqueda, camposBusqueda, filtros]);

  const datosOrdenados = useMemo(() => {
    if (!sortConfig.field || !sortConfig.order) return datosFiltrados;

    return [...datosFiltrados].sort((a, b) => {
      const va = a[sortConfig.field];
      const vb = b[sortConfig.field];

      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;

      return comparar(va, vb, sortConfig.order!);
    });
  }, [datosFiltrados, sortConfig]);

  const totalFiltrados = datosOrdenados.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltrados / pageSize));

  const datosPaginados = useMemo(() => {
    const inicio = (page - 1) * pageSize;
    return datosOrdenados.slice(inicio, inicio + pageSize);
  }, [datosOrdenados, page, pageSize]);

  return {
    datosPaginados,
    datosFiltrados: datosOrdenados,
    totalFiltrados,
    page,
    setPage,
    totalPages,
    sortConfig,
    toggleSort,
    resetSort,
  };
}
