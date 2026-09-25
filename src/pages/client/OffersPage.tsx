import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Heart, Clock, Search, Filter, ArrowRight, Sparkles, Star, Loader2, Percent, Tag } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { AdminService } from '../../services/adminService';
import type { OfertaPublica, DescuentoPublico } from '../../types';

const TIPO_LABELS: Record<string, string> = {
  ARREGLO_FLORAL: 'Arreglos Florales',
  FLORERO: 'Floreros',
  RAMO: 'Ramos',
  PLANTA: 'Plantas',
  CAJA_REGALO: 'Cajas de Regalo',
};

const prettyTipo = (tipo: string) =>
  TIPO_LABELS[tipo] ?? tipo.charAt(0) + tipo.slice(1).toLowerCase().replace(/_/g, ' ');

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

export default function OffersPage() {
  const { addToCart } = useCart();
  const [ofertas, setOfertas] = useState<OfertaPublica[]>([]);
  const [descuentos, setDescuentos] = useState<DescuentoPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [sortBy, setSortBy] = useState('discount');
  const [likedItems, setLikedItems] = useState<string[]>([]);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const [ofertasRes, descRes] = await Promise.all([
          AdminService.getOfertasPublicas(),
          AdminService.getDescuentosPublicos(),
        ]);
        setOfertas(ofertasRes.data ?? []);
        setDescuentos(descRes.data ?? []);
      } catch {
        setOfertas([]);
        setDescuentos([]);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const categories = useMemo(() => {
    const tipos = Array.from(new Set(ofertas.map(o => o.productoTipo).filter(Boolean)));
    return ['Todas', ...tipos];
  }, [ofertas]);

  const filtered = useMemo(() => {
    let result = [...ofertas];
    if (selectedCategory !== 'Todas') {
      result = result.filter(o => o.productoTipo === selectedCategory);
    }
    switch (sortBy) {
      case 'discount':
        result.sort((a, b) => b.porcentajeDesc - a.porcentajeDesc);
        break;
      case 'price-asc':
        result.sort((a, b) => a.precioOferta - b.precioOferta);
        break;
      case 'price-desc':
        result.sort((a, b) => b.precioOferta - a.precioOferta);
        break;
      case 'name':
        result.sort((a, b) => a.productoNombre.localeCompare(b.productoNombre));
        break;
    }
    return result;
  }, [ofertas, selectedCategory, sortBy]);

  const toggleLike = (id: string) => {
    setLikedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const maxDesc = ofertas.length > 0 ? Math.max(...ofertas.map(o => o.porcentajeDesc)) : 0;

  return (
    <div className="bg-[#f0f7ff] min-h-screen pt-24 pb-20 overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[600px] bg-brand-coral/10 rounded-full blur-[120px]"
        />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Hero */}
        <section className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[3.5rem] bg-[#050505] text-white min-h-[320px] flex items-center shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,127,125,0.15),transparent_50%)]" />

            <div className="relative z-10 px-8 md:px-24 py-12 w-full grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full">
                  <Sparkles className="w-4 h-4 text-brand-coral" />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/80">
                    {ofertas.length} Ofertas Activas
                  </span>
                </div>

                <h1 className="text-5xl md:text-6xl font-serif font-black leading-[0.9] tracking-tighter">
                  Ofertas <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-coral to-[#ff9f9d] italic">Especiales</span>
                </h1>

                <p className="text-lg text-white/60 max-w-lg leading-relaxed font-medium">
                  {maxDesc > 0
                    ? `Descuentos de hasta ${maxDesc}% en productos seleccionados. Aprovecha antes de que terminen.`
                    : 'Descubre nuestros precios especiales en arreglos y flores seleccionadas.'}
                </p>
              </div>

              {/* Discount highlight */}
              {maxDesc > 0 && (
                <motion.div
                  initial={{ x: 100, opacity: 0, rotate: 10 }}
                  animate={{ x: 0, opacity: 1, rotate: -3 }}
                  transition={{ delay: 0.8, duration: 1.2, type: 'spring' }}
                  className="hidden lg:block"
                >
                  <div className="relative z-10 bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] text-center">
                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-coral">Hasta</span>
                    <div className="text-7xl font-serif font-black tracking-tighter text-white leading-none mt-1">
                      {maxDesc}<span className="text-3xl align-top mt-2 inline-block">%</span>
                    </div>
                    <div className="h-px w-20 bg-gradient-to-r from-transparent via-brand-coral to-transparent mx-auto my-4" />
                    <p className="text-lg font-serif italic text-white/70">de descuento</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </section>

        {/* Discount Banners */}
        {descuentos.length > 0 && (
          <section className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {descuentos.map(d => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-brand-deep/90 to-brand-deep text-white rounded-2xl p-5 flex items-center gap-4 shadow-lg"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Percent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{d.nombre}</h3>
                    <p className="text-xs text-white/70 mt-0.5">
                      {d.tipoValor === 'PORCENTAJE' ? `${d.valor}% de descuento` : `$${d.valor} de descuento`}
                      {d.montoMinimoCompra ? ` en compras desde $${d.montoMinimoCompra}` : ''}
                      {d.categoriaNombre ? ` en ${d.categoriaNombre}` : ''}
                      {d.catalogoNombre ? ` en ${d.catalogoNombre}` : ''}
                    </p>
                    {d.fechaFin && (
                      <p className="text-[10px] text-white/50 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Hasta {new Date(d.fechaFin + 'T00:00').toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Filter Bar */}
        {ofertas.length > 0 && (
          <section className="mb-10 flex flex-wrap items-center justify-between gap-6 p-4 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-xl shadow-black/5">
            <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-brand-deep text-white shadow-lg shadow-brand-deep/20'
                      : 'bg-white/50 text-slate-500 hover:bg-white hover:text-brand-deep border border-transparent hover:border-brand-deep/10'
                  }`}
                >
                  {cat === 'Todas' ? 'Todas las Ofertas' : prettyTipo(cat)}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-4 bg-white/50 p-2 rounded-xl border border-white/60">
              <Filter className="w-4 h-4 text-slate-400 ml-2" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ordenar:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-sm font-bold border-none bg-transparent focus:ring-0 text-brand-deep cursor-pointer pr-8">
                <option value="discount">Mayor Descuento</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name">Nombre: A-Z</option>
              </select>
            </div>
          </section>
        )}

        {/* Offers Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-brand-deep animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center">
            <div className="bg-white/50 backdrop-blur-xl rounded-[3rem] p-16 border border-white/60 inline-block shadow-2xl">
              <Tag className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-brand-deep mb-3">
                {ofertas.length === 0 ? 'No hay ofertas disponibles por ahora' : 'Sin ofertas en esta categoría'}
              </h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">Vuelve pronto, nuestras ofertas se actualizan constantemente.</p>
              {ofertas.length > 0 && (
                <button onClick={() => setSelectedCategory('Todas')} className="bg-brand-deep text-white px-8 py-3 rounded-xl font-black hover:bg-brand-coral transition-all">
                  Ver todas las ofertas
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.section variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filtered.map(oferta => (
              <motion.article
                key={oferta.id}
                variants={cardVariants}
                className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full border border-slate-100 group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-coral/0 to-brand-coral/0 group-hover:from-brand-coral/5 group-hover:to-transparent pointer-events-none transition-all duration-500" />

                <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                  {oferta.productoImagen ? (
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      alt={oferta.productoNombre}
                      className="w-full h-full object-cover"
                      src={oferta.productoImagen}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-slate-300" />
                    </div>
                  )}

                  {/* Discount Badge */}
                  <div className="absolute top-6 left-0 px-4 py-1.5 font-black text-[10px] text-white uppercase tracking-[0.2em] shadow-lg bg-brand-coral"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)' }}>
                    -{oferta.porcentajeDesc}% OFF
                  </div>

                  <button
                    onClick={() => toggleLike(oferta.id)}
                    className={`absolute top-6 right-6 p-3 rounded-2xl transition-all shadow-xl backdrop-blur-md ${
                      likedItems.includes(oferta.id) ? 'bg-brand-coral text-white scale-110' : 'bg-white/80 text-slate-400 hover:text-brand-coral hover:bg-white'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${likedItems.includes(oferta.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="p-8 flex flex-col flex-grow relative z-10">
                  <div className="mb-4">
                    {oferta.productoTipo && (
                      <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-[0.2em] font-black">{prettyTipo(oferta.productoTipo)}</p>
                    )}
                    <h3 className="text-xl font-black text-brand-deep leading-tight group-hover:text-brand-coral transition-colors">{oferta.productoNombre}</h3>
                  </div>

                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-3xl font-black text-brand-coral">${oferta.precioOferta.toLocaleString()}</span>
                    <span className="text-lg text-slate-400 line-through">${oferta.precioBase.toLocaleString()}</span>
                  </div>

                  <div className="mt-auto">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addToCart({
                        id: oferta.productoId,
                        nombre: oferta.productoNombre,
                        precioBase: oferta.precioOferta,
                        imagenUrl: oferta.productoImagen,
                      })}
                      className="w-full bg-brand-deep text-white py-4 rounded-2xl font-black hover:bg-brand-coral transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-deep/10 hover:shadow-brand-coral/30"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Añadir al Carrito
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.section>
        )}
      </main>
    </div>
  );
}
