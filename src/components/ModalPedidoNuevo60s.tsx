import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, X, MapPin, Clock, Calendar } from 'lucide-react';
import type { PedidoNuevoEvento } from '../hooks/useRealtimeOrders';

interface Props {
  pedido: PedidoNuevoEvento;
  onClose: () => void;
}

const AUTO_DISMISS_MS = 60_000;

export default function ModalPedidoNuevo60s({ pedido, onClose }: Props) {
  const [remaining, setRemaining] = useState(60);

  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_DISMISS_MS);

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[190] flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900">Nuevo pedido</h3>
            <p className="text-xs text-slate-500">
              {pedido.esInstantanea ? 'Venta instantanea' : pedido.tipoPedido}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Cliente:</span>
            <span className="font-bold text-slate-800">{pedido.nombreCliente}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500">Entrega:</span>
            <span className="font-bold text-slate-800">{pedido.fechaEntrega}</span>
          </div>

          {pedido.horaEntrega && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">Hora:</span>
              <span className="font-bold text-slate-800">{pedido.horaEntrega}</span>
            </div>
          )}

          {pedido.direccion && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">Lugar:</span>
              <span className="font-bold text-slate-800">{pedido.direccion}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Total:</span>
            <span className="font-bold text-slate-800">
              ${pedido.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {pedido.notas && (
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500">Notas:</span>{' '}
              <span className="text-slate-700">{pedido.notas}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Se cierra en {remaining}s
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
}
