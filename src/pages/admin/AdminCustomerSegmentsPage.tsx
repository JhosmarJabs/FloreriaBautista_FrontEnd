import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, Crown, Repeat, Clock, UserX, RefreshCw, Download, Loader2, Phone, Mail, ScatterChart as ScatterChartIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { FadeIn, GlassCard, AnimatedButton } from '../../components/Animations';
import { AdminService } from '../../services/adminService';
import { useToast } from '../../hooks/useToast';

interface SegmentCustomer {
  customerId: string;
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
  recenciaDias: number;
  frecuenciaPedidos: number;
  montoTotal: number;
}

interface SegmentGroup {
  grupo: string;
  totalClientes: number;
  montoTotalGrupo: number;
  montoPromedio: number;
  recenciaPromedioDias: number;
  frecuenciaPromedio: number;
  clientes: SegmentCustomer[];
}

const GRUPO_META: Record<string, { label: string; icon: any; color: string; bg: string; desc: string }> = {
  VIP:       { label: 'VIP / Alto valor',        icon: Crown,  color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10',   desc: 'Mayor gasto acumulado: prioriza atención y beneficios exclusivos.' },
  FRECUENTE: { label: 'Frecuentes',              icon: Repeat, color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10',     desc: 'Compran seguido aunque con ticket menor: candidatos a upsell.' },
  OCASIONAL: { label: 'Ocasionales',             icon: Clock,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', desc: 'Compras esporádicas: oportunidad de fidelización.' },
  INACTIVO:  { label: 'Inactivos',               icon: UserX,  color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-500/10',     desc: 'Sin compras recientes: riesgo de abandono, requieren reactivación.' },
};

const grupoMeta = (g: string) => GRUPO_META[g] ?? { label: g, icon: Users, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800', desc: '' };

const GRUPO_HEX: Record<string, string> = {
  VIP: '#f59e0b',
  FRECUENTE: '#3b82f6',
  OCASIONAL: '#10b981',
  INACTIVO: '#f43f5e',
};
const grupoHex = (g: string) => GRUPO_HEX[g] ?? '#64748b';

// ─── Gráfica de dispersión: Recencia vs Monto, tamaño = frecuencia ──────────
function CustomerScatterChart({ segmentos }: { segmentos: SegmentGroup[] }) {
  const puntos = useMemo(
    () => segmentos.flatMap(s => s.clientes.map(c => ({ ...c, grupo: s.grupo }))),
    [segmentos]
  );

  const gruposPresentes = useMemo(
    () => Array.from(new Set(puntos.map(p => p.grupo))),
    [puntos]
  );

  if (puntos.length === 0) return null;

  const W = 900, H = 380;
  const padX = 70, padY = 30;
  const chartW = W - padX - 30;
  const chartH = H - padY * 2;

  const maxX = Math.max(...puntos.map(p => p.recenciaDias), 1) * 1.05;
  const maxY = Math.max(...puntos.map(p => p.montoTotal), 1) * 1.08;
  const maxFreq = Math.max(...puntos.map(p => p.frecuenciaPedidos), 1);

  const toSvgX = (v: number) => padX + (v / maxX) * chartW;
  const toSvgY = (v: number) => padY + chartH - (v / maxY) * chartH;
  const toRadio = (freq: number) => 4 + (freq / maxFreq) * 10;

  return (
    <GlassCard className="p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <ScatterChartIcon className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Dispersión de Clientes</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recencia (días) vs. Monto total — tamaño = frecuencia de pedidos</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {gruposPresentes.map(g => (
            <div key={g} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: grupoHex(g) }} />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{grupoMeta(g).label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 rounded-[32px] border border-slate-100 dark:border-slate-800 p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* Grid + Y axis */}
          {[0, 0.25, 0.5, 0.75, 1].map(p => {
            const y = padY + chartH * p;
            const val = maxY - maxY * p;
            return (
              <g key={p}>
                <line x1={padX} y1={y} x2={W - 30} y2={y} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />
                <text x={padX - 12} y={y + 4} textAnchor="end" fontSize="10" fontWeight="900" className="fill-slate-400 font-mono uppercase">
                  ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Grid + X axis */}
          {[0, 0.25, 0.5, 0.75, 1].map(p => {
            const x = padX + chartW * p;
            const val = maxX * p;
            return (
              <g key={p}>
                <line x1={x} y1={padY} x2={x} y2={padY + chartH} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />
                <text x={x} y={H - 6} textAnchor="middle" fontSize="9" fontWeight="900" className="fill-slate-400 font-mono uppercase">
                  {val.toFixed(0)}d
                </text>
              </g>
            );
          })}

          {/* Puntos */}
          {puntos.map(p => (
            <motion.circle
              key={p.customerId}
              cx={toSvgX(p.recenciaDias)}
              cy={toSvgY(p.montoTotal)}
              r={toRadio(p.frecuenciaPedidos)}
              fill={grupoHex(p.grupo)}
              fillOpacity={0.65}
              stroke={grupoHex(p.grupo)}
              strokeWidth={1.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: Math.random() * 0.3 }}
            >
              <title>{`${p.nombre} — ${p.recenciaDias}d sin comprar, $${p.montoTotal.toLocaleString()}, ${p.frecuenciaPedidos} pedido(s)`}</title>
            </motion.circle>
          ))}

          {/* Ejes labels */}
          <text x={padX + chartW / 2} y={H + 2} textAnchor="middle" fontSize="9" fontWeight="900" className="fill-slate-300 uppercase tracking-widest" style={{ display: 'none' }} />
        </svg>
      </div>
      <div className="flex justify-between px-2 mt-3">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">← Recencia (días sin comprar) →</p>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">↑ Monto total gastado</p>
      </div>
    </GlassCard>
  );
}

function exportarCsv(grupo: SegmentGroup) {
  const encabezado = ['Nombre', 'Telefono', 'Correo', 'Recencia (dias)', 'Frecuencia (pedidos)', 'Monto total'];
  const filas = grupo.clientes.map(c => [c.nombre, c.telefono ?? '', c.correo ?? '', c.recenciaDias, c.frecuenciaPedidos, c.montoTotal]);
  const csv = [encabezado, ...filas].map(fila => fila.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clientes_${grupo.grupo.toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminCustomerSegmentsPage() {
  const { showToast } = useToast();
  const [segmentos, setSegmentos] = useState<SegmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculando, setRecalculando] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string | null>(null);

  const cargarSegmentos = async () => {
    setLoading(true);
    try {
      const res = await AdminService.getCustomerSegments();
      const data: SegmentGroup[] = res.data || [];
      setSegmentos(data);
      if (data.length > 0 && !grupoSeleccionado) setGrupoSeleccionado(data[0].grupo);
    } catch (e) {
      showToast('Error al cargar la segmentación de clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSegmentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecalcular = async () => {
    setRecalculando(true);
    try {
      const res = await AdminService.recalcularSegmentosClientes();
      showToast(res.message || 'Segmentación recalculada con éxito', 'success');
      await cargarSegmentos();
    } catch (e) {
      showToast('Error al recalcular la segmentación', 'error');
    } finally {
      setRecalculando(false);
    }
  };

  const grupoActivo = segmentos.find(s => s.grupo === grupoSeleccionado) || null;
  const totalClientes = segmentos.reduce((acc, s) => acc + s.totalClientes, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Segmentación de Clientes</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Clustering RFM (Recencia, Frecuencia, Monto) — modelos predictivos, Propuesta 3
            </p>
          </div>
          <AnimatedButton
            onClick={handleRecalcular}
            disabled={recalculando}
            className="px-5 py-3 bg-[#1e3a5f] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-60"
          >
            {recalculando ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Recalcular segmentos
          </AnimatedButton>
        </div>
      </FadeIn>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      ) : segmentos.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase mb-2">Sin segmentación calculada</h3>
          <p className="text-sm text-slate-400 mb-6">Aún no se ha corrido el modelo de clustering. Calcúlalo para ver los grupos de clientes.</p>
          <AnimatedButton
            onClick={handleRecalcular}
            disabled={recalculando}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest inline-flex items-center gap-2"
          >
            {recalculando ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Calcular ahora
          </AnimatedButton>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {segmentos.map((s) => {
              const meta = grupoMeta(s.grupo);
              const Icon = meta.icon;
              const activo = grupoSeleccionado === s.grupo;
              return (
                <motion.button
                  key={s.grupo}
                  onClick={() => setGrupoSeleccionado(s.grupo)}
                  whileHover={{ y: -4 }}
                  className={`text-left rounded-3xl border p-6 transition-all shadow-sm ${
                    activo
                      ? 'bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-500 shadow-lg ring-2 ring-blue-100 dark:ring-blue-900'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`size-11 rounded-2xl ${meta.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase">
                      {totalClientes > 0 ? Math.round((s.totalClientes / totalClientes) * 100) : 0}%
                    </span>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{s.totalClientes}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{meta.label}</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>Monto prom.</span><span className="text-slate-700 dark:text-slate-200">${s.montoPromedio.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>Recencia prom.</span><span className="text-slate-700 dark:text-slate-200">{s.recenciaPromedioDias} días</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <CustomerScatterChart segmentos={segmentos} />

          {grupoActivo && (
            <GlassCard className="p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {grupoMeta(grupoActivo.grupo).label} — {grupoActivo.totalClientes} clientes
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{grupoMeta(grupoActivo.grupo).desc}</p>
                </div>
                <button
                  onClick={() => exportarCsv(grupoActivo)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <Download className="w-4 h-4" /> Exportar CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Contacto</th>
                      <th className="px-6 py-4 text-right">Recencia</th>
                      <th className="px-6 py-4 text-right">Pedidos</th>
                      <th className="px-6 py-4 text-right">Monto total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {grupoActivo.clientes.map(c => (
                      <tr key={c.customerId} className="text-[11px] hover:bg-slate-50/40 dark:hover:bg-slate-900/30">
                        <td className="px-6 py-3 font-bold text-slate-700 dark:text-slate-200">{c.nombre}</td>
                        <td className="px-6 py-3 text-slate-400">
                          <div className="flex flex-col gap-0.5">
                            {c.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.telefono}</span>}
                            {c.correo && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.correo}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-slate-600 dark:text-slate-300">{c.recenciaDias} días</td>
                        <td className="px-6 py-3 text-right font-bold text-slate-600 dark:text-slate-300">{c.frecuenciaPedidos}</td>
                        <td className="px-6 py-3 text-right font-black text-slate-900 dark:text-white font-mono">${c.montoTotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
