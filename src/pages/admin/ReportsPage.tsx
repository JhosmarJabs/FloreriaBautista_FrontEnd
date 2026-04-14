import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, UserPlus, Package,
  Download, FileText, Filter, ChevronDown, Minus, RefreshCw, BarChart2,
  FlaskConical, Flower2, Activity, Layers, ChevronRight, PieChart,
  Calendar, MapPin, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DataService } from '../../services/dataService';
import { FadeIn, StaggerContainer, GlassCard, AnimatedButton } from '../../components/Animations';

// ─── Mock data para las gráficas estadísticas ─────────────────────────────────
const FLOWER_STATS = [
  { nombre: 'Rosa Roja',    x0: 42, k: 0.08,  promedio: 42, media: 40, moda: 38, color: '#e11d48', light: '#ffe4e6' },
  { nombre: 'Tulipán',      x0: 30, k: -0.05, promedio: 30, media: 28, moda: 25, color: '#7c3aed', light: '#ede9fe' },
  { nombre: 'Girasol',      x0: 25, k: 0.12,  promedio: 25, media: 24, moda: 20, color: '#d97706', light: '#fef3c7' },
  { nombre: 'Orquídea',     x0: 18, k: -0.03, promedio: 18, media: 17, moda: 15, color: '#db2777', light: '#fce7f3' },
  { nombre: 'Lirio',        x0: 22, k: 0.04,  promedio: 22, media: 21, moda: 20, color: '#2563eb', light: '#dbeafe' },
  { nombre: 'Margarita',    x0: 35, k: 0.06,  promedio: 35, media: 34, moda: 30, color: '#059669', light: '#d1fae5' },
];

const ARREGLOS = [
  { nombre: 'Bouquet Clásico',   flores: [{ nombre: 'Rosa Roja', requerido: 12, disponible: 85 }, { nombre: 'Margarita', requerido: 6, disponible: 120 }], demanda: 8 },
  { nombre: 'Arreglo Primavera', flores: [{ nombre: 'Tulipán', requerido: 8, disponible: 45 }, { nombre: 'Lirio', requerido: 4, disponible: 60 }], demanda: 5 },
  { nombre: 'Girasoles Felices', flores: [{ nombre: 'Girasol', requerido: 10, disponible: 32 }, { nombre: 'Margarita', requerido: 5, disponible: 120 }], demanda: 3 },
  { nombre: 'Orquídea Exótica',  flores: [{ nombre: 'Orquídea', requerido: 3, disponible: 18 }, { nombre: 'Lirio', requerido: 2, disponible: 60 }], demanda: 4 },
];

const WEEKS = 12;

function calcExponential(x0: number, k: number, t: number) {
  return x0 * Math.exp(k * t);
}

// ─── Gráfica 5.1 — Promedio / Media / Moda ───────────────────────────────────
function Chart51() {
  const maxVal = Math.max(...FLOWER_STATS.flatMap(f => [f.promedio, f.media, f.moda]));
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <FadeIn>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-[32px] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
               <FlaskConical className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Estadística Descriptiva</span>
                <span className="size-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-black text-slate-400">SECCIÓN 5.1</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Análisis de Tendencia Central</h3>
            </div>
          </div>
          <div className="flex items-center gap-5 shrink-0 bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 rounded-[20px] border border-slate-100 dark:border-slate-700/50">
            {[
              { color: 'bg-blue-600', label: 'Promedio' },
              { color: 'bg-violet-500', label: 'Media' },
              { color: 'bg-amber-400', label: 'Moda' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-full ${l.color} shadow-sm`} />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart body */}
        <div className="p-8">
          <div className="flex items-end gap-5 h-72 lg:px-6">
            {FLOWER_STATS.map((f, i) => (
              <motion.div
                key={f.nombre}
                className="flex-1 flex flex-col gap-2 cursor-pointer group relative"
                onHoverStart={() => setHovered(f.nombre)}
                onHoverEnd={() => setHovered(null)}
              >
                {/* Tooltip */}
                <AnimatePresence>
                  {hovered === f.nombre && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black px-4 py-2 rounded-2xl whitespace-nowrap shadow-2xl pointer-events-none"
                    >
                      PROM: {f.promedio} · MED: {f.media} · MOD: {f.moda}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative flex items-end justify-center gap-1 h-full">
                  {/* Promedio */}
                  <motion.div
                    className="flex-1 rounded-t-xl bg-blue-600 origin-bottom shadow-lg shadow-blue-500/10 group-hover:brightness-110 transition-all"
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.07 + 0.2, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                    style={{ height: `${(f.promedio / maxVal) * 100}%` }}
                  />
                  {/* Media */}
                  <motion.div
                    className="flex-1 rounded-t-xl bg-violet-500 origin-bottom shadow-lg shadow-violet-500/10 group-hover:brightness-110 transition-all"
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.07 + 0.3, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                    style={{ height: `${(f.media / maxVal) * 100}%` }}
                  />
                  {/* Moda */}
                  <motion.div
                    className="flex-1 rounded-t-xl bg-amber-400 origin-bottom shadow-lg shadow-amber-500/10 group-hover:brightness-110 transition-all"
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.07 + 0.4, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                    style={{ height: `${(f.moda / maxVal) * 100}%` }}
                  />
                </div>

                <div className="text-center">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-tighter uppercase line-clamp-1">
                    {f.nombre}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Key Indicators Table */}
          <div className="mt-10 bg-slate-50/50 dark:bg-slate-900/30 rounded-[28px] border border-slate-100 dark:border-slate-700/50 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  {['Unidad Floral', 'x₀ Inicial', 'Promedio', 'Media', 'Moda', 'Trend'].map(h => (
                    <th key={h} className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30">
                {FLOWER_STATS.map((f, i) => (
                  <motion.tr key={f.nombre} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.03 }}
                    className="hover:bg-white dark:hover:bg-slate-800 transition-colors">
                    <td className="px-8 py-4 font-black text-xs text-slate-800 dark:text-slate-200 uppercase tracking-tight">{f.nombre}</td>
                    <td className="px-8 py-4 font-mono text-xs font-black text-slate-400">{f.x0}</td>
                    <td className="px-8 py-4 font-black text-xs text-blue-600 dark:text-blue-400">{f.promedio}</td>
                    <td className="px-8 py-4 font-black text-xs text-violet-500 dark:text-violet-400">{f.media}</td>
                    <td className="px-8 py-4 font-black text-xs text-amber-500">{f.moda}</td>
                    <td className="px-8 py-4">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${f.k > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600'}`}>
                          {f.k > 0 ? 'GROWTH +' : 'DECLINE -'}
                       </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

// ─── Gráfica 5.2 — Curvas Exponenciales x(t) = x₀·eᵏᵗ ───────────────────────
function Chart52() {
  const [activeFlowers, setActiveFlowers] = useState<string[]>(FLOWER_STATS.map(f => f.nombre));

  const toggle = (nombre: string) =>
    setActiveFlowers(prev => prev.includes(nombre) ? prev.filter(n => n !== nombre) : [...prev, nombre]);

  const points = FLOWER_STATS.map(f => {
    const vals = Array.from({ length: WEEKS }, (_, t) => calcExponential(f.x0, f.k, t));
    return { ...f, vals };
  });

  const allVals = points.flatMap(p => p.vals);
  const maxY = Math.max(...allVals) * 1.05;
  const minY = Math.min(...allVals) * 0.95;

  const W = 800; const H = 340;
  const padX = 60; const padY = 40;
  const chartW = W - padX - 40; const chartH = H - padY * 2;

  const toSvgX = (t: number) => padX + (t / (WEEKS - 1)) * chartW;
  const toSvgY = (v: number) => padY + chartH - ((v - minY) / (maxY - minY)) * chartH;

  const toPath = (vals: number[]) =>
    vals.map((v, t) => `${t === 0 ? 'M' : 'L'}${toSvgX(t).toFixed(1)},${toSvgY(v).toFixed(1)}`).join(' ');

  return (
    <FadeIn delay={0.1}>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-[32px] shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="size-10 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-violet-500" />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Modelado Dinámico</span>
                  <span className="size-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-black text-slate-400">SECCIÓN 5.2</span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Ecuación de Diferencial de Demanda</h3>
             </div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex flex-wrap gap-2 mb-8">
            {FLOWER_STATS.map(f => (
              <button key={f.nombre} onClick={() => toggle(f.nombre)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeFlowers.includes(f.nombre) ? 'text-white shadow-xl shadow-current/20 scale-105' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-700'}`}
                style={activeFlowers.includes(f.nombre) ? { background: f.color, borderColor: f.color } : {}}>
                <span className="size-1.5 rounded-full" style={{ background: activeFlowers.includes(f.nombre) ? 'white' : f.color }} />
                {f.nombre}
                <span className="opacity-50 ml-1">{f.k > 0 ? '↑' : '↓'}</span>
              </button>
            ))}
          </div>

          <div className="overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 rounded-[32px] border border-slate-100 dark:border-slate-800 p-4">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto drop-shadow-2xl">
              {/* Y-axis grid */}
              {[0, 0.25, 0.5, 0.75, 1].map(p => {
                const y = padY + chartH * p;
                const val = maxY - (maxY - minY) * p;
                return (
                  <g key={p}>
                    <line x1={padX} y1={y} x2={W-padX} y2={y} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />
                    <text x={padX - 12} y={y + 4} textAnchor="end" fontSize="10" fontWeight="900" className="fill-slate-400 font-mono tracking-tighter uppercase">{val.toFixed(0)}</text>
                  </g>
                );
              })}

              {/* Curves */}
              <AnimatePresence>
                {points.map(f => activeFlowers.includes(f.nombre) && (
                  <motion.path
                    key={f.nombre}
                    d={toPath(f.vals)}
                    fill="none"
                    stroke={f.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: [0.65, 0, 0.35, 1] }}
                  />
                ))}
              </AnimatePresence>
            </svg>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

// ─── Gráfica 3 — Composición de Arreglos vs Inventario ───────────────────────
function Chart3() {
  return (
    <FadeIn delay={0.2}>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-[32px] shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-500" />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Soporte a Decisiones</span>
                  <span className="size-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-black text-slate-400">SECCIÓN 5.3</span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Capacidad vs Demanda Receptada</h3>
             </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {ARREGLOS.map((arreglo, ai) => {
            const maxProducible = Math.min(
              ...arreglo.flores.map(f => Math.floor(f.disponible / f.requerido))
            );
            const pctDemanda = Math.min((arreglo.demanda / Math.max(1, maxProducible)) * 100, 100);
            const sinStock = maxProducible === 0;

            return (
              <motion.div key={arreglo.nombre} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ai * 0.1 }}
                className="bg-slate-50/50 dark:bg-slate-900/10 rounded-[32px] p-8 border border-slate-100 dark:border-slate-700/50 group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{arreglo.nombre}</h4>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-tight">
                       Demanda: <span className="text-slate-900 dark:text-white">{arreglo.demanda} u/semana</span> &nbsp;·&nbsp; Potencial: <span className="text-emerald-600 font-black">{maxProducible} u</span>
                    </p>
                  </div>
                  <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${sinStock ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-xl shadow-emerald-500/10'}`}>
                    {sinStock ? 'Out of Production' : 'Operational Readiness'}
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {arreglo.flores.map((f, fi) => {
                         const critico = f.disponible < (f.requerido * arreglo.demanda);
                         return (
                           <div key={fi} className="p-5 bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-4 group/item">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <div className={`size-8 rounded-xl ${critico ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'} flex items-center justify-center transition-colors`}>
                                       <Flower2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{f.nombre}</span>
                                 </div>
                                 <span className={`text-[10px] font-black ${critico ? 'text-rose-500' : 'text-emerald-500'}`}>{critico ? 'CRITICAL' : 'OPTIMAL'}</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                 <motion.div
                                    className={`h-full rounded-full ${critico ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'}`}
                                    initial={{ width: 0 }} animate={{ width: `${Math.min(100, (f.disponible / (f.requerido * arreglo.demanda * 2)) * 100)}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                 />
                              </div>
                              <div className="flex items-center justify-between px-1">
                                 <span className="text-[10px] font-bold text-slate-400">STOCK: {f.disponible}</span>
                                 <span className="text-[10px] font-bold text-slate-400">REQ: {f.requerido}/u</span>
                              </div>
                           </div>
                         )
                      })}
                   </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </FadeIn>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [stats, setStats]                     = useState<any>(null);
  const [weeklySales, setWeeklySales]         = useState<any[]>([]);
  const [topCustomers, setTopCustomers]       = useState<any[]>([]);
  const [topProducts, setTopProducts]         = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [inventoryStats, setInventoryStats]   = useState<any>(null);
  const [loading, setLoading]                 = useState(true);
  const [activeTab, setActiveTab]             = useState<'general' | 'demanda'>('general');

  useEffect(() => {
    setStats(DataService.getDashboardStats());
    setWeeklySales(DataService.getWeeklySalesData());
    setTopCustomers(DataService.getTopCustomers(3));
    setTopProducts(DataService.getTopProducts(4));
    setInventoryAlerts(DataService.getInventoryAlerts().slice(0, 3));
    setInventoryStats(DataService.getInventoryStats());
    setLoading(false);
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <RefreshCw className="size-10 text-blue-500 animate-spin" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sincronizando Metadatabase...</span>
    </div>
  );

  return (
    <div className="w-full space-y-8 pb-16">

      {/* Header Area */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
               </div>
               <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Business Intelligence</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Reportes Analíticos</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Visión integral de métricas operativas y proyecciones de stock.</p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
             <button onClick={() => setActiveTab('general')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'general' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}>GENERAL</button>
             <button onClick={() => setActiveTab('demanda')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'demanda' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}>DEMANDA (MATH)</button>
          </div>
        </div>
      </FadeIn>

      <AnimatePresence mode="wait">
        {activeTab === 'general' ? (
          <motion.div key="general" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-8">
            
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { label: 'Ingresos Totales', val: `$${stats?.totalSales.toLocaleString()}`, icon: <TrendingUp />, trend: '+12.5%', color: 'text-blue-600' },
                 { label: 'Pedidos Generados', val: stats?.orderCount, icon: <ShoppingBag />, trend: '+8.2%', color: 'text-emerald-500' },
                 { label: 'Ticket Promedio', val: `$${stats?.averageTicket.toFixed(2)}`, icon: <PieChart />, trend: '-2.1%', color: 'text-amber-500' },
                 { label: 'Nuevos Clientes', val: stats?.newCustomers, icon: <UserPlus />, trend: '+15%', color: 'text-indigo-500' },
               ].map((kpi, idx) => (
                 <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-[32px] shadow-sm group">
                    <div className="flex items-start justify-between mb-8">
                       <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:scale-110 transition-transform">
                          {React.cloneElement(kpi.icon as React.ReactElement, { className: 'w-5 h-5' })}
                       </div>
                       <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg ${kpi.trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>{kpi.trend}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                    <h4 className={`text-xl font-black text-slate-900 dark:text-white tracking-tight`}>{kpi.val || '—'}</h4>
                 </motion.div>
               ))}
            </div>

            {/* Sales Chart Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[32px] p-8 shadow-sm">
                   <div className="flex items-center justify-between mb-10">
                      <div>
                         <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Relleno de Ventas Semanales</h3>
                         <p className="text-xs font-medium text-slate-500 tracking-tight">Análisis comparativo de los últimos 7 días operativos</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-blue-600 shadow-lg shadow-blue-500/50" />
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ingresos</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-end justify-between h-56 gap-4 px-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-[32px] border border-slate-50 dark:border-slate-800 py-6 mb-2">
                       {weeklySales.map((d, i) => {
                          const max = Math.max(...weeklySales.map(s => s.total));
                          const h = (d.total / max) * 100;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group cursor-pointer">
                               <div className="relative w-full flex flex-col items-center justify-end h-full">
                                  <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.1, duration: 1 }}
                                     className="w-full max-w-[40px] bg-blue-600 rounded-t-xl shadow-xl shadow-blue-600/10 group-hover:brightness-125 transition-all relative overflow-hidden">
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                  </motion.div>
                               </div>
                               <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{d.day}</span>
                            </div>
                          )
                       })}
                   </div>
                </div>

                <div className="lg:col-span-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[32px] p-8 shadow-sm flex flex-col">
                   <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Top Productos</h3>
                   <div className="space-y-6 flex-1">
                      {topProducts.map((p, idx) => (
                        <div key={idx} className="group">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase truncate max-w-[140px]">{p.name}</span>
                              <span className="text-[10px] font-black text-blue-600">{p.sales} u</span>
                           </div>
                           <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${(p.sales / topProducts[0].sales) * 100}%` }} transition={{ duration: 1.2, delay: idx * 0.1 }}
                                 className="h-full bg-blue-600 group-hover:bg-blue-500 transition-colors shadow-[0_0_10px_rgba(37,99,235,0.3)]" />
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="pt-8 mt-8 border-t border-slate-50 dark:border-slate-700">
                      <button className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
                         <MapPin className="w-3.5 h-3.5" /> Ver regiones
                      </button>
                   </div>
                </div>
            </div>

            {/* Tables Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Clientes */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[32px] overflow-hidden shadow-sm flex flex-col">
                   <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Ranking de Compradores</h3>
                      <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline transition-all">Exportar Tabla</button>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                               {['Cliente', 'Total Gastado', 'Rating'].map(h => (
                                 <th key={h} className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                               ))}
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {topCustomers.map((c, i) => (
                              <tr key={i} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/10 transition-colors">
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                       <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-600 dark:text-blue-400">{c.name.charAt(0)}</div>
                                       <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{c.name}</p>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">${c.total.toLocaleString()}</td>
                                 <td className="px-8 py-5">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/40 text-blue-600`}>{c.status}</span>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>

                {/* Stock Alarms */}
                <div className="bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/30 rounded-[32px] overflow-hidden shadow-sm flex flex-col">
                   <div className="p-8 border-b border-rose-50 dark:border-rose-900/10 bg-rose-50/30 dark:bg-rose-900/5">
                      <div className="flex items-center gap-3">
                         <div className="size-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                            <Package className="w-4 h-4 text-rose-500" />
                         </div>
                         <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">Alertas de Reposición</h3>
                      </div>
                   </div>
                   {inventoryAlerts.map((item, i) => (
                     <div key={i} className="p-6 border-b border-rose-50 dark:border-rose-900/10 flex items-center justify-between group hover:bg-rose-50/10 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="size-1 rounded-full bg-rose-500 animate-pulse" />
                           <div>
                              <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{item.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Existencia: <span className="text-rose-600">{item.stock}</span> / {item.stock_minimo}</p>
                           </div>
                        </div>
                        <button className="px-4 py-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500 hover:text-white transition-all">Ordenar</button>
                     </div>
                   ))}
                   <div className="p-6 text-center">
                      <button className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors">Auditoría completa de almacén</button>
                   </div>
                </div>
            </div>

          </motion.div>
        ) : (
          <motion.div key="demanda" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="space-y-8">
            
            {/* Info Banner */}
            <FadeIn>
              <div className="p-8 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-[32px] flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="size-14 rounded-3xl bg-white dark:bg-slate-900 shadow-xl shadow-violet-500/10 flex items-center justify-center shrink-0">
                  <FlaskConical className="size-7 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Motor de Predicción Algorítmica</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                    Utilizamos modelos exponenciales basados en la solución analítica de la ecuación diferencial <strong className="text-violet-600">dx/dt = kx</strong> para proyectar la demanda floral futura basándonos en históricos de x₀ y k.
                  </p>
                </div>
              </div>
            </FadeIn>

            <Chart51 />
            <Chart52 />
            <Chart3 />

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}