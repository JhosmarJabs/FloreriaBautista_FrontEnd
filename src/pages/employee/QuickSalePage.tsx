import React, { useState, useEffect, useMemo } from 'react';
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
  ShoppingBag,
  Sparkles,
  Leaf,
  Gift,
  Heart,
  Calendar,
  Layout,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { Product, QuickSaleTemplate, QuickSaleTemplateItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { todayISO } from '../../utils/date';
import { agregarVenta } from '../../services/offlineSalesQueue';
import { useOfflineSync } from '../../hooks/useOfflineSync';

interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

/* Mapas de presentación (deben coincidir con el editor de plantillas del admin). */
const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles />,
  Leaf: <Leaf />,
  Gift: <Gift />,
  Heart: <Heart />,
  Calendar: <Calendar />,
  Layout: <Layout />,
  ShoppingBag: <ShoppingBag />,
};

const COLOR_TINT: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  slate: 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400',
};

const renderIcon = (iconName: string, className = 'w-8 h-8') => {
  const icon = ICON_MAP[iconName] || ICON_MAP.Sparkles;
  return React.cloneElement(icon as React.ReactElement, { className });
};

export default function QuickSalePage() {
  // Buscador global (incluye productos SOLO_SUCURSAL) como respaldo.
  const [products, setProducts] = useState<Product[]>([]);
  // Las plantillas de venta las diseña y publica el administrador; aquí solo se
  // consumen las que están activas. Cada plantilla es una pestaña de botones.
  const [templates, setTemplates] = useState<QuickSaleTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
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
      const productsRes = await AdminService.getEmployeeProducts({ size: 500 });
      setProducts(productsRes.data.items);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el catálogo');
      setLoading(false);
      return;
    }
    setLoading(false);

    // Las plantillas alimentan las pestañas; si fallan, la búsqueda global sigue
    // funcionando.
    try {
      const res = await AdminService.getQuickSaleTemplates(true);
      const activas = res.data ?? [];
      setTemplates(activas);
      setActiveTemplateId(prev => {
        if (prev && activas.some(t => t.id === prev)) return prev;
        return activas[0]?.id ?? null;
      });
    } catch (err) {
      console.error('Error loading quick sale templates:', err);
      setTemplates([]);
    }
  };

  useEffect(() => { load(); }, []);

  const activeTemplate = useMemo(
    () => templates.find(t => t.id === activeTemplateId) ?? null,
    [templates, activeTemplateId]
  );

  const resultadosBusqueda = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return products.filter(p => p.nombre.toLowerCase().includes(q)).slice(0, 12);
  }, [products, search]);

  const addItemToCart = (id: string, nombre: string, precio: number, cantidad = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing) {
        return prev.map(i => i.id === id ? { ...i, cantidad: i.cantidad + cantidad } : i);
      }
      return [...prev, { id, nombre, precio, cantidad }];
    });
  };

  const addProduct = (product: Product) =>
    addItemToCart(product.id, product.nombre, product.precioBase, 1);

  const addTemplateItem = (item: QuickSaleTemplateItem) =>
    addItemToCart(item.productId, item.nombre, item.precio, item.cantidad || 1);

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) return { ...item, cantidad: Math.max(0, item.cantidad + delta) };
      return item;
    }).filter(item => item.cantidad > 0));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const total = cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  const { refreshCount } = useOfflineSync();

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    const hoy = todayISO();
    const idLocalOffline = crypto.randomUUID();
    const payload = {
      nombreCliente: 'Cliente Mostrador',
      fechaEntrega: hoy,
      tipoPedido: 'INSTANTANEO' as const,
      notas: 'Venta rápida de mostrador',
      items: cart.map(item => ({ productId: item.id, cantidad: item.cantidad })),
      idLocalOffline,
    };

    try {
      await AdminService.createPhysicalOrder(payload);
      showToast('Venta registrada con éxito', 'success');
      setCart([]);
    } catch {
      await agregarVenta({
        idLocalOffline,
        payload,
        creadoEn: new Date().toISOString(),
        intentos: 0,
      });
      await refreshCount();
      showToast('Sin conexión — venta guardada localmente', 'info');
      setCart([]);
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
          <p className="text-slate-500 dark:text-slate-400 text-[12px] max-w-md font-medium italic leading-none">
            "Eficacia en cada transacción, belleza en cada entrega."
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2.5 bg-white border border-slate-100 rounded-xl text-[#1e3a5f] hover:bg-slate-50 transition-colors shadow-sm" title="Recargar">
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

      {/* Template tabs (plantillas de venta activas) */}
      {!search.trim() && templates.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTemplateId(t.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTemplateId === t.id
                  ? 'bg-[#1e3a5f] text-white shadow-lg'
                  : 'bg-white/70 dark:bg-slate-800/40 text-slate-400 border border-slate-100 dark:border-white/5 hover:text-[#1e3a5f]'
              }`}
            >
              {t.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0">
        <main className="col-span-12 lg:col-span-8 flex flex-col overflow-hidden min-h-0">
          <section className="flex-1 bg-white/95 dark:bg-[#0b1624]/60 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-6 flex flex-col transition-colors overflow-y-auto">
            {search.trim() ? (
              <>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Resultados de búsqueda</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {resultadosBusqueda.map(p => (
                    <ProductoBoton
                      key={p.id}
                      nombre={p.nombre}
                      precio={p.precioBase}
                      onClick={() => addProduct(p)}
                    />
                  ))}
                  {resultadosBusqueda.length === 0 && (
                    <p className="col-span-full text-center text-slate-400 text-sm py-10">Sin resultados para "{search}".</p>
                  )}
                </div>
              </>
            ) : templates.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 gap-4">
                <ShoppingBag className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                <p className="text-slate-400 dark:text-slate-500 text-sm font-bold">Aún no hay plantillas de venta publicadas.</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs">El administrador debe crear y activar una plantilla, o usa el buscador de arriba.</p>
              </div>
            ) : (
              <>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">{activeTemplate?.nombre}</h3>
                {activeTemplate && activeTemplate.items.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                    {activeTemplate.items.map(item => (
                      <ProductoBoton
                        key={item.id}
                        nombre={item.nombre}
                        precio={item.precio}
                        cantidad={item.cantidad}
                        icono={item.icono}
                        color={item.color}
                        onClick={() => addTemplateItem(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 text-sm py-10">Esta plantilla todavía no tiene botones configurados.</p>
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
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Detalle de Venta</h3>
              </div>
              <span className="text-[10px] font-black text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{cart.reduce((a, b) => a + b.cantidad, 0)} items</span>
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
                      <p className="text-[11px] font-black text-white uppercase tracking-tight leading-none">{item.nombre}</p>
                      <p className="text-[12px] font-serif font-bold text-[#eab308] mt-1">${item.precio.toFixed(2)}</p>
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
                  <p className="text-[9px] font-black uppercase tracking-widest text-center">Bandeja Vacía</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-white/5 shrink-0">
              <div className="flex justify-between items-center gap-2 mb-3 text-white/60">
                <User className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest flex-1">Cliente Mostrador</span>
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-slate-200 dark:border-white/5">
                <span className="text-[9px] font-black text-[#1e3a5f] dark:text-blue-400 uppercase tracking-[0.3em] mb-1">Total a Liquidar</span>
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
              className="w-full bg-white hover:bg-[#eab308] text-[#1e3a5f] font-black py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-40 shadow-xl relative z-10"
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

interface ProductoBotonProps {
  nombre: string;
  precio: number;
  cantidad?: number;
  icono?: string;
  color?: string;
  onClick: () => void;
}

const ProductoBoton: React.FC<ProductoBotonProps> = ({
  nombre,
  precio,
  cantidad,
  icono = 'ShoppingBag',
  color = 'blue',
  onClick,
}) => {
  const tint = COLOR_TINT[color] || COLOR_TINT.blue;
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800 transition-all text-center"
    >
      {cantidad && cantidad > 1 && (
        <span className="absolute top-2 right-2 text-[10px] font-black text-white bg-[#1e3a5f] dark:bg-[#eab308] dark:text-[#1e3a5f] px-2 py-0.5 rounded-full shadow">
          ×{cantidad}
        </span>
      )}
      <div className={`p-4 rounded-2xl ${tint} mb-4 shadow-sm transition-transform group-hover:scale-110`}>
        {renderIcon(icono)}
      </div>
      <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest leading-none h-6 flex items-center justify-center w-full">{nombre}</span>
      <span className="text-base font-black text-[#1e3a5f] dark:text-[#eab308] mt-3 italic">${precio}</span>
    </motion.button>
  );
};
