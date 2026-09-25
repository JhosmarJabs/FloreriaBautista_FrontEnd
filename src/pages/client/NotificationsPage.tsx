import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Bell, Truck, CheckCircle, CreditCard, ChevronRight, Inbox, Trash2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FadeIn, StaggerContainer, GlassCard, AnimatedButton } from '../../components/Animations';
import { useNotifications } from '../../hooks/useNotifications';
import { parseApiDate } from '../../utils/date';
import { NotificationDto } from '../../services/notificationsService';

const ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  PEDIDO_ENTREGADO:   { icon: Truck,       color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  PAGO_REGISTRADO:    { icon: CreditCard,  color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
  SOLICITUD_DECIDIDA: { icon: CheckCircle, color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' },
};

const DEFAULT_ICON = { icon: Bell, color: 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500' };

function agruparPorFecha(items: NotificationDto[]): { label: string; items: NotificationDto[] }[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);

  const grupos: Record<string, NotificationDto[]> = {};
  for (const n of items) {
    const fecha = parseApiDate(n.creadaEn);
    if (!fecha) continue;
    const d = new Date(fecha);
    d.setHours(0, 0, 0, 0);

    let label: string;
    if (d.getTime() === hoy.getTime()) label = 'Hoy';
    else if (d.getTime() === ayer.getTime()) label = 'Ayer';
    else label = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

    (grupos[label] ??= []).push(n);
  }

  return Object.entries(grupos).map(([label, items]) => ({ label, items }));
}

function resolverRuta(n: NotificationDto): string | null {
  if (!n.entidadTipo || !n.entidadId) return null;
  if (n.entidadTipo === 'Order') return `/mis-pedidos`;
  return null;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notificaciones, noLeidas, cargando,
    totalPaginas, pagina, setPagina,
    marcarLeida, marcarTodasLeidas, eliminar,
  } = useNotifications();

  const [onlyUnread, setOnlyUnread] = React.useState(false);

  const filtered = useMemo(
    () => onlyUnread ? notificaciones.filter(n => !n.leida) : notificaciones,
    [notificaciones, onlyUnread],
  );

  const grupos = useMemo(() => agruparPorFecha(filtered), [filtered]);

  const handleClick = async (n: NotificationDto) => {
    if (!n.leida) await marcarLeida(n.id);
    const ruta = resolverRuta(n);
    if (ruta) navigate(ruta);
  };

  if (cargando) {
    return (
      <div className="bg-[#f8fafc] dark:bg-slate-900 min-h-screen pt-28 pb-20 transition-colors">
        <main className="max-w-4xl mx-auto px-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white/60 dark:bg-slate-800/40 rounded-[2rem] animate-pulse" />
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] dark:bg-slate-900 min-h-screen pt-28 pb-20 transition-colors">
      <main className="max-w-4xl mx-auto px-6">
        <FadeIn>
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-[#1e3a5f] dark:bg-blue-600 text-[#eab308] dark:text-blue-100 rounded-2xl shadow-xl shadow-blue-900/10">
                  <Bell className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tight leading-none">
                    Notificaciones <span className="text-[#eab308] italic">FB</span>
                  </h1>
                  {noLeidas > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{noLeidas} sin leer</p>
                  )}
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium italic">"Mantente al tanto de cada pétalo y cada proceso."</p>
            </div>

            <div className="flex items-center gap-5">
              {noLeidas > 0 && (
                <button
                  onClick={marcarTodasLeidas}
                  className="text-[10px] font-black uppercase tracking-widest text-[#1e3a5f] dark:text-blue-400 hover:text-[#eab308] transition-colors flex items-center gap-2 border-b-2 border-transparent hover:border-[#eab308] pb-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Limpiar Bitácora
                </button>
              )}

              <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>

              <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-800/40 backdrop-blur-md p-2 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">No leídas</span>
                <button
                  onClick={() => setOnlyUnread(!onlyUnread)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-500 ${onlyUnread ? 'bg-[#1e3a5f] dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <motion.div
                    animate={{ x: onlyUnread ? 26 : 2 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-white dark:bg-slate-200 rounded-full shadow-lg"
                  />
                </button>
              </div>
            </div>
          </header>
        </FadeIn>

        <div className="space-y-12">
          {filtered.length > 0 ? (
            <>
              {grupos.map(grupo => (
                <section key={grupo.label}>
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className={`text-[10px] font-black uppercase tracking-[0.3em] px-5 py-2 rounded-full ${
                      grupo.label === 'Hoy' ? 'text-[#1e3a5f] bg-[#eab308] shadow-lg shadow-amber-500/20' : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
                    }`}>
                      {grupo.label}
                    </h2>
                    <div className="flex-grow h-px bg-slate-100 dark:bg-slate-800"></div>
                  </div>

                  <StaggerContainer className="space-y-4">
                    {grupo.items.map(n => {
                      const { icon: Icon, color } = ICON_MAP[n.tipo] ?? DEFAULT_ICON;
                      return (
                        <GlassCard
                          key={n.id}
                          className={`p-6 group relative overflow-hidden transition-all duration-500 rounded-[2rem] border cursor-pointer ${
                            n.leida ? 'opacity-70 dark:opacity-50 grayscale-[0.2] bg-white/40 dark:bg-slate-900/40 border-slate-50/50 dark:border-slate-800/50' : 'shadow-2xl shadow-blue-900/5 bg-white/95 dark:bg-slate-800/80 border-slate-100 dark:border-white/5'
                          }`}
                          onClick={() => handleClick(n)}
                        >
                          {!n.leida && (
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#eab308] dark:bg-blue-500"></div>
                          )}

                          <div className="flex gap-8 items-start">
                            <div className={`flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-[1.5rem] shadow-sm transition-all duration-700 group-hover:rotate-12 group-hover:scale-110 ${color}`}>
                              <Icon className="h-8 w-8" />
                            </div>

                            <div className="flex-grow">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-serif font-bold text-xl text-[#1e3a5f] dark:text-white leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                    {n.titulo}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                      {parseApiDate(n.creadaEn)?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {!n.leida && <span className="w-1.5 h-1.5 bg-[#eab308] rounded-full animate-pulse" />}
                                  </div>
                                </div>
                                <button
                                  onClick={e => { e.stopPropagation(); eliminar(n.id); }}
                                  className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <p className="text-slate-500 dark:text-slate-400 font-medium italic leading-relaxed mb-5">
                                "{n.mensaje}"
                              </p>

                              {resolverRuta(n) && (
                                <AnimatedButton className="text-[#1e3a5f] dark:text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:text-[#eab308] transition-colors border-t border-slate-50 dark:border-white/5 pt-4">
                                  Ver mis pedidos
                                  <ChevronRight className="h-3 w-3" />
                                </AnimatedButton>
                              )}
                            </div>
                          </div>
                        </GlassCard>
                      );
                    })}
                  </StaggerContainer>
                </section>
              ))}

              {totalPaginas > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                  <button
                    onClick={() => setPagina(Math.max(1, pagina - 1))}
                    disabled={pagina <= 1}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300 rotate-180" />
                  </button>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {pagina} / {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
                    disabled={pagina >= totalPaginas}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <FadeIn>
              <div className="flex flex-col items-center justify-center py-32 text-center bg-white/50 dark:bg-slate-800/20 backdrop-blur-md rounded-[4rem] border-2 border-dashed border-slate-100 dark:border-white/5 transition-all">
                <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[3rem] flex items-center justify-center text-slate-200 dark:text-slate-700 mb-8 shadow-2xl relative overflow-hidden">
                    <Inbox className="h-16 w-16 text-[#1e3a5f]/20" />
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute text-[#eab308] opacity-50"
                    >
                        <Bell className="w-20 h-20" />
                    </motion.div>
                </div>
                <h3 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white mb-3">Archivo Vacío</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium italic">
                  "Todo está en armonía. Te notificaremos ante cualquier novedad."
                </p>
                {onlyUnread && (
                  <AnimatedButton
                    onClick={() => setOnlyUnread(false)}
                    className="mt-10 px-10 py-4 bg-[#1e3a5f] dark:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-900/20 hover:bg-[#eab308] hover:text-[#1e3a5f] transition-all"
                  >
                    Restaurar Bitácora
                  </AnimatedButton>
                )}
              </div>
            </FadeIn>
          )}
        </div>
      </main>
    </div>
  );
}
