import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Settings,
  Wrench,
  Bell,
  LogOut,
  ChevronDown,
  PanelLeftClose,
  Database,
  Activity,
  ArrowLeftRight,
  Layout as LayoutIcon,
  Library,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminLayoutProps {
  children: React.ReactNode;
  user: any;
}

const TECH_OPS_ITEMS = [
  { to: "/admin/respaldos",  icon: Database,        label: "Respaldos manuales"    },
  { to: "/admin/datos",      icon: ArrowLeftRight,  label: "Exportación / importación" },
  { to: "/admin/monitoreo",  icon: Activity,        label: "Monitoreo base de datos" },
];

export default function AdminLayout({ children, user }: AdminLayoutProps) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTechOpsOpen, setIsTechOpsOpen] = useState(
    TECH_OPS_ITEMS.some((item) => location.pathname.startsWith(item.to)),
  );

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("usuario");
    window.location.href = "/";
  };

  const isActive = (path: string) => location.pathname === path;
  const isTechActive = TECH_OPS_ITEMS.some((item) =>
    location.pathname.startsWith(item.to),
  );

  const Label = ({ children: text }: { children: string }) => (
    <AnimatePresence initial={false}>
      {isSidebarOpen && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.18 }}
          className="whitespace-nowrap overflow-hidden"
        >
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  );

  const linkCls = (active: boolean) =>
    `flex items-center rounded-xl text-sm font-semibold transition-all duration-200 py-3 ${
      isSidebarOpen ? "px-4 gap-3" : "justify-center px-0"
    } ${
      active 
        ? "bg-white dark:bg-blue-600 text-[#1e3a5f] dark:text-white shadow-lg shadow-white/10 dark:shadow-blue-500/20 scale-[1.02]" 
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors">
      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: 0, width: isSidebarOpen ? 256 : 72 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="bg-[#1e3a5f] dark:bg-[#0f172a] border-r border-black/30 dark:border-white/5 shadow-2xl flex flex-col flex-shrink-0 z-20 overflow-hidden transition-colors"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-[18px] border-b border-white/10 overflow-hidden">
          <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src="/Logo.png"
                alt="Logo"
                className="w-8 h-8 object-contain relative z-10"
              />
              <div className="absolute inset-0 bg-[#FBBF24] blur-lg opacity-20 animate-pulse" />
            </div>
            <AnimatePresence initial={false}>
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-bold text-lg whitespace-nowrap"
                >
                  <span className="text-white">Florería </span>
                  <span className="text-[#eab308]">Bautista</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar">
          {/* 1. Dashboard */}
          <Link to="/dashboard" className={linkCls(isActive("/dashboard"))}>
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <Label>Dashboard</Label>
          </Link>

          {/* 2. Pedidos */}
          <Link to="/admin/pedidos" className={linkCls(location.pathname.startsWith("/admin/pedidos"))}>
            <ShoppingCart className="w-5 h-5 flex-shrink-0" />
            <Label>Pedidos</Label>
          </Link>

          {/* 3. Catálogos */}
          <Link to="/admin/catalogos" className={linkCls(location.pathname.startsWith("/admin/catalogos"))}>
            <Library className="w-5 h-5 flex-shrink-0" />
            <Label>Catálogos</Label>
          </Link>


          {/* 4. Productos */}
          <Link to="/admin/catalogo" className={linkCls(location.pathname === "/admin/catalogo" || location.pathname.startsWith("/admin/productos"))}>
            <ShoppingBag className="w-5 h-5 flex-shrink-0" />
            <Label>Productos</Label>
          </Link>

          {/* 5. Inventario */}
          <Link to="/admin/inventario" className={linkCls(location.pathname.startsWith("/admin/inventario"))}>
            <Package className="w-5 h-5 flex-shrink-0" />
            <Label>Inventario</Label>
          </Link>


          {/* 6. Promociones */}
          <Link to="/admin/promociones" className={linkCls(location.pathname.startsWith("/admin/promociones"))}>
            <Tag className="w-5 h-5 flex-shrink-0" />
            <Label>Promociones</Label>
          </Link>

          {/* 7. Usuarios */}
          <Link to="/admin/usuarios" className={linkCls(isActive("/admin/usuarios"))}>
            <Users className="w-5 h-5 flex-shrink-0" />
            <Label>Usuarios</Label>
          </Link>

          {/* 8. Reportes */}
          <Link to="/admin/reportes" className={linkCls(isActive("/admin/reportes"))}>
            <BarChart3 className="w-5 h-5 flex-shrink-0" />
            <Label>Reportes</Label>
          </Link>

          {/* 9. CMS — Personalizar */}
          <Link to="/admin/cms" className={linkCls(isActive("/admin/cms"))}>
            <LayoutIcon className="w-5 h-5 flex-shrink-0" />
            <Label>Personalizar Sitio</Label>
          </Link>

          {/* 10. Configuración */}
          <Link to="/admin/configuracion" className={linkCls(isActive("/admin/configuracion"))}>
            <Settings className="w-5 h-5 flex-shrink-0" />
            <Label>Configuración</Label>
          </Link>

          {/* Divider — Sistema */}
          <div className="py-3">
            <AnimatePresence initial={false} mode="wait">
              {isSidebarOpen ? (
                <motion.p key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Sistema
                </motion.p>
              ) : (
                <motion.div key="line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-white/10 mx-2" />
              )}
            </AnimatePresence>
          </div>

          {/* 9. Operación técnica (submenu) */}
          <div>
            <button
              onClick={() => setIsTechOpsOpen((v) => !v)}
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-colors duration-150 py-2.5 ${
                isSidebarOpen ? "px-3 gap-3 justify-between" : "justify-center px-0"
              } ${
                isTechActive || isTechOpsOpen
                  ? "text-white bg-white/10"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className={`flex items-center ${isSidebarOpen ? "gap-3" : ""}`}>
                <Wrench className="w-5 h-5 flex-shrink-0" />
                <Label>Operación técnica</Label>
              </div>
              <AnimatePresence initial={false}>
                {isSidebarOpen && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <motion.div animate={{ rotate: isTechOpsOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            <AnimatePresence initial={false}>
              {isTechOpsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className={`mt-1 space-y-0.5 ${isSidebarOpen ? "ml-4 pl-2 border-l-2 border-white/20" : ""}`}>
                    {TECH_OPS_ITEMS.map(({ to, icon: Icon, label }) => (
                      <Link key={to} to={to} title={!isSidebarOpen ? label : undefined}
                        className={`flex items-center rounded-lg text-xs font-semibold transition-colors duration-150 py-2 ${
                          isSidebarOpen ? "px-3 gap-3" : "justify-center px-0"
                        } ${isActive(to) ? "text-white bg-white/20" : "text-slate-300 hover:text-white hover:bg-white/10"}`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <AnimatePresence initial={false}>
                          {isSidebarOpen && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="whitespace-nowrap">
                              {label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-xl text-sm font-medium transition-colors duration-150 text-red-400 hover:bg-red-900/20 py-2.5 mt-4 ${
              isSidebarOpen ? "px-3 gap-3" : "justify-center px-0"
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <Label>Cerrar Sesión</Label>
          </button>
        </nav>

        {/* Status footer replaced by Collapse button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setIsSidebarOpen((v) => !v)}
            className={`w-full flex items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all ${
              isSidebarOpen ? "gap-3" : "justify-center"
            }`}
          >
            <motion.div animate={{ rotate: isSidebarOpen ? 0 : 180 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
              <PanelLeftClose className="w-6 h-6 flex-shrink-0" />
            </motion.div>
            <AnimatePresence initial={false}>
              {isSidebarOpen && (
                <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} className="text-xs font-bold uppercase tracking-wider">
                  Contraer Menú
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopNavbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-8 flex-shrink-0 z-10 transition-colors">
          <div>
            <h2 className="text-lg font-bold text-[#1e3a5f] dark:text-white">
              Panel de Administración
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/notificaciones"
              className="relative p-2 text-gray-400 hover:text-[#1e3a5f] transition-colors"
            >
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-[#1e3a5f] dark:text-slate-200">
                  {user?.nombre ?? user?.name ?? "Administrador"}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 capitalize">
                  {user?.role || "Propietario"}
                </p>
              </div>
              <div className="relative">
                <img
                  alt="User Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgTQQ5CBal8__PmS7Awrv1-fEp4q5CAO4Jt7MqYur9BTUz29a2MniHPTWKDsN2eJeL8vTqO-jMaQDCaZlW5LIJMmXBwuusCuRVHGIDhDExspzTrxR7AxSuk-wzQvi51g_i9_Rhe1U71ywspcwAjxPpDdA66-mLWUipNQAoP34Lt27PfskwxTq8OkFhAwjuNTKjgAHKimkyu7iocxIr09nI1u0fFSmgiYusQeMfs7L39kYy2NnCSMYkFfzTIgoeJCIerdglChmD-Jxc"
                />
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 md:p-6 lg:p-8 custom-scrollbar transition-colors">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-full flex flex-col w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
