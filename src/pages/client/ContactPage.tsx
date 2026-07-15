import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Send, MessageSquare } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { CmsService } from '../../services/cmsService';
import { SiteSettings } from '../../types';

export default function ContactPage() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    CmsService.getSettings().then(setSettings).catch(() => { /* usa los valores por defecto del markup */ });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      showToast('success', 'Mensaje enviado', 'Nos pondremos en contacto contigo pronto.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-black text-brand-deep mb-4"
          >
            Ponte en <span className="text-[#D4AF37]">Contacto</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 max-w-2xl mx-auto text-lg"
          >
            ¿Tienes alguna duda, un evento importante o quieres un arreglo personalizado? 
            Escríbenos y nuestro equipo de expertos en diseño floral te atenderá.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 space-y-8"
          >
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-8">
              <h3 className="text-2xl font-bold text-brand-deep border-b border-slate-100 pb-4">
                Información
              </h3>
              
              <div className="flex items-start gap-4">
                <div className="bg-brand-deep/5 p-3 rounded-full shrink-0">
                  <MapPin className="text-brand-deep w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Dirección</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {settings?.direccion || 'Av. Principal S/N, Centro, Huitzitzilingo, Hidalgo, México'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand-deep/5 p-3 rounded-full shrink-0">
                  <Phone className="text-brand-deep w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Teléfono</h4>
                  <p className="text-slate-600 text-sm">
                    {settings?.telefono || '+52 (771) 000 0000'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand-deep/5 p-3 rounded-full shrink-0">
                  <Mail className="text-brand-deep w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Correo Electrónico</h4>
                  <p className="text-slate-600 text-sm">
                    {settings?.correo || 'hola@floreriabautista.com'}
                  </p>
                </div>
              </div>

              {/* Business Hours */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Horario de Atención</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  {(settings?.horarios ?? []).map(h => (
                    <li key={h.dia} className="flex justify-between">
                      <span>{h.dia}</span>
                      <span className="font-medium text-slate-800">{h.cerrado ? 'Cerrado' : `${h.apertura} - ${h.cierre}`}</span>
                    </li>
                  ))}
                  {(!settings || settings.horarios.length === 0) && (
                    <>
                      <li className="flex justify-between"><span>Lunes - Viernes</span><span className="font-medium text-slate-800">8:00 AM - 8:00 PM</span></li>
                      <li className="flex justify-between"><span>Sábados</span><span className="font-medium text-slate-800">9:00 AM - 6:00 PM</span></li>
                      <li className="flex justify-between"><span>Domingos</span><span className="font-medium text-slate-800">9:00 AM - 2:00 PM</span></li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <form 
              onSubmit={handleSubmit} 
              className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-100 h-full"
            >
              <h3 className="text-2xl font-bold text-brand-deep mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-[#D4AF37]" />
                Envíanos un Mensaje
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-deep/20 focus:border-brand-deep transition-all"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-deep/20 focus:border-brand-deep transition-all"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-deep/20 focus:border-brand-deep transition-all"
                    placeholder="10 dígitos"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-bold text-slate-700 mb-2">
                    Asunto
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange as any}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-deep/20 focus:border-brand-deep transition-all"
                  >
                    <option value="">Selecciona un asunto...</option>
                    <option value="duda">Duda o consulta general</option>
                    <option value="pedido">Pedido personalizado</option>
                    <option value="evento">Flores para evento</option>
                    <option value="queja">Queja o sugerencia</option>
                  </select>
                </div>
              </div>

              <div className="mb-8">
                <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-deep/20 focus:border-brand-deep transition-all resize-none"
                  placeholder="Escribe tu mensaje aquí..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-deep text-white font-bold rounded-xl hover:bg-brand-deep/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-deep/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Enviar Mensaje</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
