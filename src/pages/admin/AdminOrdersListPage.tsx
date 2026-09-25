import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, RefreshCw, AlertTriangle, ChevronRight,
  ChevronLeft, X, Eye, Calendar, Clock, LayoutGrid, List,
  User as UserIcon, Tag, MapPin, ReceiptText, Archive, CheckCircle2,
  ChevronDown, Palette, Zap, Check, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService, type SolicitudVentaInstantaneaAdmin } from '../../services/adminService';
import { Order } from '../../types';
import { FadeIn, AnimatedButton } from '../../components/Animations';
import { parseApiDate, todayISO } from '../../utils/date';
import { ESTADO_PEDIDO, type EstadoPedidoUi } from '../../utils/labels';
import { useLocalSort } from '../../hooks/useLocalSort';
import { SortableColumnHeader } from '../../components/SortableColumnHeader';

const ESTADOS = [
  '', 'PENDIENTE_VALIDACION', 'EN_PREPARACION', 'EN_RUTA', 'ENTREGADO', 'CANCELADO', 'PENDIENTE_ANULACION', 'NO_COMPLETADO',
];
const PAGE_SIZE = 20;

const ESTADO_STYLE: Record<string, EstadoPedidoUi> = ESTADO_PEDIDO;
const ESTADOS_CERRADOS = ['ENTREGADO', 'CANCELADO'];
const MS_DIA = 86_400_000;

function formatDate(iso: string) {
  const d = parseApiDate(iso);
  return d ? d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

function formatHoraEntrega(hora?: string | null) {
  const m = hora ? /^(\d{1,2}):(\d{2})/.exec(hora) : null;
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
}

function diasHastaEntrega(iso?: string | null): number | null {
  const entrega = parseApiDate(iso);
  const hoy = parseApiDate(todayISO());
  if (!entrega || !hoy || Number.isNaN(entrega.getTime())) return null;
  entrega.setHours(0, 0, 0, 0);
  return Math.round((entrega.getTime() - hoy.getTime()) / MS_DIA);
}

function diaSemana(iso: string) {
  const d = parseApiDate(iso);
  if (!d) return '';
  const s = d.toLocaleDateString('es-MX', { weekday: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Urgencia = { label: string; text: string; dot?: string; pulse?: boolean };

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

function UrgenciaDot({ urg }: { urg: Urgencia }) {
  if (!urg.dot) return null;
  return (
    <span className="relative flex w-1.5 h-1.5">
      {urg.pulse && <span className={`absolute inline-flex w-full h-full rounded-full ${urg.dot} opacity-75 animate-ping`} />}
      <span className={`relative inline-flex w-1.5 h-1.5 rounded-full ${urg.dot}`} />
    </span>
  );
}

const ESTADO_SOLICITUD_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  PENDIENTE:  { label: 'Pendiente',  bg: 'bg-amber-100 dark:bg-amber-500/20',   text: 'text-amber-700 dark:text-amber-300' },
  ACEPTADA:   { label: 'Aceptada',   bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
  RECHAZADA:  { label: 'Rechazada',  bg: 'bg-red-100 dark:bg-red-500/20',       text: 'text-red-700 dark:text-red-300' },
  EXPIRADA:   { label: 'Expirada',   bg: 'bg-slate-100 dark:bg-slate-500/20',   text: 'text-slate-600 dark:text-slate-400' },
};

export default function AdminOrdersListPage() {
  const navigate = useNavigate();
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [verArchivo, setVerArchivo] = useState(false);
  const [verLeyenda, setVerLeyenda] = useState(false);

  const [verSolicitudes, setVerSolicitudes] = useState(false);
  const [solicitudes, setSolicitudes] = useState<SolicitudVentaInstantaneaAdmin[]>([]);
  const [solicitudesLoading, setSolicitudesLoading] = useState(false);
  const [solicitudesError, setSolicitudesError] = useState<string | null>(null);
  const [solicitudesTotal, setSolicitudesTotal] = useState(0);
  const [solicitudesFiltro, setSolicitudesFiltro] = useState('PENDIENTE');
  const [decidiendo, setDecidiendo] = useState<string | null>(null);

  const loadSolicitudes = useCallback(async () => {
    setSolicitudesLoading(true);
    setSolicitudesError(null);
    try {
      const res = await AdminService.getAdminSolicitudesInstantaneas({
        estado: solicitudesFiltro || undefined,
        page: 1,
        size: 50,
      });
      setSolicitudes(res.data.items);
      setSolicitudesTotal(res.data.total);
    } catch (err: any) {
      setSolicitudesError(err.message || 'Error al cargar solicitudes');
    } finally {
      setSolicitudesLoading(false);
    }
  }, [solicitudesFiltro]);

  useEffect(() => {
    if (verSolicitudes) loadSolicitudes();
  }, [verSolicitudes, loadSolicitudes]);

  const handleAceptar = async (id: string) => {
    setDecidiendo(id);
    try {
      await AdminService.aceptarSolicitudInstantanea(id);
      await loadSolicitudes();
    } catch (err: any) {
      alert(err.message || 'Error al aceptar');
    } finally {
      setDecidiendo(null);
    }
  };

  const handleRechazar = async (id: string) => {
    const motivo = prompt('Motivo del rechazo (opcional):');
    setDecidiendo(id);
    try {
      await AdminService.rechazarSolicitudInstantanea(id, motivo || undefined);
      await loadSolicitudes();
    } catch (err: any) {
      alert(err.message || 'Error al rechazar');
    } finally {
      setDecidiendo(null);
    }
  };

  const [estado, setEstado] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [total, setTotal] = useState(0);
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
        page: 1,
        size: 500,
        archivado: verArchivo,
      });
      setRawOrders(res.data.items);
      setTotal(res.data.total);
      setSumaTotal(res.data.sumaTotal);
    } catch (err: any) {
      setError(err.message || 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [estado, desde, hasta, verArchivo]);

  useEffect(() => { load(); }, [load]);

  const clearFilters = () => { setEstado(''); setDesde(''); setHasta(''); setBusqueda(''); };

  const camposBusqueda = useMemo(() => ['nombreCliente' as keyof Order, 'id' as keyof Order], []);

  const {
    datosPaginados: orders,
    totalFiltrados,
    page, setPage, totalPages,
    sortConfig, toggleSort,
  } = useLocalSort<Order>({
    datos: rawOrders,
    busqueda,
    camposBusqueda,
    pageSize: PAGE_SIZE,
  });

  const pendientes = orders.filter(o => o.estadoPedido === 'PENDIENTE_VALIDACION').length;
  const entregados = orders.filter(o => o.estadoPedido === 'ENTREGADO').length;

  return (
    <div className="w-full flex flex-col gap-6">

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
            <AnimatedButton onClick={() => { setVerSolicitudes(v => !v); if (verArchivo) setVerArchivo(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all border ${
                verSolicitudes
                  ? 'bg-amber-600 dark:bg-amber-500 text-white border-amber-600 dark:border-amber-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}>
              <Zap className="w-4 h-4" />
              {verSolicitudes ? 'Ver Pedidos' : 'Solicitudes Instantaneas'}
            </AnimatedButton>
            <AnimatedButton onClick={() => { setVerArchivo(v => !v); if (verSolicitudes) setVerSolicitudes(false); }}
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

      {/* ── Panel de solicitudes de venta instantanea ────────────── */}
      {verSolicitudes && (
        <FadeIn>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {['', 'PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'EXPIRADA'].map(e => (
                <button key={e} onClick={() => setSolicitudesFiltro(e)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    solicitudesFiltro === e
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}>
                  {e || 'Todas'}
                </button>
              ))}
              <button onClick={loadSolicitudes} disabled={solicitudesLoading}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${solicitudesLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>

            {solicitudesError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-xs font-bold text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {solicitudesError}
              </div>
            )}

            {solicitudesLoading ? (
              <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-500 font-bold">
                Cargando solicitudes...
              </div>
            ) : solicitudes.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-500 font-bold">
                No hay solicitudes {solicitudesFiltro ? `en estado ${solicitudesFiltro}` : ''}.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Producto</th>
                      <th className="px-4 py-3 text-center">Cant.</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-left">Creada</th>
                      <th className="px-4 py-3 text-left">Decidida por</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {solicitudes.map(s => {
                      const est = ESTADO_SOLICITUD_STYLE[s.estado] ?? ESTADO_SOLICITUD_STYLE.PENDIENTE;
                      const creada = new Date(s.creadaEn);
                      const minutosDesdeCreacion = Math.floor((Date.now() - creada.getTime()) / 60000);
                      return (
                        <tr key={s.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800 dark:text-white text-xs">{s.nombreCliente}</div>
                            {s.telefonoCliente && <div className="text-[10px] text-slate-400">{s.telefonoCliente}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {s.imagenProducto && (
                                <img src={s.imagenProducto} alt="" className="w-8 h-8 rounded-lg object-cover" />
                              )}
                              <span className="font-medium text-xs text-slate-700 dark:text-slate-300">{s.nombreProducto}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">{s.cantidad}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${est.bg} ${est.text}`}>
                              {est.label}
                            </span>
                            {s.estado === 'PENDIENTE' && minutosDesdeCreacion >= 2 && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                {s.escaladaAEmpleadoEn ? 'Escalada' : `${minutosDesdeCreacion} min`}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {creada.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {s.decididaPorNombre ?? (s.motivoExpiracion ? s.motivoExpiracion.replace(/_/g, ' ') : '---')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {s.estado === 'PENDIENTE' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => handleAceptar(s.id)} disabled={decidiendo === s.id}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50">
                                  <Check className="w-3 h-3" /> Aceptar
                                </button>
                                <button onClick={() => handleRechazar(s.id)} disabled={decidiendo === s.id}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50">
                                  <XCircle className="w-3 h-3" /> Rechazar
                                </button>
                              </div>
                            ) : s.orderId ? (
                              <button onClick={() => navigate(`/admin/orders/${s.orderId}`)}
                                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                Ver pedido
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">---</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold text-right">
              {solicitudesTotal} solicitud(es) en total
            </div>
          </div>
        </FadeIn>
      )}

      {/* KPI Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total pedidos', value: total, icon: <ReceiptText />, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100/70 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/40', trend: 'registrados' },
          { label: 'Pendientes en página', value: pendientes, icon: <Clock />, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100/70 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/40', trend: `de ${orders.length} visibles` },
          { label: 'Entregados en página', value: entregados, icon: <CheckCircle2 />, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/40', trend: `de ${orders.length} visibles` },
          { label: 'Recaudación bruta', value: `$${(sumaTotal ?? rawOrders.reduce((acc, o) => acc + o.total, 0)).toLocaleString()}`, icon: <Tag />, color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100/70 dark:bg-indigo-500/20', border: 'border-indigo-200 dark:border-indigo-500/40', trend: `${total} pedidos` },
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

        {activeFilters > 0 && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-800/50 px-3 py-2 rounded-xl transition-all">
            <X className="w-3.5 h-3.5" />Limpiar ({activeFilters})
          </button>
        )}

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
                      <SortableColumnHeader label="Cliente" field="nombreCliente" sortConfig={sortConfig} onToggle={toggleSort} className="px-6 py-4" />
                      <SortableColumnHeader label="Estado" field="estadoPedido" sortConfig={sortConfig} onToggle={toggleSort} className="px-6 py-4" />
                      <SortableColumnHeader label="Entrega" field="fechaEntrega" sortConfig={sortConfig} onToggle={toggleSort} className="px-6 py-4" />
                      <SortableColumnHeader label="Importe" field="total" sortConfig={sortConfig} onToggle={toggleSort} className="px-6 py-4" />
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                        <span className="sr-only">Acciones</span>
                      </th>
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
                            <td className={`px-6 py-4 border-l-4 ${st?.bar ?? 'border-transparent'}`}>
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

                      <div className="absolute -bottom-2 -left-2 size-8 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700" />
                      <div className="absolute -bottom-2 -right-2 size-8 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700" />
                    </motion.div>
                  );
                })}
              </div>
            )}
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{orders.length} de {totalFiltrados} registros</span>
               <div className="flex items-center gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1 || loading} className="p-2 text-slate-400 hover:text-emerald-500 disabled:opacity-30 transition-all"><ChevronLeft className="w-5 h-5"/></button>
                  <span className="text-xs font-black px-4">{page} / {totalPages}</span>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages || loading} className="p-2 text-slate-400 hover:text-emerald-500 disabled:opacity-30 transition-all"><ChevronRight className="w-5 h-5"/></button>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
