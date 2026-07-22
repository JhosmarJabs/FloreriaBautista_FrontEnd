import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBasket,
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  User,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Settings,
  ShoppingBag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { Product, AdminCatalogo } from '../../types';
import { useToast } from '../../hooks/useToast';

interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export default function QuickSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  // Las "plantillas" de venta rápida ahora son los catálogos: cada catálogo es
  // una pestaña y sus productos se muestran para agregarlos con un solo toque.
  const [catalogs, setCatalogs] = useState<AdminCatalogo[]>([]);
  const [activeCatalogId, setActiveCatalogId] = useState<string | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Record<string, Product[]>>({});
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Catálogo completo de empleado (incluye productos SOLO_SUCURSAL) para la
      // búsqueda global.
      const productsRes = await AdminService.getEmployeeProducts({ size: 500 });
      setProducts(productsRes.data.items);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el catálogo');
      setLoading(false);
      return;
    }
    setLoading(false);

    // Los catálogos alimentan las plantillas; si fallan, la búsqueda global
    // sigue funcionando.
    try {
      const catalogosData = await AdminService.getPublicCatalogos();
      setCatalogs(catalogosData);
      setActiveCatalogId(prev => {
        if (prev && catalogosData.some(c => c.id === prev)) return prev;
        return catalogosData[0]?.id ?? null;
      });
    } catch (err) {
      console.error('Error loading catalogs:', err);
      setCatalogs([]);
    }
  };

  useEffect(() => { load(); }, []);

  // Carga perezosa de los productos del catálogo activo (se cachean por id para
  // no re-consultar al cambiar de pestaña).
  useEffect(() => {
    const catalog = catalogs.find(c => c.id === activeCatalogId);
    if (!catalog || catalogProducts[catalog.id]) return;
    let cancelled = false;
    (async () => {
      setLoadingCatalog(true);
      try {
        const res = await AdminService.getEmployeeProducts({ catalogo: catalog.nombre, size: 200 });
        if (!cancelled) setCatalogProducts(prev => ({ ...prev, [catalog.id]: res.data.items }));
      } catch (err) {
        console.error('Error loading catalog products:', err);
        if (!cancelled) setCatalogProducts(prev => ({ ...prev, [catalog.id]: [] }));
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeCatalogId, catalogs, catalogProducts]);

  const activeCatalog = useMemo(
    () => catalogs.find(c => c.id === activeCatalogId) ?? null,
    [catalogs, activeCatalogId]
  );
  const activeCatalogProducts = activeCatalogId ? catalogProducts[activeCatalogId] : undefined;

  const resultadosBusqueda = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return products.filter(p => p.nombre.toLowerCase().includes(q)).slice(0, 12);
  }, [products, search]);

  const addItemToCart = (id: string, nombre: string, precio: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing) {
        return prev.map(i => i.id === id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { id, nombre, precio, cantidad: 1 }];
    });
  };

  const addToCart = (product: Product) => addItemToCart(product.id, product.nombre, product.precioBase);

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) return { ...item, cantidad: Math.max(0, item.cantidad + delta) };
      return item;
    }).filter(item => item.cantidad > 0));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const total = cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const hoy = new Date().toISOString().slice(0, 10);
      await AdminService.createPhysicalOrder({
        nombreCliente: 'Cliente Mostrador',
        fechaEntrega: hoy,
        tipoPedido: 'INSTANTANEO',
        notas: 'Venta rápida de mostrador',
        items: cart.map(item => ({ productId: item.id, cantidad: item.cantidad })),
      });
      showToast('Venta registrada con éxito', 'success');
      setCart([]);
    } catch (err: any) {
      showToast(err.message || 'Error al procesar la venta', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-[#1e3a5f] animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-serif italic animate-pulse">Cargando catálogo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <p className="text-slate-500 dark:text-slate-400 font-bold">{error}</p>
        <button onClick={load} className="px-6 py-2 bg-[#1e3a5f] text-white font-bold rounded-xl">Cargar de nuevo</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 font-sans overflow-hidden px-4 md:px-2">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 shrink-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tight leading-none">
            Venta <span className="text-[#eab308] italic">Rápida</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] max-w-md font-medium italic leading-none">
            "Eficacia en cada transacción, belleza en cada entrega."
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/empleado/venta-rapida/config" className="p-2.5 bg-white border border-slate-100 rounded-xl text-[#1e3a5f] hover:bg-slate-50 transition-colors shadow-sm" title="Configurar plantillas">
            <Settings className="w-4 h-4" />
          </Link>
          <button onClick={load} className="p-2.5 bg-white border border-slate-100 rounded-xl text-[#1e3a5f] hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="relative shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar cualquier producto del catálogo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white/80 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-medium text-[#1e3a5f] dark:text-white outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 transition-all"
        />
      </div>

      {/* Catalog tabs (plantillas) */}
      {!search.trim() && catalogs.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
          {catalogs.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCatalogId(c.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCatalogId === c.id
                  ? 'bg-[#1e3a5f] text-white shadow-lg'
                  : 'bg-white/70 dark:bg-slate-800/40 text-slate-400 border border-slate-100 dark:border-white/5 hover:text-[#1e3a5f]'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0">
        <main className="col-span-12 lg:col-span-8 flex flex-col overflow-hidden min-h-0">
          <section className="flex-1 bg-white/95 dark:bg-[#0b1624]/60 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-6 flex flex-col transition-colors overflow-y-auto">
            {search.trim() ? (
              <>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Resultados de búsqueda</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {resultadosBusqueda.map(p => (
                    <ProductoBoton key={p.id} producto={p} onClick={() => addToCart(p)} />
                  ))}
                  {resultadosBusqueda.length === 0 && (
                    <p className="col-span-full text-center text-slate-400 text-sm py-10">Sin resultados para "{search}".</p>
                  )}
                </div>
              </>
            ) : catalogs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 gap-4">
                <ShoppingBag className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                <p className="text-slate-400 dark:text-slate-500 text-sm font-bold">Aún no hay catálogos disponibles para venta rápida.</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs">Crea un catálogo activo desde administración y asígnale productos.</p>
              </div>
            ) : (
              <>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{activeCatalog?.nombre}</h3>
                {loadingCatalog && !activeCatalogProducts ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-8 h-8 text-[#1e3a5f] animate-spin" />
                    <p className="text-slate-400 text-sm font-bold">Cargando productos del catálogo...</p>
                  </div>
                ) : activeCatalogProducts && activeCatalogProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                    {activeCatalogProducts.map(p => (
                      <ProductoBoton key={p.id} producto={p} onClick={() => addToCart(p)} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 text-sm py-10">Este catálogo todavía no tiene productos asignados.</p>
                )}
              </>
            )}
          </section>
        </main>

        <aside className="col-span-12 lg:col-span-4 flex flex-col overflow-hidden">
          <div className="flex-1 bg-[#1e3a5f] dark:bg-[#0b131c] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-[#1e3a5f]/20">
            <div className="p-4 border-b border-white/5 bg-black/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBasket className="w-4 h-4 text-[#eab308]" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Detalle de Venta</h3>
              </div>
              <span className="text-[9px] font-black text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{cart.reduce((a, b) => a + b.cantidad, 0)} items</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar-white">
              <AnimatePresence mode="popLayout">
                {cart.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors"
                  >
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-tight leading-none">{item.nombre}</p>
                      <p className="text-[11px] font-serif font-bold text-[#eab308] mt-1">${item.precio.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-black/20 rounded-lg p-0.5 border border-white/5">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-all">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-white">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-all">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-white/20 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-800 py-10 opacity-30">
                  <ShoppingBasket size={48} className="mb-2" />
                  <p className="text-[8px] font-black uppercase tracking-widest text-center">Bandeja Vacía</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-white/5 shrink-0">
              <div className="flex justify-between items-center gap-2 mb-3 text-white/60">
                <User className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest flex-1">Cliente Mostrador</span>
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-slate-200 dark:border-white/5">
                <span className="text-[8px] font-black text-[#1e3a5f] dark:text-blue-400 uppercase tracking-[0.3em] mb-1">Total a Liquidar</span>
                <span className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tighter leading-none">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Controls */}
          <section className="bg-[#1e3a5f] dark:bg-blue-600 p-4 rounded-3xl shadow-2xl shadow-blue-900/30 flex flex-col gap-3 shrink-0 transition-all overflow-hidden relative group mt-3">
            <div className="absolute inset-0 bg-white/5 pointer-events-none" />
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full bg-white hover:bg-[#eab308] text-[#1e3a5f] font-black py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-40 shadow-xl relative z-10"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <ShoppingBasket size={14} />}
              {isProcessing ? 'Sincronizando...' : 'Confirmar Venta'}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProductoBoton({ producto, onClick }: { producto: Product; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800 transition-all text-center"
    >
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4 shadow-sm transition-transform group-hover:scale-110">
        <ShoppingBasket className="w-8 h-8" />
      </div>
      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest leading-none h-6 flex items-center justify-center w-full">{producto.nombre}</span>
      <span className="text-base font-black text-[#1e3a5f] dark:text-[#eab308] mt-3 italic">${producto.precioBase}</span>
    </motion.button>
  );
}

