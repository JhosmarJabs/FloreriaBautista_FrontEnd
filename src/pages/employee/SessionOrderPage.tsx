import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag, Search, Package, Plus, Minus, Trash2,
  QrCode, CreditCard, Banknote, Smartphone, CheckCircle2,
  ChevronRight, X, Loader2, User, AlertCircle
} from 'lucide-react';
import { FadeIn } from '../../components/Animations';

/* ── Tipos ──────────────────────────────────────────────── */
type ProductoCart = { id: string; nombre: string; precio: number; cantidad: number; tipo: string };
type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';

const METODOS: { key: MetodoPago; label: string; icon: React.FC<any> }[] = [
  { key: 'EFECTIVO',      label: 'Efectivo',      icon: Banknote },
  { key: 'TARJETA',       label: 'Tarjeta',        icon: CreditCard },
  { key: 'TRANSFERENCIA', label: 'Transferencia',  icon: Smartphone },
];

/* ── Productos mock de búsqueda ──────────────────────────── */
const PRODUCTOS_MOCK = [
  { id: 'p1', nombre: 'Ramo de 12 Rosas Rojas',       precio: 450, tipo: 'RAMO' },
  { id: 'p2', nombre: 'Arreglo en Florero Primaveral', precio: 650, tipo: 'ARREGLO_FLORAL' },
  { id: 'p3', nombre: 'Florero Decorativo',             precio: 180, tipo: 'FLORERO' },
  { id: 'p4', nombre: 'Ramo Primaveral Mixto',          precio: 320, tipo: 'RAMO' },
  { id: 'p5', nombre: 'Caja de Chocolate y Rosas',      precio: 780, tipo: 'COMBO' },
];

/* ── Info del cliente ────────────────────────────────────── */
type ClienteInfo = { nombre: string; email: string; telefono: string };

export default function SessionOrderPage() {
  const navigate = useNavigate();

  /* estado */
  const [paso, setPaso]                 = useState<1 | 2 | 3>(1);
  const [busqueda, setBusqueda]         = useState('');
  const [cart, setCart]                 = useState<ProductoCart[]>([]);
  const [cliente, setCliente]           = useState<ClienteInfo>({ nombre: '', email: '', telefono: '' });
  const [metodo, setMetodo]             = useState<MetodoPago>('EFECTIVO');
  const [efectivoCon, setEfectivoCon]   = useState('');
  const [notas, setNotas]               = useState('');
  const [procesando, setProcesando]     = useState(false);
  const [exito, setExito]               = useState(false);

  const productosFiltrados = PRODUCTOS_MOCK.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const total = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const cambio = parseFloat(efectivoCon || '0') - total;

  const addItem = (p: typeof PRODUCTOS_MOCK[0]) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      return ex
        ? prev.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i)
        : [...prev, { ...p, cantidad: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const confirmarPedido = async () => {
    setProcesando(true);
    await new Promise(r => setTimeout(r, 1800));
    setProcesando(false);
    setExito(true);
    setTimeout(() => navigate('/empleado/pedidos'), 2200);
  };

  /* ── ÉXITO ─────────────────────────────────────────────── */
  if (exito) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
        <div className="size-24 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">¡Venta Exitosa!</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Sincronizando con el historial de pedidos...</p>
        </div>
      </motion.div>
    </div>
  );

  const cardCls = "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-[2rem] shadow-sm transition-colors";
  const labelCls = "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1";
  const inputCls = "w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600";

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      {/* HEADER */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Venta por Sesión</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Nueva Transacción</h1>
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Vincular pedido a una cuenta de cliente activa.</p>
          </div>
          {/* Stepper */}
          <div className="flex items-center gap-3">
            {(['Productos', 'Cliente', 'Liquidación'] as const).map((label, i) => {
              const step = (i + 1) as 1 | 2 | 3;
              const active = paso === step;
              const done   = paso > step;
              return (
                <React.Fragment key={label}>
                  <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' :
                    done   ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                             'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600'
                  }`}>
                    <span className="flex items-center justify-center size-5 bg-white/20 rounded-lg">{step}</span>
                    <span className="hidden sm:inline">{label}</span>
                    {done && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  {i < 2 && <div className="w-4 h-0.5 bg-slate-100 dark:bg-slate-700 rounded-full" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── PANEL IZQUIERDO ── */}
        <div className="lg:col-span-8 space-y-4">
          <AnimatePresence mode="wait">

            {/* PASO 1: Productos */}
            {paso === 1 && (
              <motion.div key="paso1" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className={`${cardCls} overflow-hidden`}>
                <div className="p-6 border-b border-slate-50 dark:border-slate-700/50">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Filtrar catálogo de productos..."
                      className={inputCls + " pl-12 py-3 bg-slate-50/50 dark:bg-slate-900/50"}
                      value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                  </div>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-700/50 max-h-[500px] overflow-y-auto">
                  {productosFiltrados.map(p => (
                    <div key={p.id} className="group flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="size-12 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors">
                          <Package className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors">{p.nombre}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">{p.tipo.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">${p.precio}</span>
                        <button onClick={() => addItem(p)}
                          className="size-10 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg shadow-emerald-500/20">
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {productosFiltrados.length === 0 && (
                      <div className="py-20 text-center flex flex-col items-center gap-4">
                          <Search className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                          <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">No hay coincidencias</p>
                      </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* PASO 2: Cliente */}
            {paso === 2 && (
              <motion.div key="paso2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className={cardCls + " p-8 space-y-6"}>
                <div className="flex items-start gap-4 mb-2">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
                        <User className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Filiación de Pedido</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Asigna esta transacción a una cuenta real para historial de puntos y beneficios.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { field: 'nombre'     as const, label: 'Nombre Completo',  placeholder: 'Ej. María Pérez', type: 'text' },
                        { field: 'email'      as const, label: 'E-mail de Acceso',  placeholder: 'correo@ejemplo.com', type: 'email' },
                    ].map(({ field, label, placeholder, type }) => (
                        <div key={field}>
                            <label className={labelCls}>{label}</label>
                            <input type={type} placeholder={placeholder} value={cliente[field]}
                            onChange={e => setCliente(prev => ({ ...prev, [field]: e.target.value }))}
                            className={inputCls} />
                        </div>
                    ))}
                    <div className="md:col-span-2">
                        <label className={labelCls}>Teléfono Móvil</label>
                        <input type="tel" placeholder="+52 00 0000 0000" value={cliente.telefono}
                        onChange={e => setCliente(prev => ({ ...prev, telefono: e.target.value }))}
                        className={inputCls} />
                    </div>
                </div>
                
                <div>
                  <label className={labelCls}>Notas Internas & Instrucciones</label>
                  <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={4}
                    placeholder="Ej. Entregar en portería, mensaje de tarjeta: 'Feliz Cumpleaños'..."
                    className={inputCls + " resize-none h-32"} />
                </div>
              </motion.div>
            )}

            {/* PASO 3: Pago */}
            {paso === 3 && (
              <motion.div key="paso3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className={cardCls + " p-8 space-y-8"}>
                <div>
                   <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2">Gestión de Cobro</h3>
                   <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Selecciona el método de entrada de capital.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {METODOS.map(m => (
                    <button key={m.key} onClick={() => setMetodo(m.key)}
                      className={`group flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${
                        metodo === m.key
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-lg shadow-emerald-500/10'
                          : 'border-slate-50 dark:border-slate-700/50 text-slate-400 dark:text-slate-600 hover:border-emerald-200'
                      }`}>
                      <div className={`p-3 rounded-2xl transition-colors ${metodo === m.key ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'}`}>
                        <m.icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">{m.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-6">
                    {metodo === 'EFECTIVO' && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50">
                        <label className={labelCls}>Monto Recibido</label>
                        <div className="relative mb-4">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">$</span>
                        <input type="number" min={total} step={0.5} value={efectivoCon}
                            onChange={e => setEfectivoCon(e.target.value)}
                            className={inputCls + " pl-10 text-xl text-emerald-600"}
                            placeholder={`${total}.00`} />
                        </div>
                        <AnimatePresence>
                        {parseFloat(efectivoCon) >= total && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            className="p-4 bg-emerald-500 text-white rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-500/20">
                            <span className="text-[10px] font-black uppercase tracking-widest">Cambio al Cliente:</span>
                            <span className="text-2xl font-black tracking-tighter">${cambio.toFixed(2)}</span>
                        </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                    )}

                    {metodo === 'TRANSFERENCIA' && (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl flex items-center gap-5">
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                            <QrCode className="w-10 h-10 text-emerald-500" />
                        </div>
                        <div>
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Datos Bancarios SPEI</p>
                        <p className="text-base font-black text-slate-900 dark:text-white leading-tight">CLABE: 012 850 0123456789 01</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold">Titular: Florería Bautista SA</p>
                        </div>
                    </div>
                    )}
                </div>

                {/* Resumen final embebido */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-1"><span>Descripción</span><span>Valor</span></div>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50">
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase">Artículos Totales</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{cart.reduce((a,i) => a + i.cantidad, 0)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50">
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase">Cliente Asignado</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[150px]">{cliente.nombre || 'VENTA_GENERICA'}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navegación pasos */}
          <div className="flex items-center justify-between gap-4 mt-8">
            <button onClick={() => paso > 1 && setPaso(p => (p - 1) as 1|2|3)}
              disabled={paso === 1}
              className="px-8 py-3.5 text-xs font-black text-slate-500 uppercase tracking-widest border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[20px] hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-20 transition-all">
              ← Prev
            </button>
            {paso < 3 ? (
              <button onClick={() => { if (paso === 1 && cart.length === 0) return; setPaso(p => (p + 1) as 1|2|3); }}
                disabled={paso === 1 && cart.length === 0}
                className="px-10 py-3.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-40 shadow-xl shadow-emerald-500/20 transition-all">
                Siguiente →
              </button>
            ) : (
              <button onClick={confirmarPedido} disabled={procesando || cart.length === 0}
                className="flex items-center gap-3 px-10 py-3.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50">
                {procesando ? <><Loader2 className="w-4 h-4 animate-spin" />Transmitiendo...</> : <><CheckCircle2 className="w-4 h-4" />Finalizar Venta</>}
              </button>
            )}
          </div>
        </div>

        {/* ── PANEL DERECHO: CARRITO ── */}
        <div className="lg:col-span-4 sticky top-4">
            <div className={`${cardCls} overflow-hidden`}>
                <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between bg-white dark:bg-slate-800/80 backdrop-blur-md">
                    <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                    <ShoppingBag className="w-5 h-5 text-emerald-500" />Tu Selección
                    </span>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                    {cart.reduce((a,i) => a + i.cantidad, 0)} Items
                    </span>
                </div>
                {cart.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                    <div className="size-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-700">
                        <ShoppingBag className="w-10 h-10 text-slate-200 dark:text-slate-800" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Carrito Vacío</p>
                        <p className="text-[10px] text-slate-300 dark:text-slate-700 mt-1">Suma un producto arriba</p>
                    </div>
                    </div>
                ) : (
                    <>
                    <div className="divide-y divide-slate-50 dark:divide-slate-700/30 max-h-[400px] overflow-y-auto px-2">
                        {cart.map(item => (
                        <div key={item.id} className="px-4 py-4 flex items-center gap-4 group">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-white truncate group-hover:text-emerald-600 transition-colors uppercase leading-none mb-1">{item.nombre}</p>
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">Unit: ${item.precio}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                                <button onClick={() => updateQty(item.id, -1)} className="size-7 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center hover:text-emerald-500 transition-all shadow-sm">
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black w-6 text-center text-slate-700 dark:text-white">{item.cantidad}</span>
                                <button onClick={() => updateQty(item.id, +1)} className="size-7 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center hover:text-emerald-500 transition-all shadow-sm">
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="text-right min-w-[60px]">
                                <p className="text-sm font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">${(item.precio * item.cantidad).toFixed(0)}</p>
                                <button onClick={() => removeItem(item.id)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        ))}
                    </div>
                    <div className="p-6 bg-slate-50/50 dark:bg-emerald-500/5 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Monto Total</p>
                                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter leading-none">${total.toFixed(2)}</span>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <Smartphone className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>
                    </div>
                    </>
                )}
            </div>
            
            <div className="mt-4 p-5 bg-emerald-600/5 dark:bg-emerald-500/5 rounded-3xl border border-emerald-100/50 dark:border-emerald-500/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">Verifica los datos del cliente antes de emitir la nota de venta.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
