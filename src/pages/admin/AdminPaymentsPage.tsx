import React, { useState, useEffect } from 'react';
import {
  CreditCard, DollarSign, Search, Download, Clock, XCircle,
  MoreVertical, Calendar, FileText, RefreshCw, X,
  TrendingUp, TrendingDown, ChevronRight, CheckCircle2, Receipt,
  LayoutGrid, List, Landmark, ArrowRight, ShieldCheck, Filter, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { Order } from '../../types';
import { FadeIn, ScaleIn, AnimatedButton } from '../../components/Animations';
import { useToast } from '../../hooks/useToast';

// ─── Status config ──────────────────────────────────────────────────────────
const statusLabel: Record<string, string> = {
  paid:       'Completado', pending:    'Pendiente', failed:    'Fallido',
  entregado:  'Completado', pendiente:  'Pendiente', cancelado: 'Cancelado',
  enviado:    'Enviado',    procesando: 'En Proceso',
};
const statusStyle: Record<string, string> = {
  paid:       'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
  entregado:  'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
  pending:    'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
  pendiente:  'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
  procesando: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
  failed:     'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-100 dark:border-rose-500/20',
  cancelado:  'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-100 dark:border-rose-500/20',
  enviado:    'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20',
};
const statusDot: Record<string, string> = {
  paid:       'bg-emerald-500', entregado:  'bg-emerald-500',
  pending:    'bg-amber-400',   pendiente:  'bg-amber-400',   procesando: 'bg-blue-400',
  failed:     'bg-rose-500',    cancelado:  'bg-rose-500',
  enviado:    'bg-indigo-500',
};

const INVOICE_FIELDS = [
  { label: 'Cliente *',      key: 'client',  type: 'text',   placeholder: 'Nombre del cliente o empresa'   },
  { label: 'Monto (MXN) *', key: 'amount',  type: 'number', placeholder: '0.00'                           },
  { label: 'Concepto *',     key: 'concept', type: 'text',   placeholder: 'Ej. Arreglo floral para evento' },
  { label: 'Vencimiento',    key: 'dueDate', type: 'date',   placeholder: ''                               },
] as const;

export default function AdminPaymentsPage() {
  const [searchTerm,   setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos los Estados');
  const [payments,     setPayments]     = useState<Order[]>([]);
  const [viewMode,     setViewMode]     = useState<'table' | 'grid'>('table');
  const [stats,        setStats]        = useState({
    incomeToday: 0, pendingAmount: 0, failedCount: 0, totalTransactions: 0,
  });
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { showToast } = useToast();

  const [invoice, setInvoice] = useState({ client: '', amount: 0, concept: '', dueDate: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await AdminService.getAdminOrders({ size: 50 });
      const items = res.data.items;
      setPayments(items);

      const today = new Date().toISOString().slice(0, 10);
      const incomeToday = items
        .filter(o => o.fechaCreacion?.startsWith(today) &&
          (o.estadoPedido === 'entregado' || o.estadoPedido === 'paid'))
        .reduce((sum, o) => sum + o.total, 0);
      const pendingAmount = items
        .filter(o => o.estadoPedido === 'pendiente' || o.estadoPedido === 'pending')
        .reduce((sum, o) => sum + o.total, 0);
      const failedCount = items
        .filter(o => o.estadoPedido === 'cancelado' || o.estadoPedido === 'failed').length;

      setStats({ incomeToday, pendingAmount, failedCount, totalTransactions: res.data.total });
    } catch {
      showToast('Error al cargar órdenes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = () => {
    if (!invoice.client || !invoice.amount || !invoice.concept) {
      showToast('Por favor, completa los campos obligatorios.', 'error');
      return;
    }
    showToast(`Factura creada para ${invoice.client} por $${invoice.amount}`, 'success');
    setModalOpen(false);
    setInvoice({ client: '', amount: 0, concept: '', dueDate: '' });
  };

  const filtered = payments.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      p.nombreCliente.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q);
    const estado = p.estadoPedido;
    const matchStatus =
      statusFilter === 'Todos los Estados' ||
      (statusFilter === 'Completado' && (estado === 'entregado' || estado === 'paid'))    ||
      (statusFilter === 'Pendiente'  && (estado === 'pendiente' || estado === 'pending' || estado === 'procesando')) ||
      (statusFilter === 'Fallido'    && (estado === 'cancelado' || estado === 'failed'));
    return matchSearch && matchStatus;
  });

  return (
    <div className="w-full space-y-6">

      {/* Breadcrumb */}


      {/* Header */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
             </div>
             <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Control de Ingresos</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gestión de cobros, recibos y conciliación bancaria.</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-emerald-500 transition-all">
               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <AnimatedButton onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all">
              <FileText className="w-4 h-4" />
              Nueva Factura
            </AnimatedButton>
          </div>
        </div>
      </FadeIn>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ingresos hoy', value: `$${stats.incomeToday.toLocaleString()}`, icon: <TrendingUp />, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/40' },
          { label: 'Por cobrar', value: `$${stats.pendingAmount.toLocaleString()}`, icon: <Clock />, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100/70 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/40' },
          { label: 'Cancelados', value: stats.failedCount, icon: <XCircle />, color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-100/70 dark:bg-rose-500/20', border: 'border-rose-200 dark:border-rose-500/40' },
          { label: 'Operaciones', value: stats.totalTransactions, icon: <CreditCard />, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100/70 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/40' },
        ].map((s, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm group">
            <div className={`size-10 rounded-2xl ${s.bg} border ${s.border} ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
               {React.cloneElement(s.icon as React.ReactElement, { className: 'w-5 h-5' })}
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{loading ? '...' : s.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Tools / Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-3xl shadow-sm">
         <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar por cliente o folio de pago..."
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/10"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
         <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-black uppercase outline-none cursor-pointer tracking-wider">
                <option>Todos los Estados</option>
                <option>Completado</option>
                <option>Pendiente</option>
                <option>Fallido</option>
              </select>
            </div>
            <div className="flex p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
               <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-400'}`}><List className="w-4 h-4"/></button>
               <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4"/></button>
            </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] overflow-hidden shadow-sm flex flex-col min-h-[500px]">
         {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
               <RefreshCw className="size-10 text-emerald-500 animate-spin" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Escaneando libro contable...</p>
            </div>
         ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-6">
               <Receipt className="size-16 text-slate-200 dark:text-slate-700" />
               <div className="text-center">
                  <p className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sin transacciones registradas</p>
                  <p className="text-xs text-slate-400">Intenta cambiar los filtros de búsqueda</p>
               </div>
            </div>
         ) : viewMode === 'table' ? (
            <div className="overflow-x-auto flex-1">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                      {['Operación', 'Pagador / Cliente', 'Importe', 'Vencimiento', 'Estado', ''].map(h => (
                        <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                     <AnimatePresence mode="popLayout">
                        {filtered.map((trx, idx) => {
                          const stSet = statusStyle[trx.estadoPedido];
                          const dotSet = statusDot[trx.estadoPedido];
                          return (
                            <motion.tr key={trx.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.01 }}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10 transition-colors group">
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400">
                                       <Receipt className="w-4 h-4" />
                                    </div>
                                    <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">#{trx.id.slice(0, 8).toUpperCase()}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{trx.nombreCliente}</p>
                              </td>
                              <td className="px-8 py-5">
                                 <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">${(trx.total || 0).toLocaleString()}</span>
                              </td>
                              <td className="px-8 py-5 text-xs font-bold text-slate-500">
                                 {trx.fechaEntrega ? new Date(trx.fechaEntrega).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-8 py-5">
                                 <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${stSet}`}>
                                    <span className={`size-1.5 rounded-full ${dotSet}`} />
                                    {statusLabel[trx.estadoPedido] || trx.estadoPedido}
                                 </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <button className="size-9 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-emerald-600 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 active:scale-90">
                                    <Eye className="w-4 h-4" />
                                 </button>
                              </td>
                            </motion.tr>
                          );
                        })}
                     </AnimatePresence>
                  </tbody>
               </table>
            </div>
         ) : (
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-slate-50/10 dark:bg-slate-900/10 flex-1">
               {filtered.map((trx, idx) => {
                 const stSet = statusStyle[trx.estadoPedido];
                 return (
                   <motion.div key={trx.id} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.05 }}
                      className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all relative group flex flex-col">
                      
                      <div className="flex items-start justify-between mb-6">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Folio Contable</p>
                            <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">#{trx.id.slice(0, 8).toUpperCase()}</h4>
                         </div>
                         <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 group-hover:text-emerald-500 transition-colors">
                            <ランドマーク className="w-5 h-5" />
                         </div>
                      </div>

                      <div className="space-y-4 mb-6">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Pagador</p>
                            <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight flex items-center gap-2">
                               <Landmark className="w-3.5 h-3.5 text-slate-300" />
                               {trx.nombreCliente}
                            </p>
                         </div>
                         <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Total Cobrado</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white">${trx.total.toLocaleString()}</span>
                         </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                         <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${stSet}`}>
                            {statusLabel[trx.estadoPedido] || trx.estadoPedido}
                         </span>
                         <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                         </div>
                      </div>

                      <button className="absolute inset-0 z-10 opacity-0 bg-emerald-600/5 backdrop-blur-[2px] rounded-[32px] flex items-center justify-center group-hover:opacity-100 transition-all">
                         <div className="size-12 bg-white dark:bg-slate-800 rounded-full shadow-2xl flex items-center justify-center text-emerald-600 scale-75 group-hover:scale-100 transition-transform">
                            <FileText className="w-6 h-6" />
                         </div>
                      </button>
                   </motion.div>
                 );
               })}
            </div>
         )}
         
         {/* Footer Pagination */}
         <div className="px-8 py-5 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filtered.length} de {payments.length} transacciones</span>
            <button className="text-[10px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest flex items-center gap-2 transition-colors">
               Auditar reporte completo <ArrowRight className="w-4 h-4" />
            </button>
         </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setModalOpen(false)} />

            <ScaleIn className="relative bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-700">
              <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Nueva Factura</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Emisión de comprobante fiscal</p>
                 </div>
                 <button onClick={() => setModalOpen(false)} className="size-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 hover:text-rose-500 transition-all border border-slate-100 dark:border-slate-700">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="px-8 py-8 space-y-5">
                {INVOICE_FIELDS.map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">{label}</label>
                    <input type={type} placeholder={placeholder}
                      value={(invoice as any)[key]}
                      onChange={(e) => setInvoice({
                        ...invoice,
                        [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                      })}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white" />
                  </div>
                ))}
              </div>

              <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-700 flex justify-end gap-3">
                <button onClick={() => setModalOpen(false)}
                  className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                  Cancelar
                </button>
                <AnimatedButton onClick={handleCreate}
                  className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all">
                  <FileText className="w-4 h-4" />
                  Generar CFDI
                </AnimatedButton>
              </div>
            </ScaleIn>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ランドマーク = Landmark;
