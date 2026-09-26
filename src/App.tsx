import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Layout from './layouts/Layout';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ScrollToTop from './components/ScrollToTop';

const RealtimeWrapper = React.lazy(() => import('./components/RealtimeWrapper'));

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
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
