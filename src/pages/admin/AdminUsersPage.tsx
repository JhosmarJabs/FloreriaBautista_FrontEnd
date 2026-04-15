import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Search, Shield, ShoppingBag, 
  Mail, Phone, Calendar, CheckCircle2, XCircle, 
  RefreshCw, LayoutGrid, List, ChevronLeft, ChevronRight,
  User as UserIcon, MoreVertical, Edit, TrendingUp, TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn, StaggerContainer, AnimatedButton } from '../../components/Animations';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '../../services/adminService';
import { User } from '../../types';

const ROLE_OPTIONS = [
  { label: 'Todos los Roles', value: '' },
  { label: 'Administrador', value: 'ADMIN' },
  { label: 'Empleado', value: 'EMPLEADO' },
  { label: 'Cliente', value: 'CLIENTE' },
];

const getRoleBadge = (roles: string[]) => {
  const primary = roles[0] ?? '';
  switch (primary) {
    case 'ADMIN':
      return { label: 'Administrador', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20' };
    case 'EMPLEADO':
      return { label: 'Empleado', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' };
    case 'CLIENTE':
      return { label: 'Cliente', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' };
    default:
      return { label: primary || 'Sin rol', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-100 dark:border-slate-700' };
  }
};

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminService.getAdminUsers({
        busqueda: searchTerm || undefined,
        rol: roleFilter || undefined,
      });
      setUsers(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const stats = [
    { label: 'Total Usuarios', value: total, icon: <Users />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
    { label: 'Administradores', value: users.filter(u => (u.roles ?? []).includes('ADMIN')).length, icon: <Shield />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20' },
    { label: 'Activos', value: users.filter(u => u.estado === 'ACTIVO').length, icon: <CheckCircle2 />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
    { label: 'Inactivos', value: users.filter(u => u.estado !== 'ACTIVO').length, icon: <XCircle />, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-100 dark:border-rose-500/20' },
  ];

  const renderRow = (user: User) => {
    const isActive = user.estado === 'ACTIVO';
    const initials = `${(user.nombre ?? '').charAt(0)}${(user.apellido ?? '').charAt(0)}`.toUpperCase() || '?';
    return (
      <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors group">
        <td className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 dark:from-blue-500/10 dark:to-indigo-600/10 flex items-center justify-center text-blue-700 dark:text-blue-400 font-black text-sm border border-blue-100 dark:border-blue-800/30">
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-200 leading-none">{user.nombre} {user.apellido}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">ID: #{user.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Mail className="w-3.5 h-3.5" />
              {user.correo}
            </div>
            {user.telefono && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Phone className="w-3.5 h-3.5" />
                {user.telefono}
              </div>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-wrap gap-1">
            {(user.roles ?? []).map(rol => {
              const badge = getRoleBadge([rol]);
              return (
                <span key={rol} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${badge.bg} ${badge.color} ${badge.border}`}>
                  {badge.label}
                </span>
              );
            })}
          </div>
        </td>
        <td className="px-6 py-4 text-xs font-bold text-slate-400">
          {new Date(user.creadoEn).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:border-slate-600 border'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td className="px-6 py-4">
            <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-xl transition-all"><MoreVertical className="w-4 h-4" /></button>
        </td>
      </tr>
    );
  };

  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest">Seguridad y Acceso</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Usuarios del Sistema</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gestión de cuentas de clientes, empleados y administradores</p>
          </div>
          <div className="flex items-center gap-3">
            <AnimatedButton onClick={loadUsers} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
            </AnimatedButton>
            <AnimatedButton onClick={() => navigate('/admin/usuarios/nuevo')} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all">
              <UserPlus className="w-4 h-4" /> Nuevo Usuario
            </AnimatedButton>
          </div>
        </div>
      </FadeIn>

      {/* Stats KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`relative overflow-hidden rounded-2xl border ${stat.border} ${stat.bg} p-5`}
          >
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <div className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100">{stat.value}</div>
            </div>
            {React.cloneElement(stat.icon as React.ReactElement, {
               className: `absolute -bottom-4 -right-4 w-24 h-24 ${stat.color} opacity-10`,
               strokeWidth: 3
            })}
          </motion.div>
        ))}
      </div>

      {/* Tools */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre, correo..."
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer min-w-[180px]"
          value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>

        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl ml-auto">
          <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden min-h-[400px] shadow-sm flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-bold uppercase tracking-widest">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-300 py-20">
            <UserIcon className="w-16 h-16 opacity-20" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No se encontraron resultados</p>
          </div>
        ) : (
          <>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50">
                      {['Usuario', 'Contacto', 'Rol', 'Registro', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    <AnimatePresence mode="popLayout">
                      {users.map(renderRow)}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 xxl:grid-cols-4 gap-6 flex-1 bg-slate-50/20 dark:bg-slate-900/10">
                {users.map((user, idx) => {
                  const isActive = user.estado === 'ACTIVO';
                  const initials = `${(user.nombre ?? '').charAt(0)}${(user.apellido ?? '').charAt(0)}`.toUpperCase() || '?';
                  const primaryRole = user.roles[0] || 'SIN ROL';
                  const badge = getRoleBadge([primaryRole]);
                  
                  return (
                    <motion.div key={user.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}
                      className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-800/50 transition-all">
                      <div className="flex items-start justify-between mb-5">
                         <div className="size-14 rounded-[22px] bg-gradient-to-br from-blue-500/10 to-indigo-600/10 dark:from-blue-500/20 dark:to-indigo-600/20 border border-blue-50 dark:border-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg font-black tracking-tighter shadow-inner">
                           {initials}
                         </div>
                         <div className="flex gap-1.5">
                            <button className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                            <button className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"><MoreVertical className="w-4 h-4" /></button>
                         </div>
                      </div>

                      <div className="space-y-1 mb-5">
                         <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{user.nombre} {user.apellido}</h3>
                         <div className="flex items-center gap-1.5">
                           <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${badge.bg} ${badge.color} ${badge.border}`}>
                             {badge.label}
                           </span>
                           <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                         </div>
                      </div>

                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-700 mb-5">
                         <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{user.correo}</p>
                         </div>
                         {user.telefono && (
                            <div className="flex items-center gap-3">
                               <Phone className="w-4 h-4 text-slate-400" />
                               <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{user.telefono}</p>
                            </div>
                         )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                         <div>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-0.5">Miembro desde</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(user.creadoEn).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                         </div>
                         <div className={`size-8 rounded-full border-2 border-white dark:border-slate-700 shadow-sm ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{users.length} de {total} registros</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
