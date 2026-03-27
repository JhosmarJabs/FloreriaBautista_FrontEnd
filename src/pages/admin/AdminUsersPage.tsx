import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShoppingBag,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn, ScaleIn, StaggerContainer, GlassCard, AnimatedButton } from '../../components/Animations';
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
      return { label: 'Administrador', color: 'bg-purple-100 text-purple-700' };
    case 'EMPLEADO':
      return { label: 'Empleado', color: 'bg-blue-100 text-blue-700' };
    case 'CLIENTE':
      return { label: 'Cliente', color: 'bg-amber-100 text-amber-700' };
    default:
      return { label: primary || 'Sin rol', color: 'bg-slate-100 text-slate-700' };
  }
};

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

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
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const stats = [
    { label: 'Total Usuarios', value: total, icon: <Users className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Administradores', value: users.filter(u => (u.roles ?? []).includes('ADMIN')).length, icon: <Shield className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Activos', value: users.filter(u => u.estado === 'ACTIVO').length, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Inactivos', value: users.filter(u => u.estado !== 'ACTIVO').length, icon: <XCircle className="w-5 h-5" />, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <div className="w-full h-full space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Gestión de Usuarios</h1>
            <p className="text-sm text-slate-500 font-medium">Administra el personal y sus niveles de acceso al sistema</p>
          </div>
          <div className="flex items-center gap-3">
            <AnimatedButton
              onClick={loadUsers}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-50 shadow-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </AnimatedButton>
            <AnimatedButton
              onClick={() => navigate('/admin/usuarios/nuevo')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Usuario
            </AnimatedButton>
          </div>
        </div>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className={`p-3 w-fit rounded-2xl ${stat.bg} ${stat.color} mb-4 shadow-sm`}>
              {stat.icon}
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black mt-1 text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </StaggerContainer>

      {/* Filters */}
      <FadeIn delay={0.3}>
        <GlassCard className="flex flex-wrap items-center gap-4 p-4 border-none">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-black text-slate-600 focus:ring-2 focus:ring-blue-600/20 outline-none shadow-sm cursor-pointer"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </GlassCard>
      </FadeIn>


      {/* Table */}
      <FadeIn delay={0.4}>
        <GlassCard className="border-none overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registro</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(() => {
                    const admins = users.filter(u => (u.roles ?? []).includes('ADMIN'));
                    const empleados = users.filter(u => !(u.roles ?? []).includes('ADMIN') && (u.roles ?? []).includes('EMPLEADO'));
                    const clientes = users.filter(u => !(u.roles ?? []).includes('ADMIN') && !(u.roles ?? []).includes('EMPLEADO'));

                    const renderRow = (user: User) => {
                      const isActive = user.estado === 'ACTIVO';
                      const initials = `${(user.nombre ?? '').charAt(0)}${(user.apellido ?? '').charAt(0)}`.toUpperCase() || '?';
                      return (
                        <motion.tr
                          key={user.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50/30 transition-colors group"
                        >
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                                  {initials}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{user.nombre} {user.apellido}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: #{user.id.slice(0, 8).toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                {user.correo}
                                {user.correoVerificado && (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" title="Correo verificado" />
                                )}
                              </div>
                              {user.telefono && (
                                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  {user.telefono}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="flex flex-wrap gap-1.5">
                              {(user.roles ?? []).map(rol => {
                                const badge = getRoleBadge([rol]);
                                return (
                                  <span key={rol} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${badge.color} shadow-sm`}>
                                    {badge.label}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {new Date(user.creadoEn).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="p-5">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    };

                    const renderGroupHeader = (label: string, count: number, icon: React.ReactNode, color: string) => (
                      <tr key={label} className="bg-slate-50/70">
                        <td colSpan={5} className="px-5 py-2.5">
                          <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${color}`}>
                            {icon}
                            {label} <span className="ml-1 opacity-60">({count})</span>
                          </div>
                        </td>
                      </tr>
                    );

                    if (users.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="p-10 text-center text-slate-400 text-sm font-medium">
                            No se encontraron usuarios
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <AnimatePresence mode="popLayout">
                        {admins.length > 0 && renderGroupHeader('Administradores', admins.length, <Shield className="w-3.5 h-3.5" />, 'text-purple-600')}
                        {admins.map(renderRow)}
                        {empleados.length > 0 && renderGroupHeader('Empleados', empleados.length, <ShoppingBag className="w-3.5 h-3.5" />, 'text-blue-600')}
                        {empleados.map(renderRow)}
                        {clientes.length > 0 && renderGroupHeader('Clientes', clientes.length, <Users className="w-3.5 h-3.5" />, 'text-amber-600')}
                        {clientes.map(renderRow)}
                      </AnimatePresence>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-5 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {users.length} de {total} usuarios
            </span>
          </div>
        </GlassCard>
      </FadeIn>
    </div>
  );
}
