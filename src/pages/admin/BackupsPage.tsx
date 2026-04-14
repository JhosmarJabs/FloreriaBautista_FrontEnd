import React, { useState, useEffect } from 'react';
import {
  ChevronRight, Database, CloudUpload, AlertTriangle, RefreshCw, 
  Plus, Table, CheckCircle2, XCircle, Clock, HardDrive, Zap, 
  Calendar, Filter, X, ArrowUp, ArrowDown, ArrowUpDown, 
  ToggleLeft, ToggleRight, RotateCcw, Search, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { Backup } from '../../types';
import { FadeIn, ScaleIn, AnimatedButton } from '../../components/Animations';

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [descFull, setDescFull] = useState('');
  const [loadingFull, setLoadingFull] = useState(false);
  const [resultFull, setResultFull] = useState<{ ok: boolean; msg: string } | null>(null);

  const [tabla, setTabla] = useState('');
  const [descTabla, setDescTabla] = useState('');
  const [loadingTabla, setLoadingTabla] = useState(false);
  const [resultTabla, setResultTabla] = useState<{ ok: boolean; msg: string } | null>(null);

  const [frecuencia, setFrecuencia] = useState('DIARIO');
  const [hora, setHora] = useState('02:00');
  const [diaSemana, setDiaSemana] = useState(0);
  const [backupActivo, setBackupActivo] = useState(true);
  const [mantenimientoActivo, setMantenimientoActivo] = useState(true);
  const [schedulerInfo, setSchedulerInfo] = useState<{ proximoBackup: string; proximoMantenimiento: string } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [resultConfig, setResultConfig] = useState<{ ok: boolean; msg: string } | null>(null);

  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [sortBy, setSortBy] = useState<'fecha' | 'tamano'>('fecha');
  const [sortDir, setSortDir] = useState<'desc' | 'desc'>('desc');

  // Restore modal
  const [restoreBackup, setRestoreBackup] = useState<Backup | null>(null);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [resultRestore, setResultRestore] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadBackups = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdminService.getDriveBackups();
      if (response.success && response.data) {
        setBackups(response.data);
      } else {
        setError(response.message || 'Error al cargar los respaldos');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleFullBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingFull(true);
    setResultFull(null);
    try {
      const res = await AdminService.createFullBackup(descFull);
      setResultFull({ ok: res.success, msg: res.message || 'Respaldo completo creado.' });
      if (res.success) { setDescFull(''); loadBackups(); }
    } catch (err: any) {
      setResultFull({ ok: false, msg: err.message });
    } finally { setLoadingFull(false); }
  };

  const handleTableBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingTabla(true);
    setResultTabla(null);
    try {
      const res = await AdminService.createTableBackup(tabla, descTabla);
      setResultTabla({ ok: res.success, msg: res.message || 'Respaldo de tabla creado.' });
      if (res.success) { setTabla(''); setDescTabla(''); loadBackups(); }
    } catch (err: any) {
      setResultTabla({ ok: false, msg: err.message });
    } finally { setLoadingTabla(false); }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingConfig(true);
    setResultConfig(null);
    try {
      const horaNum = parseInt(hora.split(':')[0], 10);
      const res = await AdminService.saveSchedulerConfig({
        backupAutomaticoActivo: backupActivo,
        frecuencia,
        diaSemana,
        hora: isNaN(horaNum) ? 2 : horaNum,
        mantenimientoActivo,
      });
      setResultConfig({ ok: res.success, msg: res.message || 'Configuración guardada.' });
      if (res.success && res.data) {
        const d = res.data;
        setFrecuencia(d.frecuencia);
        setHora(d.horaFormato);
        setDiaSemana(d.diaSemana);
        setBackupActivo(d.backupAutomaticoActivo);
        setMantenimientoActivo(d.mantenimientoActivo);
        setSchedulerInfo({ proximoBackup: d.proximoBackup, proximoMantenimiento: d.proximoMantenimiento });
      }
    } catch (err: any) {
      setResultConfig({ ok: false, msg: err.message });
    } finally { setLoadingConfig(false); }
  };

  const handleRestore = async () => {
    if (!restoreBackup) return;
    setLoadingRestore(true);
    setResultRestore(null);
    try {
      const res = await AdminService.restoreBackup(restoreBackup.id);
      setResultRestore({ ok: res.success, msg: res.message || 'Restauración iniciada.' });
      if (res.success) { setTimeout(() => { setRestoreBackup(null); setResultRestore(null); loadBackups(); }, 3000); }
    } catch (err: any) {
      setResultRestore({ ok: false, msg: err.message });
    } finally { setLoadingRestore(false); }
  };

  useEffect(() => {
    loadBackups();
    AdminService.getScheduler().then(res => {
      if (res.success && res.data) {
        const d = res.data;
        setFrecuencia(d.frecuencia ?? 'DIARIO');
        setHora(d.horaFormato ?? '02:00');
        setDiaSemana(d.diaSemana ?? 0);
        setBackupActivo(d.backupAutomaticoActivo ?? true);
        setMantenimientoActivo(d.mantenimientoActivo ?? true);
        setSchedulerInfo({ proximoBackup: d.proximoBackup, proximoMantenimiento: d.proximoMantenimiento });
      }
    }).catch(() => {/* silencioso */});
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const getBackupType = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes('completo') || n.includes('full')) return { label: 'Base de Datos', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' };
    if (n.includes('estatico') || n.includes('archivo')) return { label: 'BD + Estáticos', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' };
    return { label: 'Parcial', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-700/50', border: 'border-slate-100 dark:border-slate-700' };
  };

  const activeFilters = [filterFechaDesde, filterFechaHasta, filterTipo].filter(Boolean).length;

  const filteredBackups = backups
    .filter(b => {
      const date = new Date(b.creadoEn);
      if (filterFechaDesde && date < new Date(filterFechaDesde)) return false;
      if (filterFechaHasta && date > new Date(filterFechaHasta + 'T23:59:59')) return false;
      if (filterTipo) {
        const tipo = getBackupType(b.nombre).label;
        if (tipo !== filterTipo) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'fecha') return mul * (new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime());
      return mul * (a.tamanoBytes - b.tamanoBytes);
    });

  return (
    <div className="w-full space-y-6">

      {/* Header */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Infraestructura Técnica</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Respaldos y Seguridad</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Administración de copias de seguridad sincronizadas con la nube</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl">
            <CloudUpload className="w-4 h-4 text-blue-500" />
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Google Drive Conectado</p>
          </div>
        </div>
      </FadeIn>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Respaldos totales', value: loading ? '—' : backups.length, icon: <HardDrive />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
          { label: 'Última copia', value: backups.length ? new Date(backups[0].creadoEn).toLocaleDateString() : 'N/A', icon: <Clock />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
          { label: 'Próxima tarea', value: schedulerInfo ? schedulerInfo.proximoBackup.split(' ')[0] : 'N/A', icon: <Zap />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
          { label: 'Espacio usado', value: formatSize(backups.reduce((a, b) => a + b.tamanoBytes, 0)), icon: <Database />, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-white dark:bg-slate-800 border ${s.border} rounded-2xl p-4 flex gap-4`}>
            <div className={`size-10 rounded-xl ${s.bg} border ${s.border} ${s.color} flex items-center justify-center shrink-0`}>
              {React.cloneElement(s.icon as React.ReactElement, { className: 'w-5 h-5' })}
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{s.label}</p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">{s.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Forms Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Create Backup */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
             <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center"><Plus className="w-4 h-4"/></div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Nuevo Respaldo</h3>
             </div>
             <form onSubmit={handleFullBackup} className="p-5 space-y-4">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Descripción corta</label>
                   <input type="text" value={descFull} onChange={e => setDescFull(e.target.value)} required
                    placeholder="Ej: Backup antes de migrar"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none transition-all dark:text-white" />
                </div>
                <button type="submit" disabled={loadingFull}
                   className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50 transition-all active:scale-95">
                   {loadingFull ? <RefreshCw className="w-4 h-4 animate-spin"/> : <CloudUpload className="w-4 h-4"/>}
                   Crear respaldo full
                </button>
                {resultFull && (
                   <div className={`p-3 rounded-xl text-[10px] font-bold uppercase tracking-tight ${resultFull.ok ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      {resultFull.msg}
                   </div>
                )}
             </form>
          </div>

          {/* Scheduler Config */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
             <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center"><Calendar className="w-4 h-4"/></div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Automatización</h3>
             </div>
             <form onSubmit={handleSaveConfig} className="p-5 space-y-5">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                   <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${backupActivo ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                      <span className="text-[10px] font-black text-slate-500 uppercase">Respaldo Automático</span>
                   </div>
                   <button type="button" onClick={() => setBackupActivo(v => !v)} className="transition-all active:scale-90">
                      {backupActivo ? <ToggleRight className="w-10 h-10 text-emerald-500" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Frecuencia</label>
                      <select value={frecuencia} onChange={e => setFrecuencia(e.target.value)}
                         className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none dark:text-white">
                         <option value="DIARIO">Diario</option>
                         <option value="SEMANAL">Semanal</option>
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Hora ejec.</label>
                      <input type="time" value={hora} onChange={e => setHora(e.target.value)}
                         className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none dark:text-white" />
                   </div>
                </div>

                <button type="submit" disabled={loadingConfig}
                   className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all active:scale-95">
                   {loadingConfig ? <RefreshCw className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                   Guardar Configuración
                </button>
                {resultConfig && (
                   <div className={`p-3 rounded-xl text-[10px] font-bold uppercase tracking-tight ${resultConfig.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {resultConfig.msg}
                   </div>
                )}
             </form>
          </div>
        </div>

        {/* List Content */}
        <div className="lg:col-span-8">
           <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full">
              
              {/* Filter Bar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                 <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="date" value={filterFechaDesde} onChange={e => setFilterFechaDesde(e.target.value)}
                       className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none" />
                 </div>
                 <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none">
                    <option value="">Todos los tipos</option>
                    <option value="Base de Datos">Base de Datos</option>
                    <option value="BD + Estáticos">BD + Estáticos</option>
                 </select>
                 <button onClick={loadBackups} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-500 transition-all">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                 </button>
              </div>

              <div className="overflow-x-auto flex-1">
                 {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-3">
                       <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leyendo metadatos de Drive...</p>
                    </div>
                 ) : (
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                             {['Nombre y tipo', 'Información', 'Estado', 'Creado', 'Acciones'].map(h => (
                                <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                             ))}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                          <AnimatePresence mode="popLayout">
                             {filteredBackups.map((backup, idx) => {
                                const tipo = getBackupType(backup.nombre);
                                return (
                                   <motion.tr key={backup.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                                      className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                                      <td className="px-6 py-4">
                                         <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl border ${tipo.border} ${tipo.bg} ${tipo.color}`}>
                                               <Database className="w-4 h-4" />
                                            </div>
                                            <div>
                                               <p className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{backup.nombre}</p>
                                               <p className={`text-[9px] font-black uppercase tracking-widest ${tipo.color}`}>{tipo.label}</p>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="px-6 py-4">
                                         <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                                            <HardDrive className="w-3.5 h-3.5 text-slate-300" />
                                            {formatSize(backup.tamanoBytes)}
                                         </div>
                                      </td>
                                      <td className="px-6 py-4">
                                         <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                                            <CheckCircle2 className="w-3 h-3" /> Drive OK
                                         </span>
                                      </td>
                                      <td className="px-6 py-4">
                                         <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(backup.creadoEn).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(backup.creadoEn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                                         </div>
                                      </td>
                                      <td className="px-6 py-4">
                                         <button onClick={() => setRestoreBackup(backup)} title="Restaurar base de datos"
                                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition-all">
                                            <RotateCcw className="w-4 h-4" />
                                         </button>
                                      </td>
                                   </motion.tr>
                                );
                             })}
                          </AnimatePresence>
                       </tbody>
                    </table>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Restore Modal */}
      <AnimatePresence>
        {restoreBackup && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRestoreBackup(null)} />
             <ScaleIn className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
                <div className="size-20 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 border-8 border-white dark:border-slate-800 shadow-xl">
                   <ShieldAlert className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">¿Confirmar Restauración?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                   Estás por restaurar la base de datos al estado de <br/><span className="text-slate-900 dark:text-white font-black underline decoration-amber-400">"{restoreBackup.nombre}"</span>.
                   <br/><strong>Los datos actuales se perderán permanentemente.</strong>
                </p>

                {resultRestore && (
                   <div className={`mb-6 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest ${resultRestore.ok ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                      {resultRestore.msg}
                   </div>
                )}

                <div className="flex gap-3">
                   <button onClick={() => setRestoreBackup(null)} disabled={loadingRestore}
                      className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-slate-200">
                      Cancelar
                   </button>
                   <button onClick={handleRestore} disabled={loadingRestore || resultRestore?.ok}
                      className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2">
                       {loadingRestore ? <RefreshCw className="w-4 h-4 animate-spin"/> : 'Confirmar'}
                   </button>
                </div>
             </ScaleIn>
           </div>
        )}
      </AnimatePresence>

    </div>
  );
}