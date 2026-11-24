import React from 'react';
import type { SlugLegal } from '../../types';
import { TARIFAS_ENVIO } from '../../utils/envio';
import { formatApiDate } from '../../utils/date';
import { valoresVariables } from '../../utils/textoLegal';
import TextoLegal from '../../components/legal/TextoLegal';
import EnlacesLegales from '../../components/legal/EnlacesLegales';
import { useContenidoLegal } from '../../components/legal/useContenidoLegal';
import { ErrorLegal, EsqueletoLegal, SinContenidoLegal } from '../../components/legal/EstadosLegales';

const FECHA_LARGA: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

const precio = (n: number) => (n === 0 ? 'Gratis' : `$${n} MXN`);

const ZONAS_TARIFA: { zona: string; costo: number }[] = [
  { zona: 'San Felipe Orizatlán', costo: TARIFAS_ENVIO.local },
  { zona: 'Resto de Hidalgo', costo: TARIFAS_ENVIO.estatal },
  { zona: 'Estados colindantes', costo: TARIFAS_ENVIO.vecino },
  { zona: 'Resto del país', costo: TARIFAS_ENVIO.nacional },
];

/** Página genérica de un documento legal (privacidad, términos, envíos, cancelaciones). */
export default function PaginaLegalPage({ slug }: { slug: SlugLegal }) {
  const { cargando, error, documentos, settings, reintentar } = useContenidoLegal();
  const doc = documentos.find((d) => d.slug === slug);
  const v = valoresVariables(settings);
  const rfc = (settings?.rfc ?? '').trim();

  return (
    <main className="max-w-3xl mx-auto px-4 pt-28 pb-16 min-h-screen dark:text-slate-300">
      {cargando && <EsqueletoLegal />}
      {!cargando && (error || !doc) && <ErrorLegal onReintentar={reintentar} />}
      {!cargando && !error && doc && (
        <>
          <h1 className="font-serif font-bold text-brand-deep text-3xl md:text-4xl leading-tight dark:text-sky-200">{doc.titulo}</h1>
          <p className="text-sm text-slate-500 mt-2 mb-8 dark:text-slate-400">Última actualización: {formatApiDate(doc.actualizadoEn, FECHA_LARGA)}</p>

          {slug === 'aviso-de-privacidad' && (
            <section aria-labelledby="responsable" className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
              <h2 id="responsable" className="text-lg font-bold text-brand-deep mb-3 dark:text-sky-200">Responsable</h2>
              <dl className="space-y-1 text-gray-700 break-words dark:text-slate-300">
                <div><dt className="inline font-semibold">Razón social: </dt><dd className="inline">{v.razonSocial}</dd></div>
                {rfc && <div><dt className="inline font-semibold">RFC: </dt><dd className="inline">{rfc}</dd></div>}
                <div><dt className="inline font-semibold">Domicilio: </dt><dd className="inline">{v.direccion}</dd></div>
                <div><dt className="inline font-semibold">Teléfono: </dt><dd className="inline">{v.telefono}</dd></div>
                <div><dt className="inline font-semibold">Correo de privacidad: </dt><dd className="inline">{v.correoPrivacidad}</dd></div>
              </dl>
            </section>
          )}

          {slug === 'envios-y-entregas' && (
            <section aria-labelledby="tarifas" className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
              <h2 id="tarifas" className="text-lg font-bold text-brand-deep mb-3 dark:text-sky-200">Tarifas de envío</h2>
              <table className="w-full text-left text-gray-700 dark:text-slate-300">
                <thead className="sr-only"><tr><th>Zona</th><th>Costo</th></tr></thead>
                <tbody>
                  {ZONAS_TARIFA.map((z) => (
                    <tr key={z.zona} className="border-t border-slate-200 first:border-t-0 dark:border-slate-700">
                      <td className="py-2 pr-4">{z.zona}</td>
                      <td className="py-2 text-right font-semibold">{precio(z.costo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm text-slate-500 mt-3 dark:text-slate-400">Si tu código postal no se reconoce, el costo se confirma después.</p>
            </section>
          )}

          {doc.secciones.length === 0 ? (
            <SinContenidoLegal />
          ) : (
            <>
              {doc.secciones.length > 4 && (
                <nav aria-label="Índice" className="mb-8 rounded-xl border border-slate-200 p-5 dark:border-slate-700">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 dark:text-slate-400">Contenido</h2>
                  <ol className="list-decimal pl-5 space-y-1">
                    {doc.secciones.map((s, i) => (
                      <li key={i}><a href={`#seccion-${i + 1}`} className="text-brand-deep hover:underline break-words dark:text-sky-200">{s.titulo}</a></li>
                    ))}
                  </ol>
                </nav>
              )}
              <div className="space-y-8">
                {doc.secciones.map((s, i) => (
                  <section key={i} aria-labelledby={`seccion-${i + 1}`}>
                    <h2 id={`seccion-${i + 1}`} className="text-xl font-bold text-brand-deep mb-3 scroll-mt-28 break-words dark:text-sky-200">{s.titulo}</h2>
                    <TextoLegal cuerpo={s.cuerpo} settings={settings} />
                  </section>
                ))}
              </div>
            </>
          )}

          <EnlacesLegales excluir={slug} />
        </>
      )}
    </main>
  );
}
