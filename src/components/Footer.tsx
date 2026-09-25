import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

const FaFacebook = () => (
  <svg viewBox="0 0 320 512" width="18" height="18" fill="white"><path d="M80 299.3V512h116V299.3h86.5l18-97.8H196V146.9c0-51.7 20.3-71.5 72.7-71.5 16.3 0 29.4.4 37 1.2V7.9C291.4 4 256.4 0 236.2 0 129.3 0 80 50.5 80 159.4v42.1H0v97.8h80z"/></svg>
);
const FaInstagram = () => (
  <svg viewBox="0 0 448 512" width="18" height="18" fill="white"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
);
const FaWhatsapp = () => (
  <svg viewBox="0 0 448 512" width="18" height="18" fill="white"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.8-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
);

import { CmsService } from '../services/cmsService';
import { SiteSettings } from '../types';
import { groupHorarios } from '../utils/horarios';

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    CmsService.getSettings().then(setSettings).catch(() => { /* usa los valores por defecto del markup */ });
  }, []);

  const horariosAgrupados = groupHorarios(settings?.horarios ?? []);

  return (
    <footer className="bg-[#1A3A5A] text-white pt-10 pb-0">
      <div className="container mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Logo & Social */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <img src="/Logo-sm.webp" alt="Florería Bautista Logo" className="h-10 w-auto" width={32} height={40} loading="lazy" />
              <span className="text-xl font-serif font-bold tracking-tight">Florería <span className="text-[#D4AF37]">Bautista</span></span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-5 max-w-xs">
              La mejor calidad en diseño floral de la región Huitzitzilingo-Orizatlán.
            </p>
            <div className="flex gap-3">
              <a className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center hover:scale-110 transition-transform" href={settings?.facebookUrl || 'https://web.facebook.com/profile.php?id=100083384015722'} target="_blank" rel="noopener noreferrer" title="Facebook">
                <FaFacebook />
              </a>
              <a className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center hover:scale-110 transition-transform" href={settings?.instagramUrl || '#'} target="_blank" rel="noopener noreferrer" title="Instagram">
                <FaInstagram />
              </a>
              <a className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center hover:scale-110 transition-transform" href={settings?.whatsappUrl || '#'} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                <FaWhatsapp />
              </a>
            </div>
          </div>
          {/* Column 2: Enlaces */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-sans)' }} className="text-[#D4AF37] font-bold text-sm tracking-widest mb-5 uppercase">Enlaces</h2>
            <ul className="space-y-3">
              <li><Link className="text-gray-300 hover:text-white transition-colors" to="/">Inicio</Link></li>
              <li><Link className="text-gray-300 hover:text-white transition-colors" to="/catalogo">Catálogo</Link></li>
              <li><Link className="text-gray-300 hover:text-white transition-colors" to="/testimonios">Testimonios</Link></li>
              <li><Link className="text-gray-300 hover:text-white transition-colors" to="/nosotros">Acerca de</Link></li>
              <li><Link className="text-gray-300 hover:text-white transition-colors" to="/contacto">Contacto</Link></li>
            </ul>
          </div>
          {/* Column 3: Contacto */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-sans)' }} className="text-[#D4AF37] font-bold text-sm tracking-widest mb-5 uppercase">Contacto</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <MapPin className="text-red-500 text-xl shrink-0" />
                {settings?.direccion && settings?.direccionUrl ? (
                  <a
                    href={settings.direccionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white text-sm leading-snug transition-colors"
                  >
                    {settings.direccion}
                  </a>
                ) : (
                  <span className="text-gray-300 text-sm leading-snug">{settings?.direccion || 'Av. Principal S/N, Centro, Huitzitzilingo, Hidalgo.'}</span>
                )}
              </li>
              <li className="flex items-center gap-4">
                <Phone className="text-gray-400 text-xl shrink-0" />
                <span className="text-gray-300 text-sm">{settings?.telefono || '+52 (771) 000 0000'}</span>
              </li>
              <li className="flex items-center gap-4">
                <Mail className="text-blue-300 text-xl shrink-0" />
                <span className="text-gray-300 text-sm">{settings?.correo || 'hola@floreriabautista.com'}</span>
              </li>
            </ul>
          </div>
          {/* Column 4: Horarios */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-sans)' }} className="text-[#D4AF37] font-bold text-sm tracking-widest mb-5 uppercase">Horarios</h2>
            <ul className="space-y-3">
              {horariosAgrupados.length > 0 ? (
                horariosAgrupados.map(g => (
                  <li key={g.label} className="text-gray-300 text-sm">{g.label}: {g.value}</li>
                ))
              ) : (
                <>
                  <li className="text-gray-300 text-sm">Lunes - Sábado: 09:00 - 19:00</li>
                  <li className="text-gray-300 text-sm">Domingo: Cerrado</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
      {/* Bottom Bar */}
      <div className="bg-[#132c45] py-5">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-400 text-sm tracking-wide">
            © 2026 Florería Bautista. Todos los derechos reservados. San Felipe Orizatlán, Hidalgo.
          </p>
        </div>
      </div>
    </footer>
  );
}
