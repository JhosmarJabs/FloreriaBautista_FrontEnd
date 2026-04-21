import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag,
  Search,
  Plus,
  RefreshCw,
  MoreVertical,
  Calendar,
  Percent,
  ChevronRight,
  TrendingDown,
  Gift
} from 'lucide-react';

interface PromoItem {
  id: string;
  nombre: string;
  codigo?: string;
  tipo: 'PORCENTAJE' | 'MONTO_FIJO' | 'COMBO';
  valor: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'PROGRAMADO';
  fechaInicio?: string;
  fechaFin?: string;
  usos: number;
}

const DUMMY_PROMOS: PromoItem[] = [
  { id: '1', nombre: 'Descuento Primavera', codigo: 'PRIMAVERA20', tipo: 'PORCENTAJE', valor: 20, estado: 'ACTIVO', fechaInicio: '2026-03-21', fechaFin: '2026-04-21', usos: 45 },
  { id: '2', nombre: 'Ramo + Chocolates Gratis', tipo: 'COMBO', valor: 0, estado: 'PROGRAMADO', fechaInicio: '2026-05-08', fechaFin: '2026-05-10', usos: 0 },
  { id: '3', nombre: 'Cupón Buen Fin 500MXN', codigo: 'BUENFIN', tipo: 'MONTO_FIJO', valor: 500, estado: 'INACTIVO', usos: 120 },
];

export default function AdminPromotionsPage() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [promos] = useState<PromoItem[]>(DUMMY_PROMOS);

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Breadcrumb */}


      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800/50 flex items-center justify-center">
            <Tag className="w-5 h-5 text-rose-600 dark:text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Promociones</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Crea ofertas, combos, y cupones de descuento para impulsar ventas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 px-3 py-2 rounded-xl transition-all shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
          <button 
            onClick={() => navigate('/admin/promociones/nuevo')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Promoción
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Promociones Activas', value: '1', trend: '+15% uso esta semana', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-100/70 dark:bg-rose-500/20', border: 'border-rose-200 dark:border-rose-500/40', icon: TrendingDown },
          { label: 'Combos Oferta', value: '1', trend: 'Próxima: Día de las madres', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100/70 dark:bg-purple-500/20', border: 'border-purple-200 dark:border-purple-500/40', icon: Gift },
          { label: 'Cupones Redimidos', value: '165', trend: 'Valor rescatado: $12,450 MXN', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/40', icon: Percent },
        ].map(({ label, value, trend, color, bg, border, icon: Icon }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl border ${border} ${bg} p-5`}>
            <div className="relative z-10 flex flex-col justify-between h-full">
               <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
               <div className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100">{value}</div>
               <p className={`text-xs mt-1.5 font-medium ${color} opacity-80`}>{trend}</p>
            </div>
            <Icon className={`absolute -bottom-2 -right-4 w-20 h-20 ${color} opacity-[0.08]`} strokeWidth={3} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o código de cupón..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-slate-800 dark:text-slate-200 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {promos.map(promo => (
          <div key={promo.id} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-rose-200 dark:hover:border-rose-800/50 transition-all flex flex-col">
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between mb-4">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                  promo.estado === 'ACTIVO' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 
                  promo.estado === 'PROGRAMADO' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' : 
                  'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}>
                  {promo.estado}
                </span>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{promo.nombre}</h3>
              
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                  promo.tipo === 'PORCENTAJE' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                  promo.tipo === 'COMBO' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                  'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
                }`}>
                  {promo.tipo === 'PORCENTAJE' ? `-${promo.valor}% DESC` : promo.tipo === 'COMBO' ? 'COMBO ESPECIAL' : `-$${promo.valor} MXN`}
                </span>
                {promo.codigo && (
                  <span className="font-mono text-xs text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded border border-rose-100 dark:border-rose-500/20 border-dashed">
                    {promo.codigo}
                  </span>
                )}
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between rounded-b-2xl mt-auto">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {promo.usos} canjeos / usos
                </span>
                {promo.fechaInicio && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                    <Calendar className="w-3 h-3" />
                    {new Date(promo.fechaInicio).toLocaleDateString()} - {promo.fechaFin ? new Date(promo.fechaFin).toLocaleDateString() : 'Indefinido'}
                  </span>
                )}
              </div>
              <button className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-600 hover:border-rose-200 dark:hover:border-rose-500/50 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all">
                Configurar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
