import React, { useState, useEffect } from 'react';
import {
  ChevronRight, Layout, Image, Type, Star, Tag, Clock, Phone,
  Save, Eye, Megaphone, RefreshCw, MapPin, ExternalLink, Share2,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { AdminService } from '../../services/adminService';
import { Horario } from '../../types';
import { useToast } from '../../hooks/useToast';

// ─── Types ──────────────────────────────────────────────────────────────────
interface HorarioItem extends Horario {}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const defaultHorarios: HorarioItem[] = DIAS.map((dia, i) => ({
  dia,
  apertura: '09:00',
  cierre: '19:00',
  cerrado: i === 6,
}));

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, color, title, description }: {
  icon: React.ElementType; color: string; title: string; description: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-sm font-black text-slate-800 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AdminCmsPage() {
  const { showToast } = useToast();
  const [bannerTitulo, setBannerTitulo] = useState('');
  const [bannerSubtitulo, setBannerSubtitulo] = useState('');
  const [bannerCta, setBannerCta] = useState('Ver catálogo');
  const [horarios, setHorarios] = useState<HorarioItem[]>(defaultHorarios);
  const [nombreTienda, setNombreTienda] = useState('Florería Bautista');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [direccionUrl, setDireccionUrl] = useState('');
  const [correo, setCorreo] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [destacados, setDestacados] = useState<string[]>([]);
  const [anuncioTexto, setAnuncioTexto] = useState('🌸 Envío gratis en pedidos mayores a $500 MXN');
  const [anuncioActivo, setAnuncioActivo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const inp = 'w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-all';

  const load = async () => {
    setLoading(true);
    try {
      const res = await AdminService.getCms();
      const s = res.data;
      setNombreTienda(s.nombreTienda || 'Florería Bautista');
      setTelefono(s.telefono || '');
      setDireccion(s.direccion || '');
      setDireccionUrl(s.direccionUrl || '');
      setCorreo(s.correo || '');
      setFacebookUrl(s.facebookUrl || '');
      setInstagramUrl(s.instagramUrl || '');
      setWhatsappUrl(s.whatsappUrl || '');
      setBannerTitulo(s.bannerTitulo || '');
      setBannerSubtitulo(s.bannerSubtitulo || '');
      setBannerCta(s.bannerCta || 'Ver catálogo');
      setHorarios(s.horarios && s.horarios.length > 0 ? s.horarios : defaultHorarios);
      setDestacados(s.destacados ?? []);
      setAnuncioTexto(s.anuncioTexto || '🌸 Envío gratis en pedidos mayores a $500 MXN');
      setAnuncioActivo(s.anuncioActivo ?? false);
    } catch {
      // si falla, se quedan los valores por defecto para poder configurarlos desde cero
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await AdminService.updateCms({
        nombreTienda, telefono, direccion, direccionUrl, correo,
        facebookUrl, instagramUrl, whatsappUrl,
        bannerTitulo, bannerSubtitulo, bannerCta,
        horarios, destacados: destacados.filter(d => d.trim()),
        anuncioTexto, anuncioActivo,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      showToast('No se pudieron guardar los cambios. Verifica tu sesión e intenta de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateHorario = (i: number, field: keyof HorarioItem, value: any) => {
    setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));
  };

  return (
    <div className="w-full flex flex-col gap-5">



      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Personalizar Sitio</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Gestiona el contenido visual: banners, horarios, información de contacto y destacados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open('/?preview=1', '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 bg-white dark:bg-slate-800 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-500/50 px-3 py-2 rounded-xl transition-all"
          >
            <Eye className="w-3.5 h-3.5" /> Ver tienda
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 bg-white dark:bg-slate-800 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-500/50 px-3 py-2 rounded-xl transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Recargar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-black shadow-lg shadow-purple-600/20 transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Save confirmation */}
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="font-black">✓</span> Cambios guardados correctamente. Ya se reflejan en el sitio público.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left column */}
        <div className="xl:col-span-2 space-y-5">

          {/* Banner del hero */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <SectionHeader
              icon={Image}
              color="bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"
              title="Banner Principal (Hero)"
              description="Se muestra en la pantalla principal de la tienda. Déjalo vacío para usar el texto por defecto."
            />
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Título</label>
                <input type="text" value={bannerTitulo} onChange={e => setBannerTitulo(e.target.value)} placeholder="Flores elegantes y coloridas para cada momento especial" className={inp} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Subtítulo</label>
                <input type="text" value={bannerSubtitulo} onChange={e => setBannerSubtitulo(e.target.value)} placeholder="Llevamos la belleza de la naturaleza a tu puerta." className={inp} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Texto del botón (CTA)</label>
                <input type="text" value={bannerCta} onChange={e => setBannerCta(e.target.value)} className={inp} />
              </div>
            </div>
          </div>

          {/* Horarios */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <SectionHeader
              icon={Clock}
              color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
              title="Horarios de Atención"
              description="Se muestran en la página de Contacto y en el footer"
            />
            <div className="space-y-2">
              {horarios.map((h, i) => (
                <div key={h.dia} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-24 shrink-0">{h.dia}</span>
                  {h.cerrado ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic flex-1">Cerrado</span>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={h.apertura} onChange={e => updateHorario(i, 'apertura', e.target.value)}
                        className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-1 focus:ring-purple-300 outline-none" />
                      <span className="text-xs text-slate-400">—</span>
                      <input type="time" value={h.cierre} onChange={e => updateHorario(i, 'cierre', e.target.value)}
                        className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-1 focus:ring-purple-300 outline-none" />
                    </div>
                  )}
                  <button
                    onClick={() => updateHorario(i, 'cerrado', !h.cerrado)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all shrink-0 ${h.cerrado ? 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border-red-100 dark:border-red-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}`}
                  >
                    {h.cerrado ? 'Cerrado' : 'Abierto'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Productos destacados */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <SectionHeader
              icon={Star}
              color="bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20"
              title="Productos Destacados"
              description="Aparecen en la sección principal de la tienda online"
            />
            <div className="space-y-2">
              {destacados.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-400 w-4">{i + 1}.</span>
                  <input
                    type="text"
                    value={d}
                    onChange={e => setDestacados(prev => prev.map((x, idx) => idx === i ? e.target.value : x))}
                    placeholder="Nombre del producto destacado"
                    className={`${inp} flex-1`}
                  />
                  <button
                    onClick={() => setDestacados(prev => prev.filter((_, idx) => idx !== i))}
                    className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                  >✕</button>
                </div>
              ))}
              {destacados.length < 6 && (
                <button
                  onClick={() => setDestacados(prev => [...prev, ''])}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 px-3 py-1.5 rounded-lg transition-all mt-1"
                >
                  + Agregar destacado
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Información de contacto */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <SectionHeader
              icon={Phone}
              color="bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20"
              title="Información de Contacto"
              description="Datos que se muestran en footer y página de contacto"
            />
            <div className="space-y-3">
               {[
                { label: 'Nombre de la tienda', value: nombreTienda, set: setNombreTienda, icon: Type },
                { label: 'Teléfono', value: telefono, set: setTelefono, icon: Phone },
                { label: 'Correo', value: correo, set: setCorreo, icon: Tag },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                  <input type="text" value={value} onChange={e => set(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-all" />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Dirección</label>
                <input type="text" value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Av. Principal S/N, Centro, Huitzitzilingo, Hidalgo" className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">URL de Google Maps</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                  <input
                    type="text"
                    value={direccionUrl}
                    onChange={e => setDireccionUrl(e.target.value)}
                    placeholder="Pega aquí el enlace de Google Maps..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-all"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                  En Google Maps: busca la dirección → "Compartir" → "Copiar enlace" → pégalo aquí.
                </p>
                {direccionUrl && (
                  <a
                    href={direccionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700"
                  >
                    Ver en Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Redes sociales */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <SectionHeader
              icon={Share2}
              color="bg-sky-50 dark:bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20"
              title="Redes Sociales"
              description="Enlaces de los íconos que aparecen en el footer"
            />
            <div className="space-y-3">
              {(([
                { label: 'Facebook', value: facebookUrl, set: setFacebookUrl, icon: FaFacebook, color: '#1877F2', placeholder: 'https://facebook.com/tu-pagina' },
                { label: 'Instagram', value: instagramUrl, set: setInstagramUrl, icon: FaInstagram, color: '#dc2743', placeholder: 'https://instagram.com/tu-cuenta' },
                { label: 'WhatsApp', value: whatsappUrl, set: setWhatsappUrl, icon: FaWhatsapp, color: '#25D366', placeholder: 'https://wa.me/527711234567' },
              ]) as { label: string; value: string; set: (v: string) => void; icon: IconType; color: string; placeholder: string }[]).map(({ label, value, set, icon: Icon, color, placeholder }) => (
                <div key={label}>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                      <Icon size={14} color={color} />
                    </span>
                    <input
                      type="text"
                      value={value}
                      onChange={e => set(e.target.value)}
                      placeholder={placeholder}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Promociones/Anuncios */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <SectionHeader
              icon={Megaphone}
              color="bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20"
              title="Anuncio Global"
              description="Banda de anuncio en la parte superior del sitio"
            />
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Texto del anuncio</label>
                <input type="text" value={anuncioTexto} onChange={e => setAnuncioTexto(e.target.value)} className={inp} />
              </div>
              <button
                onClick={() => setAnuncioActivo(v => !v)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${anuncioActivo ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700'}`}
              >
                <div className={`relative w-10 h-5 rounded-full transition-colors ${anuncioActivo ? 'bg-orange-400' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <span className={`absolute top-0.5 size-4 bg-white rounded-full shadow transition-all ${anuncioActivo ? 'right-0.5' : 'left-0.5'}`} />
                </div>
                <span className={`text-xs font-bold ${anuncioActivo ? 'text-orange-700 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {anuncioActivo ? 'Anuncio activo' : 'Anuncio inactivo'}
                </span>
              </button>
            </div>
          </div>

          {/* Preview note */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Vista previa</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Los cambios se reflejan en la tienda al guardar. Usa el botón <strong>"Ver tienda"</strong> para revisar el resultado antes de publicar.
            </p>
            <button onClick={() => window.open('/?preview=1', '_blank', 'noopener,noreferrer')} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors">
              <Eye className="w-3.5 h-3.5" /> Abrir vista previa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
