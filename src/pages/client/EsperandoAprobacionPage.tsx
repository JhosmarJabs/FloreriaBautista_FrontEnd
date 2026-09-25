import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { AdminService } from '../../services/adminService';

type Estado = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'EXPIRADA';

interface SolicitudInfo {
  id: string;
  estado: Estado;
  productoNombre: string;
  cantidad: number;
  motivoRechazo: string | null;
  reservaExpiraEn: string | null;
}

const POLLING_INTERVAL = 5_000;

export default function EsperandoAprobacionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const solicitudId = searchParams.get('id') || getSavedSolicitudId();

  const [solicitud, setSolicitud] = useState<SolicitudInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSolicitud = useCallback(async () => {
    if (!solicitudId) return;
    try {
      const res = await AdminService.getSolicitudVentaInstantanea(solicitudId);
      const data = res.data;
      setSolicitud({
        id: data.id,
        estado: data.estado as Estado,
        productoNombre: data.productoNombre,
        cantidad: data.cantidad,
        motivoRechazo: data.motivoRechazo,
        reservaExpiraEn: data.reservaExpiraEn,
      });
      setError(null);
    } catch {
      setError('No se pudo consultar el estado de tu solicitud.');
    } finally {
      setLoading(false);
    }
  }, [solicitudId]);

  // Save and retrieve solicitudId from localStorage
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      try { localStorage.setItem('solicitudInstantaneaId', idFromUrl); } catch {}
    }
  }, [searchParams]);

  // Initial fetch
  useEffect(() => {
    fetchSolicitud();
  }, [fetchSolicitud]);

  // SignalR connection for real-time updates
  useEffect(() => {
    if (!solicitudId) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/venta-instantanea', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on('SolicitudDecidida', (data: any) => {
      if (data.id === solicitudId) {
        setSolicitud({
          id: data.id,
          estado: data.estado,
          productoNombre: data.nombreProducto,
          cantidad: data.cantidad,
          motivoRechazo: data.motivoRechazo,
          reservaExpiraEn: data.reservaExpiraEn,
        });
      }
    });

    connection.onreconnected(async () => {
      await connection.invoke('SuscribirSolicitud', solicitudId);
    });

    connection
      .start()
      .then(() => connection.invoke('SuscribirSolicitud', solicitudId))
      .catch(() => {
        // If SignalR fails, rely on polling
      });

    return () => {
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop();
      }
    };
  }, [solicitudId]);

  // Polling fallback
  useEffect(() => {
    if (!solicitudId) return;
    if (solicitud && solicitud.estado !== 'PENDIENTE') return;

    pollingRef.current = setInterval(fetchSolicitud, POLLING_INTERVAL);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [solicitudId, solicitud?.estado, fetchSolicitud]);

  // Cleanup localStorage when decided
  useEffect(() => {
    if (solicitud && solicitud.estado !== 'PENDIENTE') {
      try { localStorage.removeItem('solicitudInstantaneaId'); } catch {}
    }
  }, [solicitud?.estado]);

  if (!solicitudId) {
    return (
      <main className="max-w-lg mx-auto pt-32 pb-20 px-4 font-sans min-h-screen flex flex-col items-center text-center">
        <h1 className="font-serif text-2xl text-[#1A3B5B] mb-4">Sin solicitud activa</h1>
        <p className="text-gray-500 mb-6">No hay ninguna solicitud de venta instantanea pendiente.</p>
        <button
          onClick={() => navigate('/catalogo')}
          className="px-6 py-3 bg-[#004A99] text-white font-bold rounded-xl hover:bg-[#004A99]/90 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Ir al catalogo
        </button>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="max-w-lg mx-auto pt-32 pb-20 px-4 font-sans min-h-screen flex flex-col items-center text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500">Consultando tu solicitud...</p>
      </main>
    );
  }

  if (error && !solicitud) {
    return (
      <main className="max-w-lg mx-auto pt-32 pb-20 px-4 font-sans min-h-screen flex flex-col items-center text-center">
        <h1 className="font-serif text-2xl text-[#1A3B5B] mb-4">Error</h1>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={fetchSolicitud}
          className="px-6 py-3 bg-[#004A99] text-white font-bold rounded-xl hover:bg-[#004A99]/90 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Reintentar
        </button>
      </main>
    );
  }

  if (!solicitud) return null;

  // ── PENDIENTE ──────────────────────────────────────────────
  if (solicitud.estado === 'PENDIENTE') {
    return (
      <main className="max-w-lg mx-auto pt-32 pb-20 px-4 font-sans min-h-screen flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6"
        >
          <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
        </motion.div>
        <h1 className="font-serif text-3xl text-[#1A3B5B] mb-2">
          Esperando aprobacion
        </h1>
        <p className="text-gray-500 mb-4">
          Tu solicitud de <strong>{solicitud.productoNombre}</strong> (x{solicitud.cantidad})
          esta siendo evaluada. Te notificaremos aqui mismo en cuanto haya una decision.
        </p>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Conectado en tiempo real
        </div>
      </main>
    );
  }

  // ── ACEPTADA ───────────────────────────────────────────────
  if (solicitud.estado === 'ACEPTADA') {
    return (
      <main className="max-w-lg mx-auto pt-32 pb-20 px-4 font-sans min-h-screen flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </motion.div>
        <h1 className="font-serif text-3xl text-[#1A3B5B] mb-2">
          Solicitud aceptada
        </h1>
        <p className="text-gray-500 mb-6">
          Tu solicitud de <strong>{solicitud.productoNombre}</strong> fue aceptada.
          Tienes 10 minutos para completar el pago.
        </p>
        <button
          onClick={() => navigate('/checkout/datos')}
          className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all"
        >
          Continuar al pago
        </button>
      </main>
    );
  }

  // ── RECHAZADA / EXPIRADA ───────────────────────────────────
  return (
    <main className="max-w-lg mx-auto pt-32 pb-20 px-4 font-sans min-h-screen flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6"
      >
        <XCircle className="w-12 h-12 text-red-500" />
      </motion.div>
      <h1 className="font-serif text-3xl text-[#1A3B5B] mb-2">
        {solicitud.estado === 'RECHAZADA' ? 'Solicitud rechazada' : 'Solicitud expirada'}
      </h1>
      <p className="text-gray-500 mb-6">
        {solicitud.motivoRechazo
          || (solicitud.estado === 'EXPIRADA'
            ? 'Tu solicitud expiro sin respuesta. Puedes intentarlo de nuevo o hacer un pedido anticipado.'
            : 'Tu solicitud no fue aprobada en esta ocasion.')}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button
          onClick={() => navigate('/catalogo')}
          className="px-8 py-3 bg-[#004A99] text-white font-bold rounded-xl hover:bg-[#004A99]/90 transition-all"
        >
          Ver catalogo
        </button>
        <button
          onClick={() => navigate('/inicio')}
          className="px-8 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Inicio
        </button>
      </div>
    </main>
  );
}

function getSavedSolicitudId(): string | null {
  try { return localStorage.getItem('solicitudInstantaneaId'); } catch { return null; }
}
