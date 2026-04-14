import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag, User, Search, Package, Plus, Minus, Trash2,
  QrCode, CreditCard, Banknote, Smartphone, CheckCircle2,
  ChevronRight, X, AlertCircle, Loader2,
} from 'lucide-react';
import { FadeIn, ScaleIn, AnimatedButton } from '../../components/Animations';

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
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
        <div className="size-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">¡Pedido registrado!</h2>
        <p className="text-slate-500">Redirigiendo a la lista de pedidos...</p>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <FadeIn>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">POS · Con Sesión</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">Pedido con Sesión de Cliente</h1>
            <p className="text-slate-400 text-sm mt-0.5">Registra el pedido vinculado a una cuenta existente</p>
          </div>
          {/* Stepper */}
          <div className="hidden md:flex items-center gap-2">
            {(['Productos', 'Cliente', 'Pago'] as const).map((label, i) => {
              const step = (i + 1) as 1 | 2 | 3;
              const active = paso === step;
              const done   = paso > step;
              return (
                <React.Fragment key={label}>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    active ? 'bg-blue-600 text-white shadow-sm' :
                    done   ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                             'bg-slate-100 text-slate-400'
                  }`}>
                    <span className="text-xs font-black">{step}</span>{label}
                    {done && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── PANEL IZQUIERDO (contenido dinámico por paso) ── */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">

            {/* PASO 1: Productos */}
            {paso === 1 && (
              <motion.div key="paso1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Buscar producto por nombre..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-slate-700"
                      value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {productosFiltrados.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="size-9 bg-blue-50 rounded-xl flex items-center justify-center">
                          <Package className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{p.nombre}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-medium">{p.tipo.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-900">${p.precio}</span>
                        <button onClick={() => addItem(p)}
                          className="size-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* PASO 2: Cliente */}
            {paso === 2 && (
              <motion.div key="paso2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-5">
                <div>
                  <p className="text-sm font-black text-slate-900 mb-1">Datos del cliente</p>
                  <p className="text-xs text-slate-400">Ingresa el nombre o correo del cliente para vincular el pedido a su sesión</p>
                </div>
                {[
                  { field: 'nombre'   as const, label: 'Nombre completo *',  placeholder: 'Ej. María García López', type: 'text' },
                  { field: 'email'    as const, label: 'Correo electrónico',  placeholder: 'cliente@email.com',      type: 'email' },
                  { field: 'telefono' as const, label: 'Teléfono',            placeholder: '55 1234 5678',           type: 'tel' },
                ].map(({ field, label, placeholder, type }) => (
                  <div key={field}>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
                    <input type={type} placeholder={placeholder} value={cliente[field]}
                      onChange={e => setCliente(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Notas del pedido</label>
                  <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
                    placeholder="Instrucciones especiales, dedicatoria, horario de entrega..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                </div>
              </motion.div>
            )}

            {/* PASO 3: Pago */}
            {paso === 3 && (
              <motion.div key="paso3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-5">
                <p className="text-sm font-black text-slate-900">Método de pago</p>
                <div className="grid grid-cols-3 gap-3">
                  {METODOS.map(m => (
                    <button key={m.key} onClick={() => setMetodo(m.key)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-bold transition-all ${
                        metodo === m.key
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}>
                      <m.icon className="w-5 h-5" />
                      {m.label}
                    </button>
                  ))}
                </div>
                {metodo === 'EFECTIVO' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Con cuánto paga</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input type="number" min={total} step={0.5} value={efectivoCon}
                        onChange={e => setEfectivoCon(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        placeholder={`${total}.00`} />
                    </div>
                    {parseFloat(efectivoCon) >= total && (
                      <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700">Cambio a devolver</span>
                        <span className="text-lg font-black text-emerald-700">${cambio.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
                {metodo === 'TRANSFERENCIA' && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <QrCode className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-700">CLABE: 012 850 0123456789 01</p>
                      <p className="text-xs text-blue-500 mt-0.5">Banco: BANAMEX · Florería Bautista SA de CV</p>
                    </div>
                  </div>
                )}
                {/* Resumen final */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resumen</p>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Artículos</span><span className="font-bold">{cart.reduce((a,i) => a + i.cantidad, 0)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Cliente</span><span className="font-bold">{cliente.nombre || '—'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Método</span><span className="font-bold">{metodo}</span></div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-black"><span>Total</span><span className="text-blue-600">${total.toFixed(2)}</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navegación pasos */}
          <div className="flex items-center justify-between mt-4">
            <button onClick={() => paso > 1 && setPaso(p => (p - 1) as 1|2|3)}
              disabled={paso === 1}
              className="px-5 py-2.5 text-sm font-semibold text-slate-500 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all">
              ← Anterior
            </button>
            {paso < 3 ? (
              <AnimatedButton onClick={() => { if (paso === 1 && cart.length === 0) return; setPaso(p => (p + 1) as 1|2|3); }}
                disabled={paso === 1 && cart.length === 0}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 shadow-sm transition-all">
                Siguiente →
              </AnimatedButton>
            ) : (
              <AnimatedButton onClick={confirmarPedido} disabled={procesando || cart.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50">
                {procesando ? <><Loader2 className="w-4 h-4 animate-spin" />Procesando...</> : <><CheckCircle2 className="w-4 h-4" />Confirmar pedido</>}
              </AnimatedButton>
            )}
          </div>
        </div>

        {/* ── PANEL DERECHO: CARRITO ── */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <span className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-500" />Carrito
            </span>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {cart.reduce((a,i) => a + i.cantidad, 0)} artículos
            </span>
          </div>
          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-300">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-400">Agrega productos</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.nombre}</p>
                      <p className="text-[10px] text-slate-400">${item.precio} c/u</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(item.id, -1)} className="size-6 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-all">
                        <Minus className="w-3 h-3 text-slate-500" />
                      </button>
                      <span className="text-xs font-black w-5 text-center">{item.cantidad}</span>
                      <button onClick={() => updateQty(item.id, +1)} className="size-6 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-all">
                        <Plus className="w-3 h-3 text-slate-500" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">${(item.precio * item.cantidad).toFixed(0)}</p>
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors mt-0.5">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Total</span>
                <span className="text-xl font-black text-blue-600">${total.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
