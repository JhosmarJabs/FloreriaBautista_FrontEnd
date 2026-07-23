import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  Eye, 
  Calendar, 
  Receipt, 
  RefreshCw, 
  Truck, 
  CreditCard,
  Heart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminService } from '../../services/adminService';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('usuario') || localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

    const loadOrders = async () => {
      try {
        const res = await AdminService.getMyOrders();
        const items = res.data?.items ?? [];
        setOrders(items);
        if (items.length > 0) setSelectedOrder(items[0]);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entregado': return 'bg-green-500 text-white';
      case 'Pendiente': return 'bg-amber-500 text-white';
      case 'En Ruta': return 'bg-blue-500 text-white';
      case 'Cancelado': return 'bg-slate-500 text-white';
      case 'En Preparación': return 'bg-indigo-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3b5b]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 pt-32">
        <Package className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Inicia sesión para ver tus pedidos</h2>
        <p className="text-slate-500 mb-6">Necesitas acceder a tu cuenta para ver el historial de tus compras.</p>
        <Link to="/login" className="px-6 py-3 bg-[#1a3b5b] text-white font-bold rounded-xl hover:bg-[#1a3b5b]/90 transition-colors">
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="font-display bg-[#f0f7ff] text-slate-900 min-h-screen py-12 pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black text-[#1a3b5b] mb-2">Historial de Pedidos</h1>
            <p className="text-slate-500 text-sm">Gestiona y revisa tus compras anteriores</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl w-fit shadow-sm border border-slate-100">
            <button className="px-4 py-1.5 text-sm font-bold rounded-lg transition-all bg-[#ec5b13] text-white shadow-sm">Todos</button>
            <button className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all text-slate-500 hover:text-slate-700">Este mes</button>
            <button className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all text-slate-500 hover:text-slate-700">Últimos 3 meses</button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aún no tienes pedidos</h3>
            <p className="text-slate-500 mb-6">Explora nuestro catálogo y encuentra el arreglo perfecto.</p>
            <Link to="/catalogo" className="inline-block px-6 py-3 bg-[#1a3b5b] text-white font-bold rounded-xl hover:bg-[#1a3b5b]/90 transition-colors">
              Ir al Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Order List */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {orders.map((order) => (
                <motion.div 
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer relative overflow-hidden group transition-all ${
                    selectedOrder?.id === order.id 
                    ? 'border-[#ec5b13] bg-[#ec5b13]/5 shadow-md' 
                    : 'border-white bg-white hover:border-[#ec5b13]/30 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${selectedOrder?.id === order.id ? 'text-[#ec5b13]' : 'text-slate-400'}`}>
                      #FB-{order.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(order.estadoPedido ?? order.status)}`}>
                      {order.estadoPedido ?? order.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 truncate mb-1">
                    {order.nombreCliente || order.items?.[0]?.productName || 'Pedido Floral'}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(order.fechaCreacion ?? order.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-black text-slate-900">${(order.total || 0).toLocaleString()}</span>
                    <ChevronRight className={`w-5 h-5 transition-transform ${selectedOrder?.id === order.id ? 'text-[#ec5b13] translate-x-1' : 'text-slate-300'}`} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right Column: Order Detail */}
            <AnimatePresence mode="wait">
              {selectedOrder && (
                <motion.div 
                  key={selectedOrder.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
                >
                  {/* Detail Header */}
                  <div className="p-8 border-b border-slate-50 flex flex-wrap justify-between items-center gap-6 bg-slate-50/50">
                    <div>
                      <h3 className="text-2xl font-black text-[#1a3b5b]">Detalle del Pedido #FB-{selectedOrder.id}</h3>
                      <p className="text-sm text-slate-500">
                        Realizado el {new Date(selectedOrder.fechaCreacion ?? selectedOrder.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} a las {new Date(selectedOrder.fechaCreacion ?? selectedOrder.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-white hover:shadow-sm transition-all">
                        <Receipt className="w-4 h-4" />
                        Factura
                      </button>
                      <button className="flex items-center gap-2 px-5 py-2.5 bg-[#ec5b13] text-white rounded-xl text-sm font-bold hover:bg-opacity-90 shadow-lg shadow-[#ec5b13]/20 transition-all">
                        <RefreshCw className="w-4 h-4" />
                        Repetir Pedido
                      </button>
                    </div>
                  </div>

                  <div className="p-8 space-y-10">
                    {/* Products List */}
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Productos</h4>
                      {(selectedOrder.items ?? []).map((item: any, i: number) => (
                        <div key={i} className="flex flex-col md:flex-row gap-6 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                          <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
                            {item.productImage ? (
                              <img
                                className="w-full h-full object-cover"
                                src={item.productImage}
                                alt={item.productName}
                              />
                            ) : (
                              <Package className="w-10 h-10 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-grow flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="text-lg font-bold text-slate-900">{item.productName}</h5>
                                <span className="text-xl font-black text-[#ec5b13]">${(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                                {item.description || 'Arreglo floral exclusivo diseñado con las flores más frescas de la temporada.'}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] rounded-full font-bold uppercase tracking-wider">Cantidad: {item.quantity}</span>
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] rounded-full font-bold uppercase tracking-wider">Premium</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dedicatoria if exists */}
                    <div className="p-6 rounded-2xl bg-[#ec5b13]/5 border border-[#ec5b13]/10">
                      <div className="flex items-center gap-2 text-[#ec5b13] font-black text-xs uppercase tracking-widest mb-3">
                        <Heart className="w-4 h-4" />
                        Dedicatoria
                      </div>
                      <p className="text-sm italic text-slate-700 leading-relaxed">
                        "Feliz aniversario mi vida, que sigamos floreciendo juntos muchos años más. Con todo mi amor."
                      </p>
                    </div>

                    {/* Logistics Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-slate-100">
                      {/* Shipping */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#ec5b13]">
                            <Truck className="w-5 h-5" />
                          </div>
                          <h5 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">Dirección de Envío</h5>
                        </div>
                        <div className="pl-13">
                          <p className="font-bold text-slate-900 mb-1">{user.fullName || user.nombre}</p>
                          <p className="text-sm text-slate-500 leading-relaxed">
                            Calle Mayor, 124, 3º Izquierda<br />
                            28013 Madrid, España<br />
                            <span className="text-xs mt-2 block font-medium">+34 600 000 000</span>
                          </p>
                        </div>
                      </div>

                      {/* Payment */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#ec5b13]">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <h5 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">Método de Pago</h5>
                        </div>
                        <div className="pl-13">
                          <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 w-fit mb-6">
                            <CreditCard className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="text-sm font-bold text-slate-900">Mastercard **** 4242</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Expira 12/26</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Subtotal:</span>
                              <span className="text-slate-900 font-bold">${(selectedOrder.total * 0.84).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Envío:</span>
                              <span className="text-slate-900 font-bold">$0.00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">IVA (16%):</span>
                              <span className="text-slate-900 font-bold">${(selectedOrder.total * 0.16).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xl font-black pt-4 border-t border-slate-50">
                              <span className="text-slate-900">Total:</span>
                              <span className="text-[#ec5b13]">${(selectedOrder.total || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
