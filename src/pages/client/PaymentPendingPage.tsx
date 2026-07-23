import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';

// Pantalla de retorno cuando el pago quedó pendiente (ej. OXXO/SPEI en Mercado Pago).
// El pedido queda registrado; se acreditará automáticamente cuando MP confirme el pago.
export default function PaymentPendingPage() {
  return (
    <main className="max-w-lg mx-auto pt-32 pb-20 px-4 font-sans min-h-screen flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6"
      >
        <Clock className="w-12 h-12 text-amber-500" />
      </motion.div>
      <h1 className="font-serif text-3xl text-[#1A3B5B] mb-2">Tu pago está pendiente</h1>
      <p className="text-gray-500 mb-8">
        Recibimos tu pedido y estamos esperando la confirmación del pago (por ejemplo, si pagaste en efectivo por OXXO o transferencia). En cuanto se acredite, procesaremos tu pedido y te avisaremos.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link
          to="/configuracion?tab=pedidos"
          className="px-8 py-3 bg-[#004A99] text-white font-bold rounded-xl hover:bg-[#004A99]/90 transition-all"
        >
          Ver mis pedidos
        </Link>
        <Link
          to="/catalogo"
          className="px-8 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Seguir comprando
        </Link>
      </div>
    </main>
  );
}
