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
} from '@microsoft/signalr';
import { useAuth } from './useAuth';

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

// ── Context ──────────────────────────────────────────────────

interface RealtimeOrdersContextValue {
  solicitudPendiente: SolicitudPendienteEvento | null;
  pedidoNuevo: PedidoNuevoEvento | null;
  clearSolicitudPendiente: () => void;
  clearPedidoNuevo: () => void;
  connected: boolean;
}

const RealtimeOrdersContext = createContext<RealtimeOrdersContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────

export function RealtimeOrdersProvider({ children }: { children: React.ReactNode }) {
  const { token, esAdmin, esEmpleado } = useAuth();
  const connectionRef = useRef<HubConnection | null>(null);

  const [solicitudPendiente, setSolicitudPendiente] =
    useState<SolicitudPendienteEvento | null>(null);
  const [pedidoNuevo, setPedidoNuevo] =
    useState<PedidoNuevoEvento | null>(null);
  const [connected, setConnected] = useState(false);

  const clearSolicitudPendiente = useCallback(() => setSolicitudPendiente(null), []);
  const clearPedidoNuevo = useCallback(() => setPedidoNuevo(null), []);

  useEffect(() => {
    if (!token || (!esAdmin && !esEmpleado)) return;

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/venta-instantanea', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
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

    connection.onreconnected(() => setConnected(true));
    connection.onreconnecting(() => setConnected(false));
    connection.onclose(() => setConnected(false));

    connection
      .start()
      .then(() => setConnected(true))
      .catch((err) => console.error('SignalR connection error:', err));

    return () => {
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop();
      }
    };
  }, [token, esAdmin, esEmpleado]);

  const value: RealtimeOrdersContextValue = {
    solicitudPendiente,
    pedidoNuevo,
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
