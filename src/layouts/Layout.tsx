import React, { useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import AnimatedRoutes from '../routes/AppRoutes';
import AdminLayout from '../layouts/AdminLayout';
import EmployeeLayout from '../layouts/EmployeeLayout';
import { NavbarCliente } from '../components/NavbarCliente';
import EmployeeDashboardPage from '../pages/employee/EmployeeDashboardPage';
import { DataService } from '../services/dataService';
import { Loader2 } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    const initData = async () => {
      await DataService.init();
      setIsDataReady(true);
    };
    initData();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('usuario') || localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  if (!isDataReady) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
        <p className="text-slate-900 font-black text-2xl tracking-tighter font-serif">Florería Bautista</p>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Cargando sistema...</p>
      </div>
    );
  }
  const hideNavAndFooter = ['/login', '/registro', '/recuperar-contrasena', '/restablecer-contrasena'].includes(location.pathname);
  const userRoles: string[] = (user?.roles ?? (user?.role ? [user.role] : []))
    .map((r: string) => r.toLowerCase());
  const isAdmin = userRoles.some(r => ['administrador', 'admin'].includes(r));
  const isEmployee = userRoles.some(r => ['empleado', 'staff'].includes(r));
  const isClient = userRoles.some(r => ['cliente', 'customer'].includes(r));

  if (isClient && location.pathname === '/' && !hideNavAndFooter) {
    return <Navigate to="/inicio" replace />;
  }

  if ((isAdmin || isEmployee) && !hideNavAndFooter) {
    if (isEmployee) {
      return (
        <EmployeeLayout user={user}>
          {location.pathname === '/empleado/dashboard' ? <EmployeeDashboardPage /> : <AnimatedRoutes />}
        </EmployeeLayout>
      );
    }

    if (location.pathname === '/' || location.pathname === '/dashboard') {
      return <Navigate to={isAdmin ? "/admin/dashboard" : "/empleado/dashboard"} replace />;
    }

    return (
      <AdminLayout user={user}>
        <AnimatedRoutes />
      </AdminLayout>
    );
  }

  return (
    <div className="bg-brand-light font-sans text-brand-deep overflow-x-hidden min-h-screen flex flex-col">
      {!hideNavAndFooter && (isClient ? <NavbarCliente /> : <Navigation />)}
      <div className="flex-grow">
        <AnimatedRoutes />
      </div>
      {!hideNavAndFooter && <Footer />}
    </div>
  );
}