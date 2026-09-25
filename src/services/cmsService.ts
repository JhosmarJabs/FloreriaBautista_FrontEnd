import { SiteSettings } from '../types';
import { apiCache } from './apiCache';

export const CmsService = {
  getSettings: async (): Promise<SiteSettings> => {
    const url = '/api/cms';
    const hit = apiCache.get(url);
    if (hit) return (hit as { data: SiteSettings }).data;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      apiCache.set(url, json);
      return json.data as SiteSettings;
    } catch {
      clearTimeout(timeout);
      throw new Error('CMS no disponible');
    }
  },
};
