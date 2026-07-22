import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Star, Lock, ShoppingCart, MessageCircle, Info, HelpCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../hooks/useCart';
import { FadeIn, ScaleIn, StaggerContainer, AnimatedButton, GlassCard } from '../../components/Animations';
import { useToast } from '../../hooks/useToast';
import { AdminService } from '../../services/adminService';
import { esCliente } from '../../utils/auth';

export default function ProductPage({ user: initialUser }: { user?: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { addToCart } = useCart();
  const [user, setUser] = useState<any>(initialUser);
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [mainImage, setMainImage] = useState('https://picsum.photos/seed/placeholder/400/400');

  useEffect(() => {
    if (!initialUser) {
      const storedUser = localStorage.getItem('usuario') || localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    }
  }, [initialUser]);

  useEffect(() => {
    // Carga los productos "También te podría gustar" reales: primero del mismo
    // catálogo/colección que el admin escogió para este producto, luego de la
    // misma categoría, y como último respaldo el listado público general.
    const loadRelated = async (p: any) => {
      const excluir = (items: any[]) =>
        items.filter((it: any) => it.id !== id).slice(0, 4);

      const catalogo = p?.catalogos?.[0];
      const categoria = p?.categorias?.[0] || p?.tipo;

      try {
        // 1) Mismo catálogo (lo que el admin agrupó)
        if (catalogo) {
          const res = await AdminService.getProducts({ catalogo, size: 8 });
          const rel = excluir(res.data.items);
          if (rel.length > 0) {
            setRelatedProducts(rel);
            return;
          }
        }

        // 2) Misma categoría
        if (categoria) {
          const res = await AdminService.getProducts({ categoria, size: 8 });
          const rel = excluir(res.data.items);
          if (rel.length > 0) {
            setRelatedProducts(rel);
            return;
          }
        }

        // 3) Respaldo: listado público general
        const res = await AdminService.getProducts({ size: 8 });
        setRelatedProducts(excluir(res.data.items));
      } catch {
        setRelatedProducts([]);
      }
    };

    const loadProduct = async () => {
      setLoadingProduct(true);
      let p: any = null;
      try {
        const res = await AdminService.getPublicProductById(id!);
        p = res.data;
      } catch {
        // Fallback: intentar con endpoint admin
        try {
          const res = await AdminService.getAdminProductById(id!);
          p = res.data;
        } catch {
          p = null;
        }
      }
      setProduct(p);
      if (p) setMainImage(p.imagenUrl || 'https://picsum.photos/seed/placeholder/400/400');
      setLoadingProduct(false);
      // Buscar relacionados una vez que conocemos el catálogo/categoría del producto
      loadRelated(p);
    };

    if (id) {
      loadProduct();
    }
  }, [id]);

  const galleryImages = [
    mainImage,
    'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1591886960571-74d43a9d4166?auto=format&fit=crop&q=80&w=800'
  ];

  const handleAddToCart = (p: any) => {
    if (esCliente(user)) {
      addToCart(p);
      showToast(`${p.nombre} añadido al carrito`, 'success');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-brand-coral" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-xl font-bold text-slate-700">Producto no encontrado</p>
        <button onClick={() => navigate('/catalogo')} className="text-brand-coral font-bold underline">Volver al catálogo</button>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32 min-h-screen font-display bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Back Button */}
      <FadeIn>
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-brand-coral transition-colors mb-6 font-bold uppercase tracking-widest text-xs"
        >
          <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:bg-brand-coral group-hover:text-white transition-all">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Volver al catálogo
        </button>
      </FadeIn>

      {/* Breadcrumbs */}
      <FadeIn delay={0.1}>
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-slate-400 mb-10">
          <Link to="/" className="hover:text-brand-coral transition-colors">Inicio</Link>
          <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
          <Link to="/catalogo" className="hover:text-brand-coral transition-colors">Catálogo</Link>
          <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
          <span className="font-bold text-slate-900 dark:text-white">{product.nombre}</span>
        </nav>
      </FadeIn>

      {/* Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        {/* Left Column: Images */}
        <FadeIn delay={0.2}>
          <div className="space-y-6">
            <div className="relative rounded-[2.5rem] overflow-hidden aspect-square bg-white dark:bg-slate-800 shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={mainImage}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  alt={product.name} 
                  className="w-full h-full object-cover" 
                  src={mainImage} 
                />
              </AnimatePresence>
              {(product as any).badge && (
                <div className="absolute top-8 left-0 bg-brand-coral text-white px-8 py-2 font-black text-xs uppercase tracking-[0.2em] rounded-r-full shadow-xl z-10">
                  {(product as any).badge}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {galleryImages.map((img, idx) => (
                <motion.button 
                  key={idx}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMainImage(img)}
                  className={`rounded-2xl overflow-hidden aspect-square border-2 transition-all shadow-md ${mainImage === img ? 'border-brand-coral ring-4 ring-brand-coral/10' : 'border-white dark:border-slate-800 hover:border-brand-coral/50'}`}
                >
                  <img className="w-full h-full object-cover" src={img} alt={`Gallery ${idx}`} />
                </motion.button>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Right Column: Details & Options */}
        <FadeIn delay={0.3}>
          <div className="flex flex-col h-full">
            <div className="mb-8">
              <span className="text-brand-coral font-black text-xs uppercase tracking-[0.3em] mb-3 block">
                {product.tipo || 'Colección Premium'}
              </span>
              <h1 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                {product.nombre}
              </h1>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">(48 Reseñas Verificadas)</span>
              </div>
              <div className="text-4xl font-black text-slate-900 dark:text-white">
                ${product.precioBase} <span className="text-lg font-bold text-slate-400 ml-2 uppercase tracking-widest">MXN</span>
              </div>
            </div>

            <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
              {product.descripcion || 'Un hermoso arreglo floral diseñado con las flores más frescas y seleccionadas para transmitir tus mejores sentimientos.'}
            </p>

            {/* Customization Form */}
            <div className="space-y-10">
              {/* Extras & Message */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-xs font-black uppercase text-slate-400 mb-4 tracking-[0.2em]">Personalización</label>
                  <label className="flex items-center gap-3 cursor-pointer group p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-coral transition-all">
                    <input className="w-5 h-5 rounded-lg border-slate-300 text-brand-coral focus:ring-brand-coral" type="checkbox" />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Tarjeta de regalo</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-coral transition-all">
                    <input className="w-5 h-5 rounded-lg border-slate-300 text-brand-coral focus:ring-brand-coral" type="checkbox" />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Envío anónimo</span>
                  </label>
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-black uppercase text-slate-400 mb-4 tracking-[0.2em]">Fecha de entrega</label>
                  <input className="w-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-brand-coral focus:border-brand-coral px-5 py-4 border font-bold" type="date" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-4 tracking-[0.2em]">Mensaje personalizado</label>
                <textarea className="w-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl focus:ring-brand-coral focus:border-brand-coral resize-none px-5 py-4 border font-medium min-h-[120px]" placeholder="Escribe aquí tu dedicatoria..." rows={3}></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <AnimatedButton 
                  className="flex-1 bg-brand-coral text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-brand-coral/20 flex items-center justify-center gap-3"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCart className="w-6 h-6" />
                  Añadir al Carrito
                </AnimatedButton>
                <AnimatedButton className="w-20 h-20 flex items-center justify-center bg-green-500 text-white rounded-2xl shadow-xl shadow-green-500/20">
                  <MessageCircle className="w-8 h-8" />
                </AnimatedButton>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Detailed Info */}
      <section className="py-24 border-t border-slate-200 dark:border-slate-800">
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <FadeIn>
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-coral/10 flex items-center justify-center">
                  <Info className="w-6 h-6 text-brand-coral" />
                </div>
                Especificaciones
              </h3>
              <ul className="space-y-6">
                {[
                  { label: 'Altura', value: '60 cm aprox.' },
                  { label: 'Contenido', value: '24 Rosas Premium' },
                  { label: 'Follaje', value: 'Eucalipto y Ruscus' },
                  { label: 'Extras', value: 'Moño y Alimento' }
                ].map((spec, i) => (
                  <li key={i} className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{spec.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{spec.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                Reseñas
              </h3>
              <div className="space-y-8">
                {[
                  { name: 'María G.', text: 'Las rosas más hermosas que he recibido. El aroma es increíble.' },
                  { name: 'Ricardo S.', text: 'Excelente servicio, llegaron puntual y el mensaje quedó perfecto.' }
                ].map((review, i) => (
                  <div key={i} className="relative p-6 rounded-3xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between mb-3">
                      <span className="font-black text-sm uppercase tracking-widest">{review.name}</span>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 fill-current" />)}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic leading-relaxed">"{review.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-blue-500" />
                </div>
                Preguntas
              </h3>
              <div className="space-y-4">
                {[
                  { q: '¿Cómo cuido mi ramo?', a: 'Corta tallos 2cm en diagonal y cambia agua cada 2 días.' },
                  { q: '¿A qué zonas envían?', a: 'Entregas en toda la región Huitzitzilingo-Orizatlán.' }
                ].map((faq, i) => (
                  <details key={i} className="group bg-white dark:bg-slate-800 rounded-2xl p-6 cursor-pointer border border-slate-100 dark:border-slate-700 transition-all hover:border-brand-coral">
                    <summary className="list-none flex justify-between items-center text-sm font-bold uppercase tracking-widest">
                      {faq.q}
                      <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                    </summary>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </FadeIn>
        </StaggerContainer>
      </section>

      {/* Related Products */}
      <section className="py-24 border-t border-slate-200 dark:border-slate-800">
        <FadeIn>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-12">También te podría gustar</h2>
        </FadeIn>
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {relatedProducts.map((p) => (
            <ScaleIn key={p.id}>
              <GlassCard className="group h-full flex flex-col overflow-hidden border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl hover:shadow-brand-coral/5 transition-all duration-500">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-center bg-cover"
                    style={{ backgroundImage: `url('${p.imagenUrl || 'https://picsum.photos/seed/flower/400/400'}')` }}
                  />
                  {(p.stock ?? 0) <= 5 && (
                    <div className="absolute top-6 right-0 bg-orange-500 text-white px-4 py-1.5 font-black text-[10px] uppercase tracking-widest rounded-l-full shadow-lg z-10">
                      Pocas unidades
                    </div>
                  )}
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black text-brand-coral uppercase tracking-widest mb-1 block">
                        {p.tipo}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-coral transition-colors duration-300">
                        {p.nombre}
                      </h3>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      ${p.precioBase}
                    </div>
                  </div>
                  
                  <div className="mt-auto space-y-3">
                    <Link to={`/producto/${p.id}`} className="block">
                      <AnimatedButton className="w-full py-3.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold text-sm">
                        Ver Detalles
                      </AnimatedButton>
                    </Link>
                    <AnimatedButton 
                      onClick={() => handleAddToCart(p)}
                      className="w-full py-3.5 bg-brand-coral text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-coral/20"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Añadir al Carrito
                    </AnimatedButton>
                  </div>
                </div>
              </GlassCard>
            </ScaleIn>
          ))}
        </StaggerContainer>
      </section>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#1A3B5B]/60 backdrop-blur-md"
              onClick={() => setIsLoginModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white p-12 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] max-w-md w-full text-center border border-white/20"
            >
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Lock className="w-10 h-10 text-[#1A3B5B]" />
              </div>
              <h3 className="text-3xl font-black text-[#1A3B5B] mb-4 leading-tight">¡Inicia sesión para continuar!</h3>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed">Para añadir productos a tu pedido necesitas tener una cuenta activa.</p>
              <div className="flex flex-col gap-4">
                <Link to="/login" className="w-full bg-[#1A3B5B] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-transform">
                  Iniciar sesión
                </Link>
                <Link to="/registro" className="w-full border-2 border-[#1A3B5B] text-[#1A3B5B] py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Crear cuenta
                </Link>
              </div>
              <button
                className="mt-8 text-slate-400 hover:text-[#1A3B5B] text-sm font-black uppercase tracking-widest transition-colors"
                onClick={() => setIsLoginModalOpen(false)}
              >
                Tal vez luego
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
