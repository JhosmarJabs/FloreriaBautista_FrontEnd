import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <img src="/Logo.png" alt="Florería Bautista Logo" className="h-10 w-auto" />
          <span className="text-2xl font-serif font-bold text-brand-deep tracking-tight">
            Florería <span className="text-[#D4AF37]">Bautista</span>
          </span>
        </Link>
        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-8 font-semibold text-sm uppercase tracking-wide">
          <Link className="nav-link" to="/">Inicio</Link>
          {user && <Link className="nav-link" to="/dashboard">Panel</Link>}
          <Link className="nav-link" to="/catalogo">Catálogo</Link>
          <Link className="nav-link" to="/testimonios">Testimonios</Link>
          <Link className="nav-link" to="/nosotros">Nosotros</Link>
          <Link className="nav-link" to="/contacto">Contacto</Link>
        </div>
        {/* CTA */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-brand-deep font-semibold">
                <User className="w-5 h-5" />
                <span>{user.name}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600 font-bold flex items-center gap-1"
              >
                <LogOut className="w-5 h-5" />
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <Link className="text-white px-6 py-2.5 rounded-custom font-bold hover:bg-opacity-90 transition-all shadow-md flex items-center gap-2 bg-brand-deep" to="/login">
              <span>Iniciar sesión</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
