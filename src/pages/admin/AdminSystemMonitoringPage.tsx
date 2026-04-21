import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Database, Clock, AlertCircle, CheckCircle2, XCircle,
  RefreshCw, Server, Wrench, Zap, ChevronRight, Wifi, WifiOff,
  Maximize2, Minimize2, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle,
  Link2, BarChart2, HardDrive, Users, Terminal, Cpu, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { HealthCheckResponse, MaintenanceTask, DatabaseMonitorData } from '../../types';
import { FadeIn, ScaleIn, StaggerContainer } from '../../components/Animations';

type SortField = 'totalFilas' | 'tamanoTotalBytes';
type SortDir   = 'asc' | 'desc';

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

export default function AdminSystemMonitoringPage() {
  const [tab,        setTab]        = useState<'estado' | 'monitor'>('estado');
  const [fullscreen, setFullscreen] = useState(false);

  // ── Estado ──
  const [systemInfo,          setSystemInfo]          = useState<HealthCheckResponse | null>(null);
  const [maintenanceResults,  setMaintenanceResults]  = useState<MaintenanceTask[]>([]);
  const [loadingState,        setLoadingState]        = useState(true);
  const [maintenanceLoading,  setMaintenanceLoading]  = useState(false);
  const [maintenanceMsg,      setMaintenanceMsg]      = useState<string | null>(null);
  const [stateError,          setStateError]          = useState<string | null>(null);

  // ── Monitor ──
  const [monitor,        setMonitor]        = useState<DatabaseMonitorData | null>(null);
  const [loadingMonitor, setLoadingMonitor] = useState(false);
  const [monitorError,   setMonitorError]   = useState<string | null>(null);
  const [sortField,      setSortField]      = useState<SortField>('tamanoTotalBytes');
  const [sortDir,        setSortDir]        = useState<SortDir>('desc');
  const [expandedQuery,  setExpandedQuery]  = useState<string | null>(null);

  const loadInfo = useCallback(async () => {
    setLoadingState(true); setStateError(null);
    try { setSystemInfo(await AdminService.getDatabaseHealth()); }
    catch (err: any) { setStateError(err.message || 'Error al cargar estado del sistema'); }
    finally { setLoadingState(false); }
  }, []);

  const loadMonitor = useCallback(async () => {
    setLoadingMonitor(true); setMonitorError(null);
    try { const res = await AdminService.getDatabaseMonitor(); setMonitor(res.data); }
    catch (err: any) { setMonitorError(err.message || 'Error al cargar monitor de BD'); }
    finally { setLoadingMonitor(false); }
  }, []);

  const runMaintenance = async () => {
    setMaintenanceLoading(true); setMaintenanceResults([]); setMaintenanceMsg(null);
    try {
      const res = await AdminService.runMaintenance();
      setMaintenanceResults(res.data);
      setMaintenanceMsg(res.message || 'Mantenimiento ejecutado.');
    } catch (err: any) { setMaintenanceMsg(err.message || 'Error al ejecutar mantenimiento'); }
    finally { setMaintenanceLoading(false); }
  };

  useEffect(() => { loadInfo(); }, [loadInfo]);
  useEffect(() => { if (tab === 'monitor' && !monitor) loadMonitor(); }, [tab, monitor, loadMonitor]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  const sortedTablas = monitor
    ? [...monitor.tablas].sort((a, b) =>
        sortDir === 'asc' ? (a[sortField] as number) - (b[sortField] as number) : (b[sortField] as number) - (a[sortField] as number))
    : [];

  const conectado = systemInfo?.data.conectado;

  return (
    <div className={fullscreen ? 'fixed inset-0 z-[60] bg-slate-50 dark:bg-slate-900 overflow-auto p-8' : 'w-full space-y-6'}>

      {/* Header */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>

            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Dashboard de Salud</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight">Monitoreo en tiempo real de recursos y disponibilidad</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
                <div className={`size-2 rounded-full ${conectado ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{conectado ? 'Database Online' : 'Database Offline'}</span>
             </div>
             <button onClick={() => setFullscreen(!fullscreen)} className="size-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all shadow-sm">
                {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
             </button>
          </div>
        </div>
      </FadeIn>

      {/* Tabs Menu */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
        {[
          { id: 'estado', label: 'Estado Vital', icon: <Server /> },
          { id: 'monitor', label: 'Monitor de Datos', icon: <BarChart2 /> }
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            {React.cloneElement(t.icon as React.ReactElement, { className: 'w-4 h-4' })}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'estado' ? (
          <motion.div key="estado" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="space-y-6">
            
            {/* Health Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Tiempo de Actividad', value: systemInfo?.data.tiempoActividad || '...', icon: <Clock />, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100/70 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/40', trend: 'Sistema Online' },
                { label: 'Carga de Trabajo', value: systemInfo?.data.tiempoRespuesta || '...', icon: <Zap />, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100/70 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/40', trend: 'Latencia' },
                { label: 'Threads Activos', value: systemInfo?.data.conexionesActivas || '0', icon: <Cpu />, color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100/70 dark:bg-purple-500/20', border: 'border-purple-200 dark:border-purple-500/40', trend: 'En ejecución' },
                { label: 'Origen Datos', value: systemInfo?.data.baseDatos || 'BD', icon: <Database />, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/40', trend: 'SQL Server/PG' },
              ].map((s, idx) => (
                <div key={idx} className={`relative overflow-hidden group bg-white dark:bg-slate-800 border ${s.border} rounded-[24px] p-5 transition-all hover:shadow-md h-28`}>
                   <div className="relative z-10 flex flex-col justify-between h-full">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</p>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">{s.value}</h3>
                      <p className={`text-[8px] font-black uppercase tracking-tighter ${s.color} opacity-70`}>{s.trend}</p>
                   </div>
                   {React.cloneElement(s.icon as React.ReactElement, { 
                      className: `absolute -bottom-4 -right-4 w-20 h-20 ${s.color} opacity-10 group-hover:scale-110 transition-transform duration-500`,
                      strokeWidth: 3
                   })}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               {/* Server Info */}
               <div className="lg:col-span-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[32px] overflow-hidden flex flex-col shadow-sm">
                  <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Servidor de Producción</h3>
                     </div>
                     <button onClick={loadInfo} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><RefreshCw className={`w-4 h-4 ${loadingState ? 'animate-spin' : ''}`} /></button>
                  </div>
                  <div className="p-4 space-y-1">
                     {[
                       { k: 'PostgreSQL Engine', v: systemInfo?.data.versionPostgres, icon: <Terminal /> },
                       { k: 'Remote Server', v: systemInfo?.data.servidor, icon: <Server /> },
                       { k: 'Connection Limit', v: systemInfo?.data.conexionesMaximas, icon: <Users /> },
                       { k: 'Last Handshake', v: systemInfo?.data.consultadoEn ? new Date(systemInfo.data.consultadoEn).toLocaleTimeString() : '...', icon: <Clock /> }
                     ].map((item, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors group">
                          <div className="flex items-center gap-3">
                             <div className="text-slate-300 group-hover:text-blue-400 transition-colors">{React.cloneElement(item.icon as React.ReactElement, { className: 'w-4 h-4' })}</div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.k}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.v || '—'}</span>
                       </div>
                     ))}
                  </div>
               </div>

               {/* Maintenance Tools */}
               <div className="lg:col-span-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[32px] overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                     <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Optimización BD</h3>
                  </div>
                  <div className="p-6 space-y-6">
                     <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">Manual Tuning</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                           Ejecuta tareas de reconstrucción de índices y limpieza de espacio. Úselo con precaución durante horas pico.
                        </p>
                     </div>
                     <button onClick={runMaintenance} disabled={maintenanceLoading}
                        className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                        {maintenanceLoading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Wrench className="w-4 h-4"/>}
                        Ejecutar Mantenimiento
                     </button>

                     {maintenanceResults.length > 0 && (
                        <div className="space-y-3 mt-6">
                           {maintenanceResults.map((task, i) => (
                             <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} key={i}
                                className={`p-4 rounded-2xl border ${task.estado === 'COMPLETADO' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/30 text-rose-600'}`}>
                                <div className="flex items-center justify-between mb-1">
                                   <span className="text-[10px] font-black uppercase tracking-widest">{task.tarea}</span>
                                   <span className="text-[9px] font-black">{task.duracionMs.toFixed(0)}ms</span>
                                </div>
                                <p className="text-[10px] font-bold opacity-80">{task.estado}</p>
                             </motion.div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="monitor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="space-y-6">
            
            {/* Monitor Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Peso Total BD', value: monitor?.estadisticas.tamanoTotalBd || '...', icon: <HardDrive />, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100/70 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/40', trend: 'Storage' },
                { label: 'Cache Hit Ratio', value: `${monitor?.estadisticas.porcentajeCacheHit.toFixed(2)}%`, icon: <Zap />, color: monitor?.estadisticas.porcentajeCacheHit >= 95 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300', bg: monitor?.estadisticas.porcentajeCacheHit >= 95 ? 'bg-emerald-100/70 dark:bg-emerald-500/20' : 'bg-amber-100/70 dark:bg-amber-500/20', border: monitor?.estadisticas.porcentajeCacheHit >= 95 ? 'border-emerald-200 dark:border-emerald-500/40' : 'border-amber-200 dark:border-amber-500/40', trend: 'Performance' },
                { label: 'Transacciones', value: monitor?.estadisticas.totalTransacciones.toLocaleString() || '0', icon: <Activity />, color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100/70 dark:bg-indigo-500/20', border: 'border-indigo-200 dark:border-indigo-500/40', trend: 'Actividad' },
                { label: 'Último Vacuum', value: monitor?.estadisticas.fechaUltimoVacuum ? new Date(monitor.estadisticas.fechaUltimoVacuum).toLocaleDateString() : '...', icon: <RefreshCw />, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100/70 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/40', trend: 'Mantenimiento' },
              ].map((s, idx) => (
                <div key={idx} className={`relative overflow-hidden group bg-white dark:bg-slate-800 border ${s.border} rounded-[24px] p-5 shadow-sm transition-all hover:shadow-md h-28`}>
                   <div className="relative z-10 flex flex-col justify-between h-full">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</p>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white truncate tracking-tight">{s.value}</h3>
                      <p className={`text-[8px] font-black uppercase tracking-tighter ${s.color} opacity-70`}>{s.trend}</p>
                   </div>
                   {React.cloneElement(s.icon as React.ReactElement, { 
                      className: `absolute -bottom-4 -right-4 w-20 h-20 ${s.color} opacity-10 group-hover:scale-110 transition-transform duration-500`,
                      strokeWidth: 3
                   })}
                </div>
              ))}
            </div>

            {/* Tables List */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[32px] overflow-hidden shadow-sm">
               <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                     <Terminal className="w-5 h-5 text-slate-400" />
                     <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Dimensiones de Tablas</h3>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                           {['Dataset', 'Filas Estimadas', 'Data Size', 'Index Size', 'Control'].map(h => (
                             <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                           ))}
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {sortedTablas.map((t, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                             <td className="px-8 py-4">
                                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{t.nombreTabla}</span>
                             </td>
                             <td className="px-8 py-4">
                                <span className="text-xs font-bold text-slate-500">{t.totalFilas.toLocaleString()}</span>
                             </td>
                             <td className="px-8 py-4">
                                <span className="text-xs font-black text-blue-600 dark:text-blue-400">{t.tamanoTabla}</span>
                             </td>
                             <td className="px-8 py-4">
                                <span className="text-xs font-bold text-slate-400 italic">{t.tamanoIndices}</span>
                             </td>
                             <td className="px-8 py-4">
                                <div className="flex items-center gap-2">
                                   <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (t.totalFilas / 5000) * 100)}%` }} />
                                   </div>
                                </div>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Slow Queries */}
            <div className="bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/30 rounded-[32px] overflow-hidden shadow-sm">
               <div className="p-6 border-b border-rose-50 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10">
                  <div className="flex items-center gap-3">
                     <AlertTriangle className="w-5 h-5 text-rose-500" />
                     <h3 className="text-sm font-black text-rose-600 uppercase tracking-tight">Performance Bottlenecks</h3>
                  </div>
               </div>
               <div className="p-6 space-y-4">
                  {monitor?.queriesLentos.map((q, i) => (
                    <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3 group">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Slow Operation #{i+1}</span>
                          <span className="text-[10px] font-black text-slate-400">{q.tiempoPromedioMs.toFixed(2)}ms avg</span>
                       </div>
                       <code className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 line-clamp-2 truncate">
                          {q.query}
                       </code>
                    </div>
                  ))}
                  {monitor?.queriesLentos.length === 0 && (
                    <div className="text-center py-10">
                       <CheckCircle2 className="size-12 text-emerald-500 opacity-20 mx-auto mb-3" />
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sistema operando bajo latencia óptima</p>
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}