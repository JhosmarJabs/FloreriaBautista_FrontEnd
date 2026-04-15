import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  ArrowLeftRight,
  FileJson,
  FileSpreadsheet,
  UploadCloud,
  DownloadCloud,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  Settings2,
  ChevronRight,
  RefreshCw,
  Package,
  Boxes,
  X,
  FolderOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DataService } from '../../services/dataService';
import { AdminService } from '../../services/adminService';
import { FadeIn, StaggerContainer, GlassCard, AnimatedButton } from '../../components/Animations';
import { useToast } from '../../hooks/useToast';
import { filterCSV } from '../../utils/exportUtils';

// ─── helpers ─────────────────────────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-modal de opciones export/import ─────────────────────────────────────
function ActionModal({
  mode,
  onClose,
  onExport,
  onImport,
  loading,
}: {
  mode: 'import' | 'export';
  onClose: () => void;
  onExport?: (type: 'products' | 'inventory') => void;
  onImport?: (type: 'products' | 'inventory', file: File) => void;
  loading: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<'products' | 'inventory' | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const isExport = mode === 'export';

  const types = [
    { key: 'products'  as const, label: 'Productos',   icon: <Package className="w-5 h-5" />,  color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/40',   border: 'border-blue-200 dark:border-blue-800' },
    { key: 'inventory' as const, label: 'Inventario',  icon: <Boxes   className="w-5 h-5" />,  color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/40', border: 'border-violet-200 dark:border-violet-800' },
  ];

  const handleConfirm = () => {
    if (!selectedType) return;
    if (isExport) {
      onExport?.(selectedType);
    } else {
      if (!file) return;
      onImport?.(selectedType, file);
    }
  };

  const canConfirm = selectedType && (isExport || file);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-7 z-10 border border-slate-200 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {isExport ? 'Exportar Datos' : 'Importar Datos'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {isExport ? 'Selecciona qué datos descargar' : 'Selecciona qué datos cargar'}
            </p>
          </div>
          <button onClick={onClose}
            className="size-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type selector */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {types.map(t => (
            <button key={t.key} onClick={() => setSelectedType(t.key)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                selectedType === t.key
                  ? `${t.bg} ${t.border} ${t.color}`
                  : 'border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}>
              <span className={`${selectedType === t.key ? t.color : 'text-slate-400'}`}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* File picker (solo import) */}
        {!isExport && (
          <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all mb-5 ${
            file ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50/30' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50/20'
          }`}>
            <FolderOpen className={`w-5 h-5 shrink-0 ${file ? 'text-emerald-500' : 'text-slate-400'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold truncate ${file ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {file ? file.name : 'Seleccionar archivo'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">CSV, JSON o Excel (.csv, .json, .xlsx)</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.json,.xlsx,.xls" className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
        )}

        {/* Confirm */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            Cancelar
          </button>
          <AnimatedButton onClick={handleConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${
              canConfirm
                ? isExport
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                : 'bg-slate-200 cursor-not-allowed'
            }`}>
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Procesando...</>
              : isExport ? <><DownloadCloud className="w-4 h-4" /> Descargar</>
              : <><UploadCloud className="w-4 h-4" /> Importar</>}
          </AnimatedButton>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDataManagementPage() {
  const { showToast } = useToast();
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState<'import' | 'export' | null>(null);
  const [jobLoading, setJobLoading] = useState<string | null>(null);

  useEffect(() => {
    const info = DataService.getSystemInfo();
    setSystemInfo(info);
    setLoading(false);
  }, []);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = async (type: 'products' | 'inventory') => {
    const key = `export_${type}`;
    setJobLoading(key);
    try {
      // Consumimos el endpoint de la API directamente
      const blob = type === 'products'
        ? await AdminService.exportAdminProducts()
        : await AdminService.exportAdminInventory();
      
      // Convertimos a texto para filtrar el ID por seguridad antes de la descarga
      const originalText = await blob.text();
      const filteredText = filterCSV(originalText);
      
      const filteredBlob = new Blob([filteredText], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(filteredBlob, type === 'products' ? 'productos.csv' : 'inventario.csv');
      
      showToast('Archivo exportado desde API (ID filtrado)', 'success');
      setModal(null);
    } catch (err: any) {
      showToast(err.message ?? 'Error al exportar', 'error');
    } finally {
      setJobLoading(null);
    }
  };

  // ── Import ────────────────────────────────────────────────────────────────
  const handleImport = async (type: 'products' | 'inventory', file: File) => {
    const key = `import_${type}`;
    setJobLoading(key);
    try {
      if (type === 'products') {
        const res = await AdminService.importAdminProducts(file);
        const d   = res.data;
        showToast(`${d.totalFilas} filas · +${d.insertados} insertados · ${d.actualizados} actualizados`, 'success');
      } else {
        await AdminService.importAdminInventory(file);
        showToast('Inventario importado correctamente', 'success');
      }
      setModal(null);
    } catch (err: any) {
      showToast(err.message ?? 'Error al importar', 'error');
    } finally {
      setJobLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  const { services } = systemInfo ?? { services: [] };

  const syncItems = (services ?? []).map((s: any) => ({
    name:    s.name,
    lastSync: s.latency === 'N/A' ? 'Nunca' : 'Hace poco',
    status:  s.status === 'Operativo' ? 'Éxito' : 'Pendiente',
    icon: s.type === 'database' ? <Database className="w-5 h-5" /> :
          s.type === 'gateway'  ? <ArrowLeftRight className="w-5 h-5" /> :
          s.type === 'cdn'      ? <FileJson className="w-5 h-5" /> :
                                  <FileSpreadsheet className="w-5 h-5" />,
    pending: s.status !== 'Operativo',
  }));

  return (
    <div className="w-full h-full space-y-8">

      {/* Header */}
      <FadeIn className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Datos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Importación, exportación y sincronización masiva de información</p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatedButton className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
            <History className="w-4 h-4" />
            Historial
          </AnimatedButton>
          <AnimatedButton className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
            <Settings2 className="w-4 h-4" />
            Configurar API
          </AnimatedButton>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Actions */}
        <div className="lg:col-span-2 space-y-8">

          {/* Export / Import Cards */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Importar */}
            <GlassCard
              onClick={() => setModal('import')}
              className="p-8 border-none group cursor-pointer hover:shadow-lg transition-shadow dark:bg-slate-800">
              <div className="size-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Importar Datos</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                Carga masiva de productos o inventario desde archivos CSV, JSON o Excel.
              </p>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-black group-hover:translate-x-1 transition-transform">
                Comenzar importación <ChevronRight className="w-4 h-4" />
              </div>
            </GlassCard>

            {/* Exportar */}
            <GlassCard
              onClick={() => setModal('export')}
              className="p-8 border-none group cursor-pointer hover:shadow-lg transition-shadow dark:bg-slate-800">
              <div className="size-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <DownloadCloud className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Exportar Datos</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                Descarga productos o inventario completo en formato CSV para análisis externo.
              </p>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-black group-hover:translate-x-1 transition-transform">
                Generar reporte <ChevronRight className="w-4 h-4" />
              </div>
            </GlassCard>
          </StaggerContainer>

          {/* Sync Status */}
          {syncItems.length > 0 && (
            <FadeIn delay={0.3}>
              <GlassCard className="border-none overflow-hidden dark:bg-slate-800">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/30">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                    <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Sincronización Externa
                  </h3>
                  <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-xl uppercase tracking-widest shadow-sm border border-emerald-200 dark:border-emerald-800/50">
                    Sincronizado
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  {syncItems.map((sync: any, idx: number) => (
                    <FadeIn key={idx} delay={0.1 * idx}>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm group-hover:scale-110 transition-transform">
                            {sync.icon}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{sync.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {sync.lastSync}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${sync.pending ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {sync.status}
                          </span>
                          {sync.pending
                            ? <Clock className="w-5 h-5 text-amber-500" />
                            : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </GlassCard>
            </FadeIn>
          )}
        </div>

        {/* Sidebar */}
        <StaggerContainer className="space-y-6">
          <GlassCard className="bg-amber-50/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 p-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-widest">Zona de Riesgo</h3>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed mb-8 font-bold">
              Las operaciones de importación masiva pueden sobrescribir datos existentes.
              Asegúrese de realizar un respaldo antes de proceder.
            </p>
            <AnimatedButton className="w-full py-3.5 bg-amber-600 text-white rounded-2xl text-xs font-black hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20">
              Limpiar Caché de Datos
            </AnimatedButton>
          </GlassCard>

          <GlassCard className="p-8 border-none dark:bg-slate-800">
            <h3 className="text-xs font-black text-slate-800 dark:text-white mb-6 uppercase tracking-widest">Formatos Soportados</h3>
            <div className="space-y-3">
              {[
                { fmt: 'CSV',  label: 'Valores Coma',    bg: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
                { fmt: 'JSON', label: 'JavaScript Obj',  bg: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
                { fmt: 'XLSX', label: 'MS Excel',        bg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
              ].map(f => (
                <div key={f.fmt} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-xl ${f.bg} flex items-center justify-center text-[10px] font-black shadow-sm`}>{f.fmt}</div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{f.label}</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                </div>
              ))}
            </div>
          </GlassCard>
        </StaggerContainer>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <ActionModal
            mode={modal}
            onClose={() => setModal(null)}
            onExport={handleExport}
            onImport={handleImport}
            loading={jobLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
