import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingCart, Menu, X, Bell, Settings, LogOut, User, ChevronDown, PlusCircle } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { motion, AnimatePresence } from "motion/react";

const menuItems = [
  { name: "Inicio", href: "/" },
  { name: "Catálogo", href: "/catalogo" },
  { name: "Ofertas", href: "/ofertas" },
  { name: "Eventos", href: "/eventos" },
  { name: "Contacto", href: "/contacto" },
];

export function NavbarCliente() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { cartCount } = useCart();
  const [cartBounce, setCartBounce] = useState(false);
  const [user, setUser] = useState<any>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('usuario') || localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('usuario');
    window.location.href = '/';
  };

  useEffect(() => {
    if (cartCount > 0) {
      setCartBounce(true);
      const timeout = setTimeout(() => setCartBounce(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [cartCount]);
  
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? "py-3 bg-[#1A3B5B]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]" 
          : "py-5 bg-[#1A3B5B]"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center"
          >
            <Link to="/" className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/Logo.png"
                  alt="Logo"
                  className="w-8 h-8 object-contain relative z-10"
                />
                <div className="absolute inset-0 bg-[#FBBF24] blur-lg opacity-20 animate-pulse"></div>
              </div>
              <span className="font-bold text-xl tracking-tight">
                <span className="text-white">Florería </span>
                <span className="text-[#FBBF24]">Bautista</span>
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="relative text-sm font-bold text-white/80 hover:text-white transition-colors duration-300 group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FBBF24] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Right Section: Search, Icons, User */}
          <div className="flex items-center gap-8">
            {/* Search Bar - Desktop */}
            <motion.div 
              animate={{ width: isSearchFocused ? 280 : 200 }}
              className="relative hidden lg:block"
            >
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar flores..."
                className="w-full bg-white/10 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none focus:bg-white/20 focus:border-[#FBBF24]/50 transition-all duration-300"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
                <Search className="w-4 h-4" />
              </div>
            </motion.div>

            {/* Icons */}
            <div className="flex items-center gap-5">
              {/* Cart */}
              <Link
                to="/carrito"
                className="relative group"
                aria-label="Carrito"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  whileTap={{ scale: 0.9 }}
                  animate={cartBounce ? { scale: [1, 1.3, 1] } : {}}
                  className="text-white group-hover:text-[#FBBF24] transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                </motion.div>
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-2 -right-2 bg-[#FBBF24] text-[#1A3B5B] text-[10px] font-black px-1.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg shadow-black/20"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Notifications */}
              <Link to="/notificaciones">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-white hover:text-[#FBBF24] transition-colors relative"
                  aria-label="Notificaciones"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1A3B5B]"></span>
                </motion.button>
              </Link>
            </div>

            {/* User Profile - Desktop */}
            <div className="relative hidden md:flex items-center gap-4 border-l border-white/10 pl-8" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 focus:outline-none group"
              >
                <div className="text-right hidden xl:block">
                  <p className="text-xs font-black leading-none text-white group-hover:text-[#FBBF24] transition-colors">
                    {user?.nombre || user?.name || 'Usuario'}
                  </p>
                  <p className="text-[10px] text-[#FBBF24]/80 font-bold tracking-wider uppercase mt-1">
                    {user?.role === 'cliente' ? 'Cliente Oro' : user?.role || 'Invitado'}
                  </p>
                </div>
                <div className="relative">
                  <img
                    src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuAL5B7o0eYjhGqhLycfFtW4PpBS7W-W4kLefdjYutzUVrqm7FFGlQTTQZr63LG5KENIVBXdC6cEozgkYjclBhMPqRCAg3CWRCSoVAmv3XAWHNfstqdNlme9ASbmfxPUJEDn90cw9OS4oQeoJR0-mDGbooVafT20ymwfX9p-WdnNtFc-CR7KhB7_2qyzIumRFHqiKkSayVBaSRS_dVhwty6IZAk_jlrqC2kDG2Hstoh3mNebr4U-KUTXzCmlhFACxcMhzcrGu105ldvc"}
                    alt="User Profile"
                    className="w-9 h-9 rounded-full border-2 border-white/20 group-hover:border-[#FBBF24] transition-all duration-300 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full border-2 border-[#1A3B5B]"></div>
                </div>
                <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-4 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] py-3 z-50 border border-white/20"
                  >
                    <div className="px-4 py-2 border-b border-gray-100 mb-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mi Cuenta</p>
                    </div>
                    {(user?.role === 'empleado' || user?.role === 'staff' || user?.role === 'administrador' || user?.role === 'admin') && (
                      <Link
                        to="/empleado/venta-rapida"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <PlusCircle className="w-4 h-4" />
                        </div>
                        <span className="font-bold">Venta Rápida</span>
                      </Link>
                    )}
                    <Link
                      to="/configuracion"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Settings className="w-4 h-4" />
                      </div>
                      <span className="font-bold">Configuración</span>
                    </Link>
                    <Link
                      to="/mis-pedidos"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <span className="font-bold">Mis Pedidos</span>
                    </Link>
                    <div className="h-px bg-gray-100 my-2 mx-4"></div>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span className="font-bold">Cerrar sesión</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              className="md:hidden text-white hover:text-[#FBBF24] transition-colors p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menú"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-6 space-y-6">
                {/* Mobile Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar flores..."
                    className="w-full bg-white/10 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-white/40 outline-none focus:bg-white/20 transition-all"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    <Search className="w-5 h-5" />
                  </div>
                </div>

                {/* Mobile Nav Links */}
                <nav className="grid grid-cols-2 gap-3">
                  {menuItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center justify-center p-4 bg-white/5 rounded-2xl text-white font-bold hover:bg-white/10 transition-colors border border-white/5"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>

                {/* Mobile User Actions */}
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuAL5B7o0eYjhGqhLycfFtW4PpBS7W-W4kLefdjYutzUVrqm7FFGlQTTQZr63LG5KENIVBXdC6cEozgkYjclBhMPqRCAg3CWRCSoVAmv3XAWHNfstqdNlme9ASbmfxPUJEDn90cw9OS4oQeoJR0-mDGbooVafT20ymwfX9p-WdnNtFc-CR7KhB7_2qyzIumRFHqiKkSayVBaSRS_dVhwty6IZAk_jlrqC2kDG2Hstoh3mNebr4U-KUTXzCmlhFACxcMhzcrGu105ldvc"}
                      alt="User Profile"
                      className="w-12 h-12 rounded-full border-2 border-[#FBBF24]"
                    />
                    <div>
                      <p className="font-black text-white">{user?.nombre || user?.name || 'Usuario'}</p>
                      <p className="text-xs text-[#FBBF24] font-bold uppercase tracking-wider">{user?.role === 'cliente' ? 'Cliente Oro' : user?.role || 'Invitado'}</p>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Link
                      to="/notificaciones"
                      className="flex items-center gap-3 p-3 text-white/80 hover:text-white transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Bell className="w-5 h-5" />
                      <span className="font-bold">Notificaciones</span>
                    </Link>
                    <Link
                      to="/configuracion"
                      className="flex items-center gap-3 p-3 text-white/80 hover:text-white transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="w-5 h-5" />
                      <span className="font-bold">Configuración</span>
                    </Link>
                    {(user?.role === 'empleado' || user?.role === 'staff' || user?.role === 'administrador' || user?.role === 'admin') && (
                      <Link
                        to="/empleado/venta-rapida"
                        className="flex items-center gap-3 p-3 text-[#FBBF24] hover:text-white transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <PlusCircle className="w-5 h-5" />
                        <span className="font-bold">Venta Rápida</span>
                      </Link>
                    )}
                    <button
                      className="flex items-center gap-3 p-3 text-red-400 hover:text-red-300 transition-colors"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-bold">Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
