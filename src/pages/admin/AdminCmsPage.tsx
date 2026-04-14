import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Layout, Image, Type, Star, Tag, Clock, Phone,
  Save, Eye, ToggleLeft, ToggleRight, AlertCircle, Megaphone,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface BannerConfig {
  titulo: string;
  subtitulo: string;
  cta: string;
  activo: boolean;
}

interface HorarioItem {
  dia: string;
  apertura: string;
  cierre: string;
  cerrado: boolean;
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const defaultBanners: BannerConfig[] = [
  { titulo: 'Arreglos Florales con Amor', subtitulo: 'Entrega el mismo día en toda la ciudad', cta: 'Ver catálogo', activo: true },
  { titulo: 'Bodas & Eventos Especiales', subtitulo: 'Decoración floral profesional para tu día especial', cta: 'Cotizar ahora', activo: false },
  { titulo: 'Rosas Frescas Todos los Días', subtitulo: 'Flores de corte directo del campo a tu puerta', cta: 'Ordenar', activo: false },
];

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
  const navigate = useNavigate();

  const [banners, setBanners] = useState<BannerConfig[]>(defaultBanners);
  const [horarios, setHorarios] = useState<HorarioItem[]>(defaultHorarios);
  const [nombreTienda, setNombreTienda] = useState('Florería Bautista');
  const [telefono, setTelefono] = useState('+52 (55) 1234-5678');
  const [direccion, setDireccion] = useState('Av. Principal #123, Col. Centro, CDMX');
  const [correo, setCorreo] = useState('contacto@floreriabautista.com');
  const [destacados, setDestacados] = useState<string[]>(['Rosas Rojas Premium', 'Arreglo de Bodas', 'Ramo de Novia']);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const inp = 'w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-all';

  const handleSave = async () => {
    setSaving(true);
    // Simulate save (no backend endpoint yet)
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleBanner = (i: number) => {
    setBanners(prev => prev.map((b, idx) => ({ ...b, activo: idx === i })));
  };

  const updateBanner = (i: number, field: keyof BannerConfig, value: string) => {
    setBanners(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b));
  };

  const updateHorario = (i: number, field: keyof HorarioItem, value: any) => {
    setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));
  };

  return (
    <div className="w-full flex flex-col gap-5">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
        <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer" onClick={() => navigate('/dashboard')}>Dashboard</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-700 dark:text-slate-300">Personalizar Sitio</span>
      </nav>

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
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 bg-white dark:bg-slate-800 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-500/50 px-3 py-2 rounded-xl transition-all"
          >
            <Eye className="w-3.5 h-3.5" /> Ver tienda
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
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
          <span className="font-black">✓</span> Cambios guardados correctamente
        </div>
      )}

      {/* API notice */}
      <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
        <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <span className="font-bold">Nota de desarrollo:</span> Esta sección gestiona el contenido visual del sitio. La integración con el backend (endpoint <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">/api/admin/cms</code>) está pendiente de implementación en el servidor.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left column */}
        <div className="xl:col-span-2 space-y-5">

          {/* Banners del hero */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <SectionHeader
              icon={Image}
              color="bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"
              title="Banners del Hero"
              description="El banner activo se muestra en la pantalla principal de la tienda"
            />
            <div className="space-y-4">
              {banners.map((banner, i) => (
                <div key={i} className={`rounded-xl border p-4 transition-all ${banner.activo ? 'border-blue-200 dark:border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Banner {i + 1}</span>
                    <button
                      onClick={() => toggleBanner(i)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full transition-all ${banner.activo ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-blue-200 hover:text-blue-500'}`}
                    >
                      {banner.activo ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {banner.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Título</label>
                      <input type="text" value={banner.titulo} onChange={e => updateBanner(i, 'titulo', e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Subtítulo</label>
                      <input type="text" value={banner.subtitulo} onChange={e => updateBanner(i, 'subtitulo', e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Texto del botón (CTA)</label>
                      <input type="text" value={banner.cta} onChange={e => updateBanner(i, 'cta', e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-all" />
                    </div>
                  </div>
                </div>
              ))}
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
                { label: 'Dirección', value: direccion, set: setDireccion, icon: Tag },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                  <input type="text" value={value} onChange={e => set(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-all" />
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
                <input type="text" defaultValue="🌸 Envío gratis en pedidos mayores a $500 MXN" className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-all" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl">
                <div className="relative w-10 h-5 rounded-full bg-orange-400 cursor-pointer">
                  <span className="absolute top-0.5 right-0.5 size-4 bg-white rounded-full shadow" />
                </div>
                <span className="text-xs font-bold text-orange-700 dark:text-orange-400">Anuncio activo</span>
              </div>
            </div>
          </div>

          {/* Preview note */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Vista previa</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Los cambios se reflejan en la tienda al guardar. Usa el botón <strong>"Ver tienda"</strong> para revisar el resultado antes de publicar.
            </p>
            <button onClick={() => navigate('/')} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors">
              <Eye className="w-3.5 h-3.5" /> Abrir vista previa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
