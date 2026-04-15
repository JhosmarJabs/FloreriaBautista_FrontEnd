import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Edit3, 
  Navigation,
  Check,
  Brush,
  X,
  ExternalLink,
  ShoppingBag,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DataService } from '../../services/dataService';
import { FadeIn } from '../../components/Animations';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const orderData = DataService.getOrderById(id || '');
        if (orderData) {
          setOrder(orderData);
          const userData = DataService.getUsers().find(u => u.id === orderData.customerId);
          setUser(userData);
        }
      } catch (error) {
        console.error("Error loading order detail:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="text-slate-400 font-medium animate-pulse">Cargando detalles...</p>
      </div>
    </div>
  );

  if (!order) return (
    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
      <h2 className="text-2xl font-black text-slate-400 dark:text-slate-600">Pedido no encontrado</h2>
      <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600 font-bold hover:underline">Volver atrás</button>
    </div>
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
      case 'pending': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
      case 'shipped': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
      case 'cancelled': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20';
      default: return 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'Entregado';
      case 'pending': return 'Pendiente';
      case 'shipped': return 'En Ruta';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const cardCls = "bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1280px] mx-auto space-y-6"
    >
      {/* Header Section */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-100 dark:border-slate-700">
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Gestión de Orden</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Pedido #{order.id}</h1>
              </div>
              <span className={`${getStatusStyle(order.status)} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border leading-none ml-2`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setShowStatusModal(true)}
              className="flex items-center justify-center rounded-xl px-5 py-3 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold transition-all hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Actualizar Estado
            </button>
            <button className="flex items-center justify-center rounded-xl px-5 py-3 bg-emerald-600 dark:bg-emerald-500 text-white text-sm font-black shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-95">
              <Wallet className="w-4 h-4 mr-2" />
              Registrar Cobro
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Client Info Card */}
        <div className={cardCls}>
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Cliente</h3>
          </div>
          <div className="space-y-3">
            <p className="text-slate-900 dark:text-white font-black text-lg leading-tight">{user?.name || 'Cliente Especial'}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium">{user?.phone || '+52 (00) 0000-0000'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <Mail className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium truncate">{user?.email || 'sin@correo.com'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Arrangement Info Card */}
        <div className={cardCls}>
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Producto</h3>
          </div>
          <div className="space-y-3">
            <p className="text-slate-900 dark:text-white font-black text-lg leading-tight">{order.items[0]?.productName || 'Arreglo Personalizado'}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Arreglo premium con flores de temporada y base decorativa.
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 mt-2">
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Nota de Tarjeta:</p>
              <p className="text-xs font-serif italic text-slate-600 dark:text-slate-300 leading-relaxed">
                "Con todo mi cariño, para la persona más especial."
              </p>
            </div>
          </div>
        </div>

        {/* Logistics Card */}
        <div className={cardCls}>
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
              <Navigation className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Logística</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Av. Flores Magón #567, Col. Centro, Toluca</p>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Horario: 11:00 AM - 1:00 PM</p>
            </div>
            <button className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-black rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
              UBICACIÓN GPS <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Payment Control Card */}
        <div className={cardCls}>
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Finanzas</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Total a Pagar</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">${order.total.toLocaleString()}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-xl border ${order.paymentStatus === 'paid' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest">Estado Pago:</span>
              <span className="text-sm font-black">{order.paymentStatus === 'paid' ? 'LIQUIDADO' : 'PENDIENTE'}</span>
            </div>
            <div className="flex items-center gap-2 px-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Método: {order.paymentMethod}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-8">Ciclo de Vida de la Orden</h2>
        <div className="relative space-y-0">
          {[
            { title: 'Pedido Recibido', desc: 'Sincronizado con base de datos', time: 'Hoy, 09:00 AM', status: 'completed', icon: <Check className="w-4 h-4" /> },
            { title: 'En Preparación', desc: 'Asignado a taller de floristería', time: 'Hoy, 10:15 AM', status: 'completed', icon: <Clock className="w-4 h-4" /> },
            { title: 'Diseño & Armado', desc: 'Fase actual de construcción', time: 'En proceso', status: 'current', icon: <Brush className="w-4 h-4" /> },
            { title: 'Logística de Envío', desc: 'Preparando ruta para chofer', time: 'Pendiente', status: 'future', icon: <Truck className="w-4 h-4" /> },
          ].map((item, idx, arr) => (
            <div key={idx} className="grid grid-cols-[48px_1fr] gap-x-6">
              <div className="flex flex-col items-center">
                <div className={`z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all shadow-sm ${
                  item.status === 'completed' ? 'bg-emerald-500 text-white' : 
                  item.status === 'current' ? 'bg-emerald-600 text-white ring-8 ring-emerald-500/10 scale-110' : 
                  'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-2 border-slate-200 dark:border-slate-600'
                }`}>
                  {item.icon}
                </div>
                {idx !== arr.length - 1 && (
                  <div className={`w-0.5 h-16 ${item.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                )}
              </div>
              <div className="pb-10 pt-1">
                <p className={`text-base font-black ${item.status === 'current' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'} ${item.status === 'future' ? 'text-slate-400 dark:text-slate-600' : ''}`}>
                  {item.title}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                  <p className={`text-xs ${item.status === 'future' ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.desc}
                  </p>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'current' ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {item.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Cambiar Estado */}
      <AnimatePresence>
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatusModal(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center justify-between p-8 border-b border-slate-50 dark:border-slate-700">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Estatus de Producción</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold tracking-widest">Orden #{order.id}</p>
                </div>
                <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Seleccionar Nuevo Estado</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { label: 'Diseño Completado', icon: <CheckCircle2 />, color: 'emerald' },
                      { label: 'En Ruta de Entrega', icon: <Truck />, color: 'blue' },
                      { label: 'Entrega Exitosa', icon: <CheckCircle2 />, color: 'emerald' },
                      { label: 'Reportar Incidencia', icon: <X />, color: 'rose' },
                    ].map((st, i) => (
                      <button 
                        key={i}
                        className={`group flex items-center justify-between px-5 py-4 border-2 rounded-2xl transition-all ${
                          i === 0 ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10' : 'border-slate-50 dark:border-slate-700 hover:border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600'}`}>
                            {React.cloneElement(st.icon as React.ReactElement, { size: 20 })}
                          </div>
                          <span className={`font-bold ${i === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>{st.label}</span>
                        </div>
                        {i === 0 && <Check className="w-5 h-5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Observaciones</label>
                  <textarea 
                    className="w-full rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm p-4 text-slate-900 dark:text-white transition-all outline-none" 
                    placeholder="Escribe detalles sobre el cambio de estado..." 
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 p-8 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-50 dark:border-slate-700">
                <button onClick={() => setShowStatusModal(false)} className="px-6 py-2 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 transition-colors">
                  Cerrar
                </button>
                <button className="px-8 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
