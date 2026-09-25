import { useCallback, useEffect, useRef, useState } from 'react';
import {
  NotificationsService,
  NotificationDto,
} from '../services/notificationsService';
import { useAuth } from './useAuth';

interface UseNotificationsReturn {
  notificaciones: NotificationDto[];
  noLeidas: number;
  cargando: boolean;
  totalPaginas: number;
  pagina: number;
  marcarLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  recargar: () => void;
  setPagina: (p: number) => void;
  incrementarNoLeidas: () => void;
}

export function useNotifications(size = 20): UseNotificationsReturn {
  const { isAuthenticated } = useAuth();
  const [notificaciones, setNotificaciones] = useState<NotificationDto[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [version, setVersion] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const recargar = useCallback(() => setVersion(v => v + 1), []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const cargar = async () => {
      setCargando(true);
      try {
        const [lista, count] = await Promise.all([
          NotificationsService.listar(false, pagina, size),
          NotificationsService.contarNoLeidas(),
        ]);
        if (!cancelled && mountedRef.current) {
          setNotificaciones(lista.items);
          setTotalPaginas(lista.totalPaginas);
          setNoLeidas(count);
        }
      } catch (err) {
        console.error('Error cargando notificaciones:', err);
      } finally {
        if (!cancelled && mountedRef.current) setCargando(false);
      }
    };

    cargar();
    return () => { cancelled = true; };
  }, [isAuthenticated, pagina, size, version]);

  const marcarLeida = useCallback(async (id: string) => {
    await NotificationsService.marcarLeida(id);
    setNotificaciones(prev =>
      prev.map(n => n.id === id ? { ...n, leida: true, leidaEn: new Date().toISOString() } : n)
    );
    setNoLeidas(prev => Math.max(0, prev - 1));
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    await NotificationsService.marcarTodasLeidas();
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true, leidaEn: new Date().toISOString() })));
    setNoLeidas(0);
  }, []);

  const eliminar = useCallback(async (id: string) => {
    const notif = notificaciones.find(n => n.id === id);
    await NotificationsService.eliminar(id);
    setNotificaciones(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.leida) setNoLeidas(prev => Math.max(0, prev - 1));
  }, [notificaciones]);

  const incrementarNoLeidas = useCallback(() => {
    setNoLeidas(prev => prev + 1);
  }, []);

  return {
    notificaciones,
    noLeidas,
    cargando,
    totalPaginas,
    pagina,
    marcarLeida,
    marcarTodasLeidas,
    eliminar,
    recargar,
    setPagina,
    incrementarNoLeidas,
  };
}
