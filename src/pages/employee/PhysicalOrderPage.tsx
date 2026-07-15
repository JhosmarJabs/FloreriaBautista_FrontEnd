import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  ShoppingBasket,
  PlusCircle,
  Trash2,
  Truck,
  Calendar,
  CreditCard,
  Save,
  Image as ImageIcon,
  Edit3,
  Plus,
  Minus,
  MapPin,
  Clock,
  Search,
  Loader2,
  Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn } from '../../components/Animations';
import { AdminService } from '../../services/adminService';
import { lookupCp } from '../../services/sepomexService';
import { useToast } from '../../hooks/useToast';

export default function PhysicalOrderPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<{ id: number; productId: string; name: string; quantity: number; price: number; image?: string }[]>([]);
  // Se incrementa en cada reset para forzar un remount limpio de la tabla:
  // evita que AnimatePresence deje un renglón "fantasma" a medio animar
  // cuando el formulario completo se resetea justo tras agregar un producto.
  const [itemsListKey, setItemsListKey] = useState(0);

  // Metodo de entrega: envio a domicilio o recoleccion en sucursal
  const [deliveryMethod, setDeliveryMethod] = useState<'ENVIO' | 'SUCURSAL'>('ENVIO');

  // Direccion de entrega (calle y numero manuales; el resto se autocompleta por CP)
  const [direccion, setDireccion] = useState({
    calle: '',
    numero: '',
    cp: '',
    colonia: '',
    municipio: '',
    estado: '',
  });
  const [coloniasCp, setColoniasCp] = useState<string[]>([]);
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError, setCpError] = useState<string | null>(null);

  const handleCpChange = async (cp: string) => {
    const clean = cp.replace(/\D/g, '').slice(0, 5);
    setDireccion(prev => ({ ...prev, cp: clean }));

    // Reiniciar dependientes mientras el CP no este completo
    if (clean.length < 5) {
      setColoniasCp([]);
      setCpError(null);
      setDireccion(prev => ({ ...prev, municipio: '', estado: '', colonia: '' }));
      return;
    }

    setCpLoading(true);
    setCpError(null);
    try {
      const info = await lookupCp(clean);
      if (!info) {
        setColoniasCp([]);
        setDireccion(prev => ({ ...prev, municipio: '', estado: '', colonia: '' }));
        setCpError('Código postal no encontrado');
        return;
      }
      setColoniasCp(info.colonias);
      setDireccion(prev => ({
        ...prev,
        municipio: info.municipio,
        estado: info.estado,
        // Si solo hay una colonia, seleccionarla automaticamente
        colonia: info.colonias.length === 1 ? info.colonias[0] : '',
      }));
    } catch {
      setCpError('Error al consultar el código postal');
    } finally {
      setCpLoading(false);
    }
  };

  // Datos del cliente
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefono, setTelefono] = useState('');

  // Tipo de pedido: se paga y entrega ahora mismo, o se entrega despues (con posible anticipo)
  const [tipoPedido, setTipoPedido] = useState<'INSTANTANEO' | 'ANTICIPADO'>('INSTANTANEO');

  const todayIso = () => new Date().toISOString().slice(0, 10);
  const [fechaEntrega, setFechaEntrega] = useState(todayIso());
  const [horaEntrega, setHoraEntrega] = useState('09:00:00');
  const [notaExtra, setNotaExtra] = useState('');

  // Pago: metodo y monto cobrado al registrar (puede ser menor al total = anticipo)
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [montoPagado, setMontoPagado] = useState('');
  const [montoTouched, setMontoTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // La direccion es obligatoria si se envia a domicilio, o si el pedido es
  // anticipado (el backend exige direccion para cualquier ANTICIPADO).
  const needsDireccion = deliveryMethod === 'ENVIO' || tipoPedido === 'ANTICIPADO';

  // Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (showProductModal) {
      loadProducts();
    }
  }, [showProductModal]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await AdminService.getEmployeeProducts({ size: 500 });
      setProducts(response.data.items || []);
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('Error al cargar productos', 'error');
    } finally {
      setLoadingProducts(false);
    }
  };

  const addProductToOrder = (product: any) => {
    const newItem = {
      id: Date.now(),
      productId: product.id,
      name: product.nombre || product.name,
      quantity: 1,
      price: product.precioBase || product.precio || product.price || 0,
      image: product.imagenUrl || product.imagen || undefined
    };

    setItems(prev => [...prev, newItem]);
    showToast('Producto agregado al pedido', 'success');
    setShowProductModal(false);
    setSearchTerm('');
  };

  const filteredProducts = products.filter(p =>
    (p.nombre || p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateQuantity = (id: number, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = deliveryMethod === 'ENVIO' ? 120 : 0;
  const total = subtotal + shipping;

  // El monto a cobrar sigue al total mientras el empleado no lo edite a mano
  // (para dejar un anticipo, basta con escribir un monto menor).
  useEffect(() => {
    if (!montoTouched) {
      setMontoPagado(total > 0 ? total.toFixed(2) : '');
    }
  }, [total, montoTouched]);

  const resetForm = () => {
    setItems([]);
    setNombreCliente('');
    setTelefono('');
    setTipoPedido('INSTANTANEO');
    setFechaEntrega(todayIso());
    setHoraEntrega('09:00:00');
    setNotaExtra('');
    setDeliveryMethod('ENVIO');
    setDireccion({ calle: '', numero: '', cp: '', colonia: '', municipio: '', estado: '' });
    setColoniasCp([]);
    setCpError(null);
    setMetodoPago('EFECTIVO');
    setMontoPagado('');
    setMontoTouched(false);
    setItemsListKey(k => k + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast('Agrega al menos un producto al pedido', 'error');
      return;
    }
    if (!nombreCliente.trim()) {
      showToast('Ingresa el nombre del cliente', 'error');
      return;
    }
    if (!fechaEntrega) {
      showToast('Selecciona la fecha de entrega', 'error');
      return;
    }
    if (needsDireccion && (!direccion.calle.trim() || !direccion.colonia.trim() || !direccion.municipio.trim() || !direccion.estado.trim())) {
      showToast('Completa la dirección de entrega', 'error');
      return;
    }

    const montoNum = montoPagado ? parseFloat(montoPagado) : 0;
    if (montoNum > 0 && !metodoPago) {
      showToast('Selecciona el método de pago', 'error');
      return;
    }
    if (montoNum > total) {
      showToast('El monto cobrado no puede ser mayor al total de la orden', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nombreCliente: nombreCliente.trim(),
        telefono: telefono.trim() || undefined,
        fechaEntrega,
        horaEntrega,
        tipoPedido,
        notas: notaExtra.trim() || undefined,
        direccion: needsDireccion ? {
          calle: [direccion.calle, direccion.numero].filter(Boolean).join(' '),
          colonia: direccion.colonia,
          municipio: direccion.municipio,
          estado: direccion.estado,
          cp: direccion.cp || undefined,
          referencias: notaExtra.trim() || undefined,
        } : undefined,
        items: items.map(item => ({ productId: item.productId, cantidad: item.quantity })),
        montoPagado: montoNum > 0 ? montoNum : undefined,
        metodoPago: montoNum > 0 ? metodoPago : undefined,
        costoEnvio: deliveryMethod === 'ENVIO' ? shipping : undefined,
      };

      const response = await AdminService.createPhysicalOrder(payload);
      const folio = response.data.id.slice(0, 8).toUpperCase();
      showToast(`Pedido registrado correctamente (folio ${folio})`, 'success');
      resetForm();
    } catch (error) {
      console.error('Error creating physical order:', error);
      showToast('Error al registrar el pedido', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const cardCls = "bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all";
  const labelCls = "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5";
  const inputCls = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all";

  return (
    <motion.main 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1280px] mx-auto"
    >
      {/* Header Section */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-8 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Nueva Operación</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Registro de Pedido Físico</h1>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 font-medium">Captura manual para ventas directas o telefónicas.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={resetForm} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
              Limpiar Formulario
            </button>
          </div>
        </div>
      </FadeIn>

      <form className="grid grid-cols-1 lg:grid-cols-12 gap-6" onSubmit={handleSubmit}>
        {/* Left Column (Customer & Items) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Information Card */}
          <div className={cardCls}>
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-6 pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <User className="w-5 h-5" />
              <h2 className="font-black text-lg text-slate-800 dark:text-white tracking-tight">Datos del Cliente</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Nombre Completo</label>
                <input
                  className={inputCls}
                  placeholder="Ej. Juan Pérez"
                  type="text"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Teléfono / WhatsApp</label>
                <input
                  className={inputCls}
                  placeholder="Ej. 55 1234 5678"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Order Items Card */}
          <div className={cardCls}>
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                <ShoppingBasket className="w-5 h-5" />
                <h2 className="font-black text-lg text-slate-800 dark:text-white tracking-tight">Selección de Productos</h2>
              </div>
              <button onClick={() => setShowProductModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all" type="button">
                <PlusCircle className="w-4 h-4" />
                AÑADIR ÍTEM
              </button>
            </div>
            <div className="overflow-x-auto min-h-[200px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                    <th className="py-4 pr-4">Descripción del Producto</th>
                    <th className="py-4 px-4 text-center">Cant.</th>
                    <th className="py-4 px-4 text-right">Subtotal</th>
                    <th className="py-4 px-4 text-center">Gestión</th>
                    <th className="py-4 pl-4"></th>
                  </tr>
                </thead>
                <tbody key={itemsListKey} className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  <AnimatePresence>
                    {items.map(item => (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 overflow-hidden">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-6 h-6" />
                              )}
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800 dark:text-white">{item.name}</p>
                                <p className="text-xs text-slate-400 font-medium">Precio unit: ${item.price}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-500 transition-colors" type="button"><Minus size={14} /></button>
                            <span className="text-sm font-black text-slate-700 dark:text-white w-4 text-center leading-none">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-500 transition-colors" type="button"><Plus size={14} /></button>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                            <span className="text-sm font-black text-slate-900 dark:text-white leading-none">${(item.price * item.quantity).toFixed(2)}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition-colors" type="button">
                            <Edit3 className="w-3.5 h-3.5" />
                            Personalizar
                          </button>
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors" type="button">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {items.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-full mb-4">
                        <ShoppingBasket size={48} className="opacity-20" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest leading-none">Sin productos</p>
                </div>
            )}
          </div>
        </div>

        {/* Right Column (Logistics & Sumary) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Delivery Details Card */}
          <div className={cardCls}>
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-6 pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <Truck className="w-5 h-5" />
              <h2 className="font-black text-lg text-slate-800 dark:text-white tracking-tight">Logística de Entrega</h2>
            </div>

            {/* Tipo de pedido: se paga y entrega ahora, o se entrega despues */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                type="button"
                onClick={() => { setTipoPedido('INSTANTANEO'); setFechaEntrega(todayIso()); }}
                className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all ${
                  tipoPedido === 'INSTANTANEO'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Clock className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Venta Inmediata</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoPedido('ANTICIPADO')}
                className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all ${
                  tipoPedido === 'ANTICIPADO'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Calendar className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Pedido con Anticipo</span>
              </button>
            </div>

            {/* Metodo de entrega: una columna por opcion */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setDeliveryMethod('ENVIO')}
                className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all ${
                  deliveryMethod === 'ENVIO'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Truck className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Enviar a Domicilio</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod('SUCURSAL')}
                className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all ${
                  deliveryMethod === 'SUCURSAL'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Store className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Recoger en Sucursal</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className={labelCls}>Fecha de Entrega</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className={`${inputCls} pl-10`}
                    type="date"
                    value={fechaEntrega}
                    min={tipoPedido === 'INSTANTANEO' ? undefined : todayIso()}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Bloque Horario</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    className={`${inputCls} pl-10 appearance-none`}
                    value={horaEntrega}
                    onChange={(e) => setHoraEntrega(e.target.value)}
                  >
                    <option value="09:00:00">Mañana (9:00 - 13:00)</option>
                    <option value="13:00:00">Tarde (13:00 - 18:00)</option>
                    <option value="18:00:00">Noche (18:00 - 21:00)</option>
                  </select>
                </div>
              </div>
            </div>
            {tipoPedido === 'ANTICIPADO' && deliveryMethod === 'SUCURSAL' && (
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 -mt-4 mb-4">
                Los pedidos con anticipo requieren una dirección de referencia aunque el cliente recoja en sucursal.
              </p>
            )}
            <div className="space-y-4">
              {needsDireccion ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Dirección Destino</span>
                  </div>
                  <div className="grid grid-cols-6 gap-4">
                    {/* C.P. — dispara el autocompletado */}
                    <div className="col-span-3">
                      <label className={labelCls}>C.P.</label>
                      <div className="relative">
                        <input
                          className={inputCls}
                          placeholder="Ej. 72000"
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          value={direccion.cp}
                          onChange={(e) => handleCpChange(e.target.value)}
                        />
                        {cpLoading && (
                          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
                        )}
                      </div>
                      {cpError && <p className="text-[10px] text-rose-500 font-bold mt-1">{cpError}</p>}
                    </div>
                    {/* Colonia — selector poblado por el CP */}
                    <div className="col-span-3">
                      <label className={labelCls}>Colonia</label>
                      {coloniasCp.length > 0 ? (
                        <select
                          className={`${inputCls} appearance-none`}
                          value={direccion.colonia}
                          onChange={(e) => setDireccion(prev => ({ ...prev, colonia: e.target.value }))}
                        >
                          <option value="">Selecciona…</option>
                          {coloniasCp.map((col) => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className={inputCls}
                          placeholder="Colonia"
                          type="text"
                          value={direccion.colonia}
                          onChange={(e) => setDireccion(prev => ({ ...prev, colonia: e.target.value }))}
                        />
                      )}
                    </div>
                    {/* Municipio — autocompletado (solo lectura) */}
                    <div className="col-span-3">
                      <label className={labelCls}>Municipio</label>
                      <input
                        className={`${inputCls} bg-slate-100 dark:bg-slate-800 cursor-not-allowed`}
                        placeholder="Automático por C.P."
                        type="text"
                        value={direccion.municipio}
                        readOnly
                      />
                    </div>
                    {/* Estado — autocompletado (solo lectura) */}
                    <div className="col-span-3">
                      <label className={labelCls}>Estado</label>
                      <input
                        className={`${inputCls} bg-slate-100 dark:bg-slate-800 cursor-not-allowed`}
                        placeholder="Automático por C.P."
                        type="text"
                        value={direccion.estado}
                        readOnly
                      />
                    </div>
                    {/* Calle — manual */}
                    <div className="col-span-4">
                      <label className={labelCls}>Calle</label>
                      <input
                        className={inputCls}
                        placeholder="Ej. Av. Reforma"
                        type="text"
                        value={direccion.calle}
                        onChange={(e) => setDireccion(prev => ({ ...prev, calle: e.target.value }))}
                      />
                    </div>
                    {/* Numero — manual y opcional */}
                    <div className="col-span-2">
                      <label className={labelCls}>Número <span className="text-slate-300 dark:text-slate-600 normal-case">(opcional)</span></label>
                      <input
                        className={inputCls}
                        placeholder="Ej. 123"
                        type="text"
                        value={direccion.numero}
                        onChange={(e) => setDireccion(prev => ({ ...prev, numero: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">El cliente recogerá el pedido directamente en la sucursal.</p>
                </div>
              )}
              <div>
                <label className={labelCls}>
                  {deliveryMethod === 'ENVIO' ? 'Referencias del Domicilio' : 'Agregar Nota'}
                </label>
                <input
                  className={inputCls}
                  placeholder={deliveryMethod === 'ENVIO' ? 'Ej: Portón verde, entre calle X y Y' : 'Ej: Recoge a nombre de Juan, después de las 5 PM'}
                  type="text"
                  value={notaExtra}
                  onChange={(e) => setNotaExtra(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment Summary Card */}
          <div className={cardCls}>
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-6 pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <CreditCard className="w-5 h-5" />
              <h2 className="font-black text-lg text-slate-800 dark:text-white tracking-tight">Finanzas & Pago</h2>
            </div>
            <div className="space-y-4 mb-6 pt-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-400 uppercase tracking-widest text-[10px] font-black">Subtotal Productos</span>
                <span className="text-slate-900 dark:text-white font-black">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-400 uppercase tracking-widest text-[10px] font-black">Costo de Envío</span>
                <span className="text-slate-900 dark:text-white font-black">${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 uppercase tracking-widest text-[10px] font-black">Total de la Orden</span>
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter leading-none">${total.toFixed(2)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Canal de Pago</label>
                <select
                  className={`${inputCls} appearance-none`}
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Terminal (Tarjeta)</option>
                  <option value="TRANSFERENCIA">Transferencia SPEI</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>
                  {parseFloat(montoPagado || '0') < total ? 'Anticipo a Cobrar' : 'Liquidación'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">$</span>
                  <input
                    className={`${inputCls} pl-8 font-black text-emerald-600`}
                    type="number"
                    min={0}
                    max={total}
                    step="0.01"
                    value={montoPagado}
                    onChange={(e) => { setMontoPagado(e.target.value); setMontoTouched(true); }}
                  />
                </div>
                {parseFloat(montoPagado || '0') < total && (
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                    Saldo pendiente: ${(total - parseFloat(montoPagado || '0')).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <button
              className="w-full mt-8 bg-emerald-600 dark:bg-emerald-500 text-white py-5 px-4 rounded-2xl font-black text-xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-tighter disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              type="submit"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              {submitting ? 'Registrando…' : 'Confirmar Operación'}
            </button>
          </div>
        </div>
      </form>

      {/* Modal Agregar Producto (portal a document.body para cubrir toda la pantalla) */}
      {createPortal(
      <AnimatePresence>
        {showProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProductModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/5 w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-white">Seleccionar Producto</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Elige un producto para agregar a tu pedido</p>
                </div>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-slate-100 dark:border-white/5">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Products List */}
              <div className="flex-1 overflow-y-auto">
                {loadingProducts ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                      <p className="text-slate-500">Cargando productos...</p>
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500">No se encontraron productos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6">
                    {filteredProducts.map((product) => (
                      <motion.button
                        key={product.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addProductToOrder(product)}
                        className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all text-left group"
                      >
                        <div className="w-full h-24 bg-slate-100 dark:bg-slate-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {(product.imagenUrl || product.imagen) ? (
                            <img
                              src={product.imagenUrl || product.imagen}
                              alt={product.nombre || product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingBasket className="w-8 h-8 text-slate-400" />
                          )}
                        </div>
                        <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                          {product.nombre || product.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {product.descripcion || product.description || 'Sin descripción'}
                        </p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-2">
                          ${(product.precioBase || product.precio || product.price || 0).toFixed(2)}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </motion.main>
  );
}
