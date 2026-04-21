import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart2, X, Package, TrendingUp, Activity, PieChart, Sparkles, AlertCircle } from 'lucide-react';

interface ProductHistoryModalProps {
  productName: string | null;
  onClose: () => void;
}

export const ProductHistoryModal: React.FC<ProductHistoryModalProps> = ({ productName, onClose }) => {
  const [activeTab, setActiveTab] = useState<'analisis' | 'proyeccion'>('analisis');

  // ─── Datos de Análisis (Ficticios) ──────────────────────────────────────────
  const dia0_ventas = 18; // 1 de Abril
  const dia1_ventas = 22; // 2 de Abril
  const promedio_diario = (dia0_ventas + dia1_ventas) / 2;
  const stock_actual = 145; // Inventario actual ficticio
  const dias_restantes = Math.floor(stock_actual / promedio_diario);
  
  // Fecha proyectada
  const hoy = new Date("2026-04-01");
  const fecha_reabastecimiento = new Date(hoy);
  fecha_reabastecimiento.setDate(hoy.getDate() + dias_restantes);

  const salesData = [
    { label: '01 Abr', value: dia0_ventas, color: 'bg-blue-600' },
    { label: '02 Abr', value: dia1_ventas, color: 'bg-blue-500' },
    { label: '03 Abr', value: 25, color: 'bg-blue-400' },
    { label: '04 Abr', value: 30, color: 'bg-blue-600' },
    { label: '05 Abr', value: 28, color: 'bg-blue-500' },
    { label: '06 Abr', value: 35, color: 'bg-blue-400' },
    { label: '07 Abr', value: 42, color: 'bg-blue-600' },
  ];

  const distributionData = [
    { label: 'Matutino', value: 45, color: '#2563eb' },
    { label: 'Vespertino', value: 35, color: '#3b82f6' },
    { label: 'Nocturno', value: 20, color: '#60a5fa' },
  ];

  return (
    <AnimatePresence>
      {productName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[90vw] lg:max-w-7xl bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="flex flex-col h-[85vh]">
              {/* Header */}
              <div className="p-8 sm:p-10 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 z-10">
                <div className="flex items-center gap-6">
                  <div className="size-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                    <BarChart2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{productName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">En Stock: {stock_actual} u</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">· Dashboard de Inteligencia Predictiva</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl mr-4">
                    <button onClick={() => setActiveTab('analisis')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'analisis' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}>Análisis Visual</button>
                    <button onClick={() => setActiveTab('proyeccion')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'proyeccion' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}>Modelo Predictivo</button>
                  </div>
                  <button onClick={onClose} className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Main Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Charts Area */}
                  <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Bar Chart Section */}
                      <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Historial de Ventas (7D)</h4>
                           <TrendingUp className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="h-56 flex items-end justify-between gap-3 px-2">
                           {salesData.map((d, i) => (
                             <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                                <div className="relative w-full flex justify-center items-end h-full">
                                   <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-blue-600">{d.value}u</div>
                                   <motion.div 
                                      initial={{ height: 0 }} 
                                      animate={{ height: `${(d.value / 45) * 100}%` }}
                                      className={`w-full max-w-[28px] ${d.color} rounded-t-lg shadow-lg group-hover:brightness-110 transition-all`}
                                   />
                                </div>
                                <span className="mt-4 text-[9px] font-black text-slate-400 uppercase">{d.label.split(' ')[0]}</span>
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* Pie Chart Section */}
                      <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Distribución por Horario</h4>
                           <PieChart className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex items-center justify-center h-56 relative">
                           {/* SVG Pie Chart Implementation */}
                           <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90">
                              {/* Simple semi-manual segments for demonstration */}
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2563eb" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="113.04" />
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="200.96" />
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#60a5fa" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="251.2" />
                           </svg>
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-xl font-black text-slate-800 dark:text-white">100%</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center mt-1">Óptimo</span>
                           </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-4">
                           {distributionData.map((d, i) => (
                             <div key={i} className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
                                <span className="text-[8px] font-black text-slate-400 uppercase">{d.label}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha del Evento</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Unidades</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Variación</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                             {[...salesData].reverse().map((d, i) => (
                               <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/5 transition-colors">
                                  <td className="px-8 py-4 text-xs font-black text-slate-700 dark:text-slate-300 uppercase">{d.label} 2026</td>
                                  <td className="px-8 py-4 text-xs font-black text-slate-900 dark:text-white">{d.value} Unidades</td>
                                  <td className="px-8 py-4">
                                     <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-[9px] font-black uppercase">Vanguardia</span>
                                  </td>
                                  <td className="px-8 py-4 text-xs font-black text-emerald-500 text-right">+{Math.floor(Math.random()*15)}%</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  </div>

                  {/* Right Column: Predictive Model & AI Insights */}
                  <div className="lg:col-span-4 space-y-8">
                    {/* Predictive AI Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-[40px] text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden group">
                       <Sparkles className="absolute -top-10 -right-10 w-40 h-40 text-white/10 group-hover:rotate-12 transition-transform" />
                       <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-6">
                             <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Activity className="w-6 h-6" />
                             </div>
                             <h4 className="text-sm font-black uppercase tracking-widest">Modelo Predictivo IA</h4>
                          </div>
                          
                          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-6">Cálculo de Agotamiento de Inventario</p>
                          
                          <div className="space-y-6">
                             <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                <span className="text-xs font-bold text-white/60">Ventas Día 0 (01 Abr)</span>
                                <span className="text-sm font-black">{dia0_ventas} u</span>
                             </div>
                             <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                <span className="text-xs font-bold text-white/60">Ventas Día 1 (02 Abr)</span>
                                <span className="text-sm font-black">{dia1_ventas} u</span>
                             </div>
                             <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                <span className="text-xs font-bold text-white/60">Tasa de Consumo Promedio</span>
                                <span className="text-sm font-black text-emerald-300">{promedio_diario} u/día</span>
                             </div>
                          </div>

                          <div className="mt-10 p-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10">
                             <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-4">Fecha Estimada de Reabastecimiento</p>
                             <div className="text-3xl font-black tracking-tight mb-2 uppercase">
                                {fecha_reabastecimiento.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
                             </div>
                             <p className="text-[10px] font-bold text-white/60 flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" /> Faltan aprox. {dias_restantes} días
                             </p>
                          </div>
                       </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Métricas de Salud del Producto</h4>
                       {[
                         { label: 'Eficiencia de Stock', value: '85%', color: 'text-emerald-500' },
                         { label: 'Velocidad de Venta', value: 'Alta', color: 'text-blue-500' },
                         { label: 'Rentabilidad Estimada', value: '42%', color: 'text-purple-500' },
                         { label: 'Costo Unitario', value: '$85.00', color: 'text-slate-900' },
                       ].map((m, i) => (
                         <div key={i} className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{m.label}</span>
                            <span className={`text-sm font-black ${m.color} dark:text-blue-300`}>{m.value}</span>
                         </div>
                       ))}
                    </div>

                    <div className="flex gap-4">
                       <button className="flex-1 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-3xl hover:scale-105 transition-all shadow-xl">Imprimir Reporte Completo</button>
                       <button onClick={onClose} className="px-10 py-5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-3xl hover:bg-slate-200 transition-colors">Cerrar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
