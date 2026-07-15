import { SiteSettings } from '../types';

// Servicio público (sin autenticación) para que las páginas del sitio (Footer,
// Contacto, banner del Home) muestren el mismo contenido configurado en /admin/cms.
export const CmsService = {
  getSettings: async (): Promise<SiteSettings> => {
    const res = await fetch('/api/cms');
    if (!res.ok) throw new Error(`Error ${res.status} al obtener la configuración del sitio`);
    const json = await res.json();
    return json.data as SiteSettings;
  },
};
