import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid, Tag, Search, Plus, Star, CalendarDays, Clock,
  Package, Flower2, Leaf, ChevronRight, X, AlertCircle, Sparkles,
} from 'lucide-react';
import { FadeIn, ScaleIn, AnimatedButton } from '../../components/Animations';

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
    activa: false, color: 'pink',
  },
  {
    id: '5', nombre: 'Ramo Día de las Madres Lux', temporada: 'Día de las Madres',
    descripcion: 'Orquídeas y liliums en caja elegante con lazo.',
    precio: 890, ingredientes: ['Orquídea blanca x2', 'Lilium rosado x3', 'Follaje oscuro', 'Caja kraft', 'Lazo satin'],
    activa: true, color: 'purple',
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; badge: string; dot: string }> = {
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    badge: 'bg-rose-100 text-rose-700',    dot: 'bg-rose-400' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  pink:    { bg: 'bg-pink-50',    text: 'text-pink-700',    badge: 'bg-pink-100 text-pink-700',    dot: 'bg-pink-400' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  badge: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-400' },
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
    <div className="space-y-6">
      {/* HEADER */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-4 h-4 text-purple-500" />
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">POS · Empleado</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Plantillas de Temporada</h1>
            <p className="text-slate-400 text-sm mt-0.5">Arreglos predefinidos para agilizar ventas en fechas especiales</p>
          </div>
          <AnimatedButton
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-600/25 transition-all">
            <Plus className="w-4 h-4" /> Nueva Plantilla
          </AnimatedButton>
        </div>
      </FadeIn>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total plantillas', value: MOCK_PLANTILLAS.length, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', icon: LayoutGrid },
          { label: 'Activas',          value: MOCK_PLANTILLAS.filter(p => p.activa).length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: Star },
          { label: 'Temporadas',       value: new Set(MOCK_PLANTILLAS.map(p => p.temporada)).size, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: CalendarDays },
          { label: 'Precio promedio',  value: `$${Math.round(MOCK_PLANTILLAS.reduce((a,p) => a + p.precio, 0) / MOCK_PLANTILLAS.length)}`, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: Tag },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`bg-white border ${s.border} rounded-xl p-3.5 flex items-center gap-3 hover:shadow-sm transition-all`}>
            <div className={`size-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FILTROS */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar plantilla..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-slate-700"
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPORADAS.map(t => (
            <button key={t} onClick={() => setTemporadaFiltro(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                temporadaFiltro === t
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </motion.div>

      {/* GRID PLANTILLAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((p, i) => {
            const c = COLOR_MAP[p.color] ?? COLOR_MAP.rose;
            return (
              <motion.div key={p.id}
                layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }} transition={{ delay: i * 0.04 }}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                onClick={() => setSelected(p)}>
                {/* Top color bar */}
                <div className={`h-1.5 w-full ${c.dot}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{p.temporada}</span>
                        {!p.activa && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">Inactiva</span>}
                      </div>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">{p.nombre}</h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 mt-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{p.descripcion}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {p.ingredientes.slice(0, 3).map((ing, j) => (
                      <span key={j} className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{ing}</span>
                    ))}
                    {p.ingredientes.length > 3 && (
                      <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5">+{p.ingredientes.length - 3} más</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <span className={`text-lg font-black ${c.text}`}>${p.precio.toFixed(2)}</span>
                    <AnimatedButton
                      onClick={e => { e.stopPropagation(); navigate('/empleado/venta-rapida'); }}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold ${c.bg} ${c.text} hover:opacity-80 transition-all`}>
                      <Sparkles className="w-3.5 h-3.5" />Usar plantilla
                    </AnimatedButton>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="col-span-3 py-20 text-center">
            <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No se encontraron plantillas</p>
          </div>
        )}
      </div>

      {/* DETALLE MODAL */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <ScaleIn className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className={`h-2 w-full ${COLOR_MAP[selected.color]?.dot ?? 'bg-purple-400'}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${COLOR_MAP[selected.color]?.badge}`}>{selected.temporada}</span>
                    <h2 className="text-xl font-black text-slate-900 mt-2">{selected.nombre}</h2>
                    <p className="text-sm text-slate-500 mt-1">{selected.descripcion}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="size-8 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 hover:bg-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ingredientes</p>
                  <div className="space-y-1.5">
                    {selected.ingredientes.map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <Flower2 className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        {ing}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precio</p>
                    <p className={`text-2xl font-black ${COLOR_MAP[selected.color]?.text}`}>${selected.precio.toFixed(2)}</p>
                  </div>
                  <AnimatedButton
                    onClick={() => { setSelected(null); navigate('/empleado/venta-rapida'); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-purple-700 transition-all">
                    <Sparkles className="w-4 h-4" />Aplicar en venta
                  </AnimatedButton>
                </div>
              </div>
            </ScaleIn>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
