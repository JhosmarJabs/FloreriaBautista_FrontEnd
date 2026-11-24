import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { rutaInicialPorRol } from '../../utils/auth';

/** 404 de las rutas públicas. Las rutas comodín de /admin y /empleado siguen redirigiendo al panel. */
export default function NotFoundPage() {
  const { roles, cargando } = useAuth();
  if (cargando) return null;
  return (
    <main className="max-w-3xl mx-auto px-4 pt-32 pb-16 min-h-[70vh] text-center dark:text-slate-300">
      <p className="text-6xl font-serif font-bold text-[#D4AF37] mb-4" aria-hidden="true">404</p>
      <h1 className="font-serif font-bold text-brand-deep text-3xl md:text-4xl mb-3 dark:text-sky-200">No encontramos esta página</h1>
      <p className="text-slate-600 mb-8 dark:text-slate-400">Puede que el enlace esté mal escrito o que la página ya no exista.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to={rutaInicialPorRol(roles)} className="px-6 py-3 bg-brand-deep text-white font-bold rounded-xl hover:bg-brand-deep/90 transition-colors dark:bg-sky-800">
          Ir al inicio
        </Link>
        <Link to="/catalogo" className="px-6 py-3 border border-brand-deep text-brand-deep font-bold rounded-xl hover:bg-brand-deep/5 transition-colors dark:border-sky-200 dark:text-sky-200">
          Ver catálogo
        </Link>
      </div>
    </main>
  );
}
