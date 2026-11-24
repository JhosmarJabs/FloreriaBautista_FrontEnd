import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CmsService } from '../services/cmsService';
import type { SeccionLegal, SiteSettings } from '../types';
import TextoLegal from './legal/TextoLegal';
import { reemplazarVariables } from '../utils/textoLegal';

const MAX_PREGUNTAS = 4;

export default function FAQ() {
  const [preguntas, setPreguntas] = useState<SeccionLegal[] | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    CmsService.getContenidoLegal()
      .then((docs) => {
        if (!vivo) return;
        setPreguntas(docs.find((d) => d.slug === 'preguntas-frecuentes')?.secciones ?? []);
      })
      .catch(() => { if (vivo) setError(true); });
    CmsService.getSettings().then((s) => { if (vivo) setSettings(s); }).catch(() => { /* respaldos legibles */ });
    return () => { vivo = false; };
  }, []);

  // Sin preguntas (el admin las eliminó) o sin datos y sin red: la sección no se muestra.
  if (error || (preguntas && preguntas.length === 0)) return null;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-12 animate-[fadeSlideUp_0.5s_ease-out_both]">
          Preguntas Frecuentes
        </h2>
        {preguntas === null ? (
          <div role="status" aria-label="Cargando preguntas" className="space-y-4 animate-pulse">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-brand-light rounded-custom" />)}
          </div>
        ) : (
          <>
            <div className="space-y-4 animate-[fadeIn_0.5s_ease-out_0.2s_both]">
              {preguntas.slice(0, MAX_PREGUNTAS).map((p, i) => (
                <details key={i} className="group bg-brand-light p-6 rounded-custom cursor-pointer">
                  <summary className="flex justify-between items-center gap-4 font-bold text-brand-deep list-none">
                    <span className="break-words">{reemplazarVariables(p.titulo, settings)}</span>
                    <span aria-hidden="true" className="group-open:rotate-180 transition-transform shrink-0">↓</span>
                  </summary>
                  <TextoLegal cuerpo={p.cuerpo} settings={settings} className="mt-4" />
                </details>
              ))}
            </div>
            <p className="text-center mt-8">
              <Link to="/preguntas-frecuentes" className="text-brand-deep font-semibold hover:underline">
                Ver todas las preguntas
              </Link>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
