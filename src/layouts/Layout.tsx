import React, { Suspense, useRef } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import AnimatedRoutes from '../routes/AppRoutes';
import { useAuth } from '../hooks/useAuth';
import { useAlAcercarse } from '../hooks/useAlAcercarse';
import RutaErrorBoundary from '../components/RutaErrorBoundary';

const AdminLayout = React.lazy(() => import('../layouts/AdminLayout'));
const EmployeeLayout = React.lazy(() => import('../layouts/EmployeeLayout'));
const NavbarCliente = React.lazy(() => import('../components/NavbarCliente').then(m => ({ default: m.NavbarCliente })));

const Footer = React.lazy(() => import('../components/Footer'));

/** El footer siempre empieza fuera de la primera pantalla (el contenido tiene
 *  min-h-screen): se monta al acercarse, no durante la carga inicial. */
function FooterDiferido() {
  const centinela = useRef<HTMLDivElement>(null);
  const cerca = useAlAcercarse(centinela);
  return (
    <>
      <div ref={centinela} aria-hidden="true" className="h-px" />
      {cerca && <Suspense fallback={null}><Footer /></Suspense>}
    </>
  );
}

const initDataService = () => import('../services/dataService').then(m => m.DataService.init());

export default function Layout() {
  const location = useLocation();
  const { usuario, esAdmin, esEmpleado, esCliente } = useAuth();

  const hideNavAndFooter = ['/login', '/registro', '/recuperar-contrasena', '/restablecer-contrasena'].includes(location.pathname);
  // Permite a un admin/empleado ver la tienda pública sin ser rebotado al dashboard
  // (usado por el botón "Ver tienda" en /admin/cms)
  const isPreview = new URLSearchParams(location.search).get('preview') === '1';

  if (esCliente && location.pathname === '/' && !hideNavAndFooter) {
    return <Navigate to="/inicio" replace />;
  }

  if ((esAdmin || esEmpleado) && !hideNavAndFooter) {
    initDataService();
    if ((esEmpleado && !esAdmin) || (esAdmin && location.pathname.startsWith('/empleado'))) {
      return (
        <RutaErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={null}>
            <EmployeeLayout user={usuario}>
              <RutaErrorBoundary resetKey={location.pathname}>
                <AnimatedRoutes />
              </RutaErrorBoundary>
            </EmployeeLayout>
          </Suspense>
        </RutaErrorBoundary>
      );
    }

    if (!isPreview && (location.pathname === '/' || location.pathname === '/dashboard')) {
      return <Navigate to={esAdmin ? "/admin/dashboard" : "/empleado/dashboard"} replace />;
    }

    if (isPreview && (location.pathname === '/' || location.pathname === '/dashboard')) {
      return (
        <div className="bg-brand-light font-sans text-brand-deep overflow-x-hidden min-h-screen flex flex-col">
          <div className="sticky top-0 z-50 bg-slate-900 text-white text-xs font-bold text-center py-2 px-4">
            Vista previa del sitio público — los cambios no publicados no se ven aquí.{' '}
            <button onClick={() => window.close()} className="underline hover:text-slate-300">Cerrar</button>
          </div>
          <Navigation />
          <div className="flex-grow min-h-screen">
            <AnimatedRoutes />
          </div>
          <FooterDiferido />
        </div>
      );
    }

    return (
      // Dos niveles: el exterior cubre el chunk del propio layout; el interior (solo el
      // contenido) deja visible el menú cuando una sección no visitada no carga sin red.
      <RutaErrorBoundary resetKey={location.pathname}>
        <Suspense fallback={null}>
          <AdminLayout user={usuario}>
            <RutaErrorBoundary resetKey={location.pathname}>
              <AnimatedRoutes />
            </RutaErrorBoundary>
          </AdminLayout>
        </Suspense>
      </RutaErrorBoundary>
    );
  }

  return (
    // Dos niveles: el exterior cubre la barra del cliente (otro chunk diferido); el
    // interior, solo el contenido, conserva encabezado y pie si una página no carga sin red.
    <RutaErrorBoundary resetKey={location.pathname}>
    <div className="bg-brand-light font-sans text-brand-deep overflow-x-hidden min-h-screen flex flex-col">
      {!hideNavAndFooter && (esCliente ? <Suspense fallback={null}><NavbarCliente /></Suspense> : <Navigation />)}
      {/* min-h-screen: mientras la ruta lazy carga, el footer no debe quedar en
          pantalla, o salta hacia abajo al llegar el contenido (CLS). */}
      <div className="flex-grow min-h-screen">
        <RutaErrorBoundary resetKey={location.pathname}>
          <AnimatedRoutes />
        </RutaErrorBoundary>
      </div>
      {!hideNavAndFooter && <FooterDiferido />}
    </div>
    </RutaErrorBoundary>
  );
}
