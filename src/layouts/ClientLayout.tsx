import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { useCart } from "../hooks/useCart";

const menuItems = [
  { name: "Inicio", href: "/" },
  { name: "Catálogo", href: "#categorias" },
  { name: "Ofertas", href: "#promo" },
  { name: "Eventos", href: "#productos" },
];

export function NavbarCliente() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { cartCount } = useCart();
  const [cartBounce, setCartBounce] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#1A3B5B] shadow-md ${
        isScrolled ? "py-2" : "py-3"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="h-16 flex items-center px-6">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/Logo.png"
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-lg">
                <span className="text-white">Florería </span>
                <span className="text-[#eab308]">Bautista</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm font-medium text-white hover:text-[#FBBF24] transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Section: Search, Icons, User */}
          <div className="flex items-center gap-6">
            {/* Search Bar - Desktop */}
            <div className="relative hidden lg:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar flores..."
                className="bg-[#2A4B6B] border-none rounded-md py-1.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[#FBBF24] w-64 text-white placeholder-gray-400 outline-none"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4">
              {/* Cart */}
              <button
                type="button"
                className={`relative text-white hover:text-[#FBBF24] transition-all duration-200 ${
                  cartBounce ? "scale-110" : ""
                }`}
                aria-label="Carrito"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FBBF24] text-[#1A3B5B] text-[10px] font-bold px-1.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Notifications */}
              <button
                type="button"
                className="text-white hover:text-[#FBBF24] transition-colors duration-200"
                aria-label="Notificaciones"
              >
                <Bell className="w-6 h-6" />
              </button>
            </div>

            {/* User Profile - Desktop */}
            <div className="relative hidden md:flex items-center gap-3 border-l border-white/20 pl-6">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 focus:outline-none"
              >
                <div className="text-right">
                  <p className="text-xs font-bold leading-none text-white">
                    Carlos Pérez
                  </p>
                  <p className="text-[10px] text-[#FBBF24]">Cliente Oro</p>
                </div>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAL5B7o0eYjhGqhLycfFtW4PpBS7W-W4kLefdjYutzUVrqm7FFGlQTTQZr63LG5KENIVBXdC6cEozgkYjclBhMPqRCAg3CWRCSoVAmv3XAWHNfstqdNlme9ASbmfxPUJEDn90cw9OS4oQeoJR0-mDGbooVafT20ymwfX9p-WdnNtFc-CR7KhB7_2qyzIumRFHqiKkSayVBaSRS_dVhwty6IZAk_jlrqC2kDG2Hstoh3mNebr4U-KUTXzCmlhFACxcMhzcrGu105ldvc"
                  alt="User Profile"
                  className="w-10 h-10 rounded-full border-2 border-[#FBBF24]"
                />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                  <Link
                    to="/admin/configuracion"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" /> Configuración de perfil
                  </Link>
                  <button
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden text-white hover:text-[#FBBF24] transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menú"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? "max-h-[500px] mt-4" : "max-h-0"
          }`}
        >
          {/* Mobile Search */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar flores..."
              className="w-full bg-[#2A4B6B] border-none rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[#FBBF24] text-white placeholder-gray-400 outline-none"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </div>
          </div>

          {/* Mobile User Info */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/20">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAL5B7o0eYjhGqhLycfFtW4PpBS7W-W4kLefdjYutzUVrqm7FFGlQTTQZr63LG5KENIVBXdC6cEozgkYjclBhMPqRCAg3CWRCSoVAmv3XAWHNfstqdNlme9ASbmfxPUJEDn90cw9OS4oQeoJR0-mDGbooVafT20ymwfX9p-WdnNtFc-CR7KhB7_2qyzIumRFHqiKkSayVBaSRS_dVhwty6IZAk_jlrqC2kDG2Hstoh3mNebr4U-KUTXzCmlhFACxcMhzcrGu105ldvc"
              alt="User Profile"
              className="w-10 h-10 rounded-full border-2 border-[#FBBF24]"
            />
            <div>
              <p className="text-sm font-bold text-white">Carlos Pérez</p>
              <p className="text-xs text-[#FBBF24]">Cliente Oro</p>
            </div>
          </div>

          {/* Mobile Nav Links */}
          <nav className="flex flex-col gap-1 pb-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="px-4 py-3 text-white hover:text-[#FBBF24] hover:bg-[#2A4B6B] rounded-lg transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
