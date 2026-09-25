import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, ArrowRight, Sparkles, Star, Loader2, Clock, Gift, Heart } from 'lucide-react';
import { AdminService } from '../../services/adminService';
import type { TemporadaProxima } from '../../types';

const socialEvents = [
  {
    id: 'bodas',
    title: 'Bodas & Grandes Galas',
    description: 'Diseño de concepto floral integral para eventos que buscan la excelencia y el lujo. Ramos de novia, centros de mesa y decoración completa.',
    icon: Heart,
    features: ['Consultoría personalizada', 'Diseño de concepto integral', 'Montaje y desmontaje'],
  },
  {
    id: 'corporativos',
    title: 'Eventos Corporativos',
    description: 'Arreglos florales para oficinas, inauguraciones, conferencias y celebraciones empresariales con diseño profesional.',
    icon: Star,
    features: ['Entrega puntual garantizada', 'Facturación empresarial', 'Diseño personalizado'],
  },
  {
    id: 'funerarios',
    title: 'Arreglos Conmemorativos',
    description: 'Coronas, cruces y arreglos florales para momentos de recuerdo. Envío a iglesias, funerarias y cementerios.',
    icon: Sparkles,
    features: ['Entrega a domicilio o funeraria', 'Disponibilidad urgente', 'Tarjeta de condolencias'],
  },
];

export default function EventsPage() {
  const [temporadas, setTemporadas] = useState<TemporadaProxima[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await AdminService.getTemporadasProximas();
        setTemporadas(data);
      } catch {
        setTemporadas([]);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const enCurso = temporadas.filter(t => t.enCurso);
  const proximas = temporadas.filter(t => !t.enCurso);

  return (
    <div className="bg-[#f0f7ff] min-h-screen pt-24 pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
        {/* Header */}
        <header className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-slate-900"
          >
            Eventos & Fechas Especiales
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 leading-relaxed italic"
          >
            "Hay momentos que merecen ser recordados para siempre. En Florería Bautista, diseñamos la atmósfera perfecta para cada celebración."
          </motion.p>
          <div className="w-24 h-1 bg-[#1e3a8a] mx-auto mt-8" />
        </header>

        {/* Temporadas en curso */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-brand-deep animate-spin" />
          </div>
        ) : (
          <>
            {enCurso.length > 0 && (
              <section>
                <div className="mb-8">
                  <h2 className="text-3xl font-serif font-bold text-slate-900">Temporadas en Curso</h2>
                  <p className="text-slate-500 mt-1">Aprovecha nuestros catálogos de temporada disponibles ahora.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {enCurso.map(t => (
                    <motion.article
                      key={t.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-3xl overflow-hidden shadow-2xl group"
                    >
                      <div className="aspect-[16/9] w-full bg-gradient-to-br from-brand-deep to-[#1e3a8a]">
                        {t.imagenUrl && (
                          <img
                            alt={t.nombre}
                            className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-700"
                            src={t.imagenUrl}
                          />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center p-8 md:p-12">
                        <div className="text-white space-y-4">
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/40 bg-white/10 backdrop-blur-md rounded-full text-sm font-bold tracking-wider uppercase">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            En Curso
                          </span>
                          <h3 className="text-3xl md:text-4xl font-serif font-bold">{t.nombre}</h3>
                          {t.descripcion && <p className="text-white/80 max-w-md">{t.descripcion}</p>}
                          <p className="text-sm text-white/60 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Hasta {new Date(t.proximoFin + 'T00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </section>
            )}

            {/* Próximas temporadas */}
            {proximas.length > 0 && (
              <section>
                <div className="mb-8">
                  <h2 className="text-3xl font-serif font-bold text-slate-900">Próximas Temporadas</h2>
                  <p className="text-slate-500 mt-1">Prepárate para las fechas especiales que se acercan.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {proximas.map(t => (
                    <motion.article
                      key={t.id}
                      whileHover={{ y: -8 }}
                      className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                        {t.imagenUrl ? (
                          <img alt={t.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={t.imagenUrl} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-deep/5 to-brand-coral/5">
                            <Calendar className="w-16 h-16 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                          <span className="text-brand-deep flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {t.diasParaInicio === 1 ? 'Mañana' : `En ${t.diasParaInicio} días`}
                          </span>
                          <span className="bg-slate-100 px-2 py-1 rounded text-slate-500">
                            {new Date(t.proximoInicio + 'T00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <h3 className="text-xl font-serif font-bold text-slate-900 group-hover:text-brand-deep transition-colors">{t.nombre}</h3>
                        {t.descripcion && <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">{t.descripcion}</p>}
                        <p className="text-xs text-slate-400">
                          {new Date(t.proximoInicio + 'T00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} — {new Date(t.proximoFin + 'T00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </section>
            )}

            {temporadas.length === 0 && (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No hay temporadas próximas por ahora. ¡Vuelve pronto!</p>
              </div>
            )}
          </>
        )}

        {/* Eventos sociales (CMS estático) */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-slate-900">Servicios para Eventos</h2>
            <p className="text-slate-500 mt-2">Florería Bautista te acompaña en cada momento especial de tu vida.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {socialEvents.map(ev => (
              <motion.article
                key={ev.id}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all space-y-5"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-deep/5 flex items-center justify-center">
                  <ev.icon className="w-7 h-7 text-brand-deep" />
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900">{ev.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{ev.description}</p>
                <ul className="space-y-2">
                  {ev.features.map(f => (
                    <li key={f} className="flex items-center text-sm text-slate-700">
                      <Star className="w-3.5 h-3.5 text-brand-coral mr-2 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 border-2 border-brand-deep text-brand-deep font-bold rounded-xl hover:bg-brand-deep hover:text-white transition-colors">
                  Consultar
                </button>
              </motion.article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
