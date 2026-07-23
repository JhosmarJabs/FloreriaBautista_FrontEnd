import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  ChevronRight,
  Edit3,
  Zap,
  Mail,
  Info,
  Lock,
  ShoppingBag,
  Clock,
  Calendar,
  Loader2
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { getDraft, saveCompletedOrder, generarFolio } from '../../utils/checkout';
import { AdminService } from '../../services/adminService';

export default function CheckoutReviewPage() {
  const navigate = useNavigate();
  const { cart, cartTotal } = useCart();

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  // Todo el pedido se arma desde el borrador guardado en la pantalla de Datos.
  const draft = getDraft();

  // Si no hay borrador (entraron directo a esta URL), regresamos a capturar datos.
  useEffect(() => {
    if (!draft) navigate('/checkout/datos', { replace: true });
  }, [draft, navigate]);

  const dedicatoria = (draft?.dedicatoria || '').trim();
  const shippingCost = draft?.shippingCost ?? 0;
  const total = cartTotal + shippingCost;

  const esAnticipado = draft?.orderType === 'anticipado';

  const formatearFecha = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  // Crea el pedido real en el backend y redirige a Mercado Pago (Checkout Pro).
  const confirmarPedido = async () => {
    if (!draft || cart.length === 0 || procesando) return;
    setError('');
    setProcesando(true);
    try {
      // 1) Crear la orden real en el backend (el Total lo calcula el servidor).
      const orden = await AdminService.createWebOrder({
        fechaEntrega: draft.deliveryDate,
        tipoPedido: draft.orderType === 'anticipado' ? 'ANTICIPADO' : 'INSTANTANEO',
        costoEnvio: draft.shippingCost,
        notas: [
          draft.timeSlot ? `Horario: ${draft.timeSlot}` : '',
          dedicatoria ? `Dedicatoria: ${dedicatoria}` : '',
        ].filter(Boolean).join(' | ') || undefined,
        direccion: {
          calle: draft.address.calle,
          colonia: draft.address.colonia,
          municipio: draft.address.municipio,
          estado: draft.address.estado,
          cp: draft.address.cp,
          referencias: draft.address.referencias,
        },
        items: cart.map(i => ({ productId: i.id, cantidad: i.quantity })),
      });

      // 2) Guardar el snapshot del pedido para la pantalla de Éxito.
      saveCompletedOrder({
        ...draft,
        orderNumber: generarFolio(),
        backendOrderId: orden.id,
        createdAt: new Date().toISOString(),
        items: cart,
        subtotal: cartTotal,
        total,
        pagado: false,
      });

      // 3) Crear la preferencia de pago y redirigir a Mercado Pago.
      const pref = await AdminService.createMpPreference(orden.id);
      if (!pref.initPoint) throw new Error('No se recibió la URL de pago.');
      window.location.href = pref.initPoint;
    } catch (e: any) {
      setError(e?.message || 'No se pudo iniciar el pago. Intenta de nuevo.');
      setProcesando(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 lg:px-20 py-10 lg:py-20 pt-32 min-h-screen font-display bg-[#f0f7ff]">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 mb-8 text-sm text-slate-500">
        <Link to="/carrito" className="hover:text-[#004A99]">Carrito</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/checkout/datos" className="hover:text-[#004A99]">Envío</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#004A99] font-semibold">Confirmación</span>
      </nav>

      <div className="mb-10">
        <h2 className="text-4xl font-serif font-bold text-slate-900 mb-2">Revisa tu Pedido</h2>
        <p className="text-slate-600">Casi terminamos. Por favor, verifica que toda la información sea correcta.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Columna Izquierda: Detalles del pedido */}
        <div className="lg:col-span-8 space-y-8">
          {/* Dirección de Envío */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MapPin className="text-[#004A99] w-6 h-6" />
                <h3 className="text-xl font-serif font-bold text-slate-900">Dirección de Envío</h3>
              </div>
              <button 
                onClick={() => navigate('/checkout/datos')}
                className="text-[#004A99] text-sm font-semibold flex items-center gap-1 hover:underline"
              >
                <Edit3 className="w-4 h-4" /> Editar
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{draft?.address.label || 'Dirección de entrega'}</p>
                <p className="text-slate-600 mt-1">{draft?.address.fullAddress}</p>
              </div>
              <div className="w-full md:w-48 h-32 rounded-lg bg-slate-100 overflow-hidden relative flex items-center justify-center">
                <MapPin className="text-[#004A99] w-8 h-8" />
              </div>
            </div>
          </section>

          {/* Método de Entrega */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {esAnticipado ? <Calendar className="text-[#004A99] w-6 h-6" /> : <Zap className="text-[#004A99] w-6 h-6" />}
                <h3 className="text-xl font-serif font-bold text-slate-900">Método de Entrega</h3>
              </div>
              <button
                onClick={() => navigate('/checkout/datos')}
                className="text-[#004A99] text-sm font-semibold flex items-center gap-1 hover:underline"
              >
                <Edit3 className="w-4 h-4" /> Editar
              </button>
            </div>
            <div className="p-4 rounded-lg bg-[#004A99]/5 border border-[#004A99]/20 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{esAnticipado ? 'Pedido Anticipado' : 'Entrega Instantánea'}</p>
                {esAnticipado ? (
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatearFecha(draft?.deliveryDate || '')}{draft?.timeSlot ? ` · ${draft.timeSlot}` : ''}
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">Recibe tus flores en un lapso de 60 a 90 minutos.</p>
                )}
              </div>
              <span className={shippingCost > 0 ? 'text-slate-900 font-bold' : 'text-green-600 font-bold'}>
                {shippingCost > 0 ? `$${shippingCost.toFixed(2)} MXN` : '¡Gratis!'}
              </span>
            </div>
          </section>

          {/* Mensaje para la tarjeta: solo se muestra si el cliente agregó una dedicatoria. */}
          {dedicatoria && (
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Mail className="text-[#004A99] w-6 h-6" />
                <h3 className="text-xl font-serif font-bold text-slate-900">Mensaje para la Tarjeta</h3>
              </div>
              <button
                onClick={() => navigate('/checkout/datos')}
                className="text-[#004A99] text-sm font-semibold flex items-center gap-1 hover:underline"
              >
                <Edit3 className="w-4 h-4" /> Editar
              </button>
            </div>
            <div className="italic text-slate-700 border-l-4 border-[#004A99]/30 pl-4 py-2">
              "{dedicatoria}"
            </div>
          </section>
          )}

          {/* Políticas de entrega */}
          <div className="bg-slate-100 p-4 rounded-lg border-l-4 border-[#004A99] flex gap-4">
            <Info className="text-[#004A99] w-6 h-6 flex-shrink-0" />
            <div className="text-sm text-slate-600 leading-relaxed">
              <p className="font-bold mb-1">Políticas de Entrega:</p>
              Al confirmar tu pedido, aceptas nuestras condiciones de servicio. Las flores pueden variar ligeramente de la foto según disponibilidad estacional.
            </div>
          </div>
        </div>

        {/* Columna Derecha: Resumen */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-xl border border-slate-100">
              <h3 className="text-xl font-serif font-bold mb-6 border-b border-slate-100 pb-4 text-slate-900">Resumen del Pedido</h3>
              
              {/* Lista de Productos */}
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto no-scrollbar">
                {cart.length > 0 ? (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="size-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center">
                        {item.image ? (
                          <img
                            alt={item.name}
                            className="w-full h-full object-cover"
                            src={item.image}
                          />
                        ) : (
                          <ShoppingBag className="w-7 h-7 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold leading-tight text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">Cantidad: {item.quantity}</p>
                        <p className="text-sm font-semibold mt-1 text-[#004A99]">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-4">Carrito vacío</p>
                )}
              </div>

              {/* Totales */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-900">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Envío</span>
                  <span className={`font-medium ${shippingCost > 0 ? 'text-slate-900' : 'text-green-600'}`}>
                    {shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : '¡Gratis!'}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-4 text-slate-900">
                  <span>Total</span>
                  <span className="text-[#004A99]">${total.toFixed(2)} MXN</span>
                </div>
              </div>

              {/* Botón Principal */}
              <button
                onClick={confirmarPedido}
                disabled={cart.length === 0 || procesando}
                className="w-full mt-8 bg-[#004A99] hover:bg-[#004A99]/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#004A99]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {procesando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redirigiendo a Mercado Pago…
                  </>
                ) : (
                  'PAGAR CON MERCADO PAGO'
                )}
              </button>
              {error && (
                <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
              )}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Lock className="w-3 h-3" />
                Pago 100% Seguro y Encriptado
              </div>
            </div>

            {/* Cupones o ayuda */}
            <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl flex items-center gap-3 group cursor-pointer hover:border-[#004A99] transition-colors">
              <ShoppingBag className="w-5 h-5 text-slate-400 group-hover:text-[#004A99]" />
              <span className="text-sm font-medium text-slate-600">¿Tienes un cupón de descuento?</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-20 pb-10 text-center text-xs text-slate-400">
        © 2024 Florería Bautista. Todos los derechos reservados.
      </div>
    </main>
  );
}

