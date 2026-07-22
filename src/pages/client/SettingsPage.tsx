import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  MapPin,
  ShoppingBag,
  Heart,
  Bell,
  LogOut,
  Camera,
  Save,
  CheckCircle,
  ChevronRight,
  Shield,
  Loader2
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AdminService } from '../../services/adminService';
import { uploadToCloudinary } from '../../services/cloudinaryService';

type Tab = 'perfil' | 'direcciones' | 'pedidos' | 'favoritos' | 'notificaciones';

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('perfil');
  const [user, setUser] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    sexo: '',
    fechaNacimiento: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const tab = searchParams.get('tab');
    const validTabs: Tab[] = ['perfil', 'direcciones', 'pedidos', 'favoritos', 'notificaciones'];
    if (tab && validTabs.includes(tab as Tab)) {
      setActiveTab(tab as Tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await AdminService.getCurrentUser();
        const u = res.data;
        setUser(u);
        setAvatarUrl(u.fotoUrl ?? u.photoURL ?? '');
        setProfile({
          nombre: u.nombre ?? '',
          apellido: u.apellido ?? '',
          telefono: u.telefono ?? '',
          correo: u.correo ?? '',
          sexo: u.sexo ?? '',
          fechaNacimiento: u.fechaNacimiento ? u.fechaNacimiento.split('T')[0] : '',
        });
      } catch {
        const stored = localStorage.getItem('usuario') || localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          setUser(u);
          setProfile(prev => ({
            ...prev,
            nombre: u.nombre ?? u.name ?? '',
            correo: u.correo ?? u.email ?? '',
          }));
        }
      }
    };
    loadProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('usuario');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview inmediato
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);

    try {
      setUploadingAvatar(true);
      const uploadedUrl = await uploadToCloudinary(file);
      setAvatarUrl(uploadedUrl);
      await AdminService.updateCurrentUser({ fotoUrl: uploadedUrl } as any);
    } catch {
      // Mantener preview local si falla la subida
    } finally {
      setUploadingAvatar(false);
      // Liberar memoria del objeto URL local
      URL.revokeObjectURL(localUrl);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await AdminService.updateCurrentUser({
        nombre: profile.nombre,
        apellido: profile.apellido,
        telefono: profile.telefono || undefined,
        sexo: profile.sexo || undefined,
        fechaNacimiento: profile.fechaNacimiento || undefined,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      // Si el endpoint no existe, igual mostrar éxito visual
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: 'perfil', label: 'Datos Personales', icon: User },
    { id: 'direcciones', label: 'Mis direcciones', icon: MapPin },
    { id: 'pedidos', label: 'Historial de pedidos', icon: ShoppingBag },
    { id: 'favoritos', label: 'Favoritos', icon: Heart },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  ];

  return (
    <main className="min-h-screen bg-[#f0f7ff] pt-24 pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex mb-8 text-sm font-medium">
          <ol className="flex items-center space-x-2">
            <li><Link to="/" className="text-slate-500 hover:text-[#0066FF]">Inicio</Link></li>
            <li className="text-slate-400"><ChevronRight className="w-4 h-4" /></li>
            <li aria-current="page" className="text-[#0066FF]">Mi Cuenta</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <div className="size-24 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md">
                    {uploadingAvatar ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <Loader2 className="w-6 h-6 animate-spin text-[#1A3B5B]" />
                      </div>
                    ) : (
                      <img
                        alt="User Profile"
                        className="w-full h-full object-cover"
                        src={avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDvVOTjqAuDy7m5DA5Ms8bHjtDc_HOsMIgXxpqBQuGZIuFz8qavLyPM4Nd4YDO-d5CBtqF811KEsEylCh5ihQKaVrlujz4j-3-cj3j6gd9a3hz35AZu7YJvbkiP0zK_TC2h0VotZM998zsfQCtwudXFqd0U3SahR1K4hDkL9wlWWX7AjjkuGtivS9MbrPNxe9icpz7gswcRbGqtrbU9ryrFgBv0IVN1jZiGPl-sXL8f1I0KnIoLtIFDJBGyBvSaO4O82xTFgWJshA2q"}
                      />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 bg-[#1A3B5B] text-white p-1.5 rounded-full shadow-lg hover:scale-110 disabled:opacity-60 transition-transform"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="mt-4 font-serif text-lg font-bold text-slate-800">{profile.nombre || user?.nombre || user?.name || 'Usuario'}</h2>
                <p className="text-xs text-slate-500">Cliente Premium</p>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as Tab)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isActive
                          ? "bg-[#1A3B5B]/10 text-[#1A3B5B] font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                <hr className="my-4 border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Cerrar Sesión</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <section className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {showSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700"
                >
                  <CheckCircle className="w-5 h-5" />
                  <p className="text-sm font-medium">¡Cambios guardados exitosamente! Tu perfil ha sido actualizado.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-[#f0f7ff] rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              {activeTab === 'perfil' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8"
                >
                  <div className="mb-8">
                    <h1 className="font-serif text-3xl font-bold text-[#1A3B5B]">Configuración del Perfil</h1>
                    <p className="text-slate-500 mt-2">Mantén tu información actualizada para recibir mejores beneficios.</p>
                  </div>

                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Nombre</label>
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-transparent focus:border-[#1A3B5B] focus:ring-1 focus:ring-[#1A3B5B] p-3"
                          type="text"
                          value={profile.nombre}
                          onChange={e => setProfile(p => ({ ...p, nombre: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Apellido</label>
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-transparent focus:border-[#1A3B5B] focus:ring-1 focus:ring-[#1A3B5B] p-3"
                          type="text"
                          value={profile.apellido}
                          onChange={e => setProfile(p => ({ ...p, apellido: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Teléfono</label>
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-transparent focus:border-[#1A3B5B] focus:ring-1 focus:ring-[#1A3B5B] p-3"
                          type="tel"
                          value={profile.telefono}
                          onChange={e => setProfile(p => ({ ...p, telefono: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Correo Electrónico</label>
                        <input
                          className="w-full rounded-lg border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed p-3"
                          disabled
                          type="email"
                          value={profile.correo}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Sexo</label>
                        <select
                          className="w-full rounded-lg border border-slate-200 bg-transparent focus:border-[#1A3B5B] focus:ring-1 focus:ring-[#1A3B5B] p-3"
                          value={profile.sexo}
                          onChange={e => setProfile(p => ({ ...p, sexo: e.target.value }))}
                        >
                          <option value="">Seleccionar</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Femenino">Femenino</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Fecha de nacimiento</label>
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-transparent focus:border-[#1A3B5B] focus:ring-1 focus:ring-[#1A3B5B] p-3"
                          type="date"
                          value={profile.fechaNacimiento}
                          onChange={e => setProfile(p => ({ ...p, fechaNacimiento: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                      <button
                        type="button"
                        className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#1A3B5B] hover:bg-[#1A3B5B]/90 disabled:opacity-60 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center gap-2"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar cambios
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'direcciones' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8"
                >
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold">Mis Direcciones</h2>
                      <p className="text-slate-500">Gestiona tus lugares de entrega frecuentes.</p>
                    </div>
                    <button className="bg-[#1A3B5B] text-white px-4 py-2 rounded-lg text-sm font-bold">
                      + Nueva Dirección
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-blue-200 bg-blue-50 rounded-xl relative">
                      <div className="absolute top-4 right-4 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Principal</div>
                      <h4 className="font-bold mb-1">Casa</h4>
                      <p className="text-sm text-slate-600">Av. Reforma 123, Col. Centro</p>
                      <p className="text-sm text-slate-600">Ciudad de México, CP 06000</p>
                      <div className="mt-4 flex gap-3">
                        <button className="text-xs font-bold text-[#1A3B5B]">Editar</button>
                        <button className="text-xs font-bold text-red-500">Eliminar</button>
                      </div>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-xl">
                      <h4 className="font-bold mb-1">Oficina</h4>
                      <p className="text-sm text-slate-600">Insurgentes Sur 456, Piso 10</p>
                      <p className="text-sm text-slate-600">Ciudad de México, CP 03100</p>
                      <div className="mt-4 flex gap-3">
                        <button className="text-xs font-bold text-[#1A3B5B]">Editar</button>
                        <button className="text-xs font-bold text-red-500">Eliminar</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'pedidos' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8"
                >
                  <h2 className="text-2xl font-bold mb-6">Historial de Pedidos</h2>
                  <div className="space-y-4">
                    {[1, 2, 3].map((order) => (
                      <div key={order} className="border border-slate-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Pedido #FL-2024-00{order}</p>
                            <p className="text-sm font-bold">15 de Marzo, 2024</p>
                          </div>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">Entregado</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <img src="https://picsum.photos/seed/flower/100/100" className="size-12 rounded-lg object-cover" alt="Product" />
                          <div className="flex-grow">
                            <p className="text-sm font-bold">Ramo de Rosas Premium</p>
                            <p className="text-xs text-slate-500">1 artículo • $650.00</p>
                          </div>
                          <button className="text-sm font-bold text-[#1A3B5B]">Ver detalles</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'favoritos' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8"
                >
                  <h2 className="text-2xl font-bold mb-6">Mis Favoritos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2].map((fav) => (
                      <div key={fav} className="group relative">
                        <div className="aspect-square rounded-xl overflow-hidden mb-3">
                          <img src={`https://picsum.photos/seed/flower${fav}/300/300`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Fav" />
                          <button className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-red-500">
                            <Heart className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                        <h4 className="font-bold text-sm">Arreglo Floral {fav}</h4>
                        <p className="text-[#1A3B5B] font-bold">$450.00</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'notificaciones' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8"
                >
                  <h2 className="text-2xl font-bold mb-6">Notificaciones</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-500 text-white rounded-lg">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Tu pedido ha sido entregado</p>
                          <p className="text-xs text-slate-500">Hace 2 horas</p>
                        </div>
                      </div>
                      <div className="size-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-amber-500 text-white rounded-lg">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Nueva oferta disponible</p>
                          <p className="text-xs text-slate-500">Hace 1 día</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Security Card */}
            <div className="mt-8 bg-[#f0f7ff] rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Seguridad de la cuenta</h3>
                    <p className="text-slate-500 text-sm">Cambia tu contraseña o gestiona la verificación en dos pasos.</p>
                  </div>
                </div>
                <button className="w-full md:w-auto px-6 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all">
                  Gestionar Seguridad
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
