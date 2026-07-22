import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Edit3,
  Check,
  X,
  ShoppingBag,
  Wallet,
  AlertTriangle,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { OrderDetail } from '../../types';
import { FadeIn } from '../../components/Animations';
import { useToast } from '../../hooks/useToast';
import { parseApiDate } from '../../utils/date';

// Estados reales del backend (ver Transiciones en Backend/Services/OrderService.cs)
const ESTADOS_FLUJO = [
  { key: 'PENDIENTE_VALIDACION', label: 'Pendiente',      color: 'bg-amber-400',   text: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { key: 'EN_PREPARACION',       label: 'En Preparación', color: 'bg-indigo-400',  text: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
  { key: 'EN_RUTA',              label: 'En Ruta',        color: 'bg-blue-400',    text: 'text-blue-700 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { key: 'ENTREGADO',            label: 'Entregado',      color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
];
const ESTADO_CANCELADO = { key: 'CANCELADO', label: 'Cancelado', color: 'bg-rose-400', text: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' };
const ESTADO_NO_COMPLETADO = { key: 'NO_COMPLETADO', label: 'No Completado', color: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700/30' };

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await AdminService.getAdminOrderById(id);
      setOrder(res.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusChange = async (nuevoEstado: string) => {
    if (!id) return;
    setShowStatusModal(false);
    setUpdating(true);
    try {
      const res = await AdminService.updateAdminOrderStatus(id, nuevoEstado);
      setOrder(res.data);
      showToast('Estado actualizado correctamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar el estado', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="text-slate-400 font-medium animate-pulse">Cargando detalles...</p>
      </div>
    </div>
  );

  if (error || !order) return (
    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
      <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
      <h2 className="text-2xl font-black text-slate-400 dark:text-slate-600">{error || 'Pedido no encontrado'}</h2>
      <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600 font-bold hover:underline">Volver atrás</button>
    </div>
  );

  const currentEstado = [...ESTADOS_FLUJO, ESTADO_CANCELADO, ESTADO_NO_COMPLETADO].find(e => e.key === order.estadoPedido);
  const isCancelled = order.estadoPedido === 'CANCELADO';
  const isNoCompletado = order.estadoPedido === 'NO_COMPLETADO';

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
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Pedido #{id?.slice(0, 8).toUpperCase()}</h1>
              </div>
              {currentEstado && (
                <span className={`${currentEstado.bg} ${currentEstado.text} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-current/20 leading-none ml-2`}>
                  {currentEstado.label}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowStatusModal(true)}
              disabled={updating || isCancelled}
              className="flex items-center justify-center rounded-xl px-5 py-3 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold transition-all hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 disabled:opacity-50"
            >
              {updating ? <Clock className="w-4 h-4 mr-2 animate-spin" /> : <Edit3 className="w-4 h-4 mr-2" />}
              Actualizar Estado
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
            <p className="text-slate-900 dark:text-white font-black text-lg leading-tight">{order.nombreCliente || 'Cliente sin nombre'}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium">{order.telefonoCliente || 'Sin teléfono registrado'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <Mail className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium truncate">{order.correoCliente || 'Sin correo registrado'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Card */}
        <div className={cardCls}>
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Productos</h3>
          </div>
          <div className="space-y-2">
            {order.items && order.items.length > 0 ? order.items.map(item => (
              <div key={item.productoId} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-700 dark:text-slate-300 font-semibold truncate">{item.cantidad}x {item.productoNombre}</span>
                <span className="text-slate-400 dark:text-slate-500 font-bold shrink-0">${item.subtotal.toLocaleString()}</span>
              </div>
            )) : (
              <p className="text-sm text-slate-400 italic">Sin detalle de productos disponible.</p>
            )}
            {order.notas && (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 mt-2">
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Notas del pedido:</p>
                <p className="text-xs font-serif italic text-slate-600 dark:text-slate-300 leading-relaxed">"{order.notas}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Logistics Card */}
        <div className={cardCls}>
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Logística</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                {order.direccion ? `${order.direccion.calle}, ${order.direccion.colonia}, ${order.direccion.municipio}` : 'Sin dirección registrada'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                Entrega: {parseApiDate(order.fechaEntrega)?.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                {order.horaEntrega ? ` — ${order.horaEntrega}` : ''}
              </p>
            </div>
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
              <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Total</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">${order.total.toLocaleString()}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-xl border ${order.saldoPendiente <= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest">Saldo Pendiente:</span>
              <span className="text-sm font-black">${order.saldoPendiente.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancelled / No completado banners */}
      {isCancelled && (
        <div className="flex items-center gap-3 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl">
          <X className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="text-sm font-black text-rose-800 dark:text-rose-400">Pedido cancelado</p>
            <p className="text-xs text-rose-600 dark:text-rose-500">Este pedido fue cancelado y no se procesará.</p>
          </div>
        </div>
      )}
      {isNoCompletado && (
        <div className="flex items-center gap-3 p-5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <Clock className="w-5 h-5 text-slate-400 shrink-0" />
          <div>
            <p className="text-sm font-black text-slate-700 dark:text-slate-300">Pedido no completado</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Se archivó automáticamente: su fecha de entrega pasó sin seguimiento.</p>
          </div>
        </div>
      )}

      {/* Timeline Section */}
      {!isCancelled && !isNoCompletado && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-8">Ciclo de Vida de la Orden</h2>
          <div className="relative space-y-0">
            {ESTADOS_FLUJO.map((item, idx, arr) => {
              const currentIdx = ESTADOS_FLUJO.findIndex(e => e.key === order.estadoPedido);
              const done = idx <= currentIdx;
              const current = idx === currentIdx;
              return (
                <div key={item.key} className="grid grid-cols-[48px_1fr] gap-x-6">
                  <div className="flex flex-col items-center">
                    <div className={`z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all shadow-sm ${
                      done ? `${item.color} text-white` : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-2 border-slate-200 dark:border-slate-600'
                    } ${current ? 'ring-8 ring-emerald-500/10 scale-110' : ''}`}>
                      {done ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    {idx !== arr.length - 1 && (
                      <div className={`w-0.5 h-16 ${idx < currentIdx ? item.color : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                    )}
                  </div>
                  <div className="pb-10 pt-1">
                    <p className={`text-base font-black ${current ? item.text : done ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'}`}>
                      {item.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold tracking-widest">Orden #{id?.slice(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="p-8 space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Seleccionar Nuevo Estado</label>
                <div className="grid grid-cols-1 gap-3">
                  {ESTADOS_FLUJO.map(e => (
                    <button
                      key={e.key}
                      onClick={() => handleStatusChange(e.key)}
                      disabled={e.key === order.estadoPedido}
                      className={`group flex items-center justify-between px-5 py-4 border-2 rounded-2xl transition-all ${
                        e.key === order.estadoPedido ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 cursor-not-allowed' : 'border-slate-50 dark:border-slate-700 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${e.key === order.estadoPedido ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600'}`}>
                          <CheckCircle2 size={20} />
                        </div>
                        <span className={`font-bold ${e.key === order.estadoPedido ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>{e.label}</span>
                      </div>
                      {e.key === order.estadoPedido && <Check className="w-5 h-5 text-emerald-600" />}
                    </button>
                  ))}
                  <button
                    onClick={() => handleStatusChange('CANCELADO')}
                    disabled={isCancelled || order.estadoPedido === 'ENTREGADO'}
                    className="group flex items-center justify-between px-5 py-4 border-2 border-rose-100 dark:border-rose-900/40 rounded-2xl transition-all hover:border-rose-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-500">
                        <X size={20} />
                      </div>
                      <span className="font-bold text-rose-600 dark:text-rose-400">Cancelar Pedido</span>
                    </div>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 p-8 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-50 dark:border-slate-700">
                <button onClick={() => setShowStatusModal(false)} className="px-6 py-2 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 transition-colors">
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
