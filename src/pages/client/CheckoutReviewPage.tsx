import React, { useEffect, useState, useCallback } from 'react';
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
  Loader2,
  Tag,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { getDraft, saveCompletedOrder, generarFolio } from '../../utils/checkout';
import { AdminService } from '../../services/adminService';
import type { PricingBreakdown } from '../../types';

export default function CheckoutReviewPage() {
  const navigate = useNavigate();
  const { cart, cartTotal } = useCart();

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const [cuponInput, setCuponInput] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState<string | null>(null);
  const [cuponError, setCuponError] = useState('');
  const [cuponLoading, setCuponLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const draft = getDraft();

  useEffect(() => {
    if (!draft) navigate('/checkout/datos', { replace: true });
  }, [draft, navigate]);

  const shippingCost = draft?.shippingCost ?? 0;
  const dedicatoria = (draft?.dedicatoria || '').trim();
  const esAnticipado = draft?.orderType === 'anticipado';

  const pricingItems = cart.map(i => ({ productId: i.id, cantidad: i.quantity }));

  const cargarPricing = useCallback(async (cupon?: string) => {
    if (cart.length === 0) return;
    setPricingLoading(true);
    try {
      const res = await AdminService.calcularPricing(pricingItems, cupon || undefined);
      setBreakdown(res.data);
    } catch {
      setBreakdown(null);
    } finally {
      setPricingLoading(false);
    }
  }, [cart]);

  useEffect(() => {
    cargarPricing(cuponAplicado || undefined);
  }, [cart.length]);

  const aplicarCupon = async () => {
    const code = cuponInput.trim().toUpperCase();
    if (!code) return;
    setCuponError('');
    setCuponLoading(true);
    try {
      const res = await AdminService.aplicarCupon(pricingItems, code);
      setBreakdown(res.data);
      setCuponAplicado(code);
      setCuponError('');
    } catch (err: any) {
      setCuponError(err.message || 'Cupón inválido');
    } finally {
      setCuponLoading(false);
    }
  };

  const quitarCupon = async () => {
    setCuponAplicado(null);
    setCuponInput('');
    setCuponError('');
    await cargarPricing();
  };

  const subtotalDisplay = breakdown ? breakdown.subtotal : cartTotal;
  const totalDescuentos = breakdown ? breakdown.totalDescuentos : 0;
  const totalProductos = breakdown ? breakdown.total : cartTotal;
  const totalFinal = totalProductos + shippingCost;

  const formatearFecha = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const confirmarPedido = async () => {
    if (!draft || cart.length === 0 || procesando) return;
    setError('');
    setProcesando(true);
    try {
      const orden = await AdminService.createWebOrder({
        fechaEntrega: draft.deliveryDate,
        tipoPedido: draft.orderType === 'anticipado' ? 'ANTICIPADO' : 'INSTANTANEO',
        costoEnvio: draft.shippingCost,
        codigoCupon: cuponAplicado || undefined,
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

      saveCompletedOrder({
        ...draft,
        orderNumber: generarFolio(),
        backendOrderId: orden.id,
        createdAt: new Date().toISOString(),
        items: cart,
        subtotal: subtotalDisplay,
        total: totalFinal,
        pagado: false,
      });

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
        {/* Left Column: Order Details */}
        <div className="lg:col-span-8 space-y-8">
          {/* Dirección de Envío */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MapPin className="text-[#004A99] w-6 h-6" />
                <h3 className="text-xl font-serif font-bold text-slate-900">Dirección de Envío</h3>
              </div>
              <button onClick={() => navigate('/checkout/datos')} className="text-[#004A99] text-sm font-semibold flex items-center gap-1 hover:underline">
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
              <button onClick={() => navigate('/checkout/datos')} className="text-[#004A99] text-sm font-semibold flex items-center gap-1 hover:underline">
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

          {/* Dedicatoria */}
          {dedicatoria && (
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Mail className="text-[#004A99] w-6 h-6" />
                  <h3 className="text-xl font-serif font-bold text-slate-900">Mensaje para la Tarjeta</h3>
                </div>
                <button onClick={() => navigate('/checkout/datos')} className="text-[#004A99] text-sm font-semibold flex items-center gap-1 hover:underline">
                  <Edit3 className="w-4 h-4" /> Editar
                </button>
              </div>
              <div className="italic text-slate-700 border-l-4 border-[#004A99]/30 pl-4 py-2">
                "{dedicatoria}"
              </div>
            </section>
          )}

          {/* Políticas */}
          <div className="bg-slate-100 p-4 rounded-lg border-l-4 border-[#004A99] flex gap-4">
            <Info className="text-[#004A99] w-6 h-6 flex-shrink-0" />
            <div className="text-sm text-slate-600 leading-relaxed">
              <p className="font-bold mb-1">Políticas de Entrega:</p>
              Al confirmar tu pedido, aceptas nuestras condiciones de servicio. Las flores pueden variar ligeramente de la foto según disponibilidad estacional.
            </div>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-xl border border-slate-100">
              <h3 className="text-xl font-serif font-bold mb-6 border-b border-slate-100 pb-4 text-slate-900">Resumen del Pedido</h3>

              {/* Product List */}
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto no-scrollbar">
                {cart.length > 0 ? (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="size-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center">
                        {item.image ? (
                          <img alt={item.name} className="w-full h-full object-cover" src={item.image} />
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

              {/* Coupon Field */}
              <div className="pt-4 border-t border-slate-100 mb-4">
                {cuponAplicado ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-700">Cupón: {cuponAplicado}</span>
                    </div>
                    <button onClick={quitarCupon} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Código de cupón"
                          value={cuponInput}
                          onChange={e => setCuponInput(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === 'Enter' && aplicarCupon()}
                          className="w-full pl-9 pr-4 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004A99]/30 focus:border-[#004A99] outline-none transition-all uppercase"
                        />
                      </div>
                      <button
                        onClick={aplicarCupon}
                        disabled={cuponLoading || !cuponInput.trim()}
                        className="px-4 py-2.5 bg-[#004A99] text-white text-sm font-bold rounded-xl hover:bg-[#004A99]/90 disabled:opacity-50 transition-all flex items-center gap-1"
                      >
                        {cuponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                      </button>
                    </div>
                    {cuponError && <p className="text-xs text-red-600 font-medium">{cuponError}</p>}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-900">${subtotalDisplay.toFixed(2)}</span>
                </div>

                {/* Discount Breakdown */}
                {breakdown && breakdown.descuentosAplicados.length > 0 && breakdown.descuentosAplicados.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {d.nombre}
                    </span>
                    <span className="font-medium text-emerald-600">-${d.monto.toFixed(2)}</span>
                  </div>
                ))}

                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Envío</span>
                  <span className={`font-medium ${shippingCost > 0 ? 'text-slate-900' : 'text-green-600'}`}>
                    {shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : '¡Gratis!'}
                  </span>
                </div>

                {totalDescuentos > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200">
                    <span className="text-emerald-600 font-semibold">Ahorras</span>
                    <span className="font-bold text-emerald-600">-${totalDescuentos.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold pt-4 text-slate-900">
                  <span>Total</span>
                  <span className="text-[#004A99]">${totalFinal.toFixed(2)} MXN</span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={confirmarPedido}
                disabled={cart.length === 0 || procesando || pricingLoading}
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
              {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Lock className="w-3 h-3" />
                Pago 100% Seguro y Encriptado
              </div>
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
