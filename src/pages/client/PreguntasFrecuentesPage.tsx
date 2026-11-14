import React from 'react';
import { Link } from 'react-router-dom';
import { formatApiDate } from '../../utils/date';
import TextoLegal from '../../components/legal/TextoLegal';
import EnlacesLegales from '../../components/legal/EnlacesLegales';
import { reemplazarVariables } from '../../utils/textoLegal';
import { useContenidoLegal } from '../../components/legal/useContenidoLegal';
import { ErrorLegal, EsqueletoLegal, SinContenidoLegal } from '../../components/legal/EstadosLegales';

/** Preguntas frecuentes: cada sección del documento es una pregunta (título) con su respuesta (cuerpo). */
export default function PreguntasFrecuentesPage() {
  const { cargando, error, documentos, settings, reintentar } = useContenidoLegal();
  const doc = documentos.find((d) => d.slug === 'preguntas-frecuentes');

  return (
    <main className="max-w-3xl mx-auto px-4 pt-28 pb-16 min-h-screen dark:text-slate-300">
      {cargando && <EsqueletoLegal />}
      {!cargando && (error || !doc) && <ErrorLegal onReintentar={reintentar} />}
      {!cargando && !error && doc && (
        <>
          <h1 className="font-serif font-bold text-brand-deep text-3xl md:text-4xl leading-tight dark:text-sky-200">{doc.titulo}</h1>
          <p className="text-sm text-slate-500 mt-2 mb-8 dark:text-slate-400">
            Última actualización: {formatApiDate(doc.actualizadoEn, { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          {doc.secciones.length === 0 ? (
            <SinContenidoLegal />
          ) : (
            <div className="space-y-4">
              {doc.secciones.map((s, i) => (
                <details key={i} className="group bg-brand-light p-5 rounded-custom dark:bg-slate-800">
                  <summary className="flex justify-between items-center gap-4 font-bold text-brand-deep cursor-pointer list-none dark:text-sky-200">
                    <span className="break-words">{reemplazarVariables(s.titulo, settings)}</span>
                    <span aria-hidden="true" className="group-open:rotate-180 transition-transform shrink-0">↓</span>
                  </summary>
                  <TextoLegal cuerpo={s.cuerpo} settings={settings} className="mt-4" />
                </details>
              ))}
            </div>
          )}

          <p className="mt-10 text-slate-700 dark:text-slate-300">
            ¿No encontraste tu respuesta?{' '}
            <Link to="/contacto" className="text-brand-deep font-semibold hover:underline dark:text-sky-200">Escríbenos desde Contacto</Link>.
          </p>
          <EnlacesLegales excluir="preguntas-frecuentes" />
        </>
      )}
    </main>
  );
}
