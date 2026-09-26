import React from 'react';
import { RealtimeOrdersProvider } from '../hooks/useRealtimeOrders';
import RealtimeModals from './RealtimeModals';
// Sus modales pueden salir fuera de AdminLayout (vista previa de la tienda).
import '../styles/panel.css';

export default function RealtimeWrapper() {
  return (
    <RealtimeOrdersProvider>
      <RealtimeModals />
    </RealtimeOrdersProvider>
  );
}
