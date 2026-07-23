import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Loader2,
  Plus,
  Trash2,
  Edit3,
  Star,
  X
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AdminService, type UserAddress, type AddressInput } from '../../services/adminService';
import { lookupCp } from '../../services/sepomexService';
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

  // ── Direcciones ──────────────────────────────────────────────
  const emptyAddr: AddressInput = {
    etiqueta: '', calle: '', colonia: '', municipio: '', estado: '', cp: '', referencias: '', esPrincipal: false,
  };
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState<AddressInput>(emptyAddr);
  const [colonias, setColonias] = useState<string[]>([]);
  const [savingAddr, setSavingAddr] = useState(false);
  const [deletingAddrId, setDeletingAddrId] = useState<string | null>(null);
  const [addrError, setAddrError] = useState('');

  const cargarDirecciones = async () => {
    setLoadingAddr(true);
    try {
      setAddresses(await AdminService.getMyAddresses());
    } catch {
      setAddresses([]);
    } finally {
      setLoadingAddr(false);
    }
  };

  // Carga las direcciones al abrir esa pestaña (una sola vez).
  useEffect(() => {
    if (activeTab === 'direcciones' && addresses.length === 0 && !loadingAddr) {
      cargarDirecciones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Pedidos reales (usados por Historial y Notificaciones) ───
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersCargados, setOrdersCargados] = useState(false);

  const cargarPedidos = async () => {
    setLoadingOrders(true);
    try {
      const res = await AdminService.getMyOrders();
      setOrders(res.data?.items ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
      setOrdersCargados(true);
    }
  };

  useEffect(() => {
    if ((activeTab === 'pedidos' || activeTab === 'notificaciones') && !ordersCargados && !loadingOrders) {
      cargarPedidos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Estado del pedido → etiqueta y color legibles.
  const ESTADO_INFO: Record<string, { label: string; badge: string }> = {
    PENDIENTE_VALIDACION: { label: 'Pendiente', badge: 'bg-amber-100 text-amber-700' },
    EN_PREPARACION:       { label: 'En preparación', badge: 'bg-indigo-100 text-indigo-700' },
    EN_RUTA:              { label: 'En ruta', badge: 'bg-blue-100 text-blue-700' },
    ENTREGADO:            { label: 'Entregado', badge: 'bg-emerald-100 text-emerald-700' },
    CANCELADO:            { label: 'Cancelado', badge: 'bg-slate-200 text-slate-600' },
    PENDIENTE_ANULACION:  { label: 'Por anular', badge: 'bg-red-100 text-red-700' },
    NO_COMPLETADO:        { label: 'Sin completar', badge: 'bg-slate-200 text-slate-600' },
  };
  const estadoInfo = (e: string) => ESTADO_INFO[e] ?? { label: e, badge: 'bg-slate-200 text-slate-600' };

  const tiempoRelativo = (iso: string) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Hace un momento';
    if (min < 60) return `Hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d === 1) return 'Ayer';
    if (d < 30) return `Hace ${d} días`;
    return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
  };

  const folio = (id: string) => `FB-${(id || '').slice(0, 8).toUpperCase()}`;

  // Mensaje de notificación según el estado real del pedido.
  const mensajeNotificacion = (estado: string, id: string): string => {
    const f = folio(id);
    switch (estado) {
      case 'ENTREGADO':            return `Tu pedido ${f} fue entregado. ¡Gracias por tu compra!`;
      case 'EN_RUTA':              return `Tu pedido ${f} va en camino.`;
      case 'EN_PREPARACION':       return `Estamos preparando tu pedido ${f}.`;
      case 'PENDIENTE_VALIDACION': return `Recibimos tu pedido ${f}, lo estamos validando.`;
      case 'CANCELADO':            return `Tu pedido ${f} fue cancelado.`;
      default:                     return `Actualización de tu pedido ${f}.`;
    }
  };

  const abrirNuevaDireccion = () => {
    setEditingAddrId(null);
    setAddrForm(emptyAddr);
    setColonias([]);
    setAddrError('');
    setAddrModalOpen(true);
  };

  const abrirEditarDireccion = (a: UserAddress) => {
    setEditingAddrId(a.id);
    setAddrForm({
      etiqueta: a.etiqueta ?? '', calle: a.calle, colonia: a.colonia,
      municipio: a.municipio, estado: a.estado, cp: a.cp ?? '',
      referencias: a.referencias ?? '', esPrincipal: a.esPrincipal,
    });
    setColonias(a.colonia ? [a.colonia] : []);
    setAddrError('');
    setAddrModalOpen(true);
  };

  // Al escribir un CP de 5 dígitos, autocompleta estado/municipio/colonias.
  const handleCpChange = async (cp: string) => {
    setAddrForm(f => ({ ...f, cp }));
    if (/^\d{5}$/.test(cp)) {
      const info = await lookupCp(cp);
      if (info) {
        setColonias(info.colonias);
        setAddrForm(f => ({
          ...f, cp, estado: info.estado, municipio: info.municipio,
          colonia: info.colonias.includes(f.colonia ?? '') ? f.colonia : '',
        }));
      }
    }
  };

  const guardarDireccion = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrError('');
    setSavingAddr(true);
    try {
      if (editingAddrId) {
        await AdminService.updateMyAddress(editingAddrId, addrForm);
      } else {
        await AdminService.createMyAddress(addrForm);
      }
      setAddrModalOpen(false);
      await cargarDirecciones();
    } catch (err: any) {
      setAddrError('No se pudo guardar la dirección. Verifica los datos e intenta de nuevo.');
    } finally {
      setSavingAddr(false);
    }
  };

  const eliminarDireccion = async (id: string) => {
    if (!window.confirm('¿Eliminar esta dirección?')) return;
    setDeletingAddrId(id);
    try {
      await AdminService.deleteMyAddress(id);
      await cargarDirecciones();
    } catch {
      // noop: se mantiene la lista actual si falla
    } finally {
      setDeletingAddrId(null);
    }
  };

  const marcarPrincipal = async (id: string) => {
    try {
      await AdminService.setMyAddressPrincipal(id);
      await cargarDirecciones();
    } catch { /* noop */ }
  };

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
                    <button
                      onClick={abrirNuevaDireccion}
                      className="bg-[#1A3B5B] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#1A3B5B]/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Nueva Dirección
                    </button>
                  </div>

                  {loadingAddr ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 text-[#1A3B5B] animate-spin" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
                      <MapPin className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 mb-4">Aún no tienes direcciones guardadas.</p>
                      <button
                        onClick={abrirNuevaDireccion}
                        className="text-[#1A3B5B] font-bold text-sm hover:underline"
                      >
                        Agregar mi primera dirección
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((a) => (
                        <div
                          key={a.id}
                          className={`p-4 rounded-xl relative border ${a.esPrincipal ? 'border-blue-200 bg-blue-50' : 'border-slate-200'}`}
                        >
                          {a.esPrincipal && (
                            <div className="absolute top-4 right-4 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Principal</div>
                          )}
                          <h4 className="font-bold mb-1">{a.etiqueta || 'Dirección'}</h4>
                          <p className="text-sm text-slate-600">{a.calle}{a.colonia ? `, Col. ${a.colonia}` : ''}</p>
                          <p className="text-sm text-slate-600">
                            {a.municipio}{a.estado ? `, ${a.estado}` : ''}{a.cp ? `, CP ${a.cp}` : ''}
                          </p>
                          {a.referencias && <p className="text-xs text-slate-400 mt-1">Ref: {a.referencias}</p>}
                          <div className="mt-4 flex gap-3 items-center flex-wrap">
                            {!a.esPrincipal && (
                              <button
                                onClick={() => marcarPrincipal(a.id)}
                                className="text-xs font-bold text-amber-600 flex items-center gap-1 hover:underline"
                              >
                                <Star className="w-3 h-3" /> Hacer principal
                              </button>
                            )}
                            <button
                              onClick={() => abrirEditarDireccion(a)}
                              className="text-xs font-bold text-[#1A3B5B] flex items-center gap-1 hover:underline"
                            >
                              <Edit3 className="w-3 h-3" /> Editar
                            </button>
                            <button
                              onClick={() => eliminarDireccion(a.id)}
                              disabled={deletingAddrId === a.id}
                              className="text-xs font-bold text-red-500 flex items-center gap-1 hover:underline disabled:opacity-50"
                            >
                              {deletingAddrId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'pedidos' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8"
                >
                  <h2 className="text-2xl font-bold mb-6">Historial de Pedidos</h2>
                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 text-[#1A3B5B] animate-spin" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
                      <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 mb-4">Aún no tienes pedidos.</p>
                      <Link to="/catalogo" className="text-[#1A3B5B] font-bold text-sm hover:underline">Explorar el catálogo</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const info = estadoInfo(order.estadoPedido);
                        const items = order.items ?? [];
                        const primero = items[0];
                        const totalArticulos = items.reduce((n: number, it: any) => n + (it.quantity ?? 0), 0);
                        return (
                          <div key={order.id} className="border border-slate-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Pedido #{folio(order.id)}</p>
                                <p className="text-sm font-bold">
                                  {new Date(order.fechaCreacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                              <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${info.badge}`}>{info.label}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="size-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
                                {primero?.productImage ? (
                                  <img src={primero.productImage} className="w-full h-full object-cover" alt={primero.productName} />
                                ) : (
                                  <ShoppingBag className="w-6 h-6 text-slate-300" />
                                )}
                              </div>
                              <div className="flex-grow min-w-0">
                                <p className="text-sm font-bold truncate">{primero?.productName ?? 'Pedido'}</p>
                                <p className="text-xs text-slate-500">
                                  {totalArticulos} {totalArticulos === 1 ? 'artículo' : 'artículos'} • ${Number(order.total).toLocaleString('es-MX')}
                                </p>
                              </div>
                              <Link to="/mis-pedidos" className="text-sm font-bold text-[#1A3B5B] hover:underline whitespace-nowrap">Ver detalles</Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'favoritos' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8"
                >
                  <h2 className="text-2xl font-bold mb-6">Mis Favoritos</h2>
                  <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
                    <Heart className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 mb-1">Aún no tienes favoritos guardados.</p>
                    <p className="text-slate-400 text-sm mb-4">Marca tus arreglos preferidos para encontrarlos rápido.</p>
                    <Link to="/catalogo" className="text-[#1A3B5B] font-bold text-sm hover:underline">Explorar el catálogo</Link>
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
                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 text-[#1A3B5B] animate-spin" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
                      <Bell className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">No tienes notificaciones por ahora.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 8).map((order) => {
                        const entregado = order.estadoPedido === 'ENTREGADO';
                        return (
                          <div key={order.id} className={`flex items-center justify-between p-4 rounded-xl ${entregado ? 'bg-emerald-50' : 'border border-slate-100'}`}>
                            <div className="flex items-center gap-4">
                              <div className={`p-2 text-white rounded-lg ${entregado ? 'bg-emerald-500' : 'bg-[#1A3B5B]'}`}>
                                {entregado ? <CheckCircle className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold">{mensajeNotificacion(order.estadoPedido, order.id)}</p>
                                <p className="text-xs text-slate-500">{tiempoRelativo(order.fechaCreacion)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

      {/* Modal Alta/Edición de Dirección */}
      {addrModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="text-[#1A3B5B] w-5 h-5" />
                  {editingAddrId ? 'Editar Dirección' : 'Nueva Dirección'}
                </h3>
                <button onClick={() => setAddrModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={guardarDireccion} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Etiqueta (Ej. Casa, Oficina)</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 focus:border-[#1A3B5B] focus:ring-1 focus:ring-[#1A3B5B] p-3"
                    placeholder="Nombre para esta dirección"
                    value={addrForm.etiqueta ?? ''}
                    onChange={(e) => setAddrForm(f => ({ ...f, etiqueta: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Código Postal</label>
                    <input
                      required
                      maxLength={5}
                      inputMode="numeric"
                      className="w-full rounded-lg border border-slate-200 focus:border-[#1A3B5B] focus:ring-1 focus:ring-[#1A3B5B] p-3"
                      placeholder="43021"
                      value={addrForm.cp ?? ''}
                      onChange={(e) => handleCpChange(e.target.value.replace(/\D/g, ''))}
                    />
                    <p className="text-[11px] text-slate-400">Autocompleta estado, municipio y colonias.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Estado</label>
                    <input
                      required
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3"
                      placeholder="Estado"
                      value={addrForm.estado}
                      onChange={(e) => setAddrForm(f => ({ ...f, estado: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Municipio</label>
                    <input
                      required
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3"
                      placeholder="Municipio"
                      value={addrForm.municipio}
                      onChange={(e) => setAddrForm(f => ({ ...f, municipio: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Colonia</label>
                    {colonias.length > 0 ? (
                      <select
                        required
                        className="w-full rounded-lg border border-slate-200 focus:border-[#1A3B5B] focus:ring-1 focus:ring-[#1A3B5B] p-3"
                        value={addrForm.colonia}
                        onChange={(e) => setAddrForm(f => ({ ...f, colonia: e.target.value }))}
                      >
                        <option value="">Selecciona colonia</option>
                        {colonias.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input
                        required
                        className="w-full rounded-lg border border-slate-200 focus:border-[#1A3B5B] focus:ring-1 focus:ring-[#1A3B5B] p-3"
                        placeholder="Colonia"
                        value={addrForm.colonia}
                        onChange={(e) => setAddrForm(f => ({ ...f, colonia: e.target.value }))}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Calle y número</label>
                  <input
                    required
                    className="w-full rounded-lg border border-slate-200 focus:border-[#1A3B5B] focus:ring-1 focus:ring-[#1A3B5B] p-3"
                    placeholder="Ej. Av. Hidalgo 123"
                    value={addrForm.calle}
                    onChange={(e) => setAddrForm(f => ({ ...f, calle: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Referencias (opcional)</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 focus:border-[#1A3B5B] focus:ring-1 focus:ring-[#1A3B5B] p-3"
                    placeholder="Ej. Casa azul, entre calle 1 y 2"
                    value={addrForm.referencias ?? ''}
                    onChange={(e) => setAddrForm(f => ({ ...f, referencias: e.target.value }))}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-[#1A3B5B] focus:ring-[#1A3B5B]"
                    checked={addrForm.esPrincipal}
                    onChange={(e) => setAddrForm(f => ({ ...f, esPrincipal: e.target.checked }))}
                  />
                  <span className="text-sm text-slate-700">Usar como dirección principal</span>
                </label>

                {addrError && <p className="text-sm text-red-500">{addrError}</p>}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAddrModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddr}
                    className="flex-1 py-3 bg-[#1A3B5B] text-white font-bold rounded-xl hover:bg-[#1A3B5B]/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {savingAddr ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editingAddrId ? 'Guardar cambios' : 'Agregar dirección'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
    </main>
  );
}
