import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle,
  ArrowLeft,
  Download,
  Printer,
  Share2,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import { getCompletedOrder, saveCompletedOrder, clearDraft, type CompletedOrder } from '../../utils/checkout';
import { useCart } from '../../hooks/useCart';
import { AdminService } from '../../services/adminService';

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<CompletedOrder | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [mensajeAccion, setMensajeAccion] = useState('');

  // Al volver de Mercado Pago confirmamos el pago con el backend antes de dar
  // por exitosa la compra. Solo entonces se vacía el carrito.
  useEffect(() => {
    let cancelado = false;
    const procesar = async () => {
      const o = getCompletedOrder();
      if (!o) {
        navigate('/catalogo', { replace: true });
        return;
      }

      const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
      const status = searchParams.get('status') || searchParams.get('collection_status');

      // Determina si el pedido ya está pagado.
      // 1) Si MP redirigió con payment_id, lo consultamos directo.
      // 2) Si no (ej. localhost sin auto_return), buscamos el pago por id de orden.
      let pagado = o.pagado === true;
      if (!pagado && (paymentId || o.backendOrderId)) {
        try {
          const res = paymentId
            ? await AdminService.confirmMpPayment(paymentId)
            : await AdminService.confirmMpOrder(o.backendOrderId!);

          if (res.estado === 'approved' || res.acreditado) {
            pagado = true;
          } else {
            navigate(res.estado === 'rejected' || status === 'rejected' ? '/checkout/fallo' : '/checkout/pendiente', { replace: true });
            return;
          }
        } catch {
          // Si falla la verificación pero MP marcó aprobado por query, continuamos con cautela.
          if (paymentId && (!status || status === 'approved')) {
            pagado = true;
          } else {
            navigate('/checkout/pendiente', { replace: true });
            return;
          }
        }
      }

      // Siempre que el pedido esté pagado se vacía el carrito y el borrador
      // (también en revisitas), para que la insignia del carrito no quede colgada.
      if (pagado) {
        const pagada = { ...o, pagado: true };
        saveCompletedOrder(pagada);
        clearCart();
        clearDraft();
        if (!cancelado) { setOrder(pagada); setVerificando(false); }
        return;
      }

      if (!cancelado) { setOrder(o); setVerificando(false); }
    };
    procesar();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (verificando) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="w-10 h-10 text-[#1A3B5B] animate-spin" />
        <p className="text-slate-500 font-medium">Confirmando tu pago…</p>
      </main>
    );
  }

  if (!order) return null;

  const esAnticipado = order.orderType === 'anticipado';

  const fechaOrden = new Date(order.createdAt).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const formatearFecha = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  };

  // ── Acciones del recibo ──────────────────────────────────────
  const construirRecibo = () => {
    const o = order;
    const lineas = [
      'FLORERÍA BAUTISTA',
      `Recibo de pedido #${o.orderNumber}`,
      `Fecha: ${fechaOrden}`,
      '',
      'PRODUCTOS',
      ...o.items.map(i => `  ${i.quantity} x ${i.name}  —  $${(i.price * i.quantity).toFixed(2)}`),
      ...(o.dedicatoria ? ['', `Dedicatoria: "${o.dedicatoria}"`] : []),
      '',
      'ENTREGA',
      `  ${o.address.label}: ${o.address.fullAddress}`,
      `  ${esAnticipado ? `Anticipado — ${formatearFecha(o.deliveryDate)}${o.timeSlot ? ` · ${o.timeSlot}` : ''}` : 'Instantánea — el mismo día (60 a 90 min)'}`,
      '',
      'PAGO',
      `  Subtotal: $${o.subtotal.toFixed(2)}`,
      `  Envío: ${o.shippingCost > 0 ? `$${o.shippingCost.toFixed(2)}` : 'Gratis'}`,
      `  Total pagado: $${o.total.toFixed(2)} MXN`,
      '',
      '¡Gracias por tu compra!',
    ];
    return lineas.join('\n');
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const blob = new Blob([construirRecibo()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recibo-${order.orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const texto = `¡Hice mi pedido en Florería Bautista! 🌸\nPedido #${order.orderNumber} · Total $${order.total.toFixed(2)} MXN`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Florería Bautista', text: texto });
      } else {
        await navigator.clipboard.writeText(texto);
        setMensajeAccion('Resumen copiado al portapapeles');
        setTimeout(() => setMensajeAccion(''), 2500);
      }
    } catch {
      /* el usuario canceló el diálogo de compartir */
    }
  };

  return (
    <main className="max-w-2xl mx-auto pt-32 pb-20 px-4 font-sans bg-gray-50 min-h-screen">
      {/* BEGIN: HeaderSection */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>
        <h1 className="font-serif text-3xl text-[#1A3B5B] mb-2">¡Pedido Confirmado!</h1>
        <p className="text-gray-500 italic">Gracias por confiar en Florería Bautista. Tu pedido está en camino.</p>
      </div>
      {/* END: HeaderSection */}

      {/* BEGIN: TicketLayout */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative"
      >
        {/* BEGIN: TicketTop */}
        <div className="p-8 border-b border-gray-100 relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-serif text-xl text-[#D4AF37] tracking-wide">Florería Bautista</h2>
              <p className="text-xs uppercase tracking-widest text-gray-400">Recibo de Pedido #{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Fecha de Orden</p>
              <p className="font-semibold text-[#1A3B5B]">{fechaOrden}</p>
            </div>
          </div>

          {/* BEGIN: ProductsList */}
          <section>
            <h3 className="font-serif text-lg text-[#1A3B5B] mb-4 flex items-center">
              <span className="w-8 h-px bg-[#D4AF37] mr-3"></span>
              Productos y Personalización
            </h3>
            <div className="space-y-6">
              {order.items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex gap-4 items-start ${idx < order.items.length - 1 ? 'pb-6 border-b border-gray-50' : ''}`}
                >
                  <div className="w-20 h-20 rounded-lg shadow-sm overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img alt={item.name} className="w-full h-full object-cover" src={item.image} />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between gap-3">
                      <h4 className="font-semibold text-[#1A3B5B]">{item.name}</h4>
                      <span className="text-[#1A3B5B] font-semibold whitespace-nowrap">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    {/* La dedicatoria aplica a todo el pedido; se muestra una sola vez. */}
                    {idx === 0 && order.dedicatoria && (
                      <p className="italic bg-[#F9F1DC] p-2 rounded mt-2 text-xs text-gray-700">
                        "{order.dedicatoria}"
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Cantidad: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Decorative Perforation Line */}
        <div className="h-4 w-full flex items-center overflow-hidden">
          <div className="w-full border-b-2 border-dashed border-[#D4AF37] opacity-30"></div>
        </div>

        {/* BEGIN: TicketMiddle */}
        <div className="p-8 bg-white border-b border-gray-100">
          <section>
            <h3 className="font-serif text-lg text-[#1A3B5B] mb-4 flex items-center">
              <span className="w-8 h-px bg-[#D4AF37] mr-3"></span>
              Detalles de Entrega
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <p className="text-gray-400 uppercase text-[10px] tracking-widest font-bold">Dirección de Envío</p>
                <p className="text-gray-700 font-medium">{order.address.label}</p>
                <p className="text-gray-700 leading-relaxed">{order.address.fullAddress}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 uppercase text-[10px] tracking-widest font-bold">Programación</p>
                <div className="flex flex-col gap-1">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-[#1A3B5B] text-xs font-semibold w-fit">
                    {esAnticipado ? 'Pedido Anticipado' : 'Entrega Instantánea'}
                  </span>
                  {esAnticipado ? (
                    <>
                      <p className="text-gray-700 font-medium capitalize">{formatearFecha(order.deliveryDate)}</p>
                      {order.timeSlot && <p className="text-gray-500">Horario: {order.timeSlot}</p>}
                    </>
                  ) : (
                    <p className="text-gray-500">Entrega el mismo día (60 a 90 min)</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* BEGIN: TicketBottom */}
        <div className="p-8 bg-[#F9F1DC]/30">
          <section>
            <h3 className="font-serif text-lg text-[#1A3B5B] mb-4 flex items-center">
              <span className="w-8 h-px bg-[#D4AF37] mr-3"></span>
              Resumen de Pago
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Productos</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Costo de Envío</span>
                <span>{order.shippingCost > 0 ? `$${order.shippingCost.toFixed(2)}` : '¡Gratis!'}</span>
              </div>
              <div className="pt-4 mt-2 border-t border-[#D4AF37]/20 flex justify-between items-center">
                <span className="font-serif text-xl text-[#1A3B5B] font-bold">Total Pagado</span>
                <span className="font-serif text-2xl text-[#1A3B5B] font-bold">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </section>
        </div>
      </motion.div>

      {/* BEGIN: ActionButtons */}
      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center print:hidden">
        <button
          onClick={() => navigate('/catalogo')}
          className="w-full sm:w-auto px-8 py-3 text-[#1A3B5B] font-semibold border-2 border-[#1A3B5B]/20 rounded-full hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Seguir comprando
        </button>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            title="Imprimir recibo"
            aria-label="Imprimir recibo"
            className="p-3 bg-white text-[#1A3B5B] border border-gray-200 rounded-full hover:bg-gray-50 transition-all shadow-sm"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            title="Descargar recibo"
            aria-label="Descargar recibo"
            className="p-3 bg-white text-[#1A3B5B] border border-gray-200 rounded-full hover:bg-gray-50 transition-all shadow-sm"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleShare}
            title="Compartir"
            aria-label="Compartir"
            className="p-3 bg-white text-[#1A3B5B] border border-gray-200 rounded-full hover:bg-gray-50 transition-all shadow-sm"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      {mensajeAccion && (
        <p className="mt-4 text-center text-sm text-green-600 font-medium print:hidden">{mensajeAccion}</p>
      )}
    </main>
  );
}
