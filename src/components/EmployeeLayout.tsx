import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  PlusCircle,
  Truck,
  ClipboardList,
  Bell,
  LogOut,
  X,
  AlertCircle,
  Activity,
  Cloud,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeeLayoutProps {
  children: React.ReactNode;
  user: any;
}

export default function EmployeeLayout({ children, user }: EmployeeLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showError, setShowError] = useState(false); // Can be triggered by system errors

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('usuario');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-white text-[#1e3a5f] shadow-lg'
        : 'text-slate-200 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* BEGIN: LeftSidebar */}
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: 0, width: isSidebarOpen ? 256 : 72 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-[#1e3a5f] border-r border-gray-900 shadow-2xl flex flex-col flex-shrink-0 z-20 overflow-hidden"
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain flex-shrink-0" />
            {isSidebarOpen && (
              <span className="font-bold text-lg whitespace-nowrap">
                <span className="text-white">Florería </span>
                <span className="text-[#eab308]">Bautista</span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <Link to="/dashboard" className={navLinkClass('/dashboard')}>
            <Home className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Inicio</span>}
          </Link>

          <Link to="/empleado/pedidos" className={navLinkClass('/empleado/pedidos')}>
            <ShoppingBag className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Pedidos</span>}
          </Link>

          <Link to="/empleado/venta-rapida" className={navLinkClass('/empleado/venta-rapida')}>
            <PlusCircle className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Venta Rápida</span>}
          </Link>

          <Link to="/empleado/registrar-pedido" className={navLinkClass('/empleado/registrar-pedido')}>
            <ClipboardList className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Pedido Físico</span>}
          </Link>

          <Link to="/empleado/entregas" className={navLinkClass('/empleado/entregas')}>
            <Truck className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Entregas</span>}
          </Link>

          <Link to="/empleado/inventario" className={navLinkClass('/empleado/inventario')}>
            <ClipboardList className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Inventario</span>}
          </Link>

          {isSidebarOpen ? (
            <div className="pt-6 pb-2 px-3">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Sistema</span>
            </div>
          ) : (
            <div className="pt-4 border-t border-white/10 mt-4" />
          )}

          <Link
            to="/notificaciones"
            className={`flex items-center ${isSidebarOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2.5 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all group`}
          >
            <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : ''}`}>
              <Bell className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span>Notificaciones</span>}
            </div>
            {isSidebarOpen && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">3</span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className={`w-full text-red-300 hover:bg-red-900/50 flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg text-sm font-medium transition-colors mt-8`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Cerrar Sesión</span>}
          </button>

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`w-full text-slate-400 hover:bg-white/10 hover:text-white flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg text-sm font-medium transition-colors`}
            title={isSidebarOpen ? 'Contraer sidebar' : 'Expandir sidebar'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5 flex-shrink-0" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 flex-shrink-0" />
            )}
            {isSidebarOpen && <span>Contraer sidebar</span>}
          </button>
        </nav>

        {/* Status Indicator */}
        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'} p-3 rounded-xl bg-white/10`}>
            <Activity className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            {isSidebarOpen && (
              <div>
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Sesión</p>
                <p className="text-xs font-semibold text-white">En línea</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
      {/* END: LeftSidebar */}

      {/* Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* BEGIN: TopNavbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0 z-10">
          {/* Left side of header */}
          <div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">Panel de Ventas</h2>
          </div>

          {/* Right side of header */}
          <div className="flex items-center gap-6">
            {/* Notification Icon */}
            <button className="relative p-2 text-gray-400 hover:text-[#1e3a5f] transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-[#1e3a5f]">{user?.name || 'Juan Pérez'}</p>
                <p className="text-xs text-gray-400 capitalize">Empleado de Ventas</p>
              </div>
              <div className="relative">
                <img
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCzCV9ts9T2_K_tTgV_0M_ZYJNV9mEnhkvGa7qDtXK2aPuNsu_56CyYvy6dBZL7_g7ftd1Hwz23LsnXWReDheXL-sawX0VvmltjhVX1XeJxtrXUSmvbHQvY7ps3PlOTD2aUy9bWQUk18JMOZylHTwPZUZ8MSBs-3cs_bwBMoo0cJMgNtxURHFmsiv4P29gdI8oMt_9iPJlJ0pg7DM96BDRyAHa1W--Xw6OuuMSL8o7NU8hRJVBd2u4Azto9MI7OTcdu-tS4AsmJJ8IH"}
                />
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white"></span>
              </div>
            </div>
          </div>
        </header>
        {/* END: TopNavbar */}

        {/* BEGIN: MainContentArea */}
        <main className="flex-1 overflow-y-auto bg-slate-100 relative p-4 md:p-6 lg:p-8 custom-scrollbar">
          {/* Error Banner (Conditional State) */}
          <AnimatePresence>
            {showError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-lg z-50 px-4"
              >
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <p className="text-sm text-red-700 font-medium">Error al cargar datos. Por favor, reintente.</p>
                  </div>
                  <button className="text-red-500 hover:text-red-700" onClick={() => setShowError(false)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-[2rem] shadow-sm p-6 md:p-8 min-h-full flex flex-col w-full"
          >
            {children}
          </motion.div>
        </main>
        {/* END: MainContentArea */}
      </div>
    </div>
  );
}
