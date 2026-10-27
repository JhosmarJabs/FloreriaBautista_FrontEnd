import { useMemo, useState, useCallback, useEffect } from 'react';
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

// Constantes de módulo: los valores por defecto no deben cambiar de identidad en cada render
// (el reinicio de página depende de la identidad de `filtros`).
const SIN_CAMPOS: never[] = [];
const SIN_FILTROS: never[] = [];

export function useLocalSort<T extends Record<string, any>>(
  config: UseLocalSortConfig<T>
): UseLocalSortResult<T> {
  const { datos, busqueda = '', camposBusqueda = SIN_CAMPOS, filtros = SIN_FILTROS, pageSize = 100 } = config;

  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: '', order: null });
  const [page, setPage] = useState(1);

  // Al cambiar la búsqueda o los filtros locales la vista vuelve a la página 1.
  // No depende de `datos`: un parche sobre una fila no debe saltar de página.
  useEffect(() => { setPage(1); }, [busqueda, filtros]);

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

  // Nunca se muestra una página fuera de rango (p. ej. filtro de servidor que reduce los datos).
  const paginaEfectiva = Math.min(Math.max(1, page), totalPages);

  const datosPaginados = useMemo(() => {
    const inicio = (paginaEfectiva - 1) * pageSize;
    return datosOrdenados.slice(inicio, inicio + pageSize);
  }, [datosOrdenados, paginaEfectiva, pageSize]);

  return {
    datosPaginados,
    datosFiltrados: datosOrdenados,
    totalFiltrados,
    page: paginaEfectiva,
    setPage,
    totalPages,
    sortConfig,
    toggleSort,
    resetSort,
  };
}
