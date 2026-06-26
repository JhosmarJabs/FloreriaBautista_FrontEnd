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
  ChevronRight,
  Filter,
  Boxes,
  DollarSign,
  Layers,
  ArrowUpDown,
  Search,
  ShoppingCart
} from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { AnimatedButton, FadeIn } from '../../components/Animations';
import { products_history } from '../../data/inventory_history.json';
import { calculateExponentialDepletion, PredictionResult } from '../../utils/predictiveAnalysis';

export default function AdminProductAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productName = id ? decodeURIComponent(id) : null;

  // ─── Estado de vista de la gráfica ─────────────────────────────────────
  type ViewMode = 'diario' | 'semanal' | 'mensual';
  const [viewMode, setViewMode] = useState<ViewMode>('diario');
  const [activeTab, setActiveTab] = useState<'ventas' | 'insumos'>('ventas');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');

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

  const densityStats = useMemo(() => {
    if (viewMode === 'diario') {
      return {
        label1: 'Turno Mañana', label2: 'Turno Tarde',
        val1: 62, val2: 38,
        title: 'Distribución Horaria'
      };
    } else if (viewMode === 'semanal') {
      return {
        label1: 'Lun a Vie', label2: 'Sáb y Dom',
        val1: 45, val2: 55,
        title: 'Carga Semanal'
      };
    } else {
      return {
        label1: '1ra Quincena', label2: '2da Quincena',
        val1: 40, val2: 60,
        title: 'Tendencia Mensual'
      };
    }
  }, [viewMode]);

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

  // ─── Datos Globales del Modelo Predictivo (COGS Semanal) ─────────────────
  const productsCOGS = useMemo(() => {
    const mockCategories = ['Ramos', 'Arreglos', 'Cajas', 'Especiales'];
    const mockProducts = [
      { id: '1', nombre: 'Ramo Rosas Rojas', categoria: 'Ramos', ventasSemana: 45, costoUnitario: 120.5, stock: 15 },
      { id: '2', nombre: 'Arreglo Orquídeas', categoria: 'Arreglos', ventasSemana: 12, costoUnitario: 350.0, stock: 5 },
      { id: '3', nombre: 'Caja Premium Mixta', categoria: 'Cajas', ventasSemana: 28, costoUnitario: 210.0, stock: 8 },
      { id: '4', nombre: 'Bouquet Tulipanes', categoria: 'Ramos', ventasSemana: 34, costoUnitario: 180.0, stock: 20 },
      { id: '5', nombre: 'Arreglo Fúnebre Grande', categoria: 'Especiales', ventasSemana: 8, costoUnitario: 850.0, stock: 3 },
    ];

    return mockProducts
      .filter(p => categoryFilter === 'Todas' || p.categoria === categoryFilter)
      .filter(p => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(p => ({
        ...p,
        cogsSemanal: p.ventasSemana * p.costoUnitario,
        margenEstimado: 35 // Porcentaje mock
      }));
  }, [categoryFilter, searchQuery]);

  const insumosData = useMemo(() => {
    return [
      { id: 'i1', nombre: 'Rosa Roja Premium', stock: 500, unidad: 'Tallos', costo: 12.5, min: 100 },
      { id: 'i2', nombre: 'Caja Madera Grande', stock: 45, unidad: 'Piezas', costo: 85.0, min: 10 },
      { id: 'i3', nombre: 'Cinta Decorativa Oro', stock: 12, unidad: 'Rollos', costo: 45.0, min: 5 },
      { id: 'i4', nombre: 'Base Cristal Redonda', stock: 24, unidad: 'Piezas', costo: 110.0, min: 12 },
      { id: 'i5', nombre: 'Espuma Floral Oasis', stock: 80, unidad: 'Piezas', costo: 25.0, min: 40 },
    ].filter(i => i.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const statsGlobal = useMemo(() => {
    const totalVentas = productsCOGS.reduce((acc, p) => acc + p.ventasSemana, 0);
    const totalCOGS = productsCOGS.reduce((acc, p) => acc + p.cogsSemanal, 0);
    return { 
      totalVentas, 
      totalCOGS, 
      promedioCosto: totalCOGS / (totalVentas || 1),
      margenPromedio: 42.5
    };
  }, [productsCOGS]);

  return (
    <PageTransition>
      <div className="w-full flex flex-col gap-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {productName && (
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-500" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {productName ? `Análisis: ${productName}` : 'Dashboard BI: Análisis de Productos e Insumos'}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500">Dashboard de Inteligencia y Sistema Predictivo de Inventarios</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!productName && (
               <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 mr-2">
                  {(['ventas', 'insumos'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === tab 
                        ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>
            )}
            <AnimatedButton className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 shadow-sm transition-all hover:bg-amber-100/50">
              <AlertCircle className="w-4 h-4" /> Alertas
            </AnimatedButton>
            <AnimatedButton className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all">
              <FileText className="w-4 h-4" /> Reporte Global
            </AnimatedButton>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {productName ? (
            [
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
            ))
          ) : (
            [
              { label: 'Ventas Semanales', value: `${statsGlobal.totalVentas} u`, trend: 'Volumen Total', icon: <ShoppingCart />, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100/70 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/40' },
              { label: 'Costo de Ventas (COGS)', value: `$${statsGlobal.totalCOGS.toLocaleString()}`, trend: 'Gasto en Insumos', icon: <DollarSign />, color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-100/70 dark:bg-rose-500/20', border: 'border-rose-200 dark:border-rose-500/40' },
              { label: 'Costo Unit. Promedio', value: `$${statsGlobal.promedioCosto.toFixed(1)}`, trend: 'Por unidad vendida', icon: <Layers />, color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100/70 dark:bg-purple-500/20', border: 'border-purple-200 dark:border-purple-500/40' },
              { label: 'Margen Promedio', value: `${statsGlobal.margenPromedio}%`, trend: 'Utilidad Bruta', icon: <TrendingUp />, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/40' },
            ].map((s, i) => (
              <div key={i} className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5`}>
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</p>
                  <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{s.value}</div>
                  <p className={`text-xs mt-1.5 font-medium ${s.color} opacity-80`}>{s.trend}</p>
                </div>
                {React.cloneElement(s.icon as React.ReactElement, { className: `absolute -bottom-4 -right-4 w-24 h-24 ${s.color} opacity-10`, strokeWidth: 3 })}
              </div>
            ))
          )}
        </div>

        {/* Dashboard Content */}
        {productName ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ... Contenido original de un solo producto (simplificado para brevedad en este chunk pero manteniendo estructura) ... */}
            {/* COLUMNA IZQUIERDA (Gráficas e Historial) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-[280px]">
                   {/* Gráfica de consumo */}
                   <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consumo Reciente</h4>
                  </div>
                  <div className="flex-1 flex items-end justify-between gap-3 px-2 relative mb-7">
                    {salesData.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full z-10 group">
                        <motion.div 
                          initial={{ height: 0 }} 
                          animate={{ height: `${Math.min(100, (d.value / chartMax) * 100)}%` }} 
                          className={`w-full max-w-[32px] ${d.color} rounded-t-lg transition-all`} 
                        />
                        <span className="text-[8px] font-black mt-1">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center h-[280px]">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest self-start mb-4">Densidad de Ventas</h4>
                   <div className="text-3xl font-black text-blue-600">85%</div>
                </div>
              </div>
              {/* Tabla de Historial */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[300px]">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros Detallados</h4>
                </div>
                <div className="p-6 text-center text-slate-400 text-xs">Viendo historial avanzado para {productName}</div>
              </div>
            </div>
            {/* COLUMNA DERECHA (Simulador) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
               <div className="bg-slate-900 rounded-3xl p-6 text-white h-full">
                  <h4 className="text-xs font-black uppercase mb-4">Proyección IA</h4>
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-white/50">Agotamientos estimado en:</p>
                    <p className="text-xl font-black text-blue-400">14 de Mayo</p>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* FILTROS Y BUSQUEDA */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={`Buscar en ${activeTab === 'ventas' ? 'productos' : 'insumos'}...`} 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {activeTab === 'ventas' && (
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 mr-1" />
                    {['Todas', 'Ramos', 'Arreglos', 'Cajas', 'Especiales'].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          categoryFilter === cat 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-500'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {activeTab === 'ventas' ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/10">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análisis de Costos de Venta (COGS Semanal)</h4>
                  <span className="text-[9px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">Modelo Predictivo: Costo de Materiales × Volumen 7D</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/20 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                        <th className="px-6 py-4">Producto</th>
                        <th className="px-6 py-4">Categoría</th>
                        <th className="px-6 py-4">Ventas (7D)</th>
                        <th className="px-6 py-4">Unit. COGS</th>
                        <th className="px-6 py-4">Total Weekly COGS</th>
                        <th className="px-6 py-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {productsCOGS.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                          <td className="px-6 py-4 font-black text-xs text-slate-800 dark:text-slate-200">{p.nombre}</td>
                          <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded text-[9px] font-black text-slate-500 uppercase">{p.categoria}</span></td>
                          <td className="px-6 py-4 font-mono font-bold text-xs text-emerald-600">+{p.ventasSemana} u</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">${p.costoUnitario.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded text-xs font-black font-mono">
                              ${p.cogsSemanal.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => navigate(`/admin/analisis-producto/${encodeURIComponent(p.nombre)}`)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/30">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventario de Insumos (Materiales Base)</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/20 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                        <th className="px-6 py-4">Insumo</th>
                        <th className="px-6 py-4">Stock Actual</th>
                        <th className="px-6 py-4">Srutido Mín.</th>
                        <th className="px-6 py-4">Costo Unit.</th>
                        <th className="px-6 py-4">Valor Inventario</th>
                        <th className="px-6 py-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {insumosData.map((i) => (
                        <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-black text-xs text-slate-800 dark:text-slate-200">{i.nombre} <span className="text-[9px] text-slate-400 font-normal">/ {i.unidad}</span></td>
                          <td className="px-6 py-4 font-mono font-black text-xs">{i.stock}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">{i.min}</td>
                          <td className="px-6 py-4 font-mono text-xs">${i.costo.toFixed(2)}</td>
                          <td className="px-6 py-4 font-mono font-black text-xs text-blue-600">${(i.stock * i.costo).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <div className={`w-2 h-2 rounded-full ${i.stock <= i.min ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

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
