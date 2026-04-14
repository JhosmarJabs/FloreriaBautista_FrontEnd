import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, User, Clock, Search, RefreshCw, Activity, 
  Lock, ChevronLeft, ChevronRight, Filter, Eye, X, ArrowRight,
  Database, AlertCircle, Terminal, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { AuditLog } from '../../types';
import { FadeIn, ScaleIn, AnimatedButton } from '../../components/Animations';

const PAGE_SIZE = 20;

// ── Detail Modal ─────────────────────────────────────────────────────────────
function AuditDetailModal({ entidad, entidadId, onClose }: { entidad: string; entidadId: string; onClose: () => void }) {
  const [items, setItems]   = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await AdminService.getAuditByEntity(entidad, entidadId);
        setItems(res.data);
      } catch (e: any) {
        setError(e.message ?? 'Error al cargar detalles');
      } finally {
        setLoading(false);
      }
    })();
  }, [entidad, entidadId]);

  const parseDetalles = (raw: string | null) => {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <ScaleIn className="relative bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 dark:border-slate-700 bg-white dark:bg-slate-800 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Terminal className="w-3.5 h-3.5 text-rose-500" />
               <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Trazabilidad de cambios</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Historial: {entidad}</h2>
            <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">ID: {entidadId}</p>
          </div>
          <button onClick={onClose} className="size-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors border border-slate-100 dark:border-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-4 bg-slate-50/30 dark:bg-slate-900/10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultando registros...</span>
            </div>
          ) : error ? (
            <p className="text-sm font-bold text-rose-500 text-center py-20 uppercase tracking-widest">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-sm font-bold text-slate-400 text-center py-20 uppercase tracking-widest">Sin registros para esta entidad.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item, idx) => {
                const det = parseDetalles(item.detalles);
                return (
                  <motion.div key={item.id ?? idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm group">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{item.usuarioNombre ?? 'Sistema'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.usuarioCorreo || 'Proceso Automático'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-lg border uppercase tracking-[0.15em] ${
                          item.accion === 'CREAR'    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20' :
                          item.accion === 'ELIMINAR' ? 'bg-rose-50 dark:bg-rose-500/10    text-rose-600    border-rose-100 dark:border-rose-500/20'    :
                                                       'bg-blue-50 dark:bg-blue-500/10   text-blue-600   border-blue-100 dark:border-blue-500/20'
                        }`}>{item.accion}</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(item.fechaHora).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {det && (
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor anterior</p>
                          {det.antes ? (
                            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 space-y-1">
                               {Object.entries(det.antes).map(([k, v]) => (
                                 <div key={k} className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                                    <span className="text-slate-400 font-black uppercase text-[8px]">{k}</span>
                                    <span>{v === null ? 'NULL' : String(v)}</span>
                                 </div>
                               ))}
                            </div>
                          ) : <span className="text-[10px] text-slate-300 font-black tracking-widest uppercase">N/A</span>}
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 rotate-90 md:rotate-0" />
                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Nuevo valor</p>
                          {det.despues ? (
                            <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 space-y-1">
                               {Object.entries(det.despues).map(([k, v]) => (
                                 <div key={k} className="flex justify-between border-b border-white dark:border-slate-700 pb-1">
                                    <span className="text-slate-400 dark:text-slate-500 font-black uppercase text-[8px]">{k}</span>
                                    <span className="text-rose-600 dark:text-rose-400">{v === null ? 'NULL' : String(v)}</span>
                                 </div>
                               ))}
                            </div>
                          ) : <span className="text-[10px] text-slate-300 font-black tracking-widest uppercase">N/A</span>}
                        </div>
                      </div>
                    )}

                    {!det && item.detalles && (
                      <pre className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 p-4 whitespace-pre-wrap break-all mt-4 leading-relaxed">
                        {item.detalles}
                      </pre>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </ScaleIn>
    </div>
  );
}

export default function AdminAuditPage() {
  const [logs, setLogs]             = useState<AuditLog[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPags, setTotalPags]   = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [timeStr, setTimeStr]       = useState('');
  const [detail, setDetail] = useState<{ entidad: string; entidadId: string } | null>(null);

  const [busqueda, setBusqueda]     = useState('');
  const [entidad, setEntidad]       = useState('');
  const [accion, setAccion]         = useState('');
  const [desde, setDesde]           = useState('');
  const [hasta, setHasta]           = useState('');

  useEffect(() => {
    const update = () => setTimeStr(new Date().toLocaleTimeString('es-MX', { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminService.getAuditLogs({
        entidad:  entidad  || undefined,
        accion:   accion   || undefined,
        desde:    desde    || undefined,
        hasta:    hasta    || undefined,
        page,
        size: PAGE_SIZE,
      });
      setLogs(res.data.items);
      setTotal(res.data.total);
      setTotalPags(res.data.totalPaginas > 0 ? res.data.totalPaginas : 1);
    } catch {
      // quiet
    } finally {
      setLoading(false);
    }
  }, [entidad, accion, desde, hasta, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [entidad, accion, desde, hasta]);

  const filtered = busqueda.trim()
    ? logs.filter(l => {
        const q = busqueda.toLowerCase();
        return (
          (l.usuarioNombre  ?? '').toLowerCase().includes(q) ||
          (l.usuarioCorreo  ?? '').toLowerCase().includes(q) ||
          (l.accion         ?? '').toLowerCase().includes(q) ||
          (l.entidad        ?? '').toLowerCase().includes(q)
        );
      })
    : logs;

  const stats = [
    { label: 'Eventos registrados', value: total, icon: <Activity />, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
    { label: 'Acciones críticas', value: logs.filter(l => l.accion === 'ELIMINAR').length, icon: <ShieldAlert />, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { label: 'Operaciones BD', value: total, icon: <Database />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Session OK', value: 'ACTIVO', icon: <Lock />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ];

  return (
    <div className="w-full space-y-6">

      {/* Header */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Seguridad Informática</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Libro de Auditoría</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Historial completo e inmutable de operaciones del administrador</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden lg:flex flex-col items-end text-right px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Server Time</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-white uppercase">{timeStr}</span>
             </div>
             <AnimatedButton onClick={load} disabled={loading} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
             </AnimatedButton>
          </div>
        </div>
      </FadeIn>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-4 flex gap-4 hover:shadow-lg transition-all">
            <div className={`size-10 rounded-2xl ${s.bg} dark:bg-opacity-10 ${s.color} shrink-0 flex items-center justify-center border ${s.border} dark:border-current dark:border-opacity-20`}>
              {React.cloneElement(s.icon as React.ReactElement, { className: 'w-5 h-5' })}
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1.5">{s.label}</p>
              <h3 className="text-xl font-black text-slate-800 dark:text-white leading-none">{loading ? '—' : s.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[32px] p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          <Filter className="w-3.5 h-3.5" /> Motor de filtrado
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Búsqueda rápida en resultados..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all" />
          </div>
          <input type="text" placeholder="Entidad..." value={entidad} onChange={e => setEntidad(e.target.value)}
            className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold w-40 outline-none focus:ring-4 focus:ring-rose-500/10" />
          <input type="text" placeholder="Acción..." value={accion} onChange={e => setAccion(e.target.value)}
            className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold w-40 outline-none focus:ring-4 focus:ring-rose-500/10" />
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1 px-4 rounded-2xl border border-slate-100 dark:border-slate-700">
             <Calendar className="w-4 h-4 text-slate-300" />
             <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="bg-transparent text-xs font-bold outline-none uppercase w-28" />
             <span className="text-slate-300 mx-1">/</span>
             <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="bg-transparent text-xs font-bold outline-none uppercase w-28" />
          </div>
          {(entidad || accion || desde || hasta) && (
            <button onClick={() => { setEntidad(''); setAccion(''); setDesde(''); setHasta(''); }}
               className="size-12 bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center rounded-2xl hover:bg-rose-100 transition-all active:scale-90">
               <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Log Data List */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[32px] overflow-hidden shadow-sm flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                {['Operador', 'Acción realizada', 'Módulo / Entidad', 'Registro temporal', 'Detalle'].map(h => (
                  <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {loading ? (
                <tr><td colSpan={5} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escaneando logs de actividad...</p>
                   </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-4 text-slate-200">
                      <ShieldAlert className="size-16 opacity-10" />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Sin eventos detectados</p>
                   </div>
                </td></tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map((log, idx) => (
                    <motion.tr key={log.id ?? idx} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.01 }}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                           <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400">
                              <User className="w-4 h-4" />
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{log.usuarioNombre || 'Sistema'}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{log.usuarioCorreo || 'Proceso interno'}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase tracking-[0.1em] ${
                          log.accion === 'CREAR' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          log.accion === 'ELIMINAR' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>{log.accion}</span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                           <HardDrive className="w-3.5 h-3.5 text-slate-300" />
                           <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase underline decoration-slate-200 underline-offset-4">{log.entidad}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                           <span className="text-xs font-black text-slate-600 dark:text-slate-400">{new Date(log.fechaHora).toLocaleDateString()}</span>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{new Date(log.fechaHora).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        {log.entidad && log.entidadId ? (
                           <button onClick={() => setDetail({ entidad: log.entidad!, entidadId: log.entidadId! })}
                              className="size-10 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900 transition-all rounded-xl flex items-center justify-center shadow-inner">
                              <Eye className="w-4 h-4" />
                           </button>
                        ) : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filtered.length} de {total} registros</span>
           {totalPags > 1 && (
             <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-all"><ChevronLeft className="w-5 h-5"/></button>
                <div className="flex gap-1">
                   {Array.from({length: Math.min(totalPags, 5)}, (_, i) => (
                      <button key={i} onClick={() => setPage(i+1)} className={`size-8 rounded-xl text-[10px] font-black ${page === i+1 ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>{i+1}</button>
                   ))}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPags, p + 1))} disabled={page === totalPags} className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30 transition-all"><ChevronRight className="w-5 h-5"/></button>
             </div>
           )}
        </div>
      </div>

      <AnimatePresence>
        {detail && <AuditDetailModal entidad={detail.entidad} entidadId={detail.entidadId} onClose={() => setDetail(null)} />}
      </AnimatePresence>

    </div>
  );
}
