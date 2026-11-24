import React from 'react';
import { Link } from 'react-router-dom';
import RequiereConexion from '../RequiereConexion';
import { useEstadoConexion } from '../../hooks/useEstadoConexion';

/** Esqueleto mientras carga (no pantalla en blanco). */
export function EsqueletoLegal() {
  return (
    <div role="status" aria-label="Cargando" className="animate-pulse space-y-4">
      <div className="h-9 w-2/3 bg-slate-200 rounded dark:bg-slate-700" />
      <div className="h-4 w-1/3 bg-slate-200 rounded dark:bg-slate-700" />
      <div className="h-6 w-1/2 bg-slate-200 rounded mt-8 dark:bg-slate-700" />
      <div className="h-4 w-full bg-slate-200 rounded dark:bg-slate-700" />
      <div className="h-4 w-full bg-slate-200 rounded dark:bg-slate-700" />
      <div className="h-4 w-5/6 bg-slate-200 rounded dark:bg-slate-700" />
    </div>
  );
}

/** Error de carga: sin conexión usa el aviso existente; si no, mensaje + «Reintentar». */
export function ErrorLegal({ onReintentar }: { onReintentar: () => void }) {
  const { sinConexion } = useEstadoConexion();
  if (sinConexion || !navigator.onLine) {
    return <RequiereConexion texto="Esta página necesita Internet. Sin conexión solo puedes ver las páginas que ya habías visitado." />;
  }
  return (
    <div role="alert" className="py-16 text-center">
      <p className="text-slate-700 text-lg mb-4 dark:text-slate-300">No pudimos cargar esta página.</p>
      <button
        type="button"
        onClick={onReintentar}
        className="px-6 py-3 bg-brand-deep text-white font-bold rounded-xl hover:bg-brand-deep/90 transition-colors dark:bg-sky-800"
      >
        Reintentar
      </button>
    </div>
  );
}

/** Documento sin secciones (el admin las eliminó todas). */
export function SinContenidoLegal() {
  return (
    <div className="py-10 text-slate-700 dark:text-slate-300">
      <p className="mb-3">Esta información estará disponible pronto.</p>
      <Link to="/contacto" className="text-brand-deep font-semibold hover:underline dark:text-sky-200">Ir a Contacto</Link>
    </div>
  );
}
