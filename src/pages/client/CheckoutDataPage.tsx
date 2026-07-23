import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  ChevronRight, 
  PlusCircle, 
  Zap, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  ShoppingBasket,
  ShieldCheck,
  CheckCircle,
  MessageSquareHeart,
  X,
  Loader2
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { calcularEnvio } from '../../utils/envio';
import { saveDraft, getDraft } from '../../utils/checkout';
import { AdminService } from '../../services/adminService';
import { lookupCp } from '../../services/sepomexService';

export default function CheckoutDataPage() {
  const navigate = useNavigate();
  const { cart, cartTotal } = useCart();
  const [address, setAddress] = useState('casa');
  const [orderType, setOrderType] = useState<'instantaneo' | 'anticipado'>('instantaneo');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('');
  const [wantsDedicatoria, setWantsDedicatoria] = useState(false);
  const [dedicatoria, setDedicatoria] = useState('');
  const [shipping, setShipping] = useState<{ costo: number; etiqueta: string; gratis: boolean; zona: string }>({
    costo: 0, etiqueta: 'Por confirmar', gratis: true, zona: 'desconocida',
  });

  const today = new Date().toISOString().split('T')[0];

  const timeSlots = [
    { label: '09:00 AM - 12:00 PM', startHour: 9 },
    { label: '12:00 PM - 03:00 PM', startHour: 12 },
    { label: '03:00 PM - 06:00 PM', startHour: 15 },
    { label: '06:00 PM - 09:00 PM', startHour: 18 },
  ];

  const getAvailableSlots = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const minHour = currentHour + 4;

    if (deliveryDate === today) {
      return timeSlots.filter(slot => slot.startHour >= minHour);
    }
    return timeSlots;
  };

  const availableSlots = getAvailableSlots();

  useEffect(() => {
    if (orderType === 'instantaneo') {
      setDeliveryDate(today);
    }
  }, [orderType, today]);

  // Las direcciones se cargan desde la BD del usuario (mismas de /configuracion).
  type SavedAddr = {
    id: string; label: string; address: string; cp: string;
    calle: string; colonia: string; municipio: string; estado: string; referencias: string;
  };
  const [savedAddresses, setSavedAddresses] = useState<SavedAddr[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const mapAddress = (a: {
    id: string; etiqueta?: string | null; calle: string; colonia: string;
    municipio: string; estado: string; cp?: string | null; referencias?: string | null; esPrincipal: boolean;
  }): SavedAddr => ({
    id: a.id,
    label: a.etiqueta || 'Dirección',
    address: `${a.calle}, Col. ${a.colonia}, ${a.municipio}, ${a.estado}${a.cp ? `. CP ${a.cp}` : ''}`,
    cp: a.cp || '',
    calle: a.calle,
    colonia: a.colonia,
    municipio: a.municipio,
    estado: a.estado,
    referencias: a.referencias || '',
  });

  const cargarDirecciones = async (seleccionarId?: string) => {
    try {
      const data = await AdminService.getMyAddresses();
      const mapped = data.map(mapAddress);
      setSavedAddresses(mapped);
      // Selecciona la indicada, o la principal, o la primera.
      const principal = data.find(a => a.esPrincipal);
      setAddress(seleccionarId || principal?.id || mapped[0]?.id || '');
    } catch {
      setSavedAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    cargarDirecciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    colony: '',
    city: 'Monterrey',
    zip: ''
  });
  const [savingNewAddress, setSavingNewAddress] = useState(false);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNewAddress(true);
    try {
      // Deriva estado/municipio del CP (si existe en SEPOMEX) para guardar completo.
      const info = await lookupCp(newAddress.zip);
      const creada = await AdminService.createMyAddress({
        etiqueta: newAddress.label || 'Nueva Dirección',
        calle: newAddress.street,
        colonia: newAddress.colony,
        municipio: info?.municipio || newAddress.city,
        estado: info?.estado || '',
        cp: newAddress.zip,
        referencias: '',
        esPrincipal: false,
      });
      setShowAddressModal(false);
      setNewAddress({ label: '', street: '', colony: '', city: 'Monterrey', zip: '' });
      await cargarDirecciones(creada.id);
    } catch {
      // Si falla el guardado, se cierra el modal sin agregar.
      setShowAddressModal(false);
    } finally {
      setSavingNewAddress(false);
    }
  };

  const selectedAddress = savedAddresses.find(a => a.id === address) || savedAddresses[0];

  // Recalcula el costo de envío cada vez que cambia la dirección seleccionada.
  useEffect(() => {
    let cancelado = false;
    calcularEnvio(selectedAddress?.cp || '').then(res => {
      if (!cancelado) setShipping({ costo: res.costo, etiqueta: res.etiqueta, gratis: res.gratis, zona: res.zona });
    });
    return () => { cancelado = true; };
  }, [selectedAddress?.cp]);

  // Mantiene un horario válido seleccionado cuando cambian las opciones disponibles.
  useEffect(() => {
    if (orderType === 'anticipado' && availableSlots.length > 0) {
      const sigueValido = availableSlots.some(s => s.label === timeSlot);
      if (!sigueValido) setTimeSlot(availableSlots[0].label);
    }
  }, [orderType, deliveryDate, availableSlots.length]);

  // Restaura la dedicatoria si el cliente vuelve desde Revisión a editar.
  useEffect(() => {
    const draft = getDraft();
    if (draft?.dedicatoria) {
      setWantsDedicatoria(true);
      setDedicatoria(draft.dedicatoria);
    }
  }, []);

  const total = cartTotal + shipping.costo;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-32 min-h-screen font-display bg-[#f0f7ff]">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm mb-8 text-slate-500">
        <Link to="/carrito" className="hover:text-[#004A99] transition-colors">Carrito</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#004A99] font-semibold">Datos de Pedido</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-400">Confirmación</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Checkout Form */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#004A99]/10 rounded-lg">
                <MapPin className="w-6 h-6 text-[#004A99]" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Dirección de Entrega</h2>
            </div>
            
            {loadingAddresses ? (
              <div className="flex items-center justify-center py-8 mb-6">
                <Loader2 className="w-6 h-6 text-[#004A99] animate-spin" />
              </div>
            ) : savedAddresses.length === 0 ? (
              <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-sm text-slate-500">
                No tienes direcciones guardadas. Agrega una para continuar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {savedAddresses.map((addr) => (
                  <label key={addr.id} className="relative group cursor-pointer">
                    <input
                      type="radio"
                      name="address"
                      className="peer sr-only"
                      checked={address === addr.id}
                      onChange={() => setAddress(addr.id)}
                    />
                    <div className="p-4 h-full rounded-xl border-2 border-slate-100 bg-slate-50 peer-checked:border-[#004A99] peer-checked:bg-[#004A99]/5 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-900">{addr.label}</span>
                        <CheckCircle className="w-5 h-5 text-[#004A99] opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-slate-600">{addr.address}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            
            <button 
              onClick={() => setShowAddressModal(true)}
              className="flex items-center gap-2 text-[#004A99] font-semibold hover:gap-3 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Añadir nueva dirección
            </button>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#004A99]/10 rounded-lg">
                <Zap className="w-6 h-6 text-[#004A99]" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Tipo de Pedido</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="relative cursor-pointer">
                <input 
                  type="radio" 
                  name="order_type" 
                  className="peer sr-only" 
                  checked={orderType === 'instantaneo'} 
                  onChange={() => setOrderType('instantaneo')}
                />
                <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-slate-100 rounded-xl peer-checked:border-[#004A99] peer-checked:bg-[#004A99]/5 transition-all">
                  <Zap className={`w-8 h-8 mb-2 transition-colors ${orderType === 'instantaneo' ? 'text-[#004A99]' : 'text-slate-400'}`} />
                  <span className="font-bold text-lg text-slate-900">INSTANTÁNEO</span>
                  <span className="text-sm text-slate-500">Entrega hoy mismo</span>
                </div>
              </label>
              
              <label className="relative cursor-pointer">
                <input 
                  type="radio" 
                  name="order_type" 
                  className="peer sr-only" 
                  checked={orderType === 'anticipado'} 
                  onChange={() => setOrderType('anticipado')}
                />
                <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-slate-100 rounded-xl peer-checked:border-[#004A99] peer-checked:bg-[#004A99]/5 transition-all">
                  <Calendar className={`w-8 h-8 mb-2 transition-colors ${orderType === 'anticipado' ? 'text-[#004A99]' : 'text-slate-400'}`} />
                  <span className="font-bold text-lg text-slate-900">ANTICIPADO</span>
                  <span className="text-sm text-slate-500">Programar para después</span>
                </div>
              </label>
            </div>
          </section>

          {/* El módulo de Fecha y Hora solo aplica para pedidos anticipados.
              Los instantáneos se entregan el mismo día, así que se oculta. */}
          {orderType === 'anticipado' && (
          <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#004A99]/10 rounded-lg">
                <Clock className="w-6 h-6 text-[#004A99]" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Fecha y Hora</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4" />
                  Seleccionar Fecha
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border-slate-200 focus:border-[#004A99] focus:ring-[#004A99] p-3"
                    type="date"
                    value={deliveryDate}
                    min={today}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Selecciona una fecha futura para tu entrega.
                </p>
              </div>

              {orderType === 'anticipado' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                    <Clock className="w-4 h-4" />
                    Rango de Entrega
                  </label>
                  <select
                    className="w-full rounded-lg border-slate-200 focus:border-[#004A99] focus:ring-[#004A99] p-3"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                  >
                    {availableSlots.length > 0 ? (
                      availableSlots.map((slot) => (
                        <option key={slot.label}>{slot.label}</option>
                      ))
                    ) : (
                      <option disabled>No hay horarios disponibles para hoy</option>
                    )}
                  </select>
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    {availableSlots.length > 0 ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Horario disponible
                      </>
                    ) : (
                      <span className="text-red-500">Por favor selecciona otra fecha</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
          )}

          {/* Dedicatoria (opcional): el módulo de texto solo se abre si el cliente lo activa. */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#004A99]/10 rounded-lg">
                  <MessageSquareHeart className="w-6 h-6 text-[#004A99]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Dedicatoria</h2>
                  <p className="text-sm text-slate-500">¿Quieres incluir un mensaje personalizado con tu pedido?</p>
                </div>
              </div>
              {/* Interruptor de encendido/apagado */}
              <button
                type="button"
                role="switch"
                aria-checked={wantsDedicatoria}
                onClick={() => setWantsDedicatoria(v => !v)}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${wantsDedicatoria ? 'bg-[#004A99]' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${wantsDedicatoria ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {wantsDedicatoria && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="pt-5 space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Tu mensaje</label>
                    <textarea
                      value={dedicatoria}
                      onChange={(e) => setDedicatoria(e.target.value)}
                      maxLength={250}
                      rows={4}
                      placeholder="Escribe aquí tu dedicatoria... Ej. Para la persona que ilumina mis días. ¡Feliz aniversario!"
                      className="w-full rounded-lg border-slate-200 focus:border-[#004A99] focus:ring-[#004A99] p-3 resize-none"
                    />
                    <p className="text-xs text-slate-400 text-right">{dedicatoria.length}/250 caracteres</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <button 
              onClick={() => navigate('/carrito')}
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al carrito
            </button>
            <button
              onClick={() => {
                // Persistimos TODO el borrador para que Revisión y Éxito muestren
                // exactamente lo mismo: dirección, tipo de pedido, fecha/horario,
                // dedicatoria y costo de envío ya calculado.
                const mensaje = wantsDedicatoria ? dedicatoria.trim() : '';
                saveDraft({
                  address: {
                    label: selectedAddress?.label || '',
                    fullAddress: selectedAddress?.address || '',
                    cp: selectedAddress?.cp || '',
                    calle: selectedAddress?.calle || '',
                    colonia: selectedAddress?.colonia || '',
                    municipio: selectedAddress?.municipio || '',
                    estado: selectedAddress?.estado || '',
                    referencias: selectedAddress?.referencias || '',
                  },
                  orderType,
                  deliveryDate: orderType === 'instantaneo' ? today : deliveryDate,
                  timeSlot: orderType === 'anticipado' ? timeSlot : '',
                  dedicatoria: mensaje,
                  shippingCost: shipping.costo,
                  shippingZona: shipping.zona as any,
                });
                navigate('/checkout/revision');
              }}
              disabled={!selectedAddress || cart.length === 0}
              className="w-full sm:w-auto px-12 py-3 rounded-xl bg-[#004A99] text-white font-bold hover:shadow-lg hover:shadow-[#004A99]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar a revisión
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Column: Cart Summary (Sticky) */}
        <aside className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
              <ShoppingBasket className="w-5 h-5 text-[#004A99]" />
              Resumen de Compra
            </h3>
            
            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto no-scrollbar">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-16 w-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {item.image ? (
                        <img
                          alt={item.name}
                          className="h-full w-full object-cover"
                          src={item.image}
                        />
                      ) : (
                        <ShoppingBasket className="w-7 h-7 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">Cantidad: {item.quantity}</p>
                      <p className="text-sm font-bold text-[#004A99]">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-4">Tu carrito está vacío</p>
              )}
            </div>
            
            <div className="border-t border-dashed border-slate-200 pt-4 space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>
                  Envío
                  <span className="block text-[11px] text-slate-400">{shipping.etiqueta}</span>
                </span>
                {shipping.gratis ? (
                  <span className="text-green-600 font-medium">¡Gratis!</span>
                ) : (
                  <span className="font-medium">${shipping.costo.toFixed(2)}</span>
                )}
              </div>
              <div className="flex justify-between text-xl font-black text-slate-900 pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#004A99]/10 rounded-xl p-4 flex gap-3">
            <ShieldCheck className="w-6 h-6 text-[#004A99] flex-shrink-0" />
            <p className="text-xs text-slate-600">
              <span className="font-bold block text-slate-900">Compra Segura</span>
              Tus datos están protegidos con encriptación SSL de grado bancario.
            </p>
          </div>
        </aside>
      </div>

      {/* Floating Address Modal */}
      {showAddressModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="text-[#004A99]" />
                  Nueva Dirección
                </h3>
                <button 
                  onClick={() => setShowAddressModal(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              
              <form onSubmit={handleAddAddress} className="p-8 space-y-6">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Etiqueta (Ej. Oficina, Casa Mamá)</label>
                  <input 
                    required
                    className="w-full rounded-xl border-slate-200 focus:border-[#004A99] focus:ring-[#004A99] p-3" 
                    placeholder="Nombre para esta dirección" 
                    type="text"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Calle y Número</label>
                    <input 
                      required
                      className="w-full rounded-xl border-slate-200 focus:border-[#004A99] focus:ring-[#004A99] p-3" 
                      placeholder="Ej. Calle 10 #123" 
                      type="text"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Colonia</label>
                    <input 
                      required
                      className="w-full rounded-xl border-slate-200 focus:border-[#004A99] focus:ring-[#004A99] p-3" 
                      placeholder="Ej. Centro" 
                      type="text"
                      value={newAddress.colony}
                      onChange={(e) => setNewAddress({...newAddress, colony: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Ciudad</label>
                    <input 
                      required
                      className="w-full rounded-xl border-slate-200 focus:border-[#004A99] focus:ring-[#004A99] p-3" 
                      placeholder="Monterrey" 
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Código Postal</label>
                    <input 
                      required
                      className="w-full rounded-xl border-slate-200 focus:border-[#004A99] focus:ring-[#004A99] p-3" 
                      placeholder="64000" 
                      type="text"
                      value={newAddress.zip}
                      onChange={(e) => setNewAddress({...newAddress, zip: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={savingNewAddress}
                    className="w-full py-4 bg-[#004A99] text-white font-black rounded-2xl hover:shadow-xl hover:shadow-[#004A99]/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {savingNewAddress && <Loader2 className="w-5 h-5 animate-spin" />}
                    Guardar Dirección
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
    </main>
  );
}

