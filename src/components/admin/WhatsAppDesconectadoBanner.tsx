import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WifiOff, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWhatsAppEstado } from '../../hooks/useWhatsAppEstado';
import { parseApiDate } from '../../utils/date';

const CLAVE_OCULTO = 'whatsapp-banner-oculto';

/**
 * Aviso de WhatsApp desconectado. Solo ADMIN (lo comprueba aquí, sin dar por hecho que
 * AdminLayout solo lo ve un ADMIN). Se oculta durante la sesión, pero vuelve a salir con
 * una nueva desconexión.
 */
export default function WhatsAppDesconectadoBanner() {
  const { esAdmin } = useAuth();
  const { estado, habilitado, configurado, desconectadoDesde, ultimoEvento } = useWhatsAppEstado();
  const [oculto, setOculto] = useState<string | null>(() => {
    try { return sessionStorage.getItem(CLAVE_OCULTO); } catch { return null; }
  });

  // Una desconexión nueva (otro "desde" o un evento en vivo) vuelve a mostrarlo.
  const firma = desconectadoDesde ?? estado ?? '';
  useEffect(() => {
    if (ultimoEvento && oculto) {
      setOculto(null);
      try { sessionStorage.removeItem(CLAVE_OCULTO); } catch { /* sin almacenamiento */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimoEvento]);

  if (!esAdmin || !configurado || !habilitado) return null;
  if (estado !== 'DESCONECTADO' && estado !== 'SERVICIO_NO_DISPONIBLE') return null;
  if (oculto === firma) return null;

  const desde = parseApiDate(desconectadoDesde);
  const hora = desde
    ? desde.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  const ocultar = () => {
    setOculto(firma);
    try { sessionStorage.setItem(CLAVE_OCULTO, firma); } catch { /* sin almacenamiento */ }
  };

  return (
    <div
      role="alert"
      className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-rose-800 dark:text-rose-200"
    >
      <WifiOff className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-semibold">
        {estado === 'SERVICIO_NO_DISPONIBLE'
          ? 'El servicio de WhatsApp no responde'
          : 'WhatsApp está desconectado'}
        {hora ? ` desde ${hora}` : ''}. Los avisos no se están enviando.
      </p>
      <div className="flex items-center gap-2">
        <Link
          to="/admin/whatsapp"
          className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-colors"
        >
          Reconectar
        </Link>
        <button
          type="button"
          onClick={ocultar}
          aria-label="Ocultar aviso"
          className="rounded-lg p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
