import React, { useEffect, useState } from 'react';
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

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 overflow-hidden" id="inicio">
      <div className="absolute inset-0 z-0">
        <img alt="Floral background" className="w-full h-full object-cover" fetchPriority="high" width="1920" height="1080" decoding="async" src="/img/landing/hero.webp" />
        <div className="absolute inset-0 bg-brand-deep/60"></div>
      </div>
      <div className="container mx-auto px-4 relative z-10 text-center lg:text-left">
        <div className="max-w-3xl animate-[fadeSlideUp_0.8s_ease-out_both]">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            {titulo}
          </h1>
          <p className="text-lg md:text-xl text-brand-light/90 mb-10 leading-relaxed max-w-2xl">
            {subtitulo}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a className="bg-white text-brand-deep px-8 py-4 rounded-custom font-bold text-lg hover:bg-brand-light transition-colors text-center" href="#arreglos">{cta}</a>
            <a className="text-white px-8 py-4 rounded-custom font-bold text-lg hover:bg-opacity-90 transition-colors text-center border-2 bg-brand-deep border-brand-deep" href={settings?.whatsappUrl || '/contacto'} target="_blank" rel="noopener noreferrer">Pedir por WhatsApp</a>
          </div>
        </div>
      </div>
    </section>
  );
}
