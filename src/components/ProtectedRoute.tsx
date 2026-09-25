import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Rol, rutaInicialPorRol } from '../utils/auth';
import PantallaCarga from './PantallaCarga';

/**
 * Guard de navegación por rol.
 *
 * Hasta ahora ninguna ruta estaba protegida: `/admin/usuarios` se abría sin
 * sesión con solo escribirla en la barra de direcciones. Esto es control de
 * navegación, no de seguridad —la autorización real vive en el backend—, pero
 * evita que la app muestre pantallas que el usuario no puede usar.
 */
export default function ProtectedRoute({
  roles,
  children,
}: {
  /** Roles con acceso. Si se omite, basta con tener sesión iniciada. */
  roles?: Rol[];
  children: React.ReactNode;
}) {
  const { isAuthenticated, roles: rolesUsuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <PantallaCarga mensaje="Verificando sesión..." />;

  if (!isAuthenticated) {
    // `from` permite volver a donde iba después de iniciar sesión.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const permitido = !roles || roles.some((r) => rolesUsuario.includes(r));
  if (!permitido) {
    return <Navigate to={rutaInicialPorRol(rolesUsuario)} replace />;
  }

  return <>{children}</>;
}
