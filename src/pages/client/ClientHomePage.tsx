import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShoppingCart, ArrowRight, Sparkles, Package, MapPin, Eye } from 'lucide-react';
import { FadeIn, ScaleIn, StaggerContainer, AnimatedButton } from '../../components/Animations';
import { useToast } from '../../hooks/useToast';
import { AdminService } from '../../services/adminService';
import { Product } from '../../types';
import { esCliente } from '../../utils/auth';

export default function ClientHomePage({ user }: { user?: any }) {
  const userName = user?.name || 'Carlos';
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [seasonalProducts, setSeasonalProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadSeasonalProducts = async () => {
      try {
        const res = await AdminService.getProducts({ size: 10 });
        setSeasonalProducts(res.data.items.slice(0, 5));
      } catch {
        setSeasonalProducts([]);
      }
    };
    loadSeasonalProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    if (esCliente(user)) {
      addToCart(product);
      showToast(`${product.nombre} añadido al carrito`, 'success');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <FadeIn>
        <section className="py-6 lg:py-10">
          <div className="relative min-h-[450px] rounded-[2.5rem] overflow-hidden flex items-center justify-start p-8 lg:p-16 shadow-2xl">
            <motion.div 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
              className="absolute inset-0 bg-cover bg-center" 
              style={{
                backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 60%, rgba(15, 23, 42, 0.2) 100%), url('https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=2000')`
              }}
            />
            <div className="relative z-10 max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-coral/20 backdrop-blur-md border border-brand-coral/30 text-brand-coral text-xs font-bold rounded-full mb-6 tracking-widest uppercase">
                  <Sparkles className="w-3 h-3" />
                  Bienvenido de vuelta
                </span>
                <h1 className="text-4xl lg:text-6xl font-black mb-6 leading-tight text-white drop-shadow-sm">
                  Tu próximo detalle <span className="text-brand-coral">inolvidable</span> te espera, {userName}
                </h1>
                <p className="text-lg lg:text-xl text-slate-300 mb-10 leading-relaxed max-w-xl">
                  Flores frescas seleccionadas a mano para transformar cualquier momento en un recuerdo eterno. Descubre nuestra colección exclusiva.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/catalogo">
                    <AnimatedButton className="px-8 py-4 bg-brand-coral text-white font-bold rounded-2xl shadow-lg shadow-brand-coral/20 flex items-center gap-2">
                      Explorar Catálogo
                      <ArrowRight className="w-5 h-5" />
                    </AnimatedButton>
                  </Link>
                  {/* Función no disponible por el momento — ocultar botón, conservar código
                  <AnimatedButton className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20">
                    Personalizar Ramo
                  </AnimatedButton>
                  */}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Quick Access */}
      <section className="pt-0 pb-12">
        <FadeIn delay={0.3}>
          <h2 className="text-3xl font-bold mb-10 flex items-center gap-3 text-brand-deep dark:text-white">
            <div className="w-10 h-10 rounded-xl bg-brand-coral/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-brand-coral" />
            </div>
            Accesos Directos
          </h2>
        </FadeIn>
        
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link to="/mis-pedidos" className="group relative h-48 rounded-[2rem] overflow-hidden cursor-pointer block shadow-xl">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-cover bg-center" 
              style={{
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1582910831295-df5148ef11d2?auto=format&fit=crop&q=80&w=1000')`
              }}
            />
            <div className="relative h-full flex flex-col justify-end p-8 text-white">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 group-hover:bg-brand-coral transition-colors duration-300">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold mb-2">Historial de pedidos</h3>
              <p className="text-slate-300 text-sm max-w-xs">Revisa el estado de tus entregas y revive tus momentos especiales.</p>
            </div>
          </Link>
          
          <Link to="/configuracion?tab=direcciones" className="group relative h-48 rounded-[2rem] overflow-hidden cursor-pointer block shadow-xl">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-cover bg-center" 
              style={{
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=1000')`
              }}
            />
            <div className="relative h-full flex flex-col justify-end p-8 text-white">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 group-hover:bg-brand-coral transition-colors duration-300">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold mb-2">Gestión de direcciones</h3>
              <p className="text-slate-300 text-sm max-w-xs">Administra tus lugares de entrega frecuentes para pedidos más rápidos.</p>
            </div>
          </Link>
        </StaggerContainer>
      </section>

      {/* Seasonal News */}
      {seasonalProducts.length > 0 && (
      <section className="pt-0 py-12">
        <div className="flex items-center justify-between mb-12">
          <FadeIn delay={0.4}>
            <h2 className="text-3xl font-bold flex items-center gap-3 text-brand-deep dark:text-white">
              <div className="w-10 h-10 rounded-xl bg-brand-coral/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-brand-coral" />
              </div>
              Novedades de temporada
            </h2>
          </FadeIn>
          <FadeIn delay={0.4}>
            <Link to="/catalogo" className="group flex items-center gap-2 text-brand-coral font-bold hover:gap-3 transition-all">
              Ver todas <ArrowRight className="w-5 h-5" />
            </Link>
          </FadeIn>
        </div>
        
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          {seasonalProducts.map((product) => (
            <ScaleIn key={product.id}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="group relative h-full flex flex-col rounded-[1.75rem] overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-lg shadow-slate-200/60 dark:shadow-black/20 hover:shadow-2xl hover:shadow-brand-coral/10 transition-shadow duration-500"
              >
                {/* Imagen */}
                <div className="relative aspect-[5/6] overflow-hidden">
                  {product.imagenUrl ? (
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="absolute inset-0 bg-center bg-cover"
                      style={{ backgroundImage: `url('${product.imagenUrl}')` }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                      <Package className="w-16 h-16 text-slate-300" />
                    </div>
                  )}

                  {/* Degradado inferior */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

                  {/* Badge Novedad */}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-brand-coral/90 backdrop-blur-md text-white pl-2.5 pr-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    Novedad
                  </div>

                  {/* Precio flotante */}
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md text-brand-deep dark:text-white px-3.5 py-1.5 rounded-full text-sm font-black shadow-lg">
                    ${product.precioBase.toLocaleString()}
                  </div>

                  {/* Ver detalles al hover */}
                  <div className="absolute inset-x-0 bottom-0 p-4 flex justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <Link
                      to={`/producto/${product.id}`}
                      className="flex items-center gap-2 bg-white/95 backdrop-blur-md text-brand-deep px-5 py-2.5 rounded-full text-sm font-bold shadow-xl hover:bg-brand-coral hover:text-white transition-colors"
                    >
                      <Eye className="w-4 h-4" /> Ver detalles
                    </Link>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 flex flex-col flex-1">
                  <span className="text-[10px] font-black text-brand-coral uppercase tracking-widest mb-1.5">
                    {product.tipo}
                  </span>
                  <h3 className="text-xl font-bold text-brand-deep dark:text-white leading-snug mb-2 line-clamp-1 group-hover:text-brand-coral transition-colors duration-300">
                    {product.nombre}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-5">
                    Diseño floral exclusivo, hecho a mano con flores frescas de temporada.
                  </p>
                  <AnimatedButton
                    onClick={() => handleAddToCart(product)}
                    className="mt-auto w-full py-3.5 bg-brand-deep dark:bg-white dark:text-brand-deep text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-brand-coral group-hover:text-white transition-colors duration-300"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Añadir al carrito
                  </AnimatedButton>
                </div>
              </motion.div>
            </ScaleIn>
          ))}
        </StaggerContainer>
      </section>
      )}

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
              onClick={() => setIsLoginModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-white/10"
            >
              <div className="w-20 h-20 bg-brand-coral/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Lock className="w-10 h-10 text-brand-coral" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">¡Inicia sesión para continuar!</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">Para añadir productos a tu pedido necesitas tener una cuenta activa.</p>
              <div className="flex flex-col gap-4">
                <Link to="/login">
                  <AnimatedButton className="w-full bg-brand-coral text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-brand-coral/20">
                    Iniciar sesión
                  </AnimatedButton>
                </Link>
                <Link to="/registro">
                  <AnimatedButton className="w-full border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                    Crear cuenta
                  </AnimatedButton>
                </Link>
              </div>
              <button 
                className="mt-8 text-slate-400 hover:text-brand-coral text-sm font-bold uppercase tracking-widest transition-colors"
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
