import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { MapPin, Phone, Mail } from 'lucide-react';
import { CmsService } from '../services/cmsService';
import { SiteSettings } from '../types';

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    CmsService.getSettings().then(setSettings).catch(() => { /* usa los valores por defecto del markup */ });
  }, []);

  const horariosAbiertos = settings?.horarios?.filter(h => !h.cerrado) ?? [];

  return (
    <footer className="bg-[#1A3A5A] text-white pt-10 pb-0">
      <div className="container mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Logo & Social */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <img src="/Logo.png" alt="Florería Bautista Logo" className="h-10 w-auto" />
              <span className="text-xl font-serif font-bold tracking-tight">Florería <span className="text-[#D4AF37]">Bautista</span></span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-5 max-w-xs">
              La mejor calidad en diseño floral de la región Huitzitzilingo-Orizatlán.
            </p>
            <div className="flex gap-3">
              <a className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center hover:scale-110 transition-transform" href="#" title="Facebook">
                <FaFacebook size={18} color="white" />
              </a>
              <a className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center hover:scale-110 transition-transform" href="#" title="Instagram">
                <FaInstagram size={18} color="white" />
              </a>
              <a className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center hover:scale-110 transition-transform" href="#" title="WhatsApp">
                <FaWhatsapp size={18} color="white" />
              </a>
            </div>
          </div>
          {/* Column 2: Enlaces */}
          <div>
            <h4 className="text-[#D4AF37] font-bold text-sm tracking-widest mb-5 uppercase">Enlaces</h4>
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
            <h4 className="text-[#D4AF37] font-bold text-sm tracking-widest mb-5 uppercase">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <MapPin className="text-red-500 text-xl shrink-0" />
                <span className="text-gray-300 text-sm leading-snug">{settings?.direccion || 'Av. Principal S/N, Centro, Huitzitzilingo, Hidalgo.'}</span>
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
            <h4 className="text-[#D4AF37] font-bold text-sm tracking-widest mb-5 uppercase">Horarios</h4>
            <ul className="space-y-3">
              {horariosAbiertos.length > 0 ? (
                horariosAbiertos.map(h => (
                  <li key={h.dia} className="text-gray-300 text-sm">{h.dia}: {h.apertura} - {h.cierre}</li>
                ))
              ) : (
                <>
                  <li className="text-gray-300 text-sm">Lunes - Viernes: 8:00 - 20:00</li>
                  <li className="text-gray-300 text-sm">Sábados: 9:00 - 18:00</li>
                  <li className="text-gray-300 text-sm">Domingos: 9:00 - 14:00</li>
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
            © 2023 Florería Bautista. Todos los derechos reservados. San Felipe Orizatlán, Hidalgo.
          </p>
        </div>
      </div>
    </footer>
  );
}
