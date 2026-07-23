import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

// Pantalla de retorno cuando el pago en Mercado Pago fue rechazado o cancelado.
// El pedido queda creado con saldo pendiente; el cliente puede reintentar el pago.
export default function PaymentFailedPage() {
  return (
    <main className="max-w-lg mx-auto pt-32 pb-20 px-4 font-sans min-h-screen flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6"
      >
        <XCircle className="w-12 h-12 text-red-500" />
      </motion.div>
      <h1 className="font-serif text-3xl text-[#1A3B5B] mb-2">El pago no se completó</h1>
      <p className="text-gray-500 mb-8">
        Tu pago fue rechazado o cancelado, así que no se realizó ningún cargo. Tu carrito sigue guardado por si quieres intentarlo de nuevo.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link
          to="/checkout/revision"
          className="px-8 py-3 bg-[#004A99] text-white font-bold rounded-xl hover:bg-[#004A99]/90 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Reintentar pago
        </Link>
        <Link
          to="/carrito"
          className="px-8 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al carrito
        </Link>
      </div>
    </main>
  );
}
