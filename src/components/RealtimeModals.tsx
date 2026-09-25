import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';
import ModalAprobacionInstantanea from './ModalAprobacionInstantanea';
import ModalPedidoNuevo60s from './ModalPedidoNuevo60s';

export default function RealtimeModals() {
  const { esAdmin, esEmpleado } = useAuth();
  const {
    solicitudPendiente,
    pedidoNuevo,
    clearSolicitudPendiente,
    clearPedidoNuevo,
  } = useRealtimeOrders();

  if (!esAdmin && !esEmpleado) return null;

  return (
    <>
      {solicitudPendiente && (
        <ModalAprobacionInstantanea
          solicitud={solicitudPendiente}
          onClose={clearSolicitudPendiente}
        />
      )}
      {pedidoNuevo && !solicitudPendiente && (
        <ModalPedidoNuevo60s
          pedido={pedidoNuevo}
          onClose={clearPedidoNuevo}
        />
      )}
    </>
  );
}
