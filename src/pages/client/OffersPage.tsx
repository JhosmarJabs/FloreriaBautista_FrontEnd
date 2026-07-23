import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Heart, Clock, Search, Filter, ArrowRight, Sparkles, Star, Loader2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { AdminService } from '../../services/adminService';
import type { Product } from '../../types';

// Etiquetas legibles para el "tipo" de producto que viene de la BD.
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
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

export default function OffersPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas las Ofertas');
  const [sortBy, setSortBy] = useState('Precio: Menor a Mayor');
  const [likedItems, setLikedItems] = useState<string[]>([]);

  // Productos reales de la base de datos.
  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const res = await AdminService.getProducts({ size: 60 });
        setProducts(res.data.items);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Categorías derivadas de los tipos reales presentes en el catálogo.
  const categories = useMemo(() => {
    const tipos = Array.from(new Set(products.map(p => p.tipo))).filter(Boolean);
    return ['Todas las Ofertas', ...tipos];
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== 'Todas las Ofertas') {
      result = result.filter(p => p.tipo === selectedCategory);
    }

    switch (sortBy) {
      case 'Precio: Menor a Mayor':
        result.sort((a, b) => a.precioBase - b.precioBase);
        break;
      case 'Precio: Mayor a Menor':
        result.sort((a, b) => b.precioBase - a.precioBase);
        break;
      case 'Nombre: A-Z':
        result.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      default:
        break;
    }

    return result;
  }, [products, selectedCategory, sortBy]);

  const toggleLike = (id: string) => {
    setLikedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-[#f0f7ff] min-h-screen pt-24 pb-20 overflow-hidden">
      {/* Futuristic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[600px] bg-brand-coral/10 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -45, 0],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[450px] bg-brand-deep/5 rounded-full blur-[100px]"
        />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Hero Section with Parallax Effect */}
        <section className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[3.5rem] bg-[#050505] text-white min-h-[380px] flex items-center shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] group"
          >
            {/* Immersive Background */}
            <motion.div 
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
              className="absolute inset-0"
            >
              <img 
                alt="Promoción de temporada" 
                className="w-full h-full object-cover opacity-40 mix-blend-luminosity group-hover:opacity-60 transition-opacity duration-1000" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkGYhKFzGSGVmmtuxtASZK74XeJknpGQUKyqY3-Hd1OzTxz5PsSyDsIauZA3EMsXS0MT8ZKwulWljc8CwFenMkMCbJvSe-RPTqvO3p5d-5dxmskYRkfFfJSFZE294PeUtP0G1G5FbZmO32JJdE_BDBTWeRHxeVNS5_mJKl9JYtIxny9bW96y21U1iu0-aIbAZHiIKa38zcfO6eSqLsK1eLipMpNN7Yq_JjM4qXXdZKrql-7ezpZPADq2al97xeLrMIhX-mKt2Zduqc"
              />
            </motion.div>

            {/* Layered Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,127,125,0.15),transparent_50%)]"></div>
            
            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -120, 0],
                    x: [0, Math.random() * 40 - 20, 0],
                    opacity: [0, 0.5, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: Math.random() * 5 + 5,
                    repeat: Infinity,
                    delay: Math.random() * 10,
                  }}
                  className="absolute w-1.5 h-1.5 bg-brand-coral rounded-full blur-[1px]"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 px-8 md:px-24 py-8 w-full grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <motion.div
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="inline-flex items-center gap-4 px-6 py-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_0_30px_rgba(255,127,125,0.1)]"
                >
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-brand-coral/20 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-brand-coral" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/80">Edición Limitada 2024</span>
                </motion.div>

                <div className="space-y-2">
                  <motion.h1 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 1 }}
                    className="text-5xl md:text-7xl font-serif font-black leading-[0.85] tracking-tighter"
                  >
                    Festival <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-coral to-[#ff9f9d] italic pr-6">Tulipanes</span> <br />
                    & Girasoles
                  </motion.h1>
                </div>

                <motion.p 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-lg text-white/60 max-w-lg leading-relaxed font-medium"
                >
                  Celebramos la explosión de color más esperada del año. Descubre arreglos que capturan la esencia pura de la naturaleza.
                </motion.p>

                <motion.div 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-wrap items-center gap-10"
                >
                  <button className="group relative px-10 py-4 rounded-2xl font-black transition-all overflow-hidden">
                    <div className="absolute inset-0 bg-brand-coral transition-transform duration-500 group-hover:scale-110"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10 flex items-center gap-4 text-white text-base">
                      Explorar Catálogo
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-3" />
                    </span>
                  </button>
                  
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Clock className="w-5 h-5 text-brand-coral" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-brand-coral uppercase tracking-widest">Finaliza pronto</span>
                      <span className="text-xs font-bold text-white/40">15 de Octubre, 2024</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Futuristic Promo Card */}
              <motion.div
                initial={{ x: 100, opacity: 0, rotate: 10 }}
                animate={{ x: 0, opacity: 1, rotate: -3 }}
                transition={{ delay: 1, duration: 1.2, type: "spring" }}
                className="hidden lg:block relative"
              >
                <div className="relative z-10 bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] group overflow-hidden">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.2, 0.4, 0.2] 
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute -top-20 -right-20 w-64 h-64 bg-brand-coral/30 rounded-full blur-[80px]"
                  />
                  
                  <div className="relative z-10 space-y-6 text-center">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-coral">Descuento</span>
                      <div className="text-7xl font-serif font-black tracking-tighter text-white leading-none">30<span className="text-3xl align-top mt-2 inline-block">%</span></div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="h-px w-20 bg-gradient-to-r from-transparent via-brand-coral to-transparent mx-auto"></div>
                      <p className="text-lg font-serif italic text-white/70">Arreglos Seleccionados</p>
                      <button className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-coral hover:text-white transition-colors">
                        Aplicar ahora →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-10 -left-10 w-24 h-24 bg-brand-coral rounded-3xl shadow-2xl flex items-center justify-center border-4 border-black rotate-12"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-8 -right-8 w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-black -rotate-12"
                >
                  <Star className="w-8 h-8 text-brand-coral fill-brand-coral" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Filter Bar with Glassmorphism */}
        <section className="mb-12 flex flex-wrap items-center justify-between gap-6 p-4 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-xl shadow-black/5">
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
                {cat === 'Todas las Ofertas' ? cat : prettyTipo(cat)}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4 bg-white/50 p-2 rounded-xl border border-white/60">
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ordenar:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm font-bold border-none bg-transparent focus:ring-0 text-brand-deep cursor-pointer pr-8"
            >
              <option>Precio: Menor a Mayor</option>
              <option>Precio: Mayor a Menor</option>
              <option>Nombre: A-Z</option>
            </select>
          </div>
        </section>

        {/* Offers Grid with Staggered Animation */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-brand-deep animate-spin" />
          </div>
        ) : (
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {filteredAndSortedProducts.map((product) => (
              <motion.article
                key={product.id}
                variants={cardVariants}
                className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full border border-slate-100 group relative"
              >
                {/* Futuristic Glow Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-coral/0 to-brand-coral/0 group-hover:from-brand-coral/5 group-hover:to-transparent pointer-events-none transition-all duration-500" />

                <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                  {product.imagenUrl ? (
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      alt={product.nombre}
                      className="w-full h-full object-cover"
                      src={product.imagenUrl}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-slate-300" />
                    </div>
                  )}

                  {/* Categoría real del producto */}
                  <div
                    className="absolute top-6 left-0 px-4 py-1.5 font-black text-[10px] text-white uppercase tracking-[0.2em] shadow-lg bg-brand-coral"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)' }}
                  >
                    {prettyTipo(product.tipo)}
                  </div>

                  <button
                    onClick={() => toggleLike(product.id)}
                    className={`absolute top-6 right-6 p-3 rounded-2xl transition-all shadow-xl backdrop-blur-md ${
                      likedItems.includes(product.id)
                        ? 'bg-brand-coral text-white scale-110'
                        : 'bg-white/80 text-slate-400 hover:text-brand-coral hover:bg-white'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${likedItems.includes(product.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="p-8 flex flex-col flex-grow relative z-10">
                  <div className="mb-4">
                    <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-[0.2em] font-black">{prettyTipo(product.tipo)}</p>
                    <h3 className="text-xl font-black text-brand-deep leading-tight group-hover:text-brand-coral transition-colors">{product.nombre}</h3>
                  </div>

                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-3xl font-black text-brand-deep">${product.precioBase.toLocaleString()}</span>
                  </div>

                  <div className="mt-auto space-y-4">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addToCart(product)}
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

        {/* Empty State */}
        {!loading && filteredAndSortedProducts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-32 text-center"
          >
            <div className="bg-white/50 backdrop-blur-xl rounded-[3rem] p-16 border border-white/60 inline-block shadow-2xl">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-brand-deep mb-3">No hay ofertas en esta categoría</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">Prueba seleccionando otra categoría o vuelve más tarde para nuevas promociones.</p>
              <button 
                onClick={() => setSelectedCategory('Todas las Ofertas')}
                className="bg-brand-deep text-white px-8 py-3 rounded-xl font-black hover:bg-brand-coral transition-all"
              >
                Ver todas las ofertas
              </button>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
}
