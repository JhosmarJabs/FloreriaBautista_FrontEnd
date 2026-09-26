import { SiteSettings } from '../types';
import { apiCache } from './apiCache';

// Hero y Footer piden la configuración en el mismo render: comparten la petición
// en vuelo en lugar de lanzar dos /api/cms.
let enVuelo: Promise<SiteSettings> | null = null;

export const CmsService = {
  getSettings: async (): Promise<SiteSettings> => {
    const url = '/api/cms';
    const hit = apiCache.get(url);
    if (hit) return (hit as { data: SiteSettings }).data;
    if (enVuelo) return enVuelo;
    enVuelo = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        // Prioridad baja: los textos del CMS no bloquean el pintado (hay valores por
        // defecto) y el backend puede tardar en despertar; no debe competir con la carga.
        const res = await fetch(url, { signal: controller.signal, priority: 'low' } as RequestInit);
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const json = await res.json();
        apiCache.set(url, json);
        return json.data as SiteSettings;
      } catch {
        clearTimeout(timeout);
        throw new Error('CMS no disponible');
      } finally {
        enVuelo = null;
      }
    })();
    return enVuelo;
  },
};
