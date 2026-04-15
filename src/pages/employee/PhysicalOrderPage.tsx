import React, { useState } from 'react';
import { 
  User, 
  ShoppingBasket, 
  PlusCircle, 
  Trash2, 
  Truck, 
  Calendar, 
  CreditCard, 
  Save,
  Image as ImageIcon,
  Edit3,
  Plus,
  Minus,
  MapPin,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn } from '../../components/Animations';

export default function PhysicalOrderPage() {
  const [items, setItems] = useState([
    { id: 1, name: 'Ramo de 24 Rosas Rojas', quantity: 1, price: 850 }
  ]);

  const updateQuantity = (id: number, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = 120;
  const total = subtotal + shipping;

  const cardCls = "bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all";
  const labelCls = "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5";
  const inputCls = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all";

  return (
    <motion.main 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1280px] mx-auto"
    >
      {/* Header Section */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-8 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Nueva Operación</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Registro de Pedido Físico</h1>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 font-medium">Captura manual para ventas directas o telefónicas.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
              Limpiar Formulario
            </button>
          </div>
        </div>
      </FadeIn>

      <form className="grid grid-cols-1 lg:grid-cols-12 gap-6" onSubmit={(e) => e.preventDefault()}>
        {/* Left Column (Customer & Items) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Information Card */}
          <div className={cardCls}>
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-6 pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <User className="w-5 h-5" />
              <h2 className="font-black text-lg text-slate-800 dark:text-white tracking-tight">Datos del Cliente</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Nombre Completo</label>
                <input className={inputCls} placeholder="Ej. Juan Pérez" type="text"/>
              </div>
              <div>
                <label className={labelCls}>Teléfono / WhatsApp</label>
                <input className={inputCls} placeholder="Ej. 55 1234 5678" type="tel"/>
              </div>
            </div>
          </div>

          {/* Order Items Card */}
          <div className={cardCls}>
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                <ShoppingBasket className="w-5 h-5" />
                <h2 className="font-black text-lg text-slate-800 dark:text-white tracking-tight">Selección de Productos</h2>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all" type="button">
                <PlusCircle className="w-4 h-4" />
                AÑADIR ÍTEM
              </button>
            </div>
            <div className="overflow-x-auto min-h-[200px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                    <th className="py-4 pr-4">Descripción del Producto</th>
                    <th className="py-4 px-4 text-center">Cant.</th>
                    <th className="py-4 px-4 text-right">Subtotal</th>
                    <th className="py-4 px-4 text-center">Gestión</th>
                    <th className="py-4 pl-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  <AnimatePresence>
                    {items.map(item => (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800 dark:text-white">{item.name}</p>
                                <p className="text-xs text-slate-400 font-medium">Precio unit: ${item.price}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-500 transition-colors" type="button"><Minus size={14} /></button>
                            <span className="text-sm font-black text-slate-700 dark:text-white w-4 text-center leading-none">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-500 transition-colors" type="button"><Plus size={14} /></button>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                            <span className="text-sm font-black text-slate-900 dark:text-white leading-none">${(item.price * item.quantity).toFixed(2)}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition-colors" type="button">
                            <Edit3 className="w-3.5 h-3.5" />
                            Personalizar
                          </button>
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors" type="button">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {items.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-full mb-4">
                        <ShoppingBasket size={48} className="opacity-20" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest leading-none">Sin productos</p>
                </div>
            )}
          </div>
        </div>

        {/* Right Column (Logistics & Sumary) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Delivery Details Card */}
          <div className={cardCls}>
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-6 pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <Truck className="w-5 h-5" />
              <h2 className="font-black text-lg text-slate-800 dark:text-white tracking-tight">Logística de Entrega</h2>
            </div>
            {/* Delivery Type Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl mb-6">
              <button className="flex-1 py-2.5 text-[10px] font-black rounded-xl bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400 transition-all uppercase tracking-widest" type="button">PROGRAMADO</button>
              <button className="flex-1 py-2.5 text-[10px] font-black rounded-xl text-slate-400 dark:text-slate-600 hover:text-slate-600 transition-all uppercase tracking-widest" type="button">INSTANTÁNEO</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className={labelCls}>Fecha de Entrega</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input className={`${inputCls} pl-10`} type="date"/>
                </div>
              </div>
              <div>
                <label className={labelCls}>Bloque Horario</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select className={`${inputCls} pl-10 appearance-none`}>
                    <option>Mañana (9:00 - 13:00)</option>
                    <option>Tarde (13:00 - 18:00)</option>
                    <option>Noche (18:00 - 21:00)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Dirección Destino</label>
                <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <textarea className={`${inputCls} pl-10 h-24 resize-none`} placeholder="Calle, número, colonia, CP..." rows={2}></textarea>
                </div>
              </div>
              <div>
                <label className={labelCls}>Referencias / Notas</label>
                <input className={inputCls} placeholder="Ej: Portón verde, junto a la tienda" type="text"/>
              </div>
            </div>
          </div>

          {/* Payment Summary Card */}
          <div className={cardCls}>
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-6 pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <CreditCard className="w-5 h-5" />
              <h2 className="font-black text-lg text-slate-800 dark:text-white tracking-tight">Finanzas & Pago</h2>
            </div>
            <div className="space-y-4 mb-6 pt-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-400 uppercase tracking-widest text-[10px] font-black">Subtotal Productos</span>
                <span className="text-slate-900 dark:text-white font-black">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-400 uppercase tracking-widest text-[10px] font-black">Costo de Envío</span>
                <span className="text-slate-900 dark:text-white font-black">${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 uppercase tracking-widest text-[10px] font-black">Total de la Orden</span>
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter leading-none">${total.toFixed(2)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Canal de Pago</label>
                <select className={`${inputCls} appearance-none`}>
                  <option>Efectivo</option>
                  <option>Terminal (Tarjeta)</option>
                  <option>Transferencia SPEI</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Liquidación</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">$</span>
                  <input className={`${inputCls} pl-8 font-black text-emerald-600`} type="number" defaultValue={total.toFixed(2)}/>
                </div>
              </div>
            </div>
            <button className="w-full mt-8 bg-emerald-600 dark:bg-emerald-500 text-white py-5 px-4 rounded-2xl font-black text-xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-tighter" type="submit">
              <Save className="w-6 h-6" />
              Confirmar Operación
            </button>
          </div>
        </div>
      </form>
    </motion.main>
  );
}
