import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid, Tag, Search, Plus, Star, CalendarDays,
  Flower2, ChevronRight, X, Sparkles,
} from 'lucide-react';
import { FadeIn, ScaleIn } from '../../components/Animations';

type Plantilla = {
  id: string;
  nombre: string;
  temporada: string;
  descripcion: string;
  precio: number;
  ingredientes: string[];
  activa: boolean;
  color: string;
};

const TEMPORADAS = ['Todas', 'Día de Muertos', 'Navidad', 'San Valentín', 'Primavera', 'Día de las Madres'];

const MOCK_PLANTILLAS: Plantilla[] = [
  {
    id: '1', nombre: 'Ramo San Valentín Clásico', temporada: 'San Valentín',
    descripcion: '12 rosas rojas con follaje y cinta roja, presentación estándar.',
    precio: 450, ingredientes: ['12 Rosas Rojas', 'Follaje verde', 'Cinta roja', 'Papel kraft'],
    activa: true, color: 'rose',
  },
  {
    id: '2', nombre: 'Arreglo Día de Muertos', temporada: 'Día de Muertos',
    descripcion: 'Cempasúchil y crisantemos en cerámica decorativa.',
    precio: 380, ingredientes: ['Cempasúchil x20', 'Crisantemo blanco x5', 'Base cerámica'],
    activa: true, color: 'amber',
  },
  {
    id: '3', nombre: 'Centro Navideño Premium', temporada: 'Navidad',
    descripcion: 'Pinos, acebo y bolas decorativas en base plateada.',
    precio: 620, ingredientes: ['Rama de pino', 'Acebo', 'Bolas decorativas', 'Base plateada', 'Cinta'],
    activa: true, color: 'emerald',
  },
  {
    id: '4', nombre: 'Ramo Primaveral Pastel', temporada: 'Primavera',
    descripcion: 'Mix de tulipanes y ranúnculos en tonos pastel.',
    precio: 320, ingredientes: ['Tulipán rosa x6', 'Ranúnculo lila x4', 'Gypsophila', 'Papel glassine'],
    activa: false, color: 'sky',
  },
  {
    id: '5', nombre: 'Ramo Día de las Madres Lux', temporada: 'Día de las Madres',
    descripcion: 'Orquídeas y liliums en caja elegante con lazo.',
    precio: 890, ingredientes: ['Orquídea blanca x2', 'Lilium rosado x3', 'Follaje oscuro', 'Caja kraft', 'Lazo satin'],
    activa: true, color: 'purple',
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; badge: string; dot: string }> = {
  rose:    { bg: 'bg-rose-50 dark:bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',    badge: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400',    dot: 'bg-rose-500' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-500/10',      text: 'text-sky-600 dark:text-sky-400',      badge: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400',        dot: 'bg-sky-500' },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-500/10',  text: 'text-purple-600 dark:text-purple-400',  badge: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400',  dot: 'bg-purple-500' },
};

export default function SeasonTemplatesPage() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda]           = useState('');
  const [temporadaFiltro, setTemporadaFiltro] = useState('Todas');
  const [selected, setSelected]           = useState<Plantilla | null>(null);
  const [showNew, setShowNew]             = useState(false);

  const filtered = MOCK_PLANTILLAS.filter(p => {
    const matchBusq = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchTemp = temporadaFiltro === 'Todas' || p.temporada === temporadaFiltro;
    return matchBusq && matchTemp;
  });

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      {/* HEADER */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Diseño de Producción</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Plantillas de Temporada</h1>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 font-medium">Modelos preestablecidos para agilizar ventas por catálogo.</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-98 transition-all">
            <Plus className="w-4 h-4" /> Registrar Plantilla
          </button>
        </div>
      </FadeIn>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Plantillas Totales', value: MOCK_PLANTILLAS.length, icon: LayoutGrid, color: 'emerald' },
          { label: 'Modelos Activos',    value: MOCK_PLANTILLAS.filter(p => p.activa).length, icon: Star, color: 'amber' },
          { label: 'Temporadas Vigentes',     value: new Set(MOCK_PLANTILLAS.map(p => p.temporada)).size, icon: CalendarDays, color: 'blue' },
          { label: 'Costo Promedio',  value: `$${Math.round(MOCK_PLANTILLAS.reduce((a,p) => a + p.precio, 0) / MOCK_PLANTILLAS.length)}`, icon: Tag, color: 'rose' },
        ].map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm transition-all hover:bg-slate-50/50 dark:hover:bg-slate-700/50"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-500/10 text-${s.color}-600 dark:text-${s.color}-400`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{s.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FILTROS */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="flex flex-wrap items-center gap-4 p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm transition-colors"
      >
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre de arreglo o ingrediente..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-sm outline-none text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)} 
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPORADAS.map(t => (
            <button 
              key={t} 
              onClick={() => setTemporadaFiltro(t)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border uppercase tracking-widest ${
                temporadaFiltro === t
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800/50'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </motion.div>

      {/* GRID PLANTILLAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((p, i) => {
            const c = COLOR_MAP[p.color] ?? COLOR_MAP.rose;
            return (
              <motion.div 
                key={p.id}
                layout 
                initial={{ opacity: 0, scale: 0.96 }} 
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }} 
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                onClick={() => setSelected(p)}
              >
                <div className={`h-2 w-full ${c.dot}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${c.badge}`}>{p.temporada}</span>
                        {!p.activa && <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500">Fuera de Stock</span>}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight tracking-tight group-hover:text-emerald-600 transition-colors">{p.nombre}</h3>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors">
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-emerald-500" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mb-6 leading-relaxed">{p.descripcion}</p>
                  
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {p.ingredientes.slice(0, 3).map((ing, j) => (
                      <span key={j} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700/50">{ing}</span>
                    ))}
                    {p.ingredientes.length > 3 && (
                      <span className="text-[10px] font-bold text-slate-400 px-2 py-1">+{p.ingredientes.length - 3}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-700/50">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Precio Sugerido</p>
                        <span className={`text-xl font-black ${c.text}`}>${p.precio.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); navigate('/empleado/venta-rapida'); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter ${c.bg} ${c.text} hover:scale-105 active:scale-95 transition-all shadow-sm`}>
                      <Sparkles className="w-3.5 h-3.5" />Vender
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* DETALLE MODAL */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
                onClick={() => setSelected(null)} 
            />
            <ScaleIn className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-700">
              <div className={`h-2.5 w-full ${COLOR_MAP[selected.color]?.dot ?? 'bg-emerald-500'}`} />
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest ${COLOR_MAP[selected.color]?.badge}`}>{selected.temporada}</span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">{selected.nombre}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">{selected.descripcion}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-10 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Ingredientes & Composición</p>
                  <div className="grid grid-cols-1 gap-3">
                    {selected.ingredientes.map((ing, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                        <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <Flower2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        {ing}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total de Venta</p>
                    <p className={`text-3xl font-black tracking-tighter ${COLOR_MAP[selected.color]?.text}`}>${selected.precio.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => { setSelected(null); navigate('/empleado/venta-rapida'); }}
                    className="flex items-center gap-2 px-8 py-4 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[20px] text-base font-black shadow-xl shadow-emerald-500/20 hover:scale-[1.05] active:scale-95 transition-all">
                    <Sparkles className="w-5 h-5" />Usar Plantilla
                  </button>
                </div>
              </div>
            </ScaleIn>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
