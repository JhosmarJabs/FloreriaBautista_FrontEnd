import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import PageTransition from '../components/PageTransition';
import OptimizedLoader from '../components/OptimizedLoader';

// Client Pages
const HomePage = lazy(() => import('../pages/client/HomePage'));
const ClientHomePage = lazy(() => import('../pages/client/ClientHomePage'));
const CatalogPage = lazy(() => import('../pages/client/CatalogPage'));
const AboutPage = lazy(() => import('../pages/client/AboutPage'));
const ProductPage = lazy(() => import('../pages/client/ProductPage'));
const TestimonialsPage = lazy(() => import('../pages/client/TestimonialsPage'));
const ContactPage = lazy(() => import('../pages/client/ContactPage'));
const CustomerOrdersPage = lazy(() => import('../pages/client/CustomerOrdersPage'));
const SettingsPage = lazy(() => import('../pages/client/SettingsPage'));
const CartPage = lazy(() => import('../pages/client/CartPage'));
const OffersPage = lazy(() => import('../pages/client/OffersPage'));
const EventsPage = lazy(() => import('../pages/client/EventsPage'));
const NotificationsPage = lazy(() => import('../pages/client/NotificationsPage'));
const CheckoutDataPage = lazy(() => import('../pages/client/CheckoutDataPage'));
const CheckoutReviewPage = lazy(() => import('../pages/client/CheckoutReviewPage'));
const OrderSuccessPage = lazy(() => import('../pages/client/OrderSuccessPage'));

// Auth Pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));

// Admin Pages
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
const ReportsPage = lazy(() => import('../pages/admin/ReportsPage'));
const BackupsPage = lazy(() => import('../pages/admin/BackupsPage'));
const AdminInventoryPage = lazy(() => import('../pages/admin/AdminInventoryPage'));
const AdminNewInsumoPage = lazy(() => import('../pages/admin/AdminNewInsumoPage'));
const AdminPaymentsPage = lazy(() => import('../pages/admin/AdminPaymentsPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'));
const AdminNewUserPage = lazy(() => import('../pages/admin/AdminNewUserPage'));
const AdminOperationPage = lazy(() => import('../pages/admin/AdminOperationPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));
const AdminDataManagementPage = lazy(() => import('../pages/admin/AdminDataManagementPage'));
const AdminSystemMonitoringPage = lazy(() => import('../pages/admin/AdminSystemMonitoringPage'));
const AdminAuditPage = lazy(() => import('../pages/admin/AdminAuditPage'));
const AdminProductDetailPage = lazy(() => import('../pages/admin/AdminProductDetailPage'));
const AdminProductsListPage = lazy(() => import('../pages/admin/AdminProductsListPage'));
const AdminRecipeManagementPage = lazy(() => import('../pages/admin/AdminRecipeManagementPage'));
const AdminCmsPage = lazy(() => import('../pages/admin/AdminCmsPage'));
const AdminOrdersListPage = lazy(() => import('../pages/admin/AdminOrdersListPage'));
const AdminOrderDetailPage = lazy(() => import('../pages/admin/AdminOrderDetailPage'));
const AdminCatalogsPage = lazy(() => import('../pages/admin/AdminCatalogsPage'));
const AdminNewCatalogPage = lazy(() => import('../pages/admin/AdminNewCatalogPage'));
const AdminPromotionsPage = lazy(() => import('../pages/admin/AdminPromotionsPage'));
const AdminNewPromotionPage = lazy(() => import('../pages/admin/AdminNewPromotionPage'));
const AdminProductAnalysisPage = lazy(() => import('../pages/admin/AdminProductAnalysisPage'));

// Employee Pages
const EmployeeDashboardPage = lazy(() => import('../pages/employee/EmployeeDashboardPage'));
const ProductManagementPage = lazy(() => import('../pages/employee/ProductManagementPage'));
const OrdersPage = lazy(() => import('../pages/employee/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/employee/OrderDetailPage'));
const PhysicalOrderPage = lazy(() => import('../pages/employee/PhysicalOrderPage'));
const DailyDeliveriesPage = lazy(() => import('../pages/employee/DailyDeliveriesPage'));
const QuickInventoryPage = lazy(() => import('../pages/employee/QuickInventoryPage'));
const QuickSalePage = lazy(() => import('../pages/employee/QuickSalePage'));
const QuickSaleTemplatesPage = lazy(() => import('../pages/employee/QuickSaleTemplatesPage'));
const SeasonTemplatesPage = lazy(() => import('../pages/employee/SeasonTemplatesPage'));
const SessionOrderPage = lazy(() => import('../pages/employee/SessionOrderPage'));
const EmployeeSettingsPage = lazy(() => import('../pages/employee/EmployeeSettingsPage'));

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Suspense fallback={<OptimizedLoader />}>
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
    </Suspense>
  );
}
