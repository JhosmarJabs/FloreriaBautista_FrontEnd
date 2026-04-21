import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBasket, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  UserPlus,
  Sparkles,
  Leaf,
  Gift,
  PlusCircle,
  Loader2,
  User,
  ShoppingCart,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Clock,
  Settings,
  Heart,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DataService, Order, OrderItem, Product } from '../../services/dataService';
import { useToast } from '../../hooks/useToast';

/* ── Mapeo de Iconos Reales ─────────────────────────────── */
const ICON_MAP: Record<string, any> = {
  Sparkles: Sparkles,
  Leaf: Leaf,
  Gift: Gift,
  Heart: Heart,
  Calendar: Calendar
};

const DEFAULT_TEMPLATES = [
  {
    id: 'basic',
    name: 'Plantilla Básica',
    description: 'Productos más vendidos en mostrador',
    icon: 'Sparkles',
    items: [
      { id: 'rb40', name: 'Ramos básicos', price: 40, icon: 'Leaf', color: 'blue' },
      { id: 'rr60', name: 'Ramos de rosas', price: 60, icon: 'Heart', color: 'rose' },
      { id: 'rg60', name: 'Ramo de gerberas', price: 60, icon: 'Sparkles', color: 'amber' },
      { id: 'rl70', name: 'Ramo de lirios', price: 70, icon: 'Leaf', color: 'blue' },
      { id: 'rer',  name: 'Ramo especial rosas', price: 120, icon: 'Heart', color: 'rose', isSpecial: true },
      { id: 'reg',  name: 'Ramo especial gerberas', price: 120, icon: 'Sparkles', color: 'amber', isSpecial: true },
    ]
  },
  {
    id: 'may10',
    name: '10 de Mayo',
    description: 'Especial para el día de las madres',
    icon: 'Heart',
    items: [
      { id: 'm1', name: 'Arreglo Madre Superior', price: 450, icon: 'Heart', color: 'rose' },
      { id: 'm2', name: 'Canasta de Flores Mixtas', price: 350, icon: 'Leaf', color: 'blue' },
    ]
  }
];

export default function QuickSalePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);

  // Template States
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<any>(null);

  useEffect(() => {
    const allProducts = DataService.getProducts();
    setProducts(allProducts);
    
    const storedUser = localStorage.getItem('usuario') || localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Load templates
    const saved = localStorage.getItem('POS_TEMPLATES');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTemplates(parsed);
      setActiveTemplate(parsed[0]);
    } else {
      // Iniciar con valores por defecto si no hay nada guardado
      setTemplates(DEFAULT_TEMPLATES);
      setActiveTemplate(DEFAULT_TEMPLATES[0]);
      localStorage.setItem('POS_TEMPLATES', JSON.stringify(DEFAULT_TEMPLATES));
    }
  }, []);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, image: item.image || '' }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {      const orderItems: OrderItem[] = cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || ''
      }));

      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        customerId: 'customer-anonymous',
        items: orderItems,
        total: total,
        status: 'delivered',
        paymentMethod: paymentMethod,
        paymentStatus: 'paid',
        createdAt: new Date().toISOString()
      };

      await DataService.addOrder(newOrder); 

      await DataService.addAuditLog({
        action: 'quick_sale',
        details: `Venta rápida registrada por $${total.toFixed(2)}`,
        userId: user?.id || 'staff-1'
      });

      showToast('Venta registrada con éxito', 'success');
      setCart([]);
    } catch (error) {
      showToast('Error al procesar la venta', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderIcon = (iconName: string, className: string = "w-6 h-6") => {
    const Icon = ICON_MAP[iconName] || ShoppingBasket;
    return <Icon className={className} />;
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans overflow-hidden px-4 md:px-2">
      {/* ── HEADER NAVIGATION ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tight leading-none">
            Venta <span className="text-[#eab308] italic">Rápida</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] max-w-md font-medium italic leading-none">
            "Eficacia en cada transacción, belleza en cada entrega."
          </p>
        </div>
      </header>

      {/* ── TOP BAR: STATS & SELECTION ── */}
      <div className="grid grid-cols-12 gap-3 shrink-0">
        <div className="col-span-12 lg:col-span-8 flex flex-col sm:flex-row items-center gap-3 bg-white/80 dark:bg-slate-800/40 backdrop-blur-md p-3 rounded-xl border border-slate-100 dark:border-white/5 transition-colors shadow-sm">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="flex size-1 rounded-full bg-[#1e3a5f] animate-pulse" />
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">POS Active</span>
                </div>
                <h2 className="text-lg font-serif font-bold text-[#1e3a5f] dark:text-white truncate uppercase italic leading-none">{activeTemplate?.name}</h2>
            </div>
            
            <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5">
               {templates.map(t => (
                 <button 
                    key={t.id}
                    onClick={() => setActiveTemplate(t)}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      activeTemplate?.id === t.id 
                      ? 'bg-[#1e3a5f] text-white shadow-lg' 
                      : 'text-slate-400 hover:text-[#1e3a5f]'
                    }`}
                 >
                   {t.name.split(' ')[1] || t.name}
                 </button>
               ))}
               <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
               <button 
                  onClick={() => navigate('/empleado/venta-rapida/config')}
                  className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors"
                  title="Configuración"
               >
                 <Settings className="w-4 h-4" />
               </button>
            </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex items-center justify-between gap-3 px-4 py-2 bg-white/50 dark:bg-slate-800/20 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-white/5 transition-colors">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600">
                    <ShoppingBasket className="w-3.5 h-3.5" />
                </div>
                <div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Ventas</p>
                    <p className="text-sm font-bold text-[#1e3a5f] dark:text-white leading-none mt-1">12</p>
                </div>
            </div>
            <div className="w-px h-6 bg-slate-100 dark:border-white/5" />
            <div className="flex items-center gap-2 text-right">
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600">
                    <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Caja</p>
                    <p className="text-sm font-bold text-[#1e3a5f] dark:text-white leading-none mt-1">$4,250</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0">
        <main className="col-span-12 lg:col-span-8 flex flex-col overflow-hidden min-h-0">
          <section className="flex-1 bg-white/95 dark:bg-[#0b1624]/60 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 p-6 flex flex-col transition-colors overflow-hidden">
            <div className="flex-1 pr-1">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTemplate?.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5"
                >
                  {activeTemplate?.items.map((item) => (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addToCart(item)}
                      className="group relative flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800 transition-all text-center"
                    >
                      <div className={`p-4 rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-500/10 text-${item.color}-600 dark:text-${item.color}-400 mb-4 shadow-sm transition-transform group-hover:scale-110`}>
                        {renderIcon(item.icon, "w-8 h-8")}
                      </div>
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest leading-none h-6 flex items-center justify-center w-full">{item.name}</span>
                      <span className="text-base font-black text-[#1e3a5f] dark:text-[#eab308] mt-3 italic">${item.price}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </main>

        <aside className="col-span-12 lg:col-span-4 flex flex-col overflow-hidden">
          <div className="flex-1 bg-[#1e3a5f] dark:bg-[#0b131c] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-[#1e3a5f]/20">
            <div className="p-4 border-b border-white/5 bg-black/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <ShoppingBasket className="w-4 h-4 text-[#eab308]" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Detalle de Venta</h3>
                </div>
                <span className="text-[9px] font-black text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)} items</span>
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
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${item.color}-500/20 text-${item.color}-400`}>
                        {renderIcon(item.icon, "w-4 h-4")}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-tight leading-none">{item.name}</p>
                        <p className="text-[11px] font-serif font-bold text-[#eab308] mt-1">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-black/20 rounded-lg p-0.5 border border-white/5">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-white/20 hover:text-rose-400 transition-colors"
                      >
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
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-slate-200 dark:border-white/5">
                <span className="text-[8px] font-black text-[#1e3a5f] dark:text-blue-400 uppercase tracking-[0.3em] mb-1">Total a Liquidar</span>
                <span className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tighter leading-none">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Controls */}
          <section className="bg-[#1e3a5f] dark:bg-blue-600 p-4 rounded-3xl shadow-2xl shadow-blue-900/30 flex flex-col gap-3 shrink-0 transition-all overflow-hidden relative group">
            <div className="absolute inset-0 bg-white/5 pointer-events-none" />
            <div className="flex items-center gap-2 px-1 relative z-10">
                <button 
                  onClick={() => setPaymentMethod('cash')}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${paymentMethod === 'cash' ? 'bg-white text-[#1e3a5f] border-white shadow-lg' : 'bg-white/10 text-white/50 border-transparent hover:bg-white/20'}`}
                >
                  Efectivo
                </button>
                <button 
                  onClick={() => setPaymentMethod('card')}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${paymentMethod === 'card' ? 'bg-white text-[#1e3a5f] border-white shadow-lg' : 'bg-white/10 text-white/50 border-transparent hover:bg-white/20'}`}
                >
                  Tarjeta
                </button>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={cart.length === 0 || isProcessing}
              className="w-full bg-white hover:bg-[#eab308] text-[#1e3a5f] font-black py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-40 shadow-xl"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={14} /> : (paymentMethod === 'cash' ? <Banknote size={14} /> : <CreditCard size={14} />)}
              {isProcessing ? 'Sincronizando...' : 'Confirmar Venta'}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
