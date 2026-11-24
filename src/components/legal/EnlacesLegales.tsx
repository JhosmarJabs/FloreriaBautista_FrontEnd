import React from 'react';
import { Link } from 'react-router-dom';
import { PAGINAS_LEGALES } from '../../constants/legal';
import type { SlugLegal } from '../../types';

interface Props {
  /** Documento que se está viendo: no se repite en la lista. */
  excluir?: SlugLegal;
}

/** Lista «Otras políticas» al final de cada página legal. */
export default function EnlacesLegales({ excluir }: Props) {
  const enlaces = PAGINAS_LEGALES.filter((p) => p.slug !== excluir);
  return (
    <nav aria-label="Otras políticas" className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 dark:text-slate-400">Otras políticas</h2>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {enlaces.map((p) => (
          <li key={p.slug}>
            <Link to={p.ruta} className="text-brand-deep font-semibold hover:underline dark:text-sky-200">{p.nombreCorto}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
