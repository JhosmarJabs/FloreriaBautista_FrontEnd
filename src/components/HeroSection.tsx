import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CmsService } from '../services/cmsService';
import { SiteSettings } from '../types';

export default function HeroSection() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    CmsService.getSettings().then(setSettings).catch(() => {});
  }, []);

  const titulo = settings?.bannerTitulo?.trim()
    ? settings.bannerTitulo
    : 'Flores elegantes y coloridas para cada momento especial en Huitzitzilingo';
  const subtitulo = settings?.bannerSubtitulo?.trim()
    ? settings.bannerSubtitulo
    : 'Llevamos la belleza de la naturaleza a tu puerta. Arreglos premium diseñados artesanalmente para celebrar la vida en San Felipe Orizatlán y sus alrededores.';
  const cta = settings?.bannerCta?.trim() ? settings.bannerCta : 'Ver catálogo';
  const whatsapp = settings?.whatsappUrl || '/contacto';

  // En la primera carga de la landing el hero ya está pintado en index.html (fuera de
  // #root). Se adopta en lugar de pintar otro: si React lo sustituyera, Chrome
  // tomaría como LCP el hero nuevo, que depende de todo el JS.
  const [esqueleto] = useState(() => document.getElementById('skeleton-hero'));
  const retiro = useRef<number>();

  useLayoutEffect(() => {
    if (!esqueleto) return;
    window.clearTimeout(retiro.current);
    esqueleto.dataset.adoptado = '1';
    // Diferido: en StrictMode (dev) el efecto se desmonta y vuelve a montar al instante.
    return () => { retiro.current = window.setTimeout(() => esqueleto.remove(), 0); };
  }, [esqueleto]);

  useEffect(() => {
    if (!esqueleto) return;
    const poner = (id: string, texto: string) => {
      const el = esqueleto.querySelector(`#${id}`);
      if (el && el.textContent !== texto) el.textContent = texto;
    };
    poner('sk-titulo', titulo);
    poner('sk-subtitulo', subtitulo);
    poner('sk-cta', cta);
    const enlace = esqueleto.querySelector<HTMLAnchorElement>('#sk-whatsapp');
    if (enlace && enlace.getAttribute('href') !== whatsapp) enlace.setAttribute('href', whatsapp);
  }, [esqueleto, titulo, subtitulo, cta, whatsapp]);

  if (esqueleto) return null;

  // Hero normal (al volver a / sin recargar). min-h-screen: igual que el de
  // index.html y deja las secciones siguientes fuera de la primera pantalla. Si
  // cambias el texto por defecto o los estilos, actualiza también index.html.
  return (
    <section className="relative min-h-screen pt-32 pb-20 lg:pt-48 lg:pb-40 overflow-hidden" id="inicio">
      <div className="absolute inset-0 z-0">
        <img alt="Floral background" className="w-full h-full object-cover" fetchPriority="high" width="1920" height="1080" decoding="async" src="/img/landing/hero.webp" />
        <div className="absolute inset-0 bg-brand-deep/60"></div>
      </div>
      <div className="container mx-auto px-4 relative z-10 text-center lg:text-left">
        {/* Sin animación de entrada: un fade desde opacity 0 retrasa el LCP. */}
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            {titulo}
          </h1>
          <p className="text-lg md:text-xl text-brand-light/90 mb-10 leading-relaxed max-w-2xl">
            {subtitulo}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a className="bg-white text-brand-deep px-8 py-4 rounded-custom font-bold text-lg hover:bg-brand-light transition-colors text-center" href="#arreglos">{cta}</a>
            <a className="text-white px-8 py-4 rounded-custom font-bold text-lg hover:bg-opacity-90 transition-colors text-center border-2 bg-brand-deep border-brand-deep" href={whatsapp} target="_blank" rel="noopener noreferrer">Pedir por WhatsApp</a>
          </div>
        </div>
      </div>
    </section>
  );
}
