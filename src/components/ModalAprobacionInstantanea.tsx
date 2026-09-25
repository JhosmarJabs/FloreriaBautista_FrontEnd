import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { AdminService } from '../services/adminService';
import type { SolicitudPendienteEvento } from '../hooks/useRealtimeOrders';
import { parseApiDate } from '../utils/date';

interface Props {
  solicitud: SolicitudPendienteEvento;
  onClose: () => void;
}

export default function ModalAprobacionInstantanea({ solicitud, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRechazo, setShowRechazo] = useState(false);

  const handleAceptar = async () => {
    setLoading(true);
    setError(null);
    try {
      await AdminService.aceptarSolicitudInstantanea(solicitud.id);
      onClose();
    } catch (err: any) {
      if (err.message?.includes('409') || err.message?.includes('decidida')) {
        setError('Esta solicitud ya fue decidida por otra persona.');
        setTimeout(onClose, 2000);
      } else {
        setError(err.message || 'Error al aceptar la solicitud');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async () => {
    setLoading(true);
    setError(null);
    try {
      await AdminService.rechazarSolicitudInstantanea(
        solicitud.id,
        motivoRechazo || undefined,
      );
      onClose();
    } catch (err: any) {
      if (err.message?.includes('409') || err.message?.includes('decidida')) {
        setError('Esta solicitud ya fue decidida por otra persona.');
        setTimeout(onClose, 2000);
      } else {
        setError(err.message || 'Error al rechazar la solicitud');
      }
    } finally {
      setLoading(false);
    }
  };

  const creadaEn = parseApiDate(solicitud.creadaEn);
  const horaCreacion = creadaEn
    ? creadaEn.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 bg-white rounded-[2rem] shadow-2xl max-w-lg w-full mx-4 p-8 flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-2">
          Solicitud de venta instantanea
        </h2>

        <p className="text-slate-500 mb-6">
          {solicitud.nombreCliente} quiere comprar ahora
        </p>

        <div className="bg-slate-50 rounded-xl p-4 w-full mb-6 text-left space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500 text-sm">Producto</span>
            <span className="font-bold text-slate-800">{solicitud.nombreProducto}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-sm">Cantidad</span>
            <span className="font-bold text-slate-800">{solicitud.cantidad}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-sm">Cliente</span>
            <span className="font-bold text-slate-800">{solicitud.nombreCliente}</span>
          </div>
          {solicitud.telefonoCliente && (
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Telefono</span>
              <span className="font-bold text-slate-800">{solicitud.telefonoCliente}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500 text-sm">Hora</span>
            <span className="font-bold text-slate-800">{horaCreacion}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl flex items-center gap-2 w-full mb-4">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {!showRechazo ? (
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setShowRechazo(true)}
              disabled={loading}
              className="flex-1 py-4 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
              Rechazar
            </button>
            <button
              onClick={handleAceptar}
              disabled={loading}
              className="flex-1 py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              Aceptar
            </button>
          </div>
        ) : (
          <div className="w-full space-y-3">
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Motivo del rechazo (opcional)"
              className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRechazo(false)}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Volver
              </button>
              <button
                onClick={handleRechazar}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                Confirmar rechazo
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
