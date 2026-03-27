import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Package,
  CreditCard,
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
  ShieldAlert,
  Cloud,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminLayoutProps {
  children: React.ReactNode;
  user: any;
}

const TECH_OPS_ITEMS = [
  { to: "/admin/respaldos", icon: Database, label: "Respaldos manuales" },
  { to: "/admin/monitoreo", icon: Activity, label: "Monitoreo de sistema" },
  { to: "/admin/datos", icon: ArrowLeftRight, label: "Gestión de datos" },
  { to: "/admin/auditoria", icon: ShieldAlert, label: "Auditoría" },
];

const MAIN_NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/catalogo", icon: ShoppingBag, label: "Catálogo" },
  { to: "/admin/pedidos", icon: ShoppingCart, label: "Pedidos" },
  { to: "/admin/inventario", icon: Package, label: "Inventario" },
  { to: "/admin/pagos", icon: CreditCard, label: "Pagos" },
  { to: "/admin/reportes", icon: BarChart3, label: "Reportes" },
  { to: "/admin/usuarios", icon: Users, label: "Usuarios" },
];

export default function AdminLayout({ children, user }: AdminLayoutProps) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTechOpsOpen, setIsTechOpsOpen] = useState(
    TECH_OPS_ITEMS.some((item) => location.pathname.startsWith(item.to)),
  );

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("usuario");
    window.location.href = "/";
  };

  const isActive = (path: string) => location.pathname === path;
  const isTechActive = TECH_OPS_ITEMS.some((item) =>
    location.pathname.startsWith(item.to),
  );

  /* ── label fade helper ── */
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
    `flex items-center rounded-xl text-sm font-medium transition-colors duration-150 py-2.5 ${
      isSidebarOpen ? "px-3 gap-3" : "justify-center px-0"
    } ${active ? "bg-white text-[#1e3a5f] shadow-md" : "text-slate-200 hover:bg-white/10 hover:text-white"}`;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: 0, width: isSidebarOpen ? 256 : 72 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="bg-[#1e3a5f] border-r border-black/30 shadow-2xl flex flex-col flex-shrink-0 z-20 overflow-hidden"
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

          {/* Main items */}
          {MAIN_NAV.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className={linkCls(isActive(to))}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <Label>{label}</Label>
            </Link>
          ))}

          {/* Sistema divider */}
          <div className="py-3">
            <AnimatePresence initial={false} mode="wait">
              {isSidebarOpen ? (
                <motion.p
                  key="label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest"
                >
                  Sistema
                </motion.p>
              ) : (
                <motion.div
                  key="line"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-t border-white/10 mx-2"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Tech Ops */}
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
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <motion.div
                      animate={{ rotate: isTechOpsOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence initial={false}>
              {isTechOpsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div
                    className={`mt-1 space-y-0.5 ${
                      isSidebarOpen
                        ? "ml-4 pl-2 border-l-2 border-white/20"
                        : ""
                    }`}
                  >
                    {TECH_OPS_ITEMS.map(({ to, icon: Icon, label }) => (
                      <Link
                        key={to}
                        to={to}
                        title={!isSidebarOpen ? label : undefined}
                        className={`flex items-center rounded-lg text-xs font-semibold transition-colors duration-150 py-2 ${
                          isSidebarOpen ? "px-3 gap-3" : "justify-center px-0"
                        } ${
                          isActive(to)
                            ? "text-white bg-white/20"
                            : "text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <AnimatePresence initial={false}>
                          {isSidebarOpen && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="whitespace-nowrap"
                            >
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

          {/* Configuración */}
          <Link
            to="/admin/configuracion"
            className={linkCls(isActive("/admin/configuracion"))}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <Label>Configuración</Label>
          </Link>

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-xl text-sm font-medium transition-colors duration-150 text-red-300 hover:bg-red-900/40 py-2.5 mt-4 ${
              isSidebarOpen ? "px-3 gap-3" : "justify-center px-0"
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <Label>Cerrar Sesión</Label>
          </button>

          {/* Toggle */}
          <button
            onClick={() => setIsSidebarOpen((v) => !v)}
            title={isSidebarOpen ? "Contraer sidebar" : "Expandir sidebar"}
            className={`w-full flex items-center rounded-xl text-sm font-medium transition-colors duration-150 text-slate-400 hover:bg-white/10 hover:text-white py-2.5 ${
              isSidebarOpen ? "px-3 gap-3" : "justify-center px-0"
            }`}
          >
            <motion.div
              animate={{ rotate: isSidebarOpen ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <PanelLeftClose className="w-5 h-5 flex-shrink-0" />
            </motion.div>
            <Label>Contraer sidebar</Label>
          </button>
        </nav>

        {/* Status footer */}
        <div className="p-3 border-t border-white/10">
          <div
            className={`flex items-center p-3 rounded-xl bg-white/10 ${
              isSidebarOpen ? "gap-3" : "justify-center"
            }`}
          >
            <Cloud className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <AnimatePresence initial={false}>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    Estado del servidor
                  </p>
                  <p className="text-xs font-semibold text-white">
                    Conectado y Seguro
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopNavbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">
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
                <p className="text-sm font-semibold text-[#1e3a5f]">
                  {user?.nombre ?? user?.name ?? "Administrador"}
                </p>
                <p className="text-xs text-gray-400 capitalize">
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
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-6 lg:p-8 custom-scrollbar">
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
