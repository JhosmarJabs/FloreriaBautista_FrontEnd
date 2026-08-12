import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Users, UserPlus, Search, Shield, ShoppingBag,
  Mail, Phone, CheckCircle2, XCircle,
  RefreshCw, LayoutGrid, List, ChevronRight, ChevronDown,
  User as UserIcon, AlertTriangle, type LucideIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { FadeIn, AnimatedButton } from '../../components/Animations';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '../../services/adminService';
import { formatApiDate } from '../../utils/date';
import { User } from '../../types';

const ROLE_OPTIONS = [
  { label: 'Todos los Roles', value: '' },
  { label: 'Administrador', value: 'ADMIN' },
  { label: 'Empleado', value: 'EMPLEADO' },
  { label: 'Cliente', value: 'CLIENTE' },
];

/**
 * El backend pagina por defecto (size=20). Para poder agrupar por rol sobre el
 * total real —y para que los KPIs no mientan— traemos todas las paginas del
 * filtro actual en lotes grandes, con un tope de seguridad.
 */
const PAGE_SIZE = 200;
const MAX_PAGES = 25; // 5,000 usuarios como maximo

type GroupKey = 'ADMIN' | 'EMPLEADO' | 'CLIENTE' | 'SIN_ROL';

/** Orden jerarquico de los bloques (no alfabetico entre grupos). */
const ROLE_GROUPS: { key: GroupKey; label: string; Icon: LucideIcon }[] = [
  { key: 'ADMIN',    label: 'Administración',   Icon: Shield },
  { key: 'EMPLEADO', label: 'Empleados',        Icon: Users },
  { key: 'CLIENTE',  label: 'Clientes',         Icon: ShoppingBag },
  { key: 'SIN_ROL',  label: 'Sin rol asignado', Icon: UserIcon },
];

const COLLAPSED_GROUPS_KEY = 'admin-usuarios:grupos-plegados';

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

/** El badge del grupo reusa el color del rol (SIN_ROL cae en el caso default). */
const getGroupBadge = (key: GroupKey) => getRoleBadge(key === 'SIN_ROL' ? [] : [key]);

/** Un usuario con varios roles pertenece al grupo de su rol de mayor jerarquia. */
const groupKeyFor = (user: User): GroupKey => {
  const roles = user.roles ?? [];
  return (['ADMIN', 'EMPLEADO', 'CLIENTE'] as const).find(r => roles.includes(r)) ?? 'SIN_ROL';
};

const fullName = (user: User) => `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim();

/** Alfabetico ignorando acentos y mayusculas. */
const byName = (a: User, b: User) =>
  fullName(a).localeCompare(fullName(b), 'es', { sensitivity: 'base' });

type UserGroup = { key: GroupKey; label: string; Icon: LucideIcon; users: User[] };

/** Contenido comun del encabezado de grupo (tabla y tarjetas). */
const GroupHeaderContent = ({ group, collapsed }: { group: UserGroup; collapsed: boolean }) => {
  const badge = getGroupBadge(group.key);
  const Chevron = collapsed ? ChevronRight : ChevronDown;
  return (
    <>
      <Chevron className={`w-4 h-4 shrink-0 ${badge.color}`} />
      <group.Icon className={`w-4 h-4 shrink-0 ${badge.color}`} />
      <span className={`text-[11px] font-black uppercase tracking-widest ${badge.color}`}>{group.label}</span>
      <span className={`text-[11px] font-black ${badge.color} opacity-60`}>({group.users.length})</span>
    </>
  );
};

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [collapsedGroups, setCollapsedGroups] = useState<GroupKey[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(COLLAPSED_GROUPS_KEY) ?? '[]');
      return Array.isArray(stored)
        ? stored.filter((k): k is GroupKey => ROLE_GROUPS.some(g => g.key === k))
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);

  const toggleGroup = (key: GroupKey) =>
    setCollapsedGroups(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  // Buscar en cada tecla dispararia varias peticiones (una por pagina): esperamos.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Descarta respuestas de peticiones que ya quedaron obsoletas.
  const requestId = useRef(0);

  const loadUsers = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const filtros = {
        busqueda: debouncedSearch || undefined,
        rol: roleFilter || undefined,
      };

      const first = await AdminService.getAdminUsers({ ...filtros, page: 1, size: PAGE_SIZE });
      const totalCount = first.data.total;
      let items = first.data.items;

      const pages = Math.min(Math.ceil(totalCount / PAGE_SIZE), MAX_PAGES);
      if (pages > 1) {
        const rest = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) =>
            AdminService.getAdminUsers({ ...filtros, page: i + 2, size: PAGE_SIZE })),
        );
        items = items.concat(...rest.map(r => r.data.items));
      }

      if (id !== requestId.current) return;
      setUsers(items);
      setTotal(totalCount);
      setTruncated(items.length < totalCount);
    } catch (err) {
      if (id === requestId.current) showToast('Error al cargar usuarios', 'error');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [debouncedSearch, roleFilter, showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  /**
   * Con el filtro de rol activo el backend ya devolvio solo usuarios de ese rol,
   * asi que todos van a ese unico bloque (aunque tengan un rol mas alto).
   * Los grupos vacios no se renderizan: nada de encabezados con "(0)".
   */
  const groups = useMemo(() => {
    const buckets = new Map<GroupKey, User[]>(ROLE_GROUPS.map(g => [g.key, []]));
    const forced = ROLE_GROUPS.find(g => g.key === roleFilter)?.key;
    users.forEach(u => buckets.get(forced ?? groupKeyFor(u))!.push(u));

    return ROLE_GROUPS
      .map(g => ({ ...g, users: (buckets.get(g.key) ?? []).sort(byName) }))
      .filter(g => g.users.length > 0);
  }, [users, roleFilter]);

  const cargados = users.length;
  const stats = [
    { label: 'Total Usuarios', value: total, sub: undefined as string | undefined, icon: <Users />, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100/70 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/40' },
    { label: 'Administradores', value: users.filter(u => (u.roles ?? []).includes('ADMIN')).length, sub: truncated ? `de ${cargados} cargados` : undefined, icon: <Shield />, color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100/70 dark:bg-purple-500/20', border: 'border-purple-200 dark:border-purple-500/40' },
    { label: 'Activos', value: users.filter(u => u.estado === 'ACTIVO').length, sub: truncated ? `de ${cargados} cargados` : undefined, icon: <CheckCircle2 />, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/40' },
    { label: 'Inactivos', value: users.filter(u => u.estado !== 'ACTIVO').length, sub: truncated ? `de ${cargados} cargados` : undefined, icon: <XCircle />, color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-100/70 dark:bg-rose-500/20', border: 'border-rose-200 dark:border-rose-500/40' },
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
          {formatApiDate(user.creadoEn, { day: 'numeric', month: 'short', year: 'numeric' })}
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:border-slate-600 border'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
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
              {stat.sub && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{stat.sub}</p>}
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

      {truncated && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
            Mostrando los primeros {cargados} de {total} usuarios. Afina la búsqueda o el filtro de rol para ver el resto.
          </p>
        </div>
      )}

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
              /* El scroll vertical vive aqui (no en <main>) para que los encabezados
                 sticky tengan un scrollport propio contra el cual fijarse. */
              <div className="overflow-auto flex-1 max-h-[70vh] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50">
                      {['Usuario', 'Contacto', 'Rol', 'Registro', 'Estado'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {groups.map(group => {
                      const badge = getGroupBadge(group.key);
                      const collapsed = collapsedGroups.includes(group.key);
                      return (
                        <React.Fragment key={group.key}>
                          <tr>
                            {/* El fondo opaco va en la celda: el tinte del rol es
                                translucido en dark y dejaria ver las filas debajo. */}
                            <td colSpan={5} className="p-0 sticky top-0 z-20 bg-white dark:bg-slate-800">
                              <button
                                type="button"
                                onClick={() => toggleGroup(group.key)}
                                aria-expanded={!collapsed}
                                className={`w-full flex items-center gap-2.5 px-6 py-3 border-b-2 ${badge.bg} ${badge.border} hover:brightness-95 dark:hover:brightness-125 transition-all`}
                              >
                                <GroupHeaderContent group={group} collapsed={collapsed} />
                              </button>
                            </td>
                          </tr>
                          {!collapsed && group.users.map(renderRow)}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 space-y-8 flex-1 bg-slate-50/20 dark:bg-slate-900/10">
                {groups.map(group => {
                  const badge = getGroupBadge(group.key);
                  const collapsed = collapsedGroups.includes(group.key);
                  return (
                    <section key={group.key}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.key)}
                        aria-expanded={!collapsed}
                        className={`w-full flex items-center gap-2.5 px-5 py-3 rounded-2xl border-b-2 border ${badge.bg} ${badge.border} hover:brightness-95 dark:hover:brightness-125 transition-all`}
                      >
                        <GroupHeaderContent group={group} collapsed={collapsed} />
                      </button>

                      {!collapsed && (
                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 xxl:grid-cols-4 gap-6">
                          {group.users.map((user, idx) => {
                            const isActive = user.estado === 'ACTIVO';
                            const initials = `${(user.nombre ?? '').charAt(0)}${(user.apellido ?? '').charAt(0)}`.toUpperCase() || '?';
                            const roles = (user.roles ?? []).length ? user.roles : [''];

                            return (
                              <motion.div key={user.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                                className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-800/50 transition-all">
                                <div className="flex items-start justify-between mb-5">
                                   <div className="size-14 rounded-[22px] bg-gradient-to-br from-blue-500/10 to-indigo-600/10 dark:from-blue-500/20 dark:to-indigo-600/20 border border-blue-50 dark:border-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg font-black tracking-tighter shadow-inner">
                                     {initials}
                                   </div>
                                   <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">#{user.id.slice(0, 8).toUpperCase()}</p>
                                </div>

                                <div className="space-y-1 mb-5">
                                   <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{user.nombre} {user.apellido}</h3>
                                   <div className="flex flex-wrap items-center gap-1.5">
                                     {roles.map(rol => {
                                       const cardBadge = getRoleBadge([rol]);
                                       return (
                                         <span key={rol} className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${cardBadge.bg} ${cardBadge.color} ${cardBadge.border}`}>
                                           {cardBadge.label}
                                         </span>
                                       );
                                     })}
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
                                      <p className="text-[10px] font-black text-slate-400 uppercase">{formatApiDate(user.creadoEn, { month: 'long', year: 'numeric' })}</p>
                                   </div>
                                   <div className={`size-8 rounded-full border-2 border-white dark:border-slate-700 shadow-sm ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cargados} de {total} registros</span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {groups.map(g => `${g.label} ${g.users.length}`).join(' · ')}
               </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
