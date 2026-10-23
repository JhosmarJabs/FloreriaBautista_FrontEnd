import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type ILogger,
} from '@microsoft/signalr';
import { useAuth } from './useAuth';
import { VENTA_INSTANTANEA_HUB_URL } from '../services/realtime';

// ── Tipos de evento ──────────────────────────────────────────

export interface SolicitudPendienteEvento {
  id: string;
  customerId: string;
  nombreCliente: string;
  telefonoCliente: string | null;
  productId: string;
  nombreProducto: string;
  imagenProducto: string | null;
  cantidad: number;
  estado: string;
  creadaEn: string;
  escaladaAEmpleadoEn: string | null;
}

export interface PedidoNuevoEvento {
  orderId: string;
  nombreCliente: string;
  tipoPedido: string;
  fechaEntrega: string;
  horaEntrega: string | null;
  direccion: string | null;
  total: number;
  notas: string | null;
  esInstantanea: boolean;
}

export interface WhatsAppEstadoEvento {
  estado: string;
  desconectadoDesde: string | null;
}

/**
 * El banner de WhatsApp vive en AdminLayout, fuera de este provider; por eso el evento
 * también se reenvía como un CustomEvent de window (lo escucha useWhatsAppEstado).
 */
export const WHATSAPP_ESTADO_EVENT = 'whatsapp-estado';

// ── Context ──────────────────────────────────────────────────

interface RealtimeOrdersContextValue {
  solicitudPendiente: SolicitudPendienteEvento | null;
  pedidoNuevo: PedidoNuevoEvento | null;
  whatsAppEstado: WhatsAppEstadoEvento | null;
  clearSolicitudPendiente: () => void;
  clearPedidoNuevo: () => void;
  connected: boolean;
}

const RealtimeOrdersContext = createContext<RealtimeOrdersContextValue | null>(null);

/** Espera entre reintentos de start() cuando la conexión no abrió o se cerró (tope 60 s). */
const RESTART_DELAYS_MS = [5000, 10000, 30000, 60000];

// ── Provider ─────────────────────────────────────────────────

export function RealtimeOrdersProvider({ children }: { children: React.ReactNode }) {
  const { token, esAdmin, esEmpleado } = useAuth();
  const connectionRef = useRef<HubConnection | null>(null);

  const [solicitudPendiente, setSolicitudPendiente] =
    useState<SolicitudPendienteEvento | null>(null);
  const [pedidoNuevo, setPedidoNuevo] =
    useState<PedidoNuevoEvento | null>(null);
  const [whatsAppEstado, setWhatsAppEstado] =
    useState<WhatsAppEstadoEvento | null>(null);
  const [connected, setConnected] = useState(false);

  const clearSolicitudPendiente = useCallback(() => setSolicitudPendiente(null), []);
  const clearPedidoNuevo = useCallback(() => setPedidoNuevo(null), []);

  useEffect(() => {
    if (!token || (!esAdmin && !esEmpleado)) return;

    // Se marca en el cleanup: si el efecto se desmonta mientras start() negocia
    // (StrictMode en desarrollo), stop() aborta la negociación y no es un fallo real.
    let cancelled = false;

    // Reproduce el ConsoleLogger de @microsoft/signalr (mínimo Warning) salvo un caso: el
    // aborto de la negociación causado por nuestro propio stop() (StrictMode, H-001).
    // Cualquier otro mensaje, incluidos los errores reales, se imprime igual que antes.
    const logger: ILogger = {
      log(logLevel, message) {
        if (logLevel < LogLevel.Warning) return;
        if (
          cancelled &&
          logLevel === LogLevel.Error &&
          message.includes('The connection was stopped during negotiation.')
        ) {
          return;
        }
        const msg = `[${new Date().toISOString()}] ${LogLevel[logLevel]}: ${message}`;
        switch (logLevel) {
          case LogLevel.Critical:
          case LogLevel.Error:
            console.error(msg);
            break;
          case LogLevel.Warning:
            console.warn(msg);
            break;
          case LogLevel.Information:
            console.info(msg);
            break;
          default:
            console.log(msg);
        }
      },
    };

    const connection = new HubConnectionBuilder()
      .withUrl(VENTA_INSTANTANEA_HUB_URL, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(logger)
      .build();

    connectionRef.current = connection;

    connection.on('SolicitudPendiente', (data: SolicitudPendienteEvento) => {
      setSolicitudPendiente(data);
    });

    connection.on('SolicitudEscalada', (data: SolicitudPendienteEvento) => {
      setSolicitudPendiente(data);
    });

    connection.on('PedidoNuevo', (data: PedidoNuevoEvento) => {
      setPedidoNuevo(data);
    });

    connection.on('PedidoAnticipadoInformativo', (data: PedidoNuevoEvento) => {
      setPedidoNuevo(data);
    });

    // Solo llega al grupo "admin" (el backend lo emite ahí).
    connection.on('WhatsAppEstado', (data: WhatsAppEstadoEvento) => {
      setWhatsAppEstado(data);
      window.dispatchEvent(new CustomEvent<WhatsAppEstadoEvento>(WHATSAPP_ESTADO_EVENT, { detail: data }));
    });

    // withAutomaticReconnect se rinde tras su último intento (~47 s) y no cubre el start()
    // inicial. Render puede reiniciarse o tardar ~1 min en despertar, así que start() se
    // reintenta sin límite con backoff mientras el efecto siga montado.
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retryAttempt = 0;

    const startConnection = () => {
      if (cancelled) return;
      connection
        .start()
        .then(() => {
          if (cancelled) return;
          retryAttempt = 0;
          setConnected(true);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error('SignalR connection error:', err);
          scheduleStart();
        });
    };

    const scheduleStart = () => {
      if (cancelled) return;
      const delay = RESTART_DELAYS_MS[Math.min(retryAttempt, RESTART_DELAYS_MS.length - 1)];
      retryAttempt++;
      clearTimeout(retryTimer);
      retryTimer = setTimeout(startConnection, delay);
    };

    connection.onreconnected(() => setConnected(true));
    connection.onreconnecting(() => setConnected(false));
    connection.onclose(() => {
      setConnected(false);
      scheduleStart();
    });

    startConnection();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop();
      }
    };
  }, [token, esAdmin, esEmpleado]);

  const value: RealtimeOrdersContextValue = {
    solicitudPendiente,
    pedidoNuevo,
    whatsAppEstado,
    clearSolicitudPendiente,
    clearPedidoNuevo,
    connected,
  };

  return (
    <RealtimeOrdersContext.Provider value={value}>
      {children}
    </RealtimeOrdersContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────

export function useRealtimeOrders() {
  const ctx = useContext(RealtimeOrdersContext);
  if (!ctx)
    throw new Error('useRealtimeOrders must be used inside RealtimeOrdersProvider');
  return ctx;
}
