import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList, Loader2, FileDown, PlusCircle, Package,
  ChevronLeft, ChevronRight, ArrowLeft, Filter,
} from 'lucide-react';
import { FadeIn, GlassCard, AnimatedButton } from '../../components/Animations';
import { AdminService, SupplyOrderEstado, SupplyOrderListItem } from '../../services/adminService';
import { useToast } from '../../hooks/useToast';
import { formatApiDate } from '../../utils/date';
import { descargarSolicitudPdf } from '../../utils/supplyOrderPdf';
import { ESTADO_SOLICITUD, formatoMoneda } from '../../utils/supplyOrderUi';

const ESTADOS: (SupplyOrderEstado | '')[] = [
  '', 'BORRADOR', 'ENVIADA', 'RECIBIDA_PARCIAL', 'RECIBIDA', 'CANCELADA',
];

const TAMANO_PAGINA = 15;

export default function AdminSupplyOrdersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [solicitudes, setSolicitudes] = useState<SupplyOrderListItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [estado, setEstado]           = useState<SupplyOrderEstado | ''>('');
  const [desde, setDesde]             = useState('');
  const [hasta, setHasta]             = useState('');
  const [page, setPage]               = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal]             = useState(0);
  const [descargando, setDescargando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminService.getSupplyOrders({ estado, desde, hasta, page, size: TAMANO_PAGINA });
      setSolicitudes(res.data?.items ?? []);
      setTotalPaginas(res.data?.totalPaginas ?? 1);
      setTotal(res.data?.total ?? 0);
    } catch (e: any) {
      showToast(e?.message || 'Error al cargar el historial de solicitudes', 'error');
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  }, [estado, desde, hasta, page, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  // El listado no trae las líneas: para el PDF se pide el detalle completo.
  const descargarPdf = async (solicitud: SupplyOrderListItem) => {
    setDescargando(solicitud.id);
    try {
      const res = await AdminService.getSupplyOrder(solicitud.id);
      descargarSolicitudPdf(res.data);
      showToast(`PDF de ${solicitud.folio} descargado`, 'success');
    } catch (e: any) {
      showToast(e?.message || 'No se pudo generar el PDF', 'error');
    } finally {
      setDescargando(null);
    }
  };

  const aplicarFiltro = (cambio: () => void) => { cambio(); setPage(1); };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              to="/admin/reabastecimiento"
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Reabastecimiento
            </Link>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-blue-600" /> Solicitudes al proveedor
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Historial de solicitudes generadas · {total} en total
            </p>
          </div>
          <AnimatedButton
            onClick={() => navigate('/admin/reabastecimiento')}
            className="px-5 py-3 bg-[#1e3a5f] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg"
          >
            <PlusCircle className="w-4 h-4" /> Nueva solicitud
          </AnimatedButton>
        </div>
      </FadeIn>

      <GlassCard className="p-0 overflow-hidden">
        {/* Filtros */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estado</span>
            <select
              value={estado}
              onChange={e => aplicarFiltro(() => setEstado(e.target.value as SupplyOrderEstado | ''))}
              className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {ESTADOS.map(e => (
                <option key={e || 'TODOS'} value={e}>
                  {e ? ESTADO_SOLICITUD[e].label : 'Todos'}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Desde</span>
            <input
              type="date"
              value={desde}
              onChange={e => aplicarFiltro(() => setDesde(e.target.value))}
              className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Hasta</span>
            <input
              type="date"
              value={hasta}
              onChange={e => aplicarFiltro(() => setHasta(e.target.value))}
              className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          {(estado || desde || hasta) && (
            <button
              onClick={() => aplicarFiltro(() => { setEstado(''); setDesde(''); setHasta(''); })}
              className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cargando solicitudes…</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm text-slate-400 font-bold">
              {estado || desde || hasta
                ? 'Ninguna solicitud coincide con el filtro.'
                : 'Todavía no has generado ninguna solicitud.'}
            </p>
            <Link
              to="/admin/reabastecimiento"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Armar la primera
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="px-5 py-4">Folio</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Proveedor</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 w-56">Recibido</th>
                  <th className="px-5 py-4 text-right">Estimado</th>
                  <th className="px-5 py-4 text-center">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {solicitudes.map(s => {
                  const estilo = ESTADO_SOLICITUD[s.estado];
                  return (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/admin/reabastecimiento/solicitudes/${s.id}`)}
                      className="text-[11px] cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-black font-mono text-slate-700 dark:text-slate-200">{s.folio}</span>
                        {s.semanaObjetivo && (
                          <span className="block text-[9px] font-black uppercase tracking-widest text-pink-500 mt-0.5">
                            {s.semanaObjetivo}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-500 dark:text-slate-400">
                        {formatApiDate(s.fechaSolicitud)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-600 dark:text-slate-300">
                        {s.proveedor || <span className="text-slate-300 dark:text-slate-600">Sin definir</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest ${estilo.badge}`}>
                          <span className={`size-1.5 rounded-full ${estilo.dot}`} />
                          {estilo.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${s.porcentajeRecibido === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${s.porcentajeRecibido}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-400 whitespace-nowrap text-[10px]">
                            {s.lineasConfirmadas} de {s.totalLineas}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-black font-mono text-slate-600 dark:text-slate-300">
                        {formatoMoneda(s.totalEstimado)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); descargarPdf(s); }}
                          disabled={descargando === s.id}
                          title={`Descargar ${s.folio}.pdf`}
                          className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all disabled:opacity-50"
                        >
                          {descargando === s.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <FileDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Página {page} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPaginas, p + 1))}
                disabled={page >= totalPaginas}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
