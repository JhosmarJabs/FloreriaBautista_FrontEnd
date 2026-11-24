import React from 'react';
import type { SiteSettings } from '../../types';
import { dividirEnBloques, reemplazarVariables } from '../../utils/textoLegal';

interface Props {
  cuerpo: string;
  settings?: Partial<SiteSettings> | null;
  className?: string;
}

/**
 * Renderiza un cuerpo legal (párrafos y viñetas) como texto de React: sin HTML ni
 * dangerouslySetInnerHTML, así que cualquier «<b>» del contenido se muestra literal.
 */
export default function TextoLegal({ cuerpo, settings, className = '' }: Props) {
  const bloques = dividirEnBloques(reemplazarVariables(cuerpo, settings));
  return (
    <div className={`space-y-3 ${className}`}>
      {bloques.map((b, i) =>
        b.tipo === 'lista' ? (
          <ul key={i} className="list-disc pl-6 space-y-1.5 text-gray-700 leading-relaxed break-words dark:text-slate-300">
            {b.items.map((it, j) => <li key={j}>{it}</li>)}
          </ul>
        ) : (
          <p key={i} className="text-gray-700 leading-relaxed whitespace-pre-line break-words dark:text-slate-300">{b.texto}</p>
        ),
      )}
    </div>
  );
}
