import { useCallback, useEffect, useState } from 'react';
import { CmsService } from '../../services/cmsService';
import type { DocumentoLegal, SiteSettings } from '../../types';

export interface EstadoContenidoLegal {
  cargando: boolean;
  error: boolean;
  documentos: DocumentoLegal[];
  /** null si /api/cms falló: el texto usa los respaldos legibles. */
  settings: SiteSettings | null;
  reintentar: () => void;
}

/** Carga en paralelo los documentos legales y los datos del negocio (para las variables). */
export function useContenidoLegal(): EstadoContenidoLegal {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [documentos, setDocumentos] = useState<DocumentoLegal[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setError(false);
    Promise.all([
      CmsService.getContenidoLegal(),
      CmsService.getSettings().catch(() => null),
    ])
      .then(([docs, ajustes]) => {
        if (!vivo) return;
        setDocumentos(docs);
        setSettings(ajustes);
      })
      .catch(() => { if (vivo) setError(true); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  return { cargando, error, documentos, settings, reintentar };
}
