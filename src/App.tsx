import React, { Suspense } from 'react';
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
