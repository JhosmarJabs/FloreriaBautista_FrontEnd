import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight, RefreshCw, AlertCircle, ShoppingCart, User,
  Calendar, MapPin, CreditCard, Package, ChevronDown, CheckCircle,
  Clock, Truck, X, ArrowLeft,
} from 'lucide-react';
import { AdminService } from '../../services/adminService';
import { OrderDetail } from '../../types';

// Estos son los estados reales que maneja el backend (ver Transiciones en OrderService.cs)
const ESTADOS_FLUJO = [
  { key: 'PENDIENTE_VALIDACION', label: 'Pendiente',      color: 'bg-amber-400',   text: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10'   },
  { key: 'EN_PREPARACION',       label: 'En preparación', color: 'bg-purple-400',  text: 'text-purple-700 dark:text-purple-400',  bg: 'bg-purple-50 dark:bg-purple-500/10'  },
  { key: 'EN_RUTA',              label: 'En camino',      color: 'bg-indigo-400',  text: 'text-indigo-700 dark:text-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-500/10'  },
  { key: 'ENTREGADO',            label: 'Entregado',      color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
];
const ESTADO_CANCELADO = { key: 'CANCELADO', label: 'Cancelado', color: 'bg-red-400', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' };
const ESTADO_NO_COMPLETADO = { key: 'NO_COMPLETADO', label: 'No completado', color: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700/30' };

// Siguiente estado permitido segun la maquina de estados del backend
const SIGUIENTE_ESTADO: Record<string, string | null> = {
  PENDIENTE_VALIDACION: 'EN_PREPARACION',
  EN_PREPARACION:        'EN_RUTA',
  EN_RUTA:               'ENTREGADO',
  ENTREGADO:             null,
};

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const sec = 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-5 shadow-sm';
const lbl = 'text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 block';

export default function AdminOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

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
    if (!id || !order) return;
    setShowStatusMenu(false);
    setUpdating(true);
    setUpdateError(null);
    try {
      const res = await AdminService.updateAdminOrderStatus(id, nuevoEstado);
      setOrder(res.data);
    } catch (err: any) {
      setUpdateError(err.message || 'Error al actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
    </div>
  );

  if (error || !order) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 dark:bg-slate-900">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-sm text-red-500 font-semibold">{error || 'Pedido no encontrado'}</p>
      <button onClick={() => navigate('/admin/pedidos')} className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800/50 px-3 py-1.5 rounded-lg">
        Volver a pedidos
      </button>
    </div>
  );

  const currentEstado = [...ESTADOS_FLUJO, ESTADO_CANCELADO, ESTADO_NO_COMPLETADO].find(e => e.key === order.estadoPedido);
  const currentIdx = ESTADOS_FLUJO.findIndex(e => e.key === order.estadoPedido);
  const isCancelled = order.estadoPedido === 'CANCELADO';
  const isNoCompletado = order.estadoPedido === 'NO_COMPLETADO';
  const siguienteEstado = SIGUIENTE_ESTADO[order.estadoPedido] ?? null;
  const siguienteLabel = ESTADOS_FLUJO.find(e => e.key === siguienteEstado)?.label;

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/admin/pedidos')}
            title="Regresar a pedidos"
            className="mt-1 flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <nav className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">
              <span className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors" onClick={() => navigate('/admin/pedidos')}>Pedidos</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-700 dark:text-slate-300">Detalle de Pedido</span>
            </nav>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-emerald-500" />
              Pedido #{id?.slice(0, 8).toUpperCase()}
            </h1>
          </div>
        </div>

        {/* Status change */}
        <div className="flex items-center gap-2">
          {updateError && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 border border-red-100 dark:border-red-800/50 px-3 py-2 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5" />{updateError}
            </div>
          )}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(v => !v)}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-60"
            >
              {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Cambiar estado
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nuevo estado</p>
                  <button onClick={() => setShowStatusMenu(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-1.5 space-y-0.5">
                  {ESTADOS_FLUJO.map(e => (
                    <button
                      key={e.key}
                      onClick={() => handleStatusChange(e.key)}
                      disabled={e.key === order.estadoPedido}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${e.key === order.estadoPedido ? 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' : `hover:bg-slate-50 dark:hover:bg-slate-700 ${e.text} hover:font-bold`}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${e.color}`} />
                      {e.label}
                      {e.key === order.estadoPedido && <CheckCircle className="w-3.5 h-3.5 ml-auto text-slate-300 dark:text-slate-600" />}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                    <button
                      onClick={() => handleStatusChange('CANCELADO')}
                      disabled={isCancelled || order.estadoPedido === 'ENTREGADO'}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${(isCancelled || order.estadoPedido === 'ENTREGADO') ? 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed' : 'hover:bg-red-50 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 hover:font-bold'}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      Cancelar pedido
                      {isCancelled && <CheckCircle className="w-3.5 h-3.5 ml-auto text-slate-300 dark:text-slate-600" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar (not cancelled / not archived as no-completado) */}
      {!isCancelled && !isNoCompletado && (
        <div className={sec}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Seguimiento del pedido</p>
          <div className="flex items-center gap-0">
            {ESTADOS_FLUJO.map((e, i) => {
              const done = i <= currentIdx;
              const current = i === currentIdx;
              return (
                <React.Fragment key={e.key}>
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${done ? `${e.color} border-transparent` : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                      {done ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />}
                    </div>
                    <span className={`text-[9px] font-bold text-center leading-tight ${current ? e.text : done ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-700'}`}>
                      {e.label}
                    </span>
                  </div>
                  {i < ESTADOS_FLUJO.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-5 transition-all ${i < currentIdx ? 'bg-emerald-300 dark:bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
          <X className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-black text-red-800 dark:text-red-400">Pedido cancelado</p>
            <p className="text-xs text-red-600 dark:text-red-500">Este pedido fue cancelado y no se procesará.</p>
          </div>
        </div>
      )}

      {/* No-completado banner (archivado sin seguimiento) */}
      {isNoCompletado && (
        <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
          <Clock className="w-5 h-5 text-slate-400 shrink-0" />
          <div>
            <p className="text-sm font-black text-slate-700 dark:text-slate-300">Pedido no completado</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Se archivó automáticamente: su fecha de entrega pasó sin que se le diera seguimiento.</p>
          </div>
        </div>
      )}

      {/* Current status badge */}
      {currentEstado && (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border dark:border-opacity-30 ${currentEstado.bg} ${currentEstado.text}`}>
            <span className={`w-2 h-2 rounded-full ${currentEstado.color}`} />
            Estado actual: {currentEstado.label}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">· Actualizado: {formatDateTime(order.fechaCreacion)}</span>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">

          {/* Client info */}
          <div className={sec}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-blue-500" /> Información del cliente
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className={lbl}>Nombre</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{order.nombreCliente || '—'}</p>
              </div>
              {order.correoCliente && (
                <div>
                  <span className={lbl}>Correo</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{order.correoCliente}</p>
                </div>
              )}
              {order.telefonoCliente && (
                <div>
                  <span className={lbl}>Teléfono</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{order.telefonoCliente}</p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery info */}
          <div className={sec}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-indigo-500" /> Entrega
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className={lbl}>Tipo de entrega</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{order.tipoEntrega || 'Domicilio'}</p>
              </div>
              <div>
                <span className={lbl}>Fecha de entrega</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatDate(order.fechaEntrega)}</p>
              </div>
              {order.direccion && (
                <div className="col-span-2">
                  <span className={lbl}>Dirección</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                    {`${order.direccion.calle}, ${order.direccion.colonia}, ${order.direccion.municipio}, ${order.direccion.estado}`}
                  </p>
                </div>
              )}
              {order.notas && (
                <div className="col-span-2">
                  <span className={lbl}>Notas del pedido</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-3 rounded-lg">
                    "{order.notas}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order items */}
          {order.items && order.items.length > 0 && (
            <div className={sec}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-emerald-500" /> Productos del pedido
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                      <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Producto</th>
                      <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Cant.</th>
                      <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Precio unit.</th>
                      <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {order.items.map(item => (
                      <tr key={item.productoId} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{item.productoNombre}</td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{item.cantidad}</td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-500 text-xs">
                          ${item.precioUnitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-white">
                          ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!order.items && (
            <div className={sec}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-emerald-500" /> Productos del pedido
              </p>
              <div className="flex flex-col items-center justify-center py-8 text-slate-300 dark:text-slate-700 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <Package className="w-8 h-8 mb-2" />
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Detalle de productos no disponible</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Summary card */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl p-4">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Resumen del pedido</p>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Folio', value: `#${id?.slice(0, 8).toUpperCase()}`, mono: true },
                { label: 'Estado', value: currentEstado?.label ?? order.estadoPedido },
                { label: 'Fecha creación', value: formatDateTime(order.fechaCreacion) },
                { label: 'Fecha entrega', value: formatDate(order.fechaEntrega) },
                { label: 'Método de pago', value: order.metodoPago || '—' },
                { label: 'Total', value: `$${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, bold: true, accent: true },
              ].map(r => (
                <div key={r.label} className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 dark:text-slate-500 shrink-0">{r.label}</span>
                  <span className={`text-right ${r.mono ? 'font-mono text-xs' : ''} ${r.bold ? 'font-black text-base' : 'font-semibold'} ${r.accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Acciones rápidas</p>
            {siguienteEstado ? (
              <button
                onClick={() => handleStatusChange(siguienteEstado)}
                disabled={updating || isCancelled || isNoCompletado}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border border-slate-100 dark:border-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-emerald-600 hover:bg-emerald-50 dark:bg-slate-900/40"
              >
                <Truck className="w-3.5 h-3.5" /> Marcar como {siguienteLabel}
              </button>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 px-1">Este pedido no tiene más avances disponibles.</p>
            )}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-2">
              <button
                onClick={() => handleStatusChange('CANCELADO')}
                disabled={updating || isCancelled || order.estadoPedido === 'ENTREGADO'}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border border-red-100 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="w-3.5 h-3.5" /> Cancelar pedido
              </button>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl p-4">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Fechas</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400 dark:text-slate-500" />
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-300 block">Creado</span>
                  {formatDateTime(order.fechaCreacion)}
                </div>
              </div>
              <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400 dark:text-slate-500" />
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-300 block">Entrega programada</span>
                  {formatDate(order.fechaEntrega)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
