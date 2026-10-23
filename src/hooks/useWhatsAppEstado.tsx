import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { WHATSAPP_ESTADO_EVENT, WhatsAppEstadoEvento } from './useRealtimeOrders';
import { WhatsAppEstado, WhatsAppService } from '../services/whatsappService';

const INTERVALO_MS = 60_000;

/**
 * Estado de la conexión de WhatsApp para el ADMIN. Consulta GET /estado al montar y cada 60 s
 * (respaldo: SignalR puede no pasar por Vercel en producción) y además escucha el evento
 * `WhatsAppEstado` de SignalR. Para cualquier otro rol no hace nada.
 */
export function useWhatsAppEstado() {
  const { esAdmin } = useAuth();
  const [estado, setEstado] = useState<WhatsAppEstado | null>(null);
  // Cambia con cada evento de desconexión recibido (el banner lo usa para volver a mostrarse).
  const [ultimoEvento, setUltimoEvento] = useState<number>(0);
  const montado = useRef(true);

  const recargar = useCallback(async () => {
    try {
      const e = await WhatsAppService.estado();
      if (montado.current) setEstado(e);
    } catch {
      // Silencioso: el banner no debe molestar si la consulta falla.
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    if (!esAdmin) return;

    recargar();
    const id = window.setInterval(recargar, INTERVALO_MS);

    const onEvento = (ev: Event) => {
      const detalle = (ev as CustomEvent<WhatsAppEstadoEvento>).detail;
      if (!detalle) return;
      setEstado(prev => prev ? { ...prev, estado: detalle.estado as WhatsAppEstado['estado'], desconectadoDesde: detalle.desconectadoDesde } : prev);
      setUltimoEvento(Date.now());
      recargar();
    };
    window.addEventListener(WHATSAPP_ESTADO_EVENT, onEvento);

    return () => {
      montado.current = false;
      window.clearInterval(id);
      window.removeEventListener(WHATSAPP_ESTADO_EVENT, onEvento);
    };
  }, [esAdmin, recargar]);

  return {
    estado: estado?.estado ?? null,
    configurado: estado?.configurado ?? false,
    habilitado: estado?.habilitado ?? false,
    desconectadoDesde: estado?.desconectadoDesde ?? null,
    numeroVinculado: estado?.numeroVinculado ?? null,
    ultimoEvento,
    recargar,
  };
}
