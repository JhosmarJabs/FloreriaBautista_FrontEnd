import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, RefreshCw, AlertTriangle, ChevronRight,
  ChevronLeft, Filter, X, Eye, Calendar, Clock, LayoutGrid, List,
  User as UserIcon, Tag, MapPin, ReceiptText, Archive, CheckCircle2,
  ChevronDown, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { Order } from '../../types';
import { FadeIn, AnimatedButton } from '../../components/Animations';
import { parseApiDate, todayISO } from '../../utils/date';
import { ESTADO_PEDIDO, type EstadoPedidoUi } from '../../utils/labels';

// Estos son los estados reales que usa el backend (ver Transiciones en Backend/Services/OrderService.cs)
const ESTADOS = [
  '', 'PENDIENTE_VALIDACION', 'EN_PREPARACION', 'EN_RUTA', 'ENTREGADO', 'CANCELADO', 'PENDIENTE_ANULACION', 'NO_COMPLETADO',
];
const PAGE_SIZE = 20;

// Semáforo por estado. Además del badge, cada entrada define cómo se pinta la
// fila/tarjeta completa: `bar` es la barra lateral (tabla) o superior (tarjeta) y
// `tint` un fondo muy tenue reservado a los estados que exigen que alguien actúe.
// Todo vive en utils/labels.ts para que un estado se llame y se pinte igual aquí,
// en el dashboard, en el panel del empleado y en la cuenta del cliente.
const ESTADO_STYLE: Record<string, EstadoPedidoUi> = ESTADO_PEDIDO;

// Un pedido ya cerrado no urge, por más que su fecha de entrega esté encima.
const ESTADOS_CERRADOS = ['ENTREGADO', 'CANCELADO'];

const MS_DIA = 86_400_000;

function formatDate(iso: string) {
  const d = parseApiDate(iso);
  return d ? d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

/** "18:30:00" → "18:30". El resumen del backend puede no traer hora de entrega. */
function formatHoraEntrega(hora?: string | null) {
  const m = hora ? /^(\d{1,2}):(\d{2})/.exec(hora) : null;
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
}

/** Días entre hoy y la entrega: 0 = hoy, 1 = mañana, negativo = ya pasó. */
function diasHastaEntrega(iso?: string | null): number | null {
  const entrega = parseApiDate(iso);
  const hoy = parseApiDate(todayISO());
  if (!entrega || !hoy || Number.isNaN(entrega.getTime())) return null;
  entrega.setHours(0, 0, 0, 0); // fechaEntrega es DateOnly, pero por si llega con hora
  return Math.round((entrega.getTime() - hoy.getTime()) / MS_DIA);
}

function diaSemana(iso: string) {
  const d = parseApiDate(iso);
  if (!d) return '';
  const s = d.toLocaleDateString('es-MX', { weekday: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Urgencia = { label: string; text: string; dot?: string; pulse?: boolean };

/**
 * Segunda capa de color: qué tan encima está la entrega. Se apaga en el archivo
 * (ahí todo es pasado) y en los pedidos ya cerrados.
 */
function urgenciaEntrega(order: Order, activa: boolean): Urgencia | null {
  if (!activa || ESTADOS_CERRADOS.includes(order.estadoPedido)) return null;
  const dias = diasHastaEntrega(order.fechaEntrega);
  if (dias === null) return null;
  if (dias < 0)   return { label: 'Atrasado', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' };
  if (dias === 0) return { label: 'HOY', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500', pulse: true };
  if (dias === 1) return { label: 'Mañana', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-400' };
  if (dias <= 7)  return { label: diaSemana(order.fechaEntrega), text: 'text-slate-600 dark:text-slate-300' };
  return { label: '', text: 'text-slate-400 dark:text-slate-500' };
}

/** Punto de urgencia; el de "HOY" late para que salte a la vista. */
function UrgenciaDot({ urg }: { urg: Urgencia }) {
  if (!urg.dot) return null;
  return (
    <span className="relative flex w-1.5 h-1.5">
      {urg.pulse && <span className={`absolute inline-flex w-full h-full rounded-full ${urg.dot} opacity-75 animate-ping`} />}
      <span className={`relative inline-flex w-1.5 h-1.5 rounded-full ${urg.dot}`} />
    </span>
  );
}

export default function AdminOrdersListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [verArchivo, setVerArchivo] = useState(false);
  const [verLeyenda, setVerLeyenda] = useState(false);

  const [estado, setEstado] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  // Recaudación bruta que calcula el backend sobre TODOS los filtrados. Si el
  // backend aún no la envía (undefined), el card cae a sumar los pedidos
  // cargados, para no mostrar $0 falso.
  const [sumaTotal, setSumaTotal] = useState<number | undefined>(undefined);

  const activeFilters = [estado, desde, hasta, busqueda].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminService.getAdminOrders({
        estado: estado || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        page,
        size: PAGE_SIZE,
        archivado: verArchivo,
      });
      let items = res.data.items;
      if (busqueda.trim()) {
        const q = busqueda.trim().toLowerCase();
        items = items.filter(o => o.nombreCliente?.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
      }
      setOrders(items);
      setTotal(res.data.total);
      setSumaTotal(res.data.sumaTotal);
      setTotalPages(res.data.totalPaginas || 1);
    } catch (err: any) {
      setError(err.message || 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [estado, desde, hasta, busqueda, page, verArchivo]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [estado, desde, hasta, busqueda, verArchivo]);

  const clearFilters = () => { setEstado(''); setDesde(''); setHasta(''); setBusqueda(''); setPage(1); };

  // OJO: estos dos conteos son de la página actual (PAGE_SIZE registros), no del
  // total filtrado. El backend solo agrega `sumaTotal` en PagedResultDto; mientras
  // no exponga conteos por estado, el label dice explícitamente "en esta página".
  const pendientes = orders.filter(o => o.estadoPedido === 'PENDIENTE_VALIDACION').length;
  const entregados = orders.filter(o => o.estadoPedido === 'ENTREGADO').length;

  return (
    <div className="w-full flex flex-col gap-6">

      {/* Breadcrumb */}


      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {verArchivo ? 'Archivo de Pedidos' : 'Ventas y Pedidos'}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
               {loading ? 'Consultando historial...' : `${total} registros encontrados`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AnimatedButton onClick={() => setVerArchivo(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all border ${
                verArchivo
                  ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}>
              <Archive className="w-4 h-4" />
              {verArchivo ? 'Ver Pedidos Activos' : 'Ver Archivo'}
            </AnimatedButton>
            <AnimatedButton onClick={load} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </AnimatedButton>
          </div>
        </div>
      </FadeIn>

      {verArchivo && (
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-500 dark:text-slate-400">
          <Archive className="w-4 h-4 shrink-0" />
          Pedidos atrasados que ya pasaron su fecha de entrega. Los que no tuvieron seguimiento se marcan como "No completado" automáticamente.
        </div>
      )}

      {/* KPI Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total pedidos', value: total, icon: <ReceiptText />, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100/70 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/40', trend: 'registrados' },
          { label: 'Pendientes en esta página', value: pendientes, icon: <Clock />, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100/70 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/40', trend: `de ${orders.length} visibles` },
          { label: 'Entregados en esta página', value: entregados, icon: <CheckCircle2 />, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/40', trend: `de ${orders.length} visibles` },
          { label: 'Recaudación bruta', value: `$${(sumaTotal ?? orders.reduce((acc, o) => acc + o.total, 0)).toLocaleString()}`, icon: <Tag />, color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100/70 dark:bg-indigo-500/20', border: 'border-indigo-200 dark:border-indigo-500/40', trend: `${total} pedidos` },
        ].map((s, idx) => (
          <div key={idx} className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5`}>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</p>
              <div className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-100">{loading ? "—" : s.value}</div>
              <p className={`text-xs mt-1.5 font-medium ${s.color} opacity-80`}>{s.trend}</p>
            </div>
            {React.cloneElement(s.icon as React.ReactElement, {
               className: `absolute -bottom-4 -right-4 w-24 h-24 ${s.color} opacity-10`,
               strokeWidth: 3
            })}
          </div>
        ))}
      </div>

      {/* Tools / Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente o número de pedido…"
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
        </div>
        <select value={estado} onChange={e => setEstado(e.target.value)} 
          className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-600 dark:text-slate-300 outline-none cursor-pointer">
          <option value="">Todos los estados</option>
          {ESTADOS.filter(Boolean).map(e => (
            <option key={e} value={e}>{ESTADO_STYLE[e]?.label ?? e}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1 px-3 rounded-xl border border-slate-200 dark:border-slate-700">
           <Calendar className="w-4 h-4 text-slate-400" />
           <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none w-28" />
           <span className="text-slate-300">|</span>
           <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none w-28" />
        </div>

        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl ml-auto">
          <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-400'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-400'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leyenda de colores (colapsable) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <button onClick={() => setVerLeyenda(v => !v)}
          className="w-full flex items-center gap-2 px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <Palette className="w-4 h-4" />
          Qué significa cada color
          <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${verLeyenda ? 'rotate-180' : ''}`} />
        </button>
        {verLeyenda && (
          <div className="px-4 pb-4 flex flex-col gap-4 border-t border-slate-100 dark:border-slate-700/50 pt-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Estado del pedido (barra lateral y badge)</p>
              <div className="flex flex-wrap gap-2">
                {ESTADOS.filter(Boolean).map(e => {
                  const st = ESTADO_STYLE[e];
                  return (
                    <span key={e} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${st.bg} ${st.text} ${st.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  );
                })}
              </div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-2">
                El fondo tenue marca los pedidos que esperan una acción tuya:{' '}
                {ESTADOS.filter(e => e && ESTADO_STYLE[e]?.tint).map(e => ESTADO_STYLE[e].label).join(' y ')}.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Proximidad de la entrega</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {[
                  { urg: { label: 'Atrasado', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' }, ayuda: 'la fecha ya pasó' },
                  { urg: { label: 'HOY', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500', pulse: true }, ayuda: 'se entrega hoy' },
                  { urg: { label: 'Mañana', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-400' }, ayuda: 'se entrega mañana' },
                  { urg: { label: 'Día de la semana', text: 'text-slate-600 dark:text-slate-300' }, ayuda: 'dentro de 2 a 7 días' },
                  { urg: { label: 'Fecha en gris', text: 'text-slate-400 dark:text-slate-500' }, ayuda: 'falta más de una semana' },
                ].map(({ urg, ayuda }) => (
                  <span key={urg.label} className="inline-flex items-center gap-1.5 text-[10px] font-bold">
                    <UrgenciaDot urg={urg} />
                    <span className={`uppercase tracking-widest ${urg.text}`}>{urg.label}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-medium normal-case tracking-normal">— {ayuda}</span>
                  </span>
                ))}
              </div>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-2">
                Los pedidos entregados o cancelados no muestran urgencia, y en el archivo se apaga por completo.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden min-h-[400px] shadow-sm flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm font-black uppercase tracking-widest">Sincronizando pedidos...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <AlertTriangle className="w-12 h-12 text-rose-500" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{error}</p>
            <button onClick={load} className="px-6 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl border border-emerald-100">Cargar de nuevo</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-300 py-20">
            <ShoppingCart className="w-16 h-16 opacity-20" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay pedidos disponibles</p>
          </div>
        ) : (
          <>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50">
                      {['Cliente', 'Estado', 'Entrega', 'Importe', ''].map((h, i) => (
                        <th key={i} className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                          {h || <span className="sr-only">Acciones</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    <AnimatePresence mode="popLayout">
                      {orders.map(order => {
                        const st = ESTADO_STYLE[order.estadoPedido];
                        const urg = urgenciaEntrega(order, !verArchivo);
                        const hora = formatHoraEntrega(order.horaEntrega);
                        return (
                          <motion.tr key={order.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className={`${st?.tint ?? ''} hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors`}>
                            {/* La barra de estado va en la primera celda: en un <tr> el color lo
                                pisaría el divide-* del tbody, que tiene más especificidad. */}
                            <td className={`px-6 py-4 border-l-4 ${st?.bar ?? 'border-transparent'}`}>
                               {/* El id ya no tiene columna propia: vive aquí como tooltip (completo,
                                   porque los primeros caracteres se repiten entre pedidos). */}
                               <div className="flex items-center gap-3" title={`Pedido ${order.id}`}>
                                  <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[10px] font-black shrink-0">{order.nombreCliente?.charAt(0) || 'C'}</div>
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{order.nombreCliente || 'Público General'}</p>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               {st && (
                                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${st.bg} ${st.text} ${st.border}`}>
                                   <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                   {st.label}
                                 </span>
                               )}
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex flex-col gap-0.5">
                                  <span className={`text-xs font-bold ${urg ? urg.text : 'text-slate-500 dark:text-slate-400'}`}>{formatDate(order.fechaEntrega)}</span>
                                  {hora && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{hora}</span>}
                                  {urg?.label && (
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${urg.text}`}>
                                      <UrgenciaDot urg={urg} />
                                      {urg.label}
                                    </span>
                                  )}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">${order.total.toLocaleString()}</td>
                            <td className="px-6 py-4">
                               <button onClick={() => navigate(`/admin/pedidos/${order.id}`)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 rounded-xl transition-all"><Eye className="w-4 h-4" /></button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6 flex-1 bg-slate-50/20 dark:bg-slate-900/10">
                {orders.map((order, idx) => {
                  const st = ESTADO_STYLE[order.estadoPedido];
                  const urg = urgenciaEntrega(order, !verArchivo);
                  const hora = formatHoraEntrega(order.horaEntrega);
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.02 }}
                      className={`group bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 ${st?.tint ?? ''} p-5 pt-6 shadow-sm hover:shadow-2xl hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all cursor-pointer relative overflow-hidden`}
                      onClick={() => navigate(`/admin/pedidos/${order.id}`)}>

                      {/* Barra superior con el color del estado */}
                      {st && <div className={`absolute top-0 inset-x-0 h-1.5 ${st.dot}`} />}

                      
                      <div className="flex items-start justify-between mb-4">
                         <div className="flex flex-col">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Folio</p>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white font-mono">#{order.id.slice(0, 8).toUpperCase()}</h3>
                         </div>
                         <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                            <ReceiptText className="w-5 h-5 text-slate-400" />
                         </div>
                      </div>

                      <div className="mb-4">
                         <div className="flex items-center gap-2 mb-2">
                           <UserIcon className="w-3.5 h-3.5 text-slate-300" />
                           <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{order.nombreCliente || 'C. General'}</p>
                         </div>
                         <div className="flex items-center gap-2">
                           <MapPin className="w-3.5 h-3.5 text-slate-300" />
                           <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate uppercase tracking-tight">Sucursal Matriz</p>
                         </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-700 mb-4 h-24 flex flex-col justify-center">
                         <div className="flex items-center justify-between mb-2 gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Entrega</span>
                            <span className="flex items-center gap-1.5 text-right">
                               <span className={`text-[10px] font-black ${urg ? urg.text : 'text-slate-700 dark:text-slate-200'}`}>
                                  {formatDate(order.fechaEntrega)}{hora && ` · ${hora}`}
                               </span>
                               {urg?.label && (
                                 <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${urg.text}`}>
                                   <UrgenciaDot urg={urg} />
                                   {urg.label}
                                 </span>
                               )}
                            </span>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Total</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white">${order.total.toLocaleString()}</span>
                         </div>
                      </div>

                      <div className="flex items-center justify-between">
                         {st && (
                           <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${st.bg} ${st.text} ${st.border}`}>
                             {st.label}
                           </span>
                         )}
                         <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center dark:hover:bg-emerald-800 transition-all opacity-0 group-hover:opacity-100">
                            <Eye className="w-4 h-4" />
                         </div>
                      </div>

                      {/* Tick decoration */}
                      <div className="absolute -bottom-2 -left-2 size-8 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700" />
                      <div className="absolute -bottom-2 -right-2 size-8 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700" />
                    </motion.div>
                  );
                })}
              </div>
            )}
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{orders.length} de {total} registros</span>
               <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="p-2 text-slate-400 hover:text-emerald-500 disabled:opacity-30 transition-all"><ChevronLeft className="w-5 h-5"/></button>
                  <span className="text-xs font-black px-4">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading} className="p-2 text-slate-400 hover:text-emerald-500 disabled:opacity-30 transition-all"><ChevronRight className="w-5 h-5"/></button>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
