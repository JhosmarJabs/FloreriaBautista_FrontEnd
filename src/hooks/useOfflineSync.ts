import { useState, useEffect, useCallback, useRef } from 'react';
import {
  obtenerPendientes,
  eliminarVenta,
  actualizarVenta,
  contarPendientes,
  type OfflineSale,
} from '../services/offlineSalesQueue';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 30_000;

async function authHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function enviarVenta(sale: OfflineSale): Promise<boolean> {
  try {
    const headers = await authHeaders();
    const res = await fetch('/api/orders/physical', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...sale.payload, idLocalOffline: sale.idLocalOffline }),
    });
    if (res.ok) return true;
    if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
      const text = await res.text().catch(() => '');
      await actualizarVenta({ ...sale, intentos: sale.intentos + 1, error: `HTTP ${res.status}: ${text}` });
      return false;
    }
    return false;
  } catch {
    return false;
  }
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try { setPendingCount(await contarPendientes()); } catch { /* IndexedDB unavailable */ }
  }, []);

  const syncAll = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    try {
      const pendientes = await obtenerPendientes();
      const ordenadas = pendientes.sort(
        (a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime(),
      );
      for (const sale of ordenadas) {
        if (sale.intentos >= MAX_RETRIES) continue;
        const ok = await enviarVenta(sale);
        if (ok) {
          await eliminarVenta(sale.idLocalOffline);
        } else if (!navigator.onLine) {
          break;
        }
      }
    } finally {
      syncingRef.current = false;
      await refreshCount();
    }
  }, [refreshCount]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncAll(); };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    refreshCount();

    const interval = setInterval(() => {
      if (navigator.onLine) syncAll();
    }, RETRY_INTERVAL_MS);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [syncAll, refreshCount]);

  return { isOnline, pendingCount, syncAll, refreshCount };
}
