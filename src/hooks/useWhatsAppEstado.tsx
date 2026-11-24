import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { WHATSAPP_ESTADO_EVENT, WhatsAppEstadoEvento } from './useRealtimeOrders';
import { WhatsAppEstado, WhatsAppService } from '../services/whatsappService';

const INTERVALO_MS = 60_000;
const MINIMO_ENTRE_CONSULTAS_MS = 10_000;

// Estado compartido a nivel de módulo: todas las instancias del hook (y los remontajes del
// banner) comparten una sola petición en vuelo, el último resultado y la hora de la última
// consulta, para no repetir GET /estado en cada montaje ni en cada cambio de página.
let enVuelo: Promise<WhatsAppEstado | null> | null = null;
let ultimoResultado: WhatsAppEstado | null = null;
let ultimaConsultaEn = 0;
const suscriptores = new Set<(e: WhatsAppEstado) => void>();

function reiniciarCompartido() {
  enVuelo = null;
  ultimoResultado = null;
  ultimaConsultaEn = 0;
}

/**
 * Consulta GET /estado respetando: una sola petición en vuelo (las demás reutilizan la misma
 * promesa) y un mínimo de 10 s entre consultas, salvo `forzar`. Dentro del mínimo devuelve el
 * último resultado sin llamar a la red.
 */
function consultarEstado(forzar = false): Promise<WhatsAppEstado | null> {
  if (enVuelo) return enVuelo;
  if (!forzar && Date.now() - ultimaConsultaEn < MINIMO_ENTRE_CONSULTAS_MS) {
    return Promise.resolve(ultimoResultado);
  }
  ultimaConsultaEn = Date.now();
  enVuelo = WhatsAppService.estado()
    .then(e => {
      ultimoResultado = e;
      suscriptores.forEach(fn => fn(e));
      return e;
    })
    .catch(() => {
      // Silencioso: el banner no debe molestar si la consulta falla.
      return ultimoResultado;
    })
    .finally(() => {
      enVuelo = null;
    });
  return enVuelo;
}

/**
 * Estado de la conexión de WhatsApp para el ADMIN. Consulta GET /estado al montar y cada 60 s
 * (respaldo: SignalR puede no pasar por Vercel en producción) y además escucha el evento
 * `WhatsAppEstado` de SignalR. Con la pestaña oculta no consulta; al volver a verse consulta
 * una vez si pasaron más de 60 s. Para cualquier otro rol no hace nada.
 */
export function useWhatsAppEstado() {
  const { esAdmin } = useAuth();
  const [estado, setEstado] = useState<WhatsAppEstado | null>(() => ultimoResultado);
  // Cambia con cada evento de desconexión recibido (el banner lo usa para volver a mostrarse).
  const [ultimoEvento, setUltimoEvento] = useState<number>(0);
  const montado = useRef(true);

  const recargar = useCallback(async (opciones?: { forzar?: boolean }) => {
    await consultarEstado(opciones?.forzar ?? false);
  }, []);

  useEffect(() => {
    montado.current = true;
    if (!esAdmin) {
      reiniciarCompartido();
      return;
    }

    const alActualizar = (e: WhatsAppEstado) => {
      if (montado.current) setEstado(e);
    };
    suscriptores.add(alActualizar);
    if (ultimoResultado) setEstado(ultimoResultado);

    consultarEstado();

    const id = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      consultarEstado();
    }, INTERVALO_MS);

    const alCambiarVisibilidad = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - ultimaConsultaEn > INTERVALO_MS) consultarEstado();
    };
    document.addEventListener('visibilitychange', alCambiarVisibilidad);

    const onEvento = (ev: Event) => {
      const detalle = (ev as CustomEvent<WhatsAppEstadoEvento>).detail;
      if (!detalle) return;
      setEstado(prev => prev ? { ...prev, estado: detalle.estado as WhatsAppEstado['estado'], desconectadoDesde: detalle.desconectadoDesde } : prev);
      setUltimoEvento(Date.now());
      consultarEstado(true);
    };
    window.addEventListener(WHATSAPP_ESTADO_EVENT, onEvento);

    return () => {
      montado.current = false;
      suscriptores.delete(alActualizar);
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      window.removeEventListener(WHATSAPP_ESTADO_EVENT, onEvento);
    };
  }, [esAdmin]);

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
