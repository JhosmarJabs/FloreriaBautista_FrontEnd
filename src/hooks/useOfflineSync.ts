import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import api from '../services/api';
import {
  obtenerPendientes,
  eliminarVenta,
  actualizarVenta,
  contarPendientes,
  COLA_OFFLINE_CAMBIO,
  type OfflineSale,
} from '../services/offlineSalesQueue';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 30_000;

// Candado a nivel de módulo: una sola sincronización por pestaña aunque el hook se monte varias veces.
let sincronizando = false;

type ResultadoEnvio = 'ok' | 'reintentar' | 'sin-sesion';

async function enviarVenta(sale: OfflineSale): Promise<ResultadoEnvio> {
  try {
    // Cliente `api`: pone el accessToken y renueva la sesión en 401 con su interceptor.
    // Todo lo que está en esta cola llegó por un fallo de red: el backend la acepta
    // aunque ya no haya existencias y deja constancia.
    await api.post('/api/orders/physical', {
      ...sale.payload,
      idLocalOffline: sale.idLocalOffline,
      ventaSincronizadaSinConexion: true,
    });
    return 'ok';
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    // Sin respuesta (red) o 5xx: se reintenta sin contar intento.
    if (status === undefined || status >= 500) return 'reintentar';
    // 401 aquí significa que el refresh también falló: las siguientes ventas fallarían igual.
    if (status === 401) return 'sin-sesion';
    if (status >= 400 && status !== 408 && status !== 429) {
      const data = isAxiosError(error) ? error.response?.data : undefined;
      const mensaje = typeof data?.message === 'string' ? data.message : '';
      await actualizarVenta({ ...sale, intentos: sale.intentos + 1, error: `HTTP ${status}: ${mensaje}` });
    }
    return 'reintentar';
  }
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try { setPendingCount(await contarPendientes()); } catch { /* IndexedDB unavailable */ }
  }, []);

  const syncAll = useCallback(async () => {
    if (sincronizando || !navigator.onLine) return;
    sincronizando = true;
    try {
      const pendientes = await obtenerPendientes();
      const ordenadas = pendientes.sort(
        (a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime(),
      );
      for (const sale of ordenadas) {
        if (sale.intentos >= MAX_RETRIES) continue;
        const resultado = await enviarVenta(sale);
        if (resultado === 'ok') {
          await eliminarVenta(sale.idLocalOffline);
        } else if (resultado === 'sin-sesion' || !navigator.onLine) {
          break;
        }
      }
    } finally {
      sincronizando = false;
      await refreshCount();
    }
  }, [refreshCount]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncAll(); };
    const handleOffline = () => setIsOnline(false);

    const handleColaCambio = () => { refreshCount(); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(COLA_OFFLINE_CAMBIO, handleColaCambio);
    refreshCount();

    const interval = setInterval(() => {
      if (navigator.onLine) syncAll();
    }, RETRY_INTERVAL_MS);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(COLA_OFFLINE_CAMBIO, handleColaCambio);
      clearInterval(interval);
    };
  }, [syncAll, refreshCount]);

  return { isOnline, pendingCount, syncAll, refreshCount };
}
