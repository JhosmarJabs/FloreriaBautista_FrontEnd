import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import Layout from './layouts/Layout';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ScrollToTop from './components/ScrollToTop';

const RealtimeWrapper = React.lazy(() => import('./components/RealtimeWrapper'));
const PwaCliente = React.lazy(() => import('./components/PwaCliente'));
const AvisoConexion = React.lazy(() => import('./components/AvisoConexion'));

/** El PWA es solo de la parte pública y del cliente: en el web privado no se monta. */
function LazyPwaCliente() {
  const { pathname } = useLocation();
  if (/^\/(admin|empleado)(\/|$)/.test(pathname)) return null;
  return (
    <Suspense fallback={null}>
      <PwaCliente />
    </Suspense>
  );
}

/** Aviso de conexión en toda la web (incluido /admin, que no entra al PWA). En
 *  /empleado lo da la pastilla del encabezado (EmployeeLayout). */
function LazyAvisoConexion() {
  const { pathname } = useLocation();
  if (/^\/empleado(\/|$)/.test(pathname)) return null;
  return (
    <Suspense fallback={null}>
      <AvisoConexion />
    </Suspense>
  );
}

function LazyRealtime() {
  const { esAdmin, esEmpleado } = useAuth();
  if (!esAdmin && !esEmpleado) return null;
  return (
    <Suspense fallback={null}>
      <RealtimeWrapper />
    </Suspense>
  );
}

function App() {
  // El hero de index.html vive fuera de #root. Si la ruta no lo adoptó (otra
  // página, o una redirección desde /), se retira. Corre tras los efectos de los hijos.
  useEffect(() => {
    const hero = document.getElementById('skeleton-hero');
    if (hero && !hero.dataset.adoptado) hero.remove();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <Layout />
          <LazyRealtime />
          <LazyPwaCliente />
          <LazyAvisoConexion />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
