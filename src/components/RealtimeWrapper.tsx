import React from 'react';
import { RealtimeOrdersProvider } from '../hooks/useRealtimeOrders';
import RealtimeModals from './RealtimeModals';

export default function RealtimeWrapper() {
  return (
    <RealtimeOrdersProvider>
      <RealtimeModals />
    </RealtimeOrdersProvider>
  );
}
