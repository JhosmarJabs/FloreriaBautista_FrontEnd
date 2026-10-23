import { useSyncExternalStore } from 'react';
import { obtenerEstado, suscribir, type EstadoConexion } from '../services/estadoConexion';

/** Estado global de conexión (red + servidor + antigüedad de los datos guardados). */
export function useEstadoConexion(): EstadoConexion {
  return useSyncExternalStore(suscribir, obtenerEstado);
}
