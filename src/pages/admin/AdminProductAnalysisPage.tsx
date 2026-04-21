import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Package, 
  TrendingUp, 
  Activity, 
  BarChart, 
  AlertCircle,
  FileText,
  Download,
  ArrowLeft,
  Calendar,
  ChevronRight
} from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { AnimatedButton, FadeIn } from '../../components/Animations';
import { products_history } from '../../data/inventory_history.json';
import { calculateExponentialDepletion, PredictionResult } from '../../utils/predictiveAnalysis';

export default function AdminProductAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productName = id ? decodeURIComponent(id) : 'Producto no Identificado';

  // ─── Estado de vista de la gráfica ─────────────────────────────────────
  type ViewMode = 'diario' | 'semanal' | 'mensual';
  const [viewMode, setViewMode] = useState<ViewMode>('diario');

  // ─── Fuente de datos según estructura JSON multi-nivel ──────────────────
  const productData = useMemo(() => {
    const raw = (products_history as any)[productName];
    if (!raw) return null;
    return raw.diario ? raw : { diario: raw, semanal: [], mensual: [] };
  }, [productName]);

  // ─── Derivar consumo según vista desde el historial JSON ──────────────────
  const getSalesFromHistory = () => {
    if (!productData) return null;

    if (viewMode === 'semanal') {
      if (!productData.semanal || productData.semanal.length === 0) return null;
      const lastEntries = productData.semanal.slice(-7);
      return lastEntries.map((w: any, i: number) => ({
        day: w.label.split(' ')[0] + ' ' + w.label.split(' ')[2], // Ej: Sem Ene
        date: w.week,
        value: w.consumed,
        stock: w.restock - w.consumed - (w.merma || 0),
        color: i === lastEntries.length - 1 ? 'bg-blue-600' : 'bg-blue-500'
      }));
    }

    if (viewMode === 'mensual') {
      if (!productData.mensual || productData.mensual.length === 0) return null;
      const lastEntries = productData.mensual.slice(-7);
      return lastEntries.map((m: any, i: number) => ({
        day: m.label.split(' ')[0].substring(0, 3), // Ej: Ene
        date: m.label.split(' ')[1], // Ej: 2026
        value: m.totalConsumed,
        stock: m.totalRestock - m.totalConsumed,
        color: i === lastEntries.length - 1 ? 'bg-blue-600' : 'bg-blue-500'
      }));
    }

    // Vista diaria
    if (!productData.diario || productData.diario.length < 2) return null;
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const lastEntries = productData.diario.slice(-8);
    const salesResult = [];
    for (let i = 1; i < lastEntries.length; i++) {
        const prev = lastEntries[i-1];
        const curr = lastEntries[i];
        // En reabastos stock sube, consumo cuenta como 0 o se ajusta. Simplificaremos con decrecimiento.
        const consumption = Math.max(0, prev.stock - curr.stock);
        const dateObj = new Date(curr.date + 'T00:00:00');
        salesResult.push({
            day: days[dateObj.getDay()],
            date: `${dateObj.getDate()} ${months[dateObj.getMonth()]}`,
            value: consumption,
            stock: curr.stock,
            color: i === lastEntries.length - 1 ? 'bg-blue-600' : 'bg-blue-500'
        });
    }
    return salesResult.length >= 7 ? salesResult.slice(-7) : salesResult;
  };

  const generateFallbackSales = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      return { day: days[d.getDay()], date: `${d.getDate()} ${months[d.getMonth()]}`, value: Math.floor(18 + Math.random() * 22), stock: Math.floor(50 + Math.random() * 100), color: i === 6 ? 'bg-blue-600' : 'bg-blue-500' };
    });
  };

  const salesData = getSalesFromHistory() || generateFallbackSales();
  
  // Escala dinámica del eje Y
  const maxValueRaw = Math.max(...salesData.map(d => d.value), 1);
  const chartStep = maxValueRaw <= 40 ? 10 : maxValueRaw <= 100 ? 30 : maxValueRaw <= 200 ? 50 : maxValueRaw <= 500 ? 125 : 250;
  const chartMax = chartStep * 4;

  const getStockFromHistory = (formattedDate: string) => {
    const history = (products_history as any)[productName]?.diario || (products_history as any)[productName] || [];
    const entry = history.find((h: any) => h.date === formattedDate);
    return entry ? entry.stock : null;
  };

  const history = productData?.diario || (products_history as any)[productName] || [];
  const dia0_ventas = salesData[salesData.length - 2]?.value || 0;
  const dia1_ventas = salesData[salesData.length - 1]?.value || 0;

  const autoPrediction: PredictionResult = useMemo(() => {
    if (history.length < 2) return { depletionDate: null, daysRemaining: null, decayRate: null };
    const p1 = history[history.length - 2];
    const p2 = history[history.length - 1];
    return calculateExponentialDepletion(p1, p2);
  }, [productName, history]);

  const hoy = new Date();
  const todayISO = hoy.toISOString().split('T')[0];
  const yesterdayISO = new Date(new Date().setDate(hoy.getDate() - 1)).toISOString().split('T')[0];
  const weekAgoISO = new Date(new Date().setDate(hoy.getDate() - 6)).toISOString().split('T')[0];

  const stock_actual = history.slice(-1)[0]?.stock || 0;
  const promedio_diario = Number((salesData.reduce((acc, curr) => acc + curr.value, 0) / 7).toFixed(1));

  const [simDate1, setSimDate1] = useState<string>(weekAgoISO);
  const initialStock1 = getStockFromHistory(weekAgoISO);
  const [simStock1, setSimStock1] = useState<number>(initialStock1 || 100);
  const [isStock1Manual, setIsStock1Manual] = useState<boolean>(initialStock1 === null);

  const [simDate2, setSimDate2] = useState<string>(todayISO);
  const initialStock2 = getStockFromHistory(todayISO);
  const [simStock2, setSimStock2] = useState<number>(initialStock2 || 40);
  const [isStock2Manual, setIsStock2Manual] = useState<boolean>(initialStock2 === null);

  const handleSimDate1Change = (date: string) => {
    setSimDate1(date);
    const historyStock = getStockFromHistory(date);
    if (historyStock !== null) {
      setSimStock1(historyStock);
      setIsStock1Manual(false);
    } else {
      setIsStock1Manual(true);
    }
  };

  const handleSimDate2Change = (date: string) => {
    setSimDate2(date);
    const historyStock = getStockFromHistory(date);
    if (historyStock !== null) {
      setSimStock2(historyStock);
      setIsStock2Manual(false);
    } else {
      setIsStock2Manual(true);
    }
  };

  const manualPrediction: PredictionResult = useMemo(() => {
    return calculateExponentialDepletion(
      { date: simDate1, stock: simStock1 },
      { date: simDate2, stock: simStock2 }
    );
  }, [simDate1, simStock1, simDate2, simStock2]);

  return (
    <PageTransition>
      <div className="w-full flex flex-col gap-6">
        
        {/* Breadcrumb / Navigation */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
           <button onClick={() => navigate('/admin/inventario')} className="hover:text-blue-600 transition-colors">Inventario</button>
           <ChevronRight className="w-3 h-3" />
           <span className="text-slate-900 dark:text-white">Análisis de Producto</span>
        </div>

        {/* HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Análisis: {productName}</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500">Dashboard de Inteligencia y Sistema Predictivo de Inventarios</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AnimatedButton className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm transition-all">
              <Download className="w-4 h-4" /> Exportar
            </AnimatedButton>
            <AnimatedButton className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all">
              <FileText className="w-4 h-4" /> Generar PDF
            </AnimatedButton>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Stock Actual', value: `${stock_actual} u`, trend: 'Estado: Óptimo', icon: <Package />, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100/70 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/40' },
            { label: 'Demanda Diaria', value: `${promedio_diario} u`, trend: 'Media Proyectada', icon: <Activity />, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/40' },
            { label: 'Rotación', value: '8.4', trend: 'Nivel: Muy Alto', icon: <TrendingUp />, color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100/70 dark:bg-purple-500/20', border: 'border-purple-200 dark:border-purple-500/40' },
            { label: 'Rentabilidad', value: '+12.4%', trend: 'Margen Neto', icon: <BarChart />, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100/70 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/40' },
          ].map((s, i) => (
            <div key={i} className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5`}>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</p>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{s.value}</div>
                <p className={`text-xs mt-1.5 font-medium ${s.color} opacity-80`}>{s.trend}</p>
              </div>
              {React.cloneElement(s.icon as React.ReactElement, { className: `absolute -bottom-4 -right-4 w-24 h-24 ${s.color} opacity-10`, strokeWidth: 3 })}
            </div>
          ))}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA (Gráficas e Historial) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

            {/* CHARTS AREA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white dark:bg-slate-800 p-5 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-[280px]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consumo Reciente</h4>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                    {(['diario', 'semanal', 'mensual'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setViewMode(v)}
                        className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                          viewMode === v
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex min-h-0 relative">
                  <div className="flex flex-col justify-between py-1 pr-3 text-[8px] font-black text-slate-400 border-r border-slate-100 dark:border-slate-700/50 mb-7">
                    <span>{chartMax}u</span>
                    <span>{chartStep * 3}u</span>
                    <span>{chartStep * 2}u</span>
                    <span>{chartStep}u</span>
                    <span>0u</span>
                  </div>

                  <div className="flex-1 flex items-end justify-between gap-3 px-2 relative mb-7">
                    <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none py-1">
                      {[0, 1, 2, 3].map(li => <div key={li} className="w-full border-t border-slate-50 dark:border-slate-700/30" />)}
                    </div>

                    {salesData.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full z-10 group">
                        <div className="flex-1 w-full flex items-end justify-center mb-1 relative">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                              {d.value} u
                            </div>
                              <motion.div 
                              initial={{ height: 0 }} 
                              animate={{ height: `${Math.min(100, (d.value / chartMax) * 100)}%` }} 
                              transition={{ delay: i * 0.1, duration: 0.8 }} 
                              className={`w-full max-w-[32px] ${d.color} rounded-t-lg hover:brightness-110 shadow-lg shadow-blue-500/5 cursor-help transition-all group-hover:w-[120%]`} 
                            />
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-[9px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">{d.day}</span>
                            <span className="text-[7px] font-bold text-slate-400 uppercase">{d.date.split(' ')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-800 p-5 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center h-[280px]">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest self-start mb-4">Densidad de Ventas</h4>
                <div className="flex-1 flex items-center justify-center relative w-full mb-4">
                    <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90 text-blue-600">
                       <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="16" strokeDasharray="251.2" strokeDashoffset="113.04" />
                       <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="16" strokeDasharray="251.2" strokeDashoffset="200.96" className="opacity-40" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-4xl font-black text-slate-800 dark:text-white leading-none">PR</span>
                    </div>
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-blue-600" />
                      <span className="text-[10px] font-black text-slate-400 uppercase">Mañana</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-blue-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase">Tarde</span>
                   </div>
                </div>
             </div>
          </div>

          {/* HISTORIAL AREA */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
             <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historial de Salidas y Registros</h4>
                <div className="size-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/10 text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-100 dark:border-slate-700">
                         <th className="px-6 py-4">Fecha de Registro</th>
                         <th className="px-6 py-4">Ventas Registradas</th>
                         <th className="px-6 py-4">Stock Disponible</th>
                         <th className="px-6 py-4 text-right">Rentabilidad</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {[...salesData].reverse().map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                           <td className="px-6 py-4 text-xs font-black text-slate-700 dark:text-slate-300 uppercase leading-none">{d.day} {d.date}</td>
                           <td className="px-6 py-4 "><span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 flex max-w-fit rounded text-xs font-black uppercase leading-none font-mono">+{d.value} u</span></td>
                           <td className="px-6 py-4 text-xs font-black text-blue-600 dark:text-blue-400 uppercase leading-none font-mono">{d.stock} u</td>
                           <td className="px-6 py-4 text-right font-black text-slate-400 text-xs">+{Math.floor(Math.random()*10) + 15}%</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          </div> {/* FIN DE LA COLUMNA IZQUIERDA */}

          {/* SIDEBAR / ADITIONAL TOOLS */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            
            {/* PREDICTIVE CENTER */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col shadow-xl">
                <div className="absolute top-0 right-0 p-6 opacity-10"><TrendingUp className="w-24 h-24" /></div>
                <div className="relative z-10 flex flex-col gap-6">
                   <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/5">
                         <Activity className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                         <h4 className="text-xs font-black uppercase tracking-widest leading-none">Proyección de Stock</h4>
                         <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1">Motor de Análisis</p>
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                         <p className="text-[9px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">Parámetros Operativos</p>
                         <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-white/60">Consumo D0</span>
                            <span className="text-emerald-400">{dia0_ventas}u</span>
                         </div>
                         <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-white/60">Consumo D1</span>
                            <span className="text-emerald-400">{dia1_ventas}u</span>
                         </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl text-slate-900 shadow-xl border-l-[6px] border-amber-400">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Suministro Agotado en:</p>
                         <div className="text-2xl font-black text-blue-700 uppercase tracking-tighter leading-none mb-2">
                            {autoPrediction.depletionDate ? autoPrediction.depletionDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }) : 'Stock insuficiente'}
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" /> {autoPrediction.daysRemaining ? `Aprox. ${autoPrediction.daysRemaining} días` : 'Sin datos'}
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                         <p className="text-[8px] font-black text-white/40 uppercase">Efectividad</p>
                         <p className="text-lg font-black text-emerald-400">92%</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                         <p className="text-[8px] font-black text-white/40 uppercase">Costo Unit.</p>
                         <p className="text-lg font-black text-blue-300">$45.2</p>
                      </div>
                   </div>
                   <button className="w-full py-3 bg-white text-blue-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-white/10 hover:bg-slate-50 transition-colors">Alertas del Sistema</button>
                </div>
            </div>

            {/* MANUAL SIMULATOR */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-4">
               <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
                    <Activity className="w-5 h-5 text-amber-600" />
                  </div>
                  <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none">Simulador Manual</h4>
               </div>

               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2">
                        <Calendar className="w-2.5 h-2.5" /> Punto A
                      </label>
                      <input 
                        type="date" 
                        value={simDate1} 
                        max={yesterdayISO}
                        onChange={(e) => handleSimDate1Change(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-[10px] font-black outline-none focus:ring-2 focus:ring-blue-500/20 uppercase appearance-none"
                      />
                      <input 
                        type="number" 
                        value={simStock1} 
                        onChange={(e) => isStock1Manual && setSimStock1(Number(e.target.value))} 
                        readOnly={!isStock1Manual}
                        className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-black outline-none ${!isStock1Manual ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2">
                        <Calendar className="w-2.5 h-2.5" /> Punto B
                      </label>
                      <input 
                        type="date" 
                        value={simDate2} 
                        max={todayISO}
                        onChange={(e) => handleSimDate2Change(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-[10px] font-black outline-none focus:ring-2 focus:ring-blue-500/20 uppercase appearance-none"
                      />
                      <input 
                        type="number" 
                        value={simStock2} 
                        onChange={(e) => isStock2Manual && setSimStock2(Number(e.target.value))} 
                        readOnly={!isStock2Manual}
                        className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-black outline-none ${!isStock2Manual ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`} 
                      />
                    </div>
                  </div>

                  <div className="p-5 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Agotamiento Estimado</p>
                    <div className="text-xl font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter leading-none">
                      {manualPrediction.depletionDate ? manualPrediction.depletionDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }) : 'Simulación inválida'}
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">Ley Decrecimiento Exp.</p>
                  </div>
               </div>
            </div>
          </div>



        </div>

        {/* DEMO MATEMÁTICA COGNITIVA */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-lg p-6 text-slate-300 font-mono text-xs mt-2">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4">
             <div className="size-8 rounded bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
               <Activity className="w-4 h-4 text-blue-400" />
             </div>
             <div>
               <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Demostración del Cálculo de Simulación</h4>
               <p className="text-[9px] text-slate-500 uppercase">Ley de Decrecimiento Exponencial (y = y0 * e^kt)</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="space-y-1">
               <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mb-2">Punto A (Inicial)</p>
               <p className="text-white">Fecha: {simDate1}</p>
               <p className="text-emerald-400">Stock (y1): {simStock1} u</p>
             </div>

             <div className="space-y-1">
               <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mb-2">Punto B (Actual/Sec)</p>
               <p className="text-white">Fecha: {simDate2}</p>
               <p className="text-blue-400">Stock (y2): {simStock2} u</p>
             </div>

             <div className="space-y-1">
               <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mb-2">Variables</p>
               <p className="text-amber-400">Dif. Días (Δt): {Math.max(0, Math.ceil((new Date(simDate2).getTime() - new Date(simDate1).getTime()) / (1000 * 3600 * 24)))} días</p>
               <p className="text-purple-400">Tasa de Caída (k): {manualPrediction.decayRate ? manualPrediction.decayRate.toFixed(4) : 'N/A'}</p>
             </div>

             <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/10 relative overflow-hidden -mt-2">
               <div className="absolute top-0 right-0 p-2 opacity-5"><TrendingUp className="w-12 h-12" /></div>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mb-2 relative z-10">Resultado</p>
               <p className="text-rose-400 font-bold relative z-10">Días Faltantes: {manualPrediction.daysRemaining ? `${manualPrediction.daysRemaining} días` : 'N/A'}</p>
               <p className="text-white font-bold text-[11px] relative z-10">Día de Stock 0: <br/>{manualPrediction.depletionDate ? manualPrediction.depletionDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Inválido'}</p>
             </div>
          </div>
        </div>

      </div>
    </PageTransition>
  );
}
