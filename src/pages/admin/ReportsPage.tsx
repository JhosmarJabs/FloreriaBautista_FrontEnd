import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, UserPlus, Package,
  Download, FileText, Filter, ChevronDown, Minus, RefreshCw, BarChart2,
  FlaskConical, Flower2, Activity, Layers, ChevronRight, PieChart,
  Calendar, MapPin, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DataService } from '../../services/dataService';
import { AdminService } from '../../services/adminService';
import { FadeIn, StaggerContainer, GlassCard, AnimatedButton } from '../../components/Animations';
import { filterCSV } from '../../utils/exportUtils';

// ─── Mock data para las gráficas estadísticas ─────────────────────────────────
const FLOWER_STATS = [
  { nombre: 'Rosa Roja (Premium)',    x0: 42, k: 0.04,  promedio: 45, media: 44, moda: 42, color: '#e11d48', light: '#ffe4e6' },
  { nombre: 'Tulipán Mixto',         x0: 30, k: 0.06,  promedio: 38, media: 35, moda: 30, color: '#7c3aed', light: '#ede9fe' },
  { nombre: 'Girasol Grande',        x0: 45, k: -0.02, promedio: 42, media: 43, moda: 45, color: '#d97706', light: '#fef3c7' },
  { nombre: 'Orquídea Blanca',       x0: 15, k: 0.12,  promedio: 22, media: 18, moda: 15, color: '#db2777', light: '#fce7f3' },
  { nombre: 'Lirio de la Paz',       x0: 25, k: 0.03,  promedio: 28, media: 26, moda: 25, color: '#2563eb', light: '#dbeafe' },
  { nombre: 'Margarita Silvestre',   x0: 50, k: -0.05, promedio: 42, media: 45, moda: 50, color: '#059669', light: '#d1fae5' },
];

const ARREGLOS = [
  { nombre: 'Rosas Rojas Premium', flores: [{ nombre: 'Rosa Roja (Premium)', requerido: 12, disponible: 45 }, { nombre: 'Margarita Silvestre', requerido: 6, disponible: 40 }], demanda: 12 },
  { nombre: 'Tulipanes Mixtos',    flores: [{ nombre: 'Tulipán Mixto', requerido: 10, disponible: 30 }, { nombre: 'Lirio de la Paz', requerido: 4, disponible: 12 }], demanda: 7 },
  { nombre: 'Girasoles Brillantes',flores: [{ nombre: 'Girasol Grande', requerido: 8, disponible: 120 }, { nombre: 'Margarita Silvestre', requerido: 10, disponible: 40 }], demanda: 5 },
  { nombre: 'Orquídea Blanca',     flores: [{ nombre: 'Orquídea Blanca', requerido: 1, disponible: 5 }, { nombre: 'Lirio de la Paz', requerido: 2, disponible: 12 }], demanda: 3 },
];

const DAYS_COUNT = 11; // 10 al 20 de abril
const DATE_LABELS = [
  '10 Abr', '11 Abr', '12 Abr', '13 Abr', '14 Abr', '15 Abr', 
  '16 Abr', '17 Abr', '18 Abr', '19 Abr', '20 Abr'
];

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

                <div className="relative flex items-end justify-center gap-1 h-64">
                   {/* Promedio */}
                   <motion.div
                     className="flex-1 rounded-t-xl bg-blue-600 origin-bottom shadow-lg shadow-blue-500/10 group-hover:brightness-110 transition-all"
                     initial={{ height: 0 }} 
                     animate={{ height: `${(f.promedio / maxVal) * 100}%` }}
                     transition={{ delay: i * 0.07 + 0.2, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                   />
                   {/* Media */}
                   <motion.div
                     className="flex-1 rounded-t-xl bg-violet-500 origin-bottom shadow-lg shadow-violet-500/10 group-hover:brightness-110 transition-all"
                     initial={{ height: 0 }} 
                     animate={{ height: `${(f.media / maxVal) * 100}%` }}
                     transition={{ delay: i * 0.07 + 0.3, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                   />
                   {/* Moda */}
                   <motion.div
                     className="flex-1 rounded-t-xl bg-amber-400 origin-bottom shadow-lg shadow-amber-500/10 group-hover:brightness-110 transition-all"
                     initial={{ height: 0 }} 
                     animate={{ height: `${(f.moda / maxVal) * 100}%` }}
                     transition={{ delay: i * 0.07 + 0.4, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
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
    const vals = Array.from({ length: DAYS_COUNT }, (_, t) => calcExponential(f.x0, f.k, t));
    return { ...f, vals };
  });

  const allVals = points.flatMap(p => p.vals);
  const maxY = Math.max(...allVals) * 1.05;
  const minY = Math.min(...allVals) * 0.95;

  const W = 800; const H = 340;
  const padX = 60; const padY = 40;
  const chartW = W - padX - 40; const chartH = H - padY * 2;

  const toSvgX = (t: number) => padX + (t / (DAYS_COUNT - 1)) * chartW;
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
              {/* X-axis labels */}
              {DATE_LABELS.map((label, t) => {
                const x = toSvgX(t);
                const isPrediction = t >= 2; // Del 12 en adelante
                const isToday = t === 5; // 15 de abril
                return (
                  <g key={t}>
                    <line x1={x} y1={padY} x2={x} y2={padY + chartH} 
                      className={`${isToday ? 'stroke-blue-500/30' : 'stroke-slate-100 dark:stroke-slate-800'}`} 
                      strokeWidth={isToday ? 2 : 1} 
                      strokeDasharray={isPrediction ? "4,4" : "0"} />
                    <text x={x} y={H - 10} textAnchor="middle" fontSize="9" fontWeight="900" 
                      className={`${isToday ? 'fill-blue-500' : 'fill-slate-400'} font-mono uppercase`}>
                      {label}
                    </text>
                  </g>
                );
              })}

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

// ─── UTILS PARA EL MODELO ──────────────────────────────────────────────────
const calculateOptimalStock = (x0: number, k: number) => {
  const nextWeekDemand = x0 * Math.exp(k * 7);
  return Math.ceil(nextWeekDemand * 1.2); // 20% de margen de seguridad
};

const getRecommendation = (stock: number, optimal: number) => {
  const diff = optimal - stock;
  if (diff > 10) return { label: 'Comprar más', color: 'text-rose-500', bg: 'bg-rose-50' };
  if (diff < -10) return { label: 'Reducir', color: 'text-amber-500', bg: 'bg-amber-50' };
  return { label: 'Mantener', color: 'text-emerald-500', bg: 'bg-emerald-50' };
};

// ─── COMPONENTES DE LA VISTA ────────────────────────────────────────────────

function InventoryTable() {
  return (
    <FadeIn delay={0.1}>
      <GlassCard className="p-0 border-none">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-500" />
             </div>
             <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Inventario de Unidades Florales</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                {['Flor', 'Stock', 'P. Compra', 'P. Venta', 'Rotación', 'Estado'].map(h => (
                  <th key={h} className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {FLOWER_STATS.map((f, i) => {
                const rotation = Math.floor(Math.random() * 40) + 40; // Simulado
                const status = rotation > 70 ? 'ALTO' : rotation > 40 ? 'MEDIO' : 'BAJO';
                const buyingPrice = 12 + i * 2;
                return (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-4 text-xs font-black text-slate-700 dark:text-slate-200 uppercase">{f.nombre}</td>
                    <td className="px-8 py-4 text-xs font-mono font-black text-slate-500">{f.x0 + 10} u</td>
                    <td className="px-8 py-4 text-xs font-bold text-slate-400">${buyingPrice}</td>
                    <td className="px-8 py-4 text-xs font-bold text-blue-500">${buyingPrice * 2.5}</td>
                    <td className="px-8 py-4">
                       <div className="flex items-center gap-2">
                          <div className="flex-1 w-16 bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-500" style={{ width: `${rotation}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-slate-400">{rotation}%</span>
                       </div>
                    </td>
                    <td className="px-8 py-4">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest border ${status === 'ALTO' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : status === 'MEDIO' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                          {status}
                       </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </FadeIn>
  );
}

function RecommendationsPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <FadeIn className="lg:col-span-2">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white">
             <h3 className="text-xl font-black uppercase tracking-tight mb-6">Estrategia de Abastecimiento</h3>
             <div className="space-y-6">
                {[
                  { flor: 'Orquídea Blanca', accion: 'Priorizar compra inmediata', desc: 'Tendencia de crecimiento (k=0.12) superior al stock de seguridad.' },
                  { flor: 'Rosa Roja', accion: 'Mantener flujo constante', desc: 'Demanda estable pero alta rotación detectada.' },
                  { flor: 'Margarita Silvestre', accion: 'Reducir órdenes', desc: 'Curva de demanda en fase de declive estacional.' }
                ].map((rec, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-white/5 rounded-2xl border border-white/10">
                     <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{rec.flor}</p>
                        <h4 className="text-sm font-black uppercase mt-0.5">{rec.accion}</h4>
                        <p className="text-xs text-slate-400 mt-1">{rec.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
       </FadeIn>
       <FadeIn delay={0.2}>
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-8 h-full shadow-sm">
             <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Sugerencias de Compra</h3>
             <div className="space-y-4">
                {FLOWER_STATS.slice(0, 4).map((f, i) => {
                   const opt = calculateOptimalStock(f.x0, f.k);
                   const rec = getRecommendation(f.x0 + 10, opt);
                   return (
                     <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-50 dark:border-slate-800">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{f.nombre}</p>
                           <p className="text-xs font-black text-slate-700 dark:text-slate-300">Pedir: {Math.max(0, opt - (f.x0 + 10))} u</p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase ${rec.bg} ${rec.color}`}>{rec.label}</span>
                     </div>
                   )
                })}
             </div>
          </div>
       </FadeIn>
    </div>
  )
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

  const handleExportProducts = async () => {
    try {
      const blob = await AdminService.exportAdminProducts();
      const text = await blob.text();
      const filteredText = filterCSV(text);
      const filteredBlob = new Blob([filteredText], { type: 'text/csv;charset=utf-8;' });
      
      const url = URL.createObjectURL(filteredBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reporte_productos.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al exportar:", err);
    }
  };

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
            {/* KPI Grid Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Ingresos Totales', value: `$${stats?.totalSales.toLocaleString()}`, icon: <TrendingUp />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20', trend: '+12.5% vs mes anterior' },
                { label: 'Pedidos Generados', value: stats?.orderCount, icon: <ShoppingBag />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', trend: '+8.2% incremento' },
                { label: 'Ticket Promedio', value: `$${stats?.averageTicket.toFixed(2)}`, icon: <PieChart />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20', trend: '-2.1% variación' },
                { label: 'Nuevos Clientes', value: stats?.newCustomers, icon: <UserPlus />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20', trend: '+15% nuevos prospectos' },
              ].map((s, i) => (
                <div key={i} className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5`}>
                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</p>
                    <div className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{s.value}</div>
                    <p className={`text-xs mt-1.5 font-medium ${s.color} opacity-80`}>{s.trend}</p>
                  </div>
                  {React.cloneElement(s.icon as React.ReactElement, {
                    className: `absolute -bottom-4 -right-4 w-24 h-24 ${s.color} opacity-10`,
                    strokeWidth: 3
                  })}
                </div>
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
                      <button onClick={handleExportProducts} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline transition-all">Exportar Tabla</button>
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
            
            <InventoryTable />

            {/* Sales trajectory */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                   <Chart52 />
                </div>
                <div className="lg:col-span-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-8 shadow-sm flex flex-col">
                   <div className="flex items-center justify-between mb-8">
                     <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Historial de Ventas</h3>
                     <Filter className="size-4 text-slate-400" />
                   </div>
                   <div className="space-y-4 flex-1">
                      {[
                        { date: '15 Abr', val: 56, label: 'Hoy' },
                        { date: '14 Abr', val: 42, label: 'Ayer' },
                        { date: '13 Abr', val: 65, label: 'Lunes' },
                        { date: '12 Abr', val: 38, label: 'Domingo' }
                      ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.date}</span>
                              <span className="text-xs font-black text-slate-700 dark:text-slate-300">{s.label}</span>
                           </div>
                           <span className="text-xs font-black text-blue-500">{s.val} u</span>
                        </div>
                      ))}
                   </div>
                   <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800">
                      <button className="w-full py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-colors shadow-xl shadow-blue-500/20">Ver listado completo</button>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <Chart51 />
               {/* Mathematical Detail Card */}
               <FadeIn delay={0.3}>
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-8 h-full shadow-sm">
                     <div className="flex items-center gap-3 mb-8">
                        <div className="size-10 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                           <Activity className="w-5 h-5 text-violet-500" />
                        </div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Detalle del Modelo x(t)</h3>
                     </div>
                     <div className="space-y-6">
                        {FLOWER_STATS.slice(0, 3).map((f, i) => {
                           const opt = calculateOptimalStock(f.x0, f.k);
                           return (
                             <div key={i} className="p-5 bg-slate-50 dark:bg-slate-900/30 rounded-[28px] border border-slate-50 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                   <span className="text-xs font-black text-slate-800 dark:text-white uppercase">{f.nombre}</span>
                                   <span className="text-[10px] font-mono font-black text-violet-500">k = {f.k}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock x₀</p>
                                      <p className="text-sm font-black text-slate-700 dark:text-white">{f.x0} u</p>
                                   </div>
                                   <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Óptimo</p>
                                      <p className="text-sm font-black text-violet-500">{opt} u</p>
                                   </div>
                                </div>
                             </div>
                           )
                        })}
                     </div>
                  </div>
               </FadeIn>
            </div>

            <RecommendationsPanel />

            {/* Módulo de Arreglos (Extra Pro) */}
            <FadeIn>
               <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-[40px] p-8 sm:p-12 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                              <Flower2 className="w-5 h-5" />
                           </div>
                           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Arrangement Optimizer</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Módulo de Arreglos Inteligentes</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">Configuración óptima de ramos para maximizar rotación de stock de corte.</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                     {ARREGLOS.map((arreglo, ai) => {
                        const maxProducible = Math.min(
                          ...arreglo.flores.map(f => Math.floor(f.disponible / f.requerido))
                        );
                        const estPrice = (arreglo.flores.reduce((acc, f) => acc + (f.requerido * 25), 0) * 1.6).toFixed(0);
                        return (
                          <div key={ai} className="group relative bg-slate-50 dark:bg-slate-900/30 rounded-[32px] border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all overflow-hidden p-8">
                             <div className="flex justify-between items-start mb-8">
                                <div>
                                   <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{arreglo.nombre}</h3>
                                   <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[9px] font-black uppercase">Recomendado</span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{arreglo.demanda} pedidos/semana</span>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">Precio Est.</p>
                                   <p className="text-2xl font-black text-emerald-600 tracking-tight">${estPrice}</p>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                {arreglo.flores.map((f, fi) => (
                                   <div key={fi} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                      <div className="flex items-center gap-3">
                                         <div className="size-2 rounded-full bg-emerald-500" />
                                         <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase truncate">{f.nombre}</p>
                                      </div>
                                      <div className="flex items-center justify-between mt-2">
                                         <span className="text-[10px] font-bold text-slate-400Uppercase">USO: {f.requerido}u</span>
                                         <span className="text-[10px] font-bold text-slate-400Uppercase">DISP: {f.disponible}u</span>
                                      </div>
                                   </div>
                                ))}
                             </div>

                             <div className="flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                                <div className="flex flex-col">
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Viabilidad</span>
                                   <span className="text-xs font-black text-slate-700 dark:text-slate-200">{maxProducible} Unidades posibles</span>
                                </div>
                                <button className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform">Ver Guía de Armado</button>
                             </div>
                          </div>
                        )
                     })}
                  </div>
               </div>
            </FadeIn>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}