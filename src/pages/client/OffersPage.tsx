import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Heart, Clock, Info, Search, Filter, ArrowRight, Sparkles, Star } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const offersData = [
  {
    id: 'OFF-001',
    name: 'Ramo de Rosas Elegance',
    category: 'Ramos',
    catalogo: 'Catálogo Premium',
    price: 450,
    oldPrice: 600,
    discount: 25,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVkE2uoVeUUyctwp74JoYnIoigk6R8XzaJyCBgb3lGY1wRRds4_zf7zbIN911Gughg2HjH6VLaoTdvkdP_he1gyP4HMDpWN_kbAaEzl9Qwmi2ZiUIk2_k_czUGuTY9Xk_S3nVaVNpyA7wy-T3Rsd595sd4HX7hIkFdFQWwIL5jxYnJV3-gc_0VeDwzen8uaLutYAmODueiZg2CE4e0TzsqHhVqDTygvU8DfQ20X_LKgM5w3Zqv2yb2IH1QPFUbxCL1bqoSZcaPyz2c',
    timeLeft: '2 días',
    rating: 4.8
  },
  {
    id: 'OFF-002',
    name: 'Caja Premium Tulipanes Holandeses',
    category: 'Cajas de Regalo',
    catalogo: 'Especial de Temporada',
    price: 840,
    oldPrice: 990,
    discount: 15,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDk0_A2EKIv8hKJfCt1v4H_0Mzi1c78mABEyxGWmbmgOsnYGqvnfwyntr--1-i3Wx16i3Bzp3yG1Yh1UyY3Am44StDMS2zknXhj26d4MHUUeJ-KZVCfuVajDZ_WCyZQE-KWuAEjERPLPV6qo9d5bsCUwHaofQG6I9xvcQme-aQ2c28pHTzzSadTot9e0aRfmE3afpTPBca6AR0gER9P54YwgZnllUMeWeMocrQNszKLNMJgE5wVYi4UHRHFShfy5TTkjl-Xjclu2OFd',
    fewUnits: true,
    rating: 4.9
  },
  {
    id: 'OFF-003',
    name: 'Canasta Radiante de Girasoles',
    category: 'Ramos',
    catalogo: 'Favoritos del Sol',
    price: 320,
    oldPrice: 480,
    discount: 33,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLs2BT75hhxY8PgrMIWY7G63NjUyC3czXR3mI9Zff3BjyXr97SohcwSNkxj4bpHUa0-l2AsVjmDn8EQMRgkZIOgJtmYQ1TVKdnMundE3DtPNs64f1gsocT0E9Nw2R4kdtuZnsrjB_YU8afogYnHncIUzMeMaZeSbQ3Htrq6W4HBIBRJ8kqSx6iRZ5kzEf1ML5Yx63trTJcucoph6lI2EJTcXDqq0jkS0uRzS4414Nmec25ZMXLzzvqnZ8TIeCtgE05fCq8WfrduvMC',
    flashSale: true,
    timeLeft: 'Hoy a medianoche',
    rating: 4.7
  },
  {
    id: 'OFF-004',
    name: 'Orquídea Phalaenopsis Púrpura',
    category: 'Plantas',
    catalogo: 'Plantas de Interior',
    price: 550,
    oldPrice: 620,
    discount: 11,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBO63iRCcQjZHwFu7QkOk79P-dmBSyq6Q-O0wBXpPHRnH7__pEiAW-1JBKBysiCfIKd8vKnSDH7WFXtz8b4h7jmTYhYj9Eb-8jgxDWy7m80G4ae0kA2dPJ7GYIRXpP2M5rQOcAuavpt941KquGs_U4eNUEqxXJhAAgISllt9GONgYDkGC0ANNADkhKu2Ltky3g8Pjt23TZV2O_AL5tr5jXH0z2ORp2K0vWHtuNxKfX2EdXtFiP1jxjULtr6XG2PJC4x9RBcOyIaX4ci',
    new: true,
    info: 'Incluye maceta decorativa',
    rating: 5.0
  }
];

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
  const [selectedCategory, setSelectedCategory] = useState('Todas las Ofertas');
  const [sortBy, setSortBy] = useState('Mayor Descuento');
  const [likedItems, setLikedItems] = useState<string[]>([]);

  const categories = ['Todas las Ofertas', 'Ramos', 'Cajas de Regalo', 'Plantas', 'Ocasiones'];

  const filteredAndSortedOffers = useMemo(() => {
    let result = [...offersData];
    
    if (selectedCategory !== 'Todas las Ofertas') {
      result = result.filter(offer => offer.category === selectedCategory);
    }

    switch (sortBy) {
      case 'Mayor Descuento':
        result.sort((a, b) => b.discount - a.discount);
        break;
      case 'Precio: Menor a Mayor':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'Precio: Mayor a Menor':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'Más Valorados':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return result;
  }, [selectedCategory, sortBy]);

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
                {cat}
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
              <option>Mayor Descuento</option>
              <option>Precio: Menor a Mayor</option>
              <option>Precio: Mayor a Menor</option>
              <option>Más Valorados</option>
            </select>
          </div>
        </section>

        {/* Offers Grid with Staggered Animation */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredAndSortedOffers.map((offer) => (
              <motion.article 
                key={offer.id}
                layout
                variants={cardVariants}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full border border-slate-100 group relative"
              >
                {/* Futuristic Glow Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-coral/0 to-brand-coral/0 group-hover:from-brand-coral/5 group-hover:to-transparent pointer-events-none transition-all duration-500" />
                
                <div className="relative aspect-[4/5] overflow-hidden">
                  <motion.img 
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    alt={offer.name} 
                    className="w-full h-full object-cover" 
                    src={offer.image} 
                  />
                  
                  {/* Badge with clip-path */}
                  <div 
                    className={`absolute top-6 left-0 px-4 py-1.5 font-black text-[10px] text-white uppercase tracking-[0.2em] shadow-lg ${
                      offer.flashSale ? 'bg-red-600' : offer.new ? 'bg-blue-600' : 'bg-brand-coral'
                    }`}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)' }}
                  >
                    {offer.flashSale ? 'FLASH SALE' : offer.new ? 'NUEVO' : `-${offer.discount}%`}
                  </div>

                  <button 
                    onClick={() => toggleLike(offer.id)}
                    className={`absolute top-6 right-6 p-3 rounded-2xl transition-all shadow-xl backdrop-blur-md ${
                      likedItems.includes(offer.id) 
                        ? 'bg-brand-coral text-white scale-110' 
                        : 'bg-white/80 text-slate-400 hover:text-brand-coral hover:bg-white'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${likedItems.includes(offer.id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* Rating Badge */}
                  <div className="absolute bottom-6 left-6 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-white text-[10px] font-black flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    {offer.rating.toFixed(1)}
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-grow relative z-10">
                  <div className="mb-4">
                    <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-[0.2em] font-black">{offer.catalogo}</p>
                    <h3 className="text-xl font-black text-brand-deep leading-tight group-hover:text-brand-coral transition-colors">{offer.name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-3xl font-black text-brand-deep">${offer.price.toLocaleString()}</span>
                    <span className="text-sm text-slate-300 line-through font-bold">${offer.oldPrice.toLocaleString()}</span>
                  </div>

                  <div className="mt-auto space-y-4">
                    {offer.timeLeft && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-[10px] text-red-600 font-black uppercase tracking-wider">Termina en {offer.timeLeft}</span>
                      </div>
                    )}
                    {offer.fewUnits && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-xl">
                        <Info className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-[10px] text-orange-600 font-black uppercase tracking-wider">Últimas unidades</span>
                      </div>
                    )}
                    
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addToCart(offer as any)}
                      className="w-full bg-brand-deep text-white py-4 rounded-2xl font-black hover:bg-brand-coral transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-deep/10 hover:shadow-brand-coral/30"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Añadir al Carrito
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.section>

        {/* Empty State */}
        {filteredAndSortedOffers.length === 0 && (
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

        {/* Newsletter with Futuristic Glow */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 relative group"
        >
          <div className="absolute inset-0 bg-brand-deep rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-brand-deep rounded-[3rem] p-10 md:p-20 text-white flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="text-center md:text-left relative z-10">
              <h2 className="text-4xl md:text-5xl font-serif mb-4 font-black tracking-tight">¿Buscas algo <span className="text-brand-coral italic">personalizado</span>?</h2>
              <p className="text-blue-100 text-lg opacity-80 max-w-md">Suscríbete a nuestro boletín y obtén un <span className="text-brand-coral font-black">10% adicional</span> en tu primera compra.</p>
            </div>
            
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 relative z-10">
              <div className="relative">
                <input 
                  className="px-8 py-5 rounded-2xl text-brand-deep w-full md:w-96 focus:ring-4 focus:ring-brand-coral/30 outline-none border-none font-bold placeholder:text-slate-400" 
                  placeholder="Tu correo electrónico" 
                  type="email"
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-brand-coral text-white px-10 py-5 rounded-2xl font-black hover:bg-white hover:text-brand-coral transition-all shadow-xl shadow-black/20"
              >
                Suscribirme
              </motion.button>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
