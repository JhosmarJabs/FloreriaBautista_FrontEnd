import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { rutaInicialPorRol } from '../utils/auth';

export default function Navigation() {
  // La sesión viene del contexto: este componente borraba solo la clave 'user'
  // al salir y dejaba intactos 'usuario' y 'accessToken', así que el botón
  // "Salir" no cerraba nada.
  const { usuario, roles, isAuthenticated, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <img src="/Logo-sm.webp" alt="Florería Bautista Logo" className="h-10 w-auto" width={32} height={40} />
          <span className="text-2xl font-serif font-bold text-brand-deep tracking-tight">
            Florería <span className="text-[#D4AF37]">Bautista</span>
          </span>
        </Link>
        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-8 font-semibold text-sm uppercase tracking-wide">
          <Link className="nav-link" to="/">Inicio</Link>
          {isAuthenticated && <Link className="nav-link" to={rutaInicialPorRol(roles)}>Panel</Link>}
          <Link className="nav-link" to="/catalogo">Catálogo</Link>
          <Link className="nav-link" to="/testimonios">Testimonios</Link>
          <Link className="nav-link" to="/nosotros">Nosotros</Link>
          <Link className="nav-link" to="/contacto">Contacto</Link>
        </div>
        {/* CTA */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-brand-deep font-semibold">
                <User className="w-5 h-5" />
                <span>{usuario?.nombre}</span>
              </div>
              <button 
                onClick={logout}
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
