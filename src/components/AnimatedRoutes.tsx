import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import PageTransition from './PageTransition';

// ── Auth ──────────────────────────────────────────
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// ── Admin ─────────────────────────────────────────
import DashboardPage from '../pages/admin/DashboardPage';
import ReportsPage from '../pages/admin/ReportsPage';
import BackupsPage from '../pages/admin/BackupsPage';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminNewUserPage from '../pages/admin/AdminNewUserPage';
import AdminOperationPage from '../pages/admin/AdminOperationPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminDataManagementPage from '../pages/admin/AdminDataManagementPage';
import AdminSystemMonitoringPage from '../pages/admin/AdminSystemMonitoringPage';
import AdminAuditPage from '../pages/admin/AdminAuditPage';
import AdminFlowersPage from '../pages/admin/AdminFlowersPage';
import AdminProductDetailPage from '../pages/admin/AdminProductDetailPage';

// ── Employee ──────────────────────────────────────
import ProductManagementPage from '../pages/employee/ProductManagementPage';
import OrdersPage from '../pages/employee/OrdersPage';
import OrderDetailPage from '../pages/employee/OrderDetailPage';
import PhysicalOrderPage from '../pages/employee/PhysicalOrderPage';
import DailyDeliveriesPage from '../pages/employee/DailyDeliveriesPage';
import QuickInventoryPage from '../pages/employee/QuickInventoryPage';
import QuickSalePage from '../pages/employee/QuickSalePage';
import EmployeeDashboardPage from '../pages/employee/EmployeeDashboardPage';
import EmployeeSettingsPage from '../pages/employee/EmployeeSettingsPage';

// ── Client ────────────────────────────────────────
import HomePage from '../pages/client/HomePage';
import CatalogPage from '../pages/client/CatalogPage';
import AboutPage from '../pages/client/AboutPage';
import ProductPage from '../pages/client/ProductPage';
import TestimonialsPage from '../pages/client/TestimonialsPage';
import CustomerOrdersPage from '../pages/client/CustomerOrdersPage';
import CartPage from '../pages/client/CartPage';
import OffersPage from '../pages/client/OffersPage';
import EventsPage from '../pages/client/EventsPage';
import NotificationsPage from '../pages/client/NotificationsPage';
import CheckoutDataPage from '../pages/client/CheckoutDataPage';
import CheckoutReviewPage from '../pages/client/CheckoutReviewPage';
import OrderSuccessPage from '../pages/client/OrderSuccessPage';
import SettingsPage from '../pages/client/SettingsPage';

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>

        {/* ── Public / Client ─────────────────────── */}
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/catalogo" element={<PageTransition><CatalogPage /></PageTransition>} />
        <Route path="/producto/:id" element={<PageTransition><ProductPage /></PageTransition>} />
        <Route path="/nosotros" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/testimonios" element={<PageTransition><TestimonialsPage /></PageTransition>} />
        <Route path="/ofertas" element={<PageTransition><OffersPage /></PageTransition>} />
        <Route path="/eventos" element={<PageTransition><EventsPage /></PageTransition>} />
        <Route path="/carrito" element={<PageTransition><CartPage /></PageTransition>} />
        <Route path="/checkout/datos" element={<PageTransition><CheckoutDataPage /></PageTransition>} />
        <Route path="/checkout/revision" element={<PageTransition><CheckoutReviewPage /></PageTransition>} />
        <Route path="/checkout/exito" element={<PageTransition><OrderSuccessPage /></PageTransition>} />
        <Route path="/mis-pedidos" element={<PageTransition><CustomerOrdersPage /></PageTransition>} />
        <Route path="/notificaciones" element={<PageTransition><NotificationsPage /></PageTransition>} />
        <Route path="/configuracion" element={<PageTransition><SettingsPage /></PageTransition>} />

        {/* ── Auth ────────────────────────────────── */}
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/registro" element={<PageTransition><RegisterPage /></PageTransition>} />

        {/* ── Admin / Dashboards ─────────────────────── */}
        <Route path="/dashboard" element={<PageTransition><EmployeeDashboardPage /></PageTransition>} />
        <Route path="/admin/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
        <Route path="/admin/reportes" element={<PageTransition><ReportsPage /></PageTransition>} />
        <Route path="/admin/respaldos" element={<PageTransition><BackupsPage /></PageTransition>} />
        <Route path="/admin/inventario" element={<PageTransition><AdminInventoryPage /></PageTransition>} />
        <Route path="/admin/pagos" element={<PageTransition><AdminPaymentsPage /></PageTransition>} />
        <Route path="/admin/usuarios" element={<PageTransition><AdminUsersPage /></PageTransition>} />
        <Route path="/admin/usuarios/nuevo" element={<PageTransition><AdminNewUserPage /></PageTransition>} />
        <Route path="/admin/operacion" element={<PageTransition><AdminOperationPage /></PageTransition>} />
        <Route path="/admin/configuracion" element={<PageTransition><AdminSettingsPage /></PageTransition>} />
        <Route path="/admin/datos" element={<PageTransition><AdminDataManagementPage /></PageTransition>} />
        <Route path="/admin/monitoreo" element={<PageTransition><AdminSystemMonitoringPage /></PageTransition>} />
        <Route path="/admin/auditoria" element={<PageTransition><AdminAuditPage /></PageTransition>} />
        <Route path="/admin/flores" element={<PageTransition><AdminFlowersPage /></PageTransition>} />
        <Route path="/admin/productos/:id" element={<PageTransition><AdminProductDetailPage /></PageTransition>} />

        {/* ── Employee ────────────────────────────── */}
        <Route path="/admin/productos/nuevo" element={<PageTransition><ProductManagementPage /></PageTransition>} />
        <Route path="/admin/productos/editar/:id" element={<PageTransition><ProductManagementPage /></PageTransition>} />
        <Route path="/admin/pedidos" element={<PageTransition><OrdersPage /></PageTransition>} />
        <Route path="/admin/pedidos/:id" element={<PageTransition><OrderDetailPage /></PageTransition>} />
        <Route path="/empleado/pedidos" element={<PageTransition><OrdersPage /></PageTransition>} />
        <Route path="/empleado/pedidos/:id" element={<PageTransition><OrderDetailPage /></PageTransition>} />
        <Route path="/empleado/registrar-pedido" element={<PageTransition><PhysicalOrderPage /></PageTransition>} />
        <Route path="/empleado/entregas" element={<PageTransition><DailyDeliveriesPage /></PageTransition>} />
        <Route path="/empleado/inventario" element={<PageTransition><QuickInventoryPage /></PageTransition>} />
        <Route path="/empleado/venta-rapida" element={<PageTransition><QuickSalePage /></PageTransition>} />
        <Route path="/empleado/configuracion" element={<PageTransition><EmployeeSettingsPage /></PageTransition>} />

      </Routes>
    </AnimatePresence>
  );
}
