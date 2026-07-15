import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShoppingCart, CreditCard, UserPlus, AlertTriangle,
  MoreVertical, ChevronRight, Download, Briefcase, UserCircle,
  User, Package, MapPin, ArrowRight, Heart, Clock, CheckCircle2,
  Bell, BarChart2, Boxes, LayoutDashboard
} from 'lucide-react';
import { DataService } from '../../services/dataService';
import { AdminService } from '../../services/adminService';
import { Order } from '../../types';
import { FadeIn, ScaleIn, StaggerContainer, AnimatedButton, GlassCard } from '../../components/Animations';

// ─── Status helpers ────────────────────────────────────────────────────────────
const statusLabel: Record<string, string> = {
  pending:    'Pendiente', pendiente:  'Pendiente',
  shipped:    'Enviado',   enviado:    'Enviado',   procesando: 'Procesando',
  delivered:  'Entregado', entregado:  'Entregado',
  cancelled:  'Cancelado', cancelado:  'Cancelado',
};
const statusStyle: Record<string, string> = {
  pending:    'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20',
  pendiente:  'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20',
  shipped:    'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20',
  enviado:    'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20',
  procesando: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20',
  delivered:  'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20',
  entregado:  'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20',
  cancelled:  'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600',
  cancelado:  'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600',
};
const statusDot: Record<string, string> = {
  pending:    'bg-amber-400', pendiente:  'bg-amber-400',
  shipped:    'bg-blue-500',  enviado:    'bg-blue-500',  procesando: 'bg-blue-500',
  delivered:  'bg-emerald-500', entregado: 'bg-emerald-500',
  cancelled:  'bg-slate-300', cancelado:  'bg-slate-300',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser]               = useState<any>(null);
  const [stats, setStats]             = useState<any>(null);
  const [alerts, setAlerts]           = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError]   = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'shipped'>('all');
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const pageSize   = 2;
  const totalPages = Math.ceil(alerts.length / pageSize);
  const displayedAlerts = alerts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const filteredOrders = recentOrders.filter(o => {
    if (orderFilter === 'all') return true;
    const s = o.estadoPedido?.toLowerCase();
    if (orderFilter === 'pending') return s === 'pendiente' || s === 'pending';
    if (orderFilter === 'shipped') return s === 'enviado'   || s === 'shipped' || s === 'procesando';
    return false;
  });

  useEffect(() => {
    const stored = localStorage.getItem('usuario');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          AdminService.getDashboardStats(),
          AdminService.getAdminOrders({ size: 4 })
        ]);
        
        if (statsRes.success) {
          setStats(statsRes.data);
          setAlerts(statsRes.data.criticalInventory || []);
          
          // Mapear ventas mensuales para la gráfica (últimos 30 días)
          const todayStr = new Date().toLocaleDateString();

          const mappedMonthly = statsRes.data.monthlySales.map((d: any) => {
            const date = new Date(d.fecha);
            const isToday = date.toLocaleDateString() === todayStr;
            return {
              day: isToday ? 'HOY' : String(date.getDate()),
              total: d.total,
              orders: d.pedidos
            };
          });
          setMonthlySales(mappedMonthly);
        }
        
        if (ordersRes.success) {
          setRecentOrders(ordersRes.data.items);
          setOrdersError(false);
        } else {
          setOrdersError(true);
        }
      } catch (err) {
        console.error("Error cargando dashboard:", err);
        setOrdersError(true);
      }
    };
    loadDashboardData();
  }, []);

  const handleExportReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ stats, monthlySales }, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "reporte_mensual.json");
    document.body.appendChild(a); a.click(); a.remove();
  };

  const handleUpdateOrderStatus = async (_orderId: string, _status: string) => {
    try {
      const res = await AdminService.getAdminOrders({ size: 4 });
      setRecentOrders(res.data.items);
    } catch { /* ignore */ }
    setOpenActionMenu(null);
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400 text-sm">Cargando información...</p>
    </div>
  );

  // ── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
  const userRoles: string[] = (user?.roles ?? (user?.role ? [user.role] : []))
    .map((r: string) => r.toLowerCase());
  const isAdmin    = userRoles.some(r => ['admin', 'administrador'].includes(r));
  const isCustomer = userRoles.some(r => ['customer', 'cliente'].includes(r));
  const isEmployee = userRoles.some(r => ['staff', 'empleado'].includes(r));

  if (isAdmin) {
    return (
      <div className="w-full h-full space-y-3 p-4 md:p-5 overflow-hidden">

        {/* Header */}
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Dashboard</h1>
                <p className="text-xs text-slate-400 dark:text-slate-500">Resumen operativo y métricas principales</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExportReport}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all">
                <Download className="w-4 h-4" />
                Reporte Mensual
              </button>
              <Link to="/admin/auditoria">
                <AnimatedButton className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all">
                  <TrendingUp className="w-4 h-4" />
                  Ver Insights
                </AnimatedButton>
              </Link>
            </div>
          </div>
        </FadeIn>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              label: 'Ventas Totales',  
              value: stats ? `$${stats.totalSales.toLocaleString()}` : ' -- ', 
              icon: <TrendingUp />,  color: 'text-blue-700 dark:text-blue-300',    bg: 'bg-blue-100/70 dark:bg-blue-500/20',    border: 'border-blue-200 dark:border-blue-500/40',    trend: stats ? '+15.4% mes actual' : '...'
            },
            { 
              label: 'Pedidos Totales', 
              value: stats ? stats.orderCount.toString() : ' -- ',             
              icon: <ShoppingCart />, color: 'text-amber-700 dark:text-amber-300',   bg: 'bg-amber-100/70 dark:bg-amber-500/20',   border: 'border-amber-200 dark:border-amber-500/40',   trend: stats ? 'Activos en sistema' : '...'
            },
            { 
              label: 'Ticket Promedio', 
              value: stats ? `$${stats.averageTicket.toFixed(2)}` : ' -- ',    
              icon: <CreditCard />,  color: 'text-indigo-700 dark:text-indigo-300',  bg: 'bg-indigo-100/70 dark:bg-indigo-500/20',  border: 'border-indigo-200 dark:border-indigo-500/40',  trend: stats ? 'Por cada venta' : '...'
            },
            { 
              label: 'Nuevos Clientes', 
              value: stats ? stats.newCustomers.toString() : ' -- ',           
              icon: <UserPlus />,    color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/40', trend: stats ? '+8.2% crecimiento' : '...'
            },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-4`}
            >
              <div className="relative z-10 flex flex-col justify-between h-full">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</p>
                <div className="mt-1 text-xl font-black text-slate-800 dark:text-slate-100">{s.value}</div>
                <p className={`text-xs mt-1.5 font-medium ${s.color} opacity-80`}>{s.trend}</p>
              </div>
              {React.cloneElement(s.icon as React.ReactElement, {
                className: `absolute -bottom-4 -right-4 w-24 h-24 ${s.color} opacity-10`,
                strokeWidth: 3
              })}
            </motion.div>
          ))}
        </div>

        {/* Alerts + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Stock Alerts */}
          <FadeIn delay={0.2} className="lg:col-span-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Alertas de Stock
              </h2>
              {alerts.length > 0 && (
                <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-lg border border-rose-100 dark:border-rose-500/20">
                  {alerts.length} críticos
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {alerts.length > 0 ? (
                <>
                  <AnimatePresence mode="popLayout">
                    {displayedAlerts.map((p) => (
                      <motion.div key={p.itemId} layout
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                        className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-rose-600 transition-colors">{p.nombre}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-400 rounded-full"
                                  style={{ width: `${Math.min((p.stockActual / p.stockMinimo) * 100, 100)}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 shrink-0">{p.stockActual}/{p.stockMinimo}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/admin/inventario/editar/${p.itemId}`)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg shadow-sm shadow-rose-600/20 transition-all shrink-0"
                          >
                            Reabastecer
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 pt-1">
                      <button onClick={() => setCurrentPage(p => (p - 1 + totalPages) % totalPages)}
                        className="size-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{currentPage + 1} / {totalPages}</span>
                      <button onClick={() => setCurrentPage(p => (p + 1) % totalPages)}
                        className="size-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Todo bajo control.</p>
                </div>
              )}
            </div>
          </FadeIn>

          {/* Monthly Sales */}
          <FadeIn delay={0.3} className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-6 h-full shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">Ventas Mensuales</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Últimos 30 días</p>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                  <Download className="w-3.5 h-3.5" />
                  Exportar
                </button>
              </div>

              <div className="flex items-end justify-between gap-1 h-32 overflow-x-auto">
                {monthlySales.map((item, idx) => {
                  const maxTotal = Math.max(...monthlySales.map(d => d.total));
                  const pct = maxTotal > 0 ? (item.total / maxTotal) * 100 : 5;
                  const isToday = item.day === 'HOY';
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="relative w-full flex flex-col items-center justify-end h-full">
                        {/* Tooltip */}
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-1 rounded-lg whitespace-nowrap">
                            ${item.total}
                          </span>
                        </div>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${pct}%` }}
                          transition={{ delay: idx * 0.05 + 0.2, duration: 0.5, ease: 'easeOut' }}
                          className={`w-full max-w-[36px] rounded-t-xl ${
                            isToday
                            ? 'bg-blue-600 shadow-lg shadow-blue-600/20'
                              : 'bg-slate-100 dark:bg-slate-700/50 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                          } transition-colors`}
                        />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Recent Orders */}
        <FadeIn delay={0.4}>
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">Pedidos Recientes</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Últimas transacciones procesadas</p>
              </div>
              <div className="flex p-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-xl gap-0.5">
                {([['all','Todos'], ['pending','Pendientes'], ['shipped','Enviados']] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setOrderFilter(key as any)}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      orderFilter === key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    {['Monto', 'Estado', 'Cliente', 'Fecha', ''].map((h, i) => (
                      <th key={i} className={`px-6 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {ordersError && (
                    <tr className="bg-rose-50/20 dark:bg-rose-900/10">
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-300 dark:text-slate-600">N/A</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                          N/A
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-300">N/A</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-300">****-**-**</span>
                      </td>
                      <td className="px-6 py-4 text-right" />
                    </tr>
                  )}

                  {!ordersError && filteredOrders.map((order, idx) => (
                    <tr key={idx} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-900 dark:text-white">${order.total}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusStyle[order.estadoPedido] || ''}`}>
                          <span className={`size-1.5 rounded-full ${statusDot[order.estadoPedido] || ''}`} />
                          {statusLabel[order.estadoPedido] || order.estadoPedido}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <UserCircle className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{order.nombreCliente}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs">{new Date(order.fechaCreacion).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button onClick={() => setOpenActionMenu(openActionMenu === order.id ? null : order.id)}
                          className="p-2 text-slate-300 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                          {openActionMenu === order.id && (
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 6 }} transition={{ duration: 0.13 }}
                              className="absolute right-6 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-20">
                              <div className="p-1.5 flex flex-col gap-0.5">
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                                  className="text-left px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                                  Marcar como Enviado
                                </button>
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                  className="text-left px-3 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                  Marcar como Entregado
                                </button>
                                <div className="h-px bg-slate-100 my-0.5" />
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                  className="text-left px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-lg transition-colors">
                                  Cancelar Pedido
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500">No hay pedidos que mostrar.</p>
              </div>
            )}

            <div className="px-6 py-3.5 border-t border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <span className="text-xs text-slate-400 dark:text-slate-500">{filteredOrders.length} pedidos</span>
              <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
                Ver historial completo <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </FadeIn>
      </div>
    );
  }

  // ── CUSTOMER VIEW ────────────────────────────────────────────────────────────
  if (isCustomer) {
    return (
      <div className="space-y-10 pb-16">

        {/* Hero */}
        <FadeIn>
          <div className="relative min-h-[480px] rounded-3xl overflow-hidden flex items-center p-8 lg:p-16 shadow-xl">
            <div className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "linear-gradient(to right, rgba(26,59,91,0.92) 0%, rgba(26,59,91,0.5) 55%, rgba(26,59,91,0.1) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuDiqKa-pG2AUir0S_KPqT0wNmI1l7oWuYZHREe1DXshdkDbD3P_UUdpai_hEtg8c0AcHQzBhXp-FXiectMMB6_zq6rNl-9SC_ji0wUyuZC_Y_biJz5CI-Y4rbjYCGMHXqs9PDdi1vJBULg6KR0q6Uf46uUwn3xLuf3YtFAqiaJ4bbmLf-aXcpomLsJEufuPU5Vqct64J1qg-5Jw4OzYiixOw5l5r09HJ9GHjpSFetP-fpaZSrvVLtK4jI6nfrOTuVzzqXZ9-Obk75yj')" }}
            />
            <div className="relative z-10 max-w-xl text-white">
              <motion.span initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="inline-block px-3 py-1.5 bg-[#facc15] text-[#1a3b5b] text-[10px] font-black rounded-lg mb-5 uppercase tracking-widest">
                Bienvenido de vuelta
              </motion.span>
              <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
                Tu próximo detalle, <span className="text-[#facc15]">{(user?.nombre ?? user?.name ?? 'Admin').split(' ')[0]}</span>
              </h1>
              <p className="text-lg text-white/75 mb-8 leading-relaxed">
                Flores frescas seleccionadas para transformar cualquier momento en un recuerdo.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/catalogo">
                  <AnimatedButton className="px-8 py-4 bg-[#facc15] text-[#1a3b5b] font-black rounded-xl hover:bg-white transition-all shadow-xl">
                    Ver catálogo
                  </AnimatedButton>
                </Link>
                <Link to="/catalogo">
                  <AnimatedButton className="px-8 py-4 bg-white/10 backdrop-blur-xl text-white font-black rounded-xl hover:bg-white/20 transition-all border border-white/30">
                    Personalizar ramo
                  </AnimatedButton>
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Quick access */}
        <FadeIn delay={0.2}>
          <h2 className="text-2xl font-black text-slate-900 mb-5 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#1a3b5b]" /> Accesos Directos
          </h2>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { to: '/mis-pedidos',    icon: Package, title: 'Historial de pedidos',     desc: 'Revisa el estado de tus entregas',        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCawVT-5B_e0L-ouIC8qN1I4mCP8bdbedGw7cKEu8AhzGMRGHciGyxxcI2PAyKo5kNzwYsB85lW8gJeRgOqR1f8VROGvlqpW9YWQE1FK064J4dw9Yq4YWazpuL49sUXRG_MiRu8Nc5qarLEdWo1-U3BdWt9loEulnXw9vIquy0XGITKMILW7pwdKomvhA6l3HgyIxvsCpZTn0wAYgUlyf8jE9pQHITdhyIusiIfPShPSZ0CKIdDJjEAL8QZvfb6fFdUpsyi1tKY-qDk' },
              { to: '/notificaciones', icon: Bell,    title: 'Notificaciones',            desc: 'Ofertas y actualizaciones de pedidos',   img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCawVT-5B_e0L-ouIC8qN1I4mCP8bdbedGw7cKEu8AhzGMRGHciGyxxcI2PAyKo5kNzwYsB85lW8gJeRgOqR1f8VROGvlqpW9YWQE1FK064J4dw9Yq4YWazpuL49sUXRG_MiRu8Nc5qarLEdWo1-U3BdWt9loEulnXw9vIquy0XGITKMILW7pwdKomvhA6l3HgyIxvsCpZTn0wAYgUlyf8jE9pQHITdhyIusiIfPShPSZ0CKIdDJjEAL8QZvfb6fFdUpsyi1tKY-qDk' },
              { to: '/mis-direcciones',icon: MapPin,  title: 'Mis Direcciones',           desc: 'Administra tus lugares de entrega',       img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5SdB5oVCRnajVoX1GjQW73VFK1mXNxnXdkfuByUxnA5eZvySHmcNPiTD1dOXTmX824nJkMkYs1rFfpwqW3AlKXcmXmX6SHw75lxZRLCtSvtfuRhI79252NpqYIm1k-7_eGOjKJFfz5IvRd7NYK0nMTYqRB923Qw3tQK7V80NZ8w_9482fCXUhy7zUoomARrUWyA6xDmK9YBBQKnYAUigaTQJLh0OsO_YJXv3VMGrx1XQahGchsKv4pMELC69NwJ-XFFEGBd30usvi' },
            ].map((card) => (
              <Link key={card.to} to={card.to}
                className="group relative h-56 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.75)), url('${card.img}')` }} />
                <div className="relative h-full flex flex-col justify-end p-6 text-white">
                  <div className="p-2.5 bg-[#facc15] rounded-xl w-fit mb-3 shadow-md">
                    <card.icon className="text-[#1a3b5b] w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black mb-1">{card.title}</h3>
                  <p className="text-white/65 text-sm">{card.desc}</p>
                </div>
              </Link>
            ))}
          </StaggerContainer>
        </FadeIn>

        {/* Seasonal products */}
        <FadeIn delay={0.4}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              🌿 Novedades de temporada
            </h2>
            <Link to="/catalogo">
              <AnimatedButton className="text-[#1a3b5b] font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 hover:underline">
                Ver todas <ArrowRight className="w-3.5 h-3.5" />
              </AnimatedButton>
            </Link>
          </div>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Amanecer Primaveral", price: "$45.00", desc: "Mix de tulipanes, lirios y follaje verde intenso.", tag: "NOVEDAD",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuJRj-eKLvW5rq6oR6TuNxGrlar4ppFGyUu1ON5MGuNZCeHhxwumbxBRxa2bQwZzEnApQrRCk-o5W2rHZvzn18TYg2LF8slSqb352y7Psw-5-LAiw1Wd283iuaf0m24zYGVUClj3vEfuC32MutzUC1VwzpfFNJzFegJHgcB6lgQiuzdsRCG8INX6qZ-Agbp1-Nequ2rVYWNkLTxvyT0gczgSl-nWsy9H326JtCM5SF2IePhg3cUG7QRzjThGVuvK72p1IGhD2DDQQt" },
              { title: "Elegancia Carmesí",  price: "$62.00", desc: "12 Rosas rojas premium con tallo largo.", tag: null,
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAy8yMEBwvCMwBWcpEeP4pLJ_QKbgx5rda_S5cA3zyzkaui1FjmNz-Z2y3qBYRxB9bO1NuvgD0Va3Bt__Y46df5fCz4eGuVeGrOdIWa3CQftiCM0hKSdOSMvPKzU7wfcXAXzbzOBknNFk_sX2mx36lH3Prd-PHJd7e4ACHDidI0_NoKA6cC1KsH56BRFwX7_TtQbJ-oORKM6kRycx-uVGhi3T6cgsiPnK_MAOseXpxAEVxGbBjdM2GOidhE3OT_HswHKOkBHOvd0Bht" },
              { title: "Rayo de Sol",        price: "$38.00", desc: "Girasoles brillantes acompañados de margaritas blancas.", tag: null,
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-AYO9Mm4EgzL_xvSOa9Z5ktrYsFSKBLTMYzVM97F-zFTOnOsy2NbHlMryIkcuQFzekrk78Fss50kA-vD19WIcltw38Byxhvs-HyfqHgD9Fs2MuEUuV8RqYEhcNwb4vLWSwww397EY0WrNmn90wnYMTY94qTZKha__G0Sp7EyWGZYIt3IUK94CKxpRY55RD6gxojI1VLJQm8OyvUYakTZYMx5KbKeypDFkUAj5FRMfxXEyxiCVVkqbMADIwAGfbHy1WWQTR0TTRxsa" },
            ].map((item, idx) => (
              <GlassCard key={idx} className="overflow-hidden group flex flex-col border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-64 overflow-hidden">
                  <button className="absolute top-3 right-3 z-10 bg-white/90 dark:bg-slate-800/90 p-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-all shadow-sm hover:scale-110 active:scale-95">
                    <Heart className="w-4 h-4" />
                  </button>
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={item.img} alt={item.title} referrerPolicy="no-referrer" />
                  {item.tag && (
                    <div className="absolute bottom-0 left-0 bg-[#facc15] text-[#1a3b5b] px-4 py-1.5 font-black text-[10px] tracking-widest uppercase">
                      {item.tag}
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-lg text-slate-900 dark:text-white">{item.title}</h4>
                    <span className="text-[#1a3b5b] dark:text-amber-500 font-black text-base">{item.price}</span>
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mb-5 line-clamp-2">{item.desc}</p>
                  <div className="mt-auto">
                    <AnimatedButton className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-900/50 text-[#1a3b5b] dark:text-slate-300 font-bold rounded-xl group-hover:bg-[#1a3b5b] group-hover:text-white dark:group-hover:bg-blue-600 transition-all text-sm">
                      <ShoppingCart className="w-4 h-4" /> Añadir al carrito
                    </AnimatedButton>
                  </div>
                </div>
              </GlassCard>
            ))}
          </StaggerContainer>
        </FadeIn>
      </div>
    );
  }

  // ── OTHER ROLES ──────────────────────────────────────────────────────────────
  const employeeCard = { title: '¡Bienvenido Empleado!', desc: 'Gestiona los pedidos y el inventario del día.', icon: <Briefcase className="w-14 h-14 text-emerald-500" />, color: 'bg-emerald-50', border: 'border-emerald-200' };

  const cfg = isEmployee ? employeeCard : {
    title: `¡Bienvenido ${user?.nombre ?? user?.name ?? 'Administrador'}!`, desc: 'Gracias por visitarnos.',
    icon: <User className="w-14 h-14 text-slate-400" />, color: 'bg-slate-50', border: 'border-slate-200',
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
        className={`max-w-xl w-full ${cfg.color} dark:bg-slate-800 border ${cfg.border} dark:border-slate-700 rounded-2xl p-10 text-center shadow-lg`}>
        <motion.div className="flex justify-center mb-5" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
          {cfg.icon}
        </motion.div>
        <motion.h1 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-3xl font-black text-slate-900 dark:text-white mb-3">{cfg.title}</motion.h1>
        <motion.p initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-slate-500 dark:text-slate-400 mb-8">{cfg.desc}</motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-3">
          {[['Usuario', user.name], ['Correo', user.email], ['Rol', user.role]].map(([label, val]) => (
            <div key={label} className="bg-white dark:bg-slate-900 px-5 py-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mb-0.5">{label}</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm capitalize">{val}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}