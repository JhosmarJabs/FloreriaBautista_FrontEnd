import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { CmsService } from '../services/cmsService';

export default function EventsSection() {
  const [whatsappUrl, setWhatsappUrl] = useState('/contacto');

  useEffect(() => {
    CmsService.getSettings().then(s => { if (s.whatsappUrl) setWhatsappUrl(s.whatsappUrl); }).catch(() => {});
  }, []);

  return (
    <section className="py-24 bg-brand-deep text-white relative overflow-hidden" id="eventos">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-coral opacity-5 rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-accent opacity-5 rounded-full -ml-48 -mb-48"></div>
      <div className="relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16 animate-[fadeSlideUp_0.6s_ease-out_both]">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 italic">Decoración para eventos especiales</h2>
          <p className="text-brand-accent text-lg leading-relaxed">
            Transformamos tus momentos más importantes en recuerdos eternos. Desde la elegancia clásica de una boda hasta la energía vibrante de unos XV años, creamos atmósferas mágicas con el sello distintivo de Florería Bautista.
          </p>
        </div>
        {/* Dynamic Event Grid */}
        <div className="flex overflow-x-auto snap-x no-scrollbar gap-0 pb-0 animate-[fadeIn_0.8s_ease-out_both]">
          {/* Bodas */}
          <div className="min-w-[100vw] md:min-w-[50vw] lg:min-w-[25vw] snap-start group relative overflow-hidden h-[600px]">
            <img alt="Bodas" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" decoding="async" width={400} height={600} src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFqWzNXPQnbik_i7cW-yIz5STPC_NWElW1XWH2XS4jSmAOG59ap5m_X6gvJvR5SLz3p4PSdbbdk_mGjJWz_FZ5GvQ7_4TwsxfX9xQ_qE44pnbczNfnJGo4Q8V2DbTvHmX0mZTeLt-_ov2g_k6zXNwjLvvZirQj4Yr3oDOIKT2xxl8L35a3qaP2N0xTIZSqao3CPk5oeg2J72-HoM8dCqWCM5oV54F7OpQrQQ7rbFnEKxHt5LqhRtPCMxXXaOf2qJsVlhCS8y20fQYb" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-10 w-full">
              <h3 className="text-3xl font-serif font-bold mb-3 text-white">Bodas</h3>
              <p className="text-base text-brand-accent mb-6">Elegancia y romance en cada detalle floral.</p>
              <a className="inline-block bg-brand-coral text-brand-deep px-8 py-3 rounded-custom font-bold text-sm hover:bg-opacity-90 transition-all" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Cotizar</a>
            </div>
          </div>
          {/* XV Años */}
          <div className="min-w-[100vw] md:min-w-[50vw] lg:min-w-[25vw] snap-start group relative overflow-hidden h-[600px]">
            <img alt="XV Años" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" decoding="async" width={400} height={600} src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4unNMcu9esz_cCLaNAPajhZBPWn9_QV66CeF0sNO-zF95zVSkAM4YKty-q5vTC70j8z0pOKV2YUiT5xAI7ycyMov7P6F4qa7BGqguJBrrhoUIW7YC-Srof_IQdeM1CV_rgFUmGce3mNLxX3fA8qn4wH7BV5iDUCdV3bKGJh8n5YMdZBE8B2RI8BTZ31IdobyigAIsvPkgWJdHXx45iLDO1Fd4_FHbofJtQiGe3w5iZAyUS8FQG2VXKsJCWGmTtVtro8J0j7emTm9s" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-10 w-full">
              <h3 className="text-3xl font-serif font-bold mb-3 text-white">XV Años</h3>
              <p className="text-base text-brand-accent mb-6">Diseños juveniles y vibrantes para una noche mágica.</p>
              <a className="inline-block bg-brand-coral text-brand-deep px-8 py-3 rounded-custom font-bold text-sm hover:bg-opacity-90 transition-all" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Cotizar</a>
            </div>
          </div>
          {/* Cumpleaños */}
          <div className="min-w-[100vw] md:min-w-[50vw] lg:min-w-[25vw] snap-start group relative overflow-hidden h-[600px]">
            <img alt="Cumpleaños" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" decoding="async" width={400} height={600} src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkV6P7Q-_KBBw4RByBn_YkMBg5T3ECf2o_EHx06uOuz3ppfuoNjq5aiKpPe3NFgpaPCuf2U8batEjY4pf974v2MGac861QIwGxKjIZYfUnc29zy09xYnKAn6L_tfefvftSWxYdsuMnxOpZjb2EoPw0B_7ttXrZXxmrliG-DYKs-Il2SiPW0ZRQonxS4qN3x1yhPgWOC-GPyMEMErmRgEg1J_mTQZsFztzA0ZSuOafVWIfv0yDYCBEdPtwyA8JOKQgCeRjuPWKLqW0l" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-10 w-full">
              <h3 className="text-3xl font-serif font-bold mb-3 text-white">Cumpleaños</h3>
              <p className="text-base text-brand-accent mb-6">Color y alegría para celebrar un año más de vida.</p>
              <a className="inline-block bg-brand-coral text-brand-deep px-8 py-3 rounded-custom font-bold text-sm hover:bg-opacity-90 transition-all" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Cotizar</a>
            </div>
          </div>
          {/* Bautizos */}
          <div className="min-w-[100vw] md:min-w-[50vw] lg:min-w-[25vw] snap-start group relative overflow-hidden h-[600px]">
            <img alt="Bautizos" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" decoding="async" width={400} height={600} src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLpcMBSdrLr9N32GADIeP2KZ-AXQYlatgjHcNixqMNtuLY4z1zJHgMYfGtZ1Xycx5VafPwQqT4fd2MxOwZ6gYg51jPZePhNxDWSHOCoUGYvi5QUqvwxb2dwiWFKwCGwzsdZAtZjSq293Lkqh7rE1Cs-Eb9ji_jyZGC_4wdvF76_XH-mkaJlNjrToI454RifxzuiWDEIBfmcXZMB4Yx5-W1Cg6uEI9GdafeUqtVF7_X-KcJOaVcHtN1a6hg7nkgQh2aeCM4Ck9cofcX" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-10 w-full">
              <h3 className="text-3xl font-serif font-bold mb-3 text-white">Bautizos</h3>
              <p className="text-base text-brand-accent mb-6">Arreglos tiernos y delicados para momentos sagrados.</p>
              <a className="inline-block bg-brand-coral text-brand-deep px-8 py-3 rounded-custom font-bold text-sm hover:bg-opacity-90 transition-all" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Cotizar</a>
            </div>
          </div>
        </div>

        {/* Specific Services */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-brand-accent/20 pt-16 mt-16 max-w-6xl mx-auto animate-[fadeIn_0.6s_ease-out_0.2s_both]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-coral/10 mb-4">
              <svg className="w-8 h-8 text-brand-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Centros de Mesa</h3>
            <p className="text-sm text-brand-accent/80">Diseños exclusivos que capturan la esencia de tu mesa principal.</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-coral/10 mb-4">
              <svg className="w-8 h-8 text-brand-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9zM12 12c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1s-1 .45-1 1v4c0 .55.45 1 1 1zM12 16c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Ramos Artesanales</h3>
            <p className="text-sm text-brand-accent/80">Ramos de novia creados a mano con flores de la más alta calidad.</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-coral/10 mb-4">
              <svg className="w-8 h-8 text-brand-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Montaje Completo</h3>
            <p className="text-sm text-brand-accent/80">Transformación total de iglesias, jardines y salones de eventos.</p>
          </div>
        </div>
        {/* CTA */}
        <div className="mt-20 text-center animate-[fadeIn_0.5s_ease-out_0.4s_both]">
          <a className="inline-block bg-brand-coral text-brand-deep px-12 py-5 rounded-custom font-extrabold text-xl shadow-lg hover:scale-105 transition-all hover:bg-opacity-90 active:scale-95 group" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <span className="flex items-center gap-3">
              Cotizar mi Evento Soñado
              <ArrowRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
