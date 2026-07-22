import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import PageTransition from '../components/PageTransition';

// Client Pages
import HomePage from '../pages/client/HomePage';
import ClientHomePage from '../pages/client/ClientHomePage';
import CatalogPage from '../pages/client/CatalogPage';
import AboutPage from '../pages/client/AboutPage';
import ProductPage from '../pages/client/ProductPage';
import TestimonialsPage from '../pages/client/TestimonialsPage';
import ContactPage from '../pages/client/ContactPage';
import CustomerOrdersPage from '../pages/client/CustomerOrdersPage';
import SettingsPage from '../pages/client/SettingsPage';
import CartPage from '../pages/client/CartPage';
import OffersPage from '../pages/client/OffersPage';
import EventsPage from '../pages/client/EventsPage';
import NotificationsPage from '../pages/client/NotificationsPage';
import CheckoutDataPage from '../pages/client/CheckoutDataPage';
import CheckoutReviewPage from '../pages/client/CheckoutReviewPage';
import OrderSuccessPage from '../pages/client/OrderSuccessPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Admin Pages
import DashboardPage from '../pages/admin/DashboardPage';
import ReportsPage from '../pages/admin/ReportsPage';
import BackupsPage from '../pages/admin/BackupsPage';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import AdminNewInsumoPage from '../pages/admin/AdminNewInsumoPage';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminNewUserPage from '../pages/admin/AdminNewUserPage';
import AdminOperationPage from '../pages/admin/AdminOperationPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminDataManagementPage from '../pages/admin/AdminDataManagementPage';
import AdminSystemMonitoringPage from '../pages/admin/AdminSystemMonitoringPage';
import AdminAuditPage from '../pages/admin/AdminAuditPage';
import AdminProductDetailPage from '../pages/admin/AdminProductDetailPage';
import AdminProductsListPage from '../pages/admin/AdminProductsListPage';
import AdminRecipeManagementPage from '../pages/admin/AdminRecipeManagementPage';
import AdminCmsPage from '../pages/admin/AdminCmsPage';
import AdminOrdersListPage from '../pages/admin/AdminOrdersListPage';
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage';
import AdminCatalogsPage from '../pages/admin/AdminCatalogsPage';
import AdminNewCatalogPage from '../pages/admin/AdminNewCatalogPage';
import AdminPromotionsPage from '../pages/admin/AdminPromotionsPage';
import AdminNewPromotionPage from '../pages/admin/AdminNewPromotionPage';
import AdminProductAnalysisPage from '../pages/admin/AdminProductAnalysisPage';
import AdminSupplyAnalysisPage from '../pages/admin/AdminSupplyAnalysisPage';
import AdminCustomerSegmentsPage from '../pages/admin/AdminCustomerSegmentsPage';

// Employee Pages
import EmployeeDashboardPage from '../pages/employee/EmployeeDashboardPage';
import ProductManagementPage from '../pages/employee/ProductManagementPage';
import OrdersPage from '../pages/employee/OrdersPage';
import OrderDetailPage from '../pages/employee/OrderDetailPage';
import PhysicalOrderPage from '../pages/employee/PhysicalOrderPage';
import DailyDeliveriesPage from '../pages/employee/DailyDeliveriesPage';
import QuickInventoryPage from '../pages/employee/QuickInventoryPage';
import QuickSalePage from '../pages/employee/QuickSalePage';
import QuickSaleTemplatesPage from '../pages/employee/QuickSaleTemplatesPage';
import SeasonTemplatesPage from '../pages/employee/SeasonTemplatesPage';
import SessionOrderPage from '../pages/employee/SessionOrderPage';
import EmployeeSettingsPage from '../pages/employee/EmployeeSettingsPage';

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/inicio" element={<PageTransition><ClientHomePage /></PageTransition>} />
        <Route path="/admin/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
        <Route path="/admin/reportes" element={<PageTransition><ReportsPage /></PageTransition>} />
        <Route path="/admin/catalogo" element={<PageTransition><AdminProductsListPage /></PageTransition>} />
        <Route path="/admin/catalogos" element={<PageTransition><AdminCatalogsPage /></PageTransition>} />
        <Route path="/admin/catalogos/nuevo" element={<PageTransition><AdminNewCatalogPage /></PageTransition>} />
        <Route path="/admin/catalogos/editar/:id" element={<PageTransition><AdminNewCatalogPage /></PageTransition>} />
        <Route path="/admin/promociones" element={<PageTransition><AdminPromotionsPage /></PageTransition>} />
        <Route path="/admin/promociones/nuevo" element={<PageTransition><AdminNewPromotionPage /></PageTransition>} />
        <Route path="/admin/promociones/editar/:id" element={<PageTransition><AdminNewPromotionPage /></PageTransition>} />
        <Route path="/admin/catalogo/recetas" element={<PageTransition><AdminRecipeManagementPage /></PageTransition>} />
        <Route path="/admin/cms" element={<PageTransition><AdminCmsPage /></PageTransition>} />
        <Route path="/admin/productos/nuevo" element={<PageTransition><ProductManagementPage /></PageTransition>} />
        <Route path="/admin/productos/editar/:id" element={<PageTransition><ProductManagementPage /></PageTransition>} />
        <Route path="/admin/productos/:id" element={<PageTransition><AdminProductDetailPage /></PageTransition>} />
        <Route path="/admin/pedidos" element={<PageTransition><AdminOrdersListPage /></PageTransition>} />
        <Route path="/admin/pedidos/:id" element={<PageTransition><AdminOrderDetailPage /></PageTransition>} />
        <Route path="/admin/inventario" element={<PageTransition><AdminInventoryPage /></PageTransition>} />
        <Route path="/admin/inventario/nuevo" element={<PageTransition><AdminNewInsumoPage /></PageTransition>} />
        <Route path="/admin/inventario/editar/:id" element={<PageTransition><AdminNewInsumoPage /></PageTransition>} />
        <Route path="/admin/pagos" element={<PageTransition><AdminPaymentsPage /></PageTransition>} />
        <Route path="/admin/usuarios" element={<PageTransition><AdminUsersPage /></PageTransition>} />
        <Route path="/admin/usuarios/nuevo" element={<PageTransition><AdminNewUserPage /></PageTransition>} />
        <Route path="/admin/operacion" element={<PageTransition><AdminOperationPage /></PageTransition>} />
        <Route path="/admin/respaldos" element={<PageTransition><BackupsPage /></PageTransition>} />
        <Route path="/admin/datos" element={<PageTransition><AdminDataManagementPage /></PageTransition>} />
        <Route path="/admin/monitoreo" element={<PageTransition><AdminSystemMonitoringPage /></PageTransition>} />
        <Route path="/admin/auditoria" element={<PageTransition><AdminAuditPage /></PageTransition>} />
        <Route path="/admin/configuracion" element={<PageTransition><AdminSettingsPage /></PageTransition>} />
        <Route path="/admin/analisis-producto/:id" element={<PageTransition><AdminProductAnalysisPage /></PageTransition>} />
        <Route path="/admin/analisis-insumo/:id" element={<PageTransition><AdminSupplyAnalysisPage /></PageTransition>} />
        <Route path="/admin/clientes" element={<PageTransition><AdminCustomerSegmentsPage /></PageTransition>} />
        
        {/* Employee Routes */}
        <Route path="/empleado/dashboard" element={<PageTransition><EmployeeDashboardPage /></PageTransition>} />
        <Route path="/empleado/pedidos" element={<PageTransition><OrdersPage /></PageTransition>} />
        <Route path="/empleado/pedidos/:id" element={<PageTransition><OrderDetailPage /></PageTransition>} />
        <Route path="/empleado/registrar-pedido" element={<PageTransition><PhysicalOrderPage /></PageTransition>} />
        <Route path="/empleado/registrar-pedido-sesion" element={<PageTransition><SessionOrderPage /></PageTransition>} />
        <Route path="/empleado/entregas" element={<PageTransition><DailyDeliveriesPage /></PageTransition>} />
        <Route path="/empleado/inventario" element={<PageTransition><QuickInventoryPage /></PageTransition>} />
        <Route path="/empleado/venta-rapida" element={<PageTransition><QuickSalePage /></PageTransition>} />
        <Route path="/empleado/venta-rapida/config" element={<PageTransition><QuickSaleTemplatesPage /></PageTransition>} />
        <Route path="/empleado/plantillas" element={<PageTransition><SeasonTemplatesPage /></PageTransition>} />
        <Route path="/empleado/configuracion" element={<PageTransition><EmployeeSettingsPage /></PageTransition>} />

        {/* Client Specific Routes */}
        <Route path="/mis-pedidos" element={<PageTransition><CustomerOrdersPage /></PageTransition>} />
        <Route path="/configuracion" element={<PageTransition><SettingsPage /></PageTransition>} />
        <Route path="/ofertas" element={<PageTransition><OffersPage /></PageTransition>} />
        <Route path="/eventos" element={<PageTransition><EventsPage /></PageTransition>} />
        <Route path="/notificaciones" element={<PageTransition><NotificationsPage /></PageTransition>} />
        <Route path="/catalogo" element={<PageTransition><CatalogPage /></PageTransition>} />
        <Route path="/carrito" element={<PageTransition><CartPage /></PageTransition>} />
        <Route path="/checkout/datos" element={<PageTransition><CheckoutDataPage /></PageTransition>} />
        <Route path="/checkout/revision" element={<PageTransition><CheckoutReviewPage /></PageTransition>} />
        <Route path="/checkout/exito" element={<PageTransition><OrderSuccessPage /></PageTransition>} />
        <Route path="/producto/:id" element={<PageTransition><ProductPage /></PageTransition>} />
        <Route path="/testimonios" element={<PageTransition><TestimonialsPage /></PageTransition>} />
        <Route path="/nosotros" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/contacto" element={<PageTransition><ContactPage /></PageTransition>} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/registro" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/recuperar-contrasena" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
        <Route path="/restablecer-contrasena" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}
