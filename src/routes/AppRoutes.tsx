import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROL, rutaInicialPorRol } from '../utils/auth';
import { useAuth } from '../hooks/useAuth';
import PantallaCarga from '../components/PantallaCarga';
// La landing va en el bundle inicial: con lazy, el primer render de React cambiaba
// el hero del esqueleto HTML por la pantalla de carga y el LCP esperaba al chunk.
import HomePage from '../pages/client/HomePage';

const AnimatePresence = React.lazy(() =>
  import('motion/react').then(m => ({ default: m.AnimatePresence }))
);
const PageTransition = React.lazy(() => import('../components/PageTransition'));

// Client Pages — lazy loaded
const ClientHomePage = React.lazy(() => import('../pages/client/ClientHomePage'));
const CatalogPage = React.lazy(() => import('../pages/client/CatalogPage'));
const AboutPage = React.lazy(() => import('../pages/client/AboutPage'));
const ProductPage = React.lazy(() => import('../pages/client/ProductPage'));
const TestimonialsPage = React.lazy(() => import('../pages/client/TestimonialsPage'));
const ContactPage = React.lazy(() => import('../pages/client/ContactPage'));
const CustomerOrdersPage = React.lazy(() => import('../pages/client/CustomerOrdersPage'));
const SettingsPage = React.lazy(() => import('../pages/client/SettingsPage'));
const CartPage = React.lazy(() => import('../pages/client/CartPage'));
const OffersPage = React.lazy(() => import('../pages/client/OffersPage'));
const EventsPage = React.lazy(() => import('../pages/client/EventsPage'));
const NotificationsPage = React.lazy(() => import('../pages/client/NotificationsPage'));
const CheckoutDataPage = React.lazy(() => import('../pages/client/CheckoutDataPage'));
const CheckoutReviewPage = React.lazy(() => import('../pages/client/CheckoutReviewPage'));
const OrderSuccessPage = React.lazy(() => import('../pages/client/OrderSuccessPage'));
const PaymentFailedPage = React.lazy(() => import('../pages/client/PaymentFailedPage'));
const PaymentPendingPage = React.lazy(() => import('../pages/client/PaymentPendingPage'));
const EsperandoAprobacionPage = React.lazy(() => import('../pages/client/EsperandoAprobacionPage'));

// Auth Pages — lazy loaded
const LoginPage = React.lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('../pages/auth/ResetPasswordPage'));

// Admin Pages — lazy loaded
const DashboardPage = React.lazy(() => import('../pages/admin/DashboardPage'));
const ReportsPage = React.lazy(() => import('../pages/admin/ReportsPage'));
const BackupsPage = React.lazy(() => import('../pages/admin/BackupsPage'));
const AdminInventoryPage = React.lazy(() => import('../pages/admin/AdminInventoryPage'));
const AdminNewInsumoPage = React.lazy(() => import('../pages/admin/AdminNewInsumoPage'));
const AdminPaymentsPage = React.lazy(() => import('../pages/admin/AdminPaymentsPage'));
const AdminNewUserPage = React.lazy(() => import('../pages/admin/AdminNewUserPage'));
const AdminOperationPage = React.lazy(() => import('../pages/admin/AdminOperationPage'));
const AdminSettingsPage = React.lazy(() => import('../pages/admin/AdminSettingsPage'));
const AdminDataManagementPage = React.lazy(() => import('../pages/admin/AdminDataManagementPage'));
const AdminSystemMonitoringPage = React.lazy(() => import('../pages/admin/AdminSystemMonitoringPage'));
const AdminAuditPage = React.lazy(() => import('../pages/admin/AdminAuditPage'));
const AdminCashControlPage = React.lazy(() => import('../pages/admin/AdminCashControlPage'));
const AdminProductDetailPage = React.lazy(() => import('../pages/admin/AdminProductDetailPage'));
const AdminProductsListPage = React.lazy(() => import('../pages/admin/AdminProductsListPage'));
const AdminRecipeManagementPage = React.lazy(() => import('../pages/admin/AdminRecipeManagementPage'));
const AdminCmsPage = React.lazy(() => import('../pages/admin/AdminCmsPage'));
const AdminOrdersListPage = React.lazy(() => import('../pages/admin/AdminOrdersListPage'));
const AdminOrderDetailPage = React.lazy(() => import('../pages/admin/AdminOrderDetailPage'));
const AdminSeasonalCatalogsPage = React.lazy(() => import('../pages/admin/AdminSeasonalCatalogsPage'));
const AdminNewCatalogPage = React.lazy(() => import('../pages/admin/AdminNewCatalogPage'));
const AdminPromotionsPage = React.lazy(() => import('../pages/admin/AdminPromotionsPage'));
const AdminNewPromotionPage = React.lazy(() => import('../pages/admin/AdminNewPromotionPage'));
const AdminProductAnalysisPage = React.lazy(() => import('../pages/admin/AdminProductAnalysisPage'));
const AdminSupplyAnalysisPage = React.lazy(() => import('../pages/admin/AdminSupplyAnalysisPage'));
const AdminPeopleModule = React.lazy(() => import('../pages/admin/AdminPeopleModule'));
const AdminReplenishmentPage = React.lazy(() => import('../pages/admin/AdminReplenishmentPage'));
const AdminSupplyOrdersPage = React.lazy(() => import('../pages/admin/AdminSupplyOrdersPage'));
const AdminSupplyOrderDetailPage = React.lazy(() => import('../pages/admin/AdminSupplyOrderDetailPage'));
const AdminQuickSaleTemplatesPage = React.lazy(() => import('../pages/admin/AdminQuickSaleTemplatesPage'));

// Employee Pages — lazy loaded
const EmployeeDashboardPage = React.lazy(() => import('../pages/employee/EmployeeDashboardPage'));
const ProductManagementPage = React.lazy(() => import('../pages/employee/ProductManagementPage'));
const OrdersPage = React.lazy(() => import('../pages/employee/OrdersPage'));
const OrderDetailPage = React.lazy(() => import('../pages/employee/OrderDetailPage'));
const PhysicalOrderPage = React.lazy(() => import('../pages/employee/PhysicalOrderPage'));
const DailyDeliveriesPage = React.lazy(() => import('../pages/employee/DailyDeliveriesPage'));
const QuickInventoryPage = React.lazy(() => import('../pages/employee/QuickInventoryPage'));
const QuickSalePage = React.lazy(() => import('../pages/employee/QuickSalePage'));
const SessionOrderPage = React.lazy(() => import('../pages/employee/SessionOrderPage'));
const EmployeeSettingsPage = React.lazy(() => import('../pages/employee/EmployeeSettingsPage'));
const EmployeeNotificationsPage = React.lazy(() => import('../pages/employee/EmployeeNotificationsPage'));

const LazyFallback = <PantallaCarga mensaje="Cargando página..." />;

const CssTransition = ({ children }: { children: React.ReactNode }) => (
  <div className="animate-[pageEnter_0.3s_ease-out_both]">{children}</div>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={null}>
    <PageTransition>{children}</PageTransition>
  </Suspense>
);

function AdminRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="dashboard" element={<Suspense fallback={LazyFallback}><P><DashboardPage /></P></Suspense>} />
        <Route path="reportes" element={<Suspense fallback={LazyFallback}><P><ReportsPage /></P></Suspense>} />

        <Route path="productos" element={<Suspense fallback={LazyFallback}><P><AdminProductsListPage /></P></Suspense>} />
        <Route path="productos/recetas" element={<Suspense fallback={LazyFallback}><P><AdminRecipeManagementPage /></P></Suspense>} />
        <Route path="productos/nuevo" element={<Suspense fallback={LazyFallback}><P><ProductManagementPage /></P></Suspense>} />
        <Route path="productos/editar/:id" element={<Suspense fallback={LazyFallback}><P><ProductManagementPage /></P></Suspense>} />
        <Route path="productos/:id" element={<Suspense fallback={LazyFallback}><P><AdminProductDetailPage /></P></Suspense>} />

        <Route path="catalogo" element={<Navigate to="/admin/productos" replace />} />
        <Route path="catalogo/recetas" element={<Navigate to="/admin/productos/recetas" replace />} />

        <Route path="catalogos" element={<Suspense fallback={LazyFallback}><P><AdminSeasonalCatalogsPage /></P></Suspense>} />
        <Route path="catalogos/nuevo" element={<Suspense fallback={LazyFallback}><P><AdminNewCatalogPage /></P></Suspense>} />
        <Route path="catalogos/editar/:id" element={<Suspense fallback={LazyFallback}><P><AdminNewCatalogPage /></P></Suspense>} />

        <Route path="plantillas-venta" element={<Suspense fallback={LazyFallback}><P><AdminQuickSaleTemplatesPage /></P></Suspense>} />

        <Route path="promociones" element={<Suspense fallback={LazyFallback}><P><AdminPromotionsPage /></P></Suspense>} />
        <Route path="promociones/nuevo" element={<Suspense fallback={LazyFallback}><P><AdminNewPromotionPage /></P></Suspense>} />
        <Route path="promociones/editar/:id" element={<Suspense fallback={LazyFallback}><P><AdminNewPromotionPage /></P></Suspense>} />
        <Route path="cms" element={<Suspense fallback={LazyFallback}><P><AdminCmsPage /></P></Suspense>} />
        <Route path="pedidos" element={<Suspense fallback={LazyFallback}><P><AdminOrdersListPage /></P></Suspense>} />
        <Route path="pedidos/:id" element={<Suspense fallback={LazyFallback}><P><AdminOrderDetailPage /></P></Suspense>} />
        <Route path="inventario" element={<Suspense fallback={LazyFallback}><P><AdminInventoryPage /></P></Suspense>} />
        <Route path="inventario/nuevo" element={<Suspense fallback={LazyFallback}><P><AdminNewInsumoPage /></P></Suspense>} />
        <Route path="inventario/editar/:id" element={<Suspense fallback={LazyFallback}><P><AdminNewInsumoPage /></P></Suspense>} />
        <Route path="pagos" element={<Suspense fallback={LazyFallback}><P><AdminPaymentsPage /></P></Suspense>} />
        <Route path="caja" element={<Suspense fallback={LazyFallback}><P><AdminCashControlPage /></P></Suspense>} />
        <Route path="usuarios" element={<Suspense fallback={LazyFallback}><P><AdminPeopleModule initialTab="usuarios" /></P></Suspense>} />
        <Route path="usuarios/nuevo" element={<Suspense fallback={LazyFallback}><P><AdminNewUserPage /></P></Suspense>} />
        <Route path="operacion" element={<Suspense fallback={LazyFallback}><P><AdminOperationPage /></P></Suspense>} />
        <Route path="respaldos" element={<Suspense fallback={LazyFallback}><P><BackupsPage /></P></Suspense>} />
        <Route path="datos" element={<Suspense fallback={LazyFallback}><P><AdminDataManagementPage /></P></Suspense>} />
        <Route path="monitoreo" element={<Suspense fallback={LazyFallback}><P><AdminSystemMonitoringPage /></P></Suspense>} />
        <Route path="auditoria" element={<Suspense fallback={LazyFallback}><P><AdminAuditPage /></P></Suspense>} />
        <Route path="configuracion" element={<Suspense fallback={LazyFallback}><P><AdminSettingsPage /></P></Suspense>} />
        <Route path="analisis-producto/:id" element={<Suspense fallback={LazyFallback}><P><AdminProductAnalysisPage /></P></Suspense>} />
        <Route path="analisis-insumo/:id" element={<Suspense fallback={LazyFallback}><P><AdminSupplyAnalysisPage /></P></Suspense>} />
        <Route path="clientes" element={<Suspense fallback={LazyFallback}><P><AdminPeopleModule initialTab="segmentos" /></P></Suspense>} />
        <Route path="reabastecimiento" element={<Suspense fallback={LazyFallback}><P><AdminReplenishmentPage /></P></Suspense>} />
        <Route path="reabastecimiento/solicitudes" element={<Suspense fallback={LazyFallback}><P><AdminSupplyOrdersPage /></P></Suspense>} />
        <Route path="reabastecimiento/solicitudes/:id" element={<Suspense fallback={LazyFallback}><P><AdminSupplyOrderDetailPage /></P></Suspense>} />

        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function EmployeeRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="dashboard" element={<Suspense fallback={LazyFallback}><P><EmployeeDashboardPage /></P></Suspense>} />
        <Route path="pedidos" element={<Suspense fallback={LazyFallback}><P><OrdersPage /></P></Suspense>} />
        <Route path="pedidos/:id" element={<Suspense fallback={LazyFallback}><P><OrderDetailPage /></P></Suspense>} />
        <Route path="registrar-pedido" element={<Suspense fallback={LazyFallback}><P><PhysicalOrderPage /></P></Suspense>} />
        <Route path="registrar-pedido-sesion" element={<Suspense fallback={LazyFallback}><P><SessionOrderPage /></P></Suspense>} />
        <Route path="entregas" element={<Suspense fallback={LazyFallback}><P><DailyDeliveriesPage /></P></Suspense>} />
        <Route path="inventario" element={<Suspense fallback={LazyFallback}><P><QuickInventoryPage /></P></Suspense>} />
        <Route path="venta-rapida" element={<Suspense fallback={LazyFallback}><P><QuickSalePage /></P></Suspense>} />
        <Route path="notificaciones" element={<Suspense fallback={LazyFallback}><P><EmployeeNotificationsPage /></P></Suspense>} />
        <Route path="configuracion" element={<Suspense fallback={LazyFallback}><P><EmployeeSettingsPage /></P></Suspense>} />

        <Route path="*" element={<Navigate to="/empleado/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function RedirigirAInicio() {
  const { roles, cargando } = useAuth();
  if (cargando) return null;
  return <Navigate to={rutaInicialPorRol(roles)} replace />;
}

export default function AnimatedRoutes() {
  return (
    <Routes>
      {/* ── Públicas (CSS transitions, no motion dependency) ── */}
      {/* Sin CssTransition: su fade parte de opacity 0 y retrasa el pintado del hero (LCP). */}
      <Route path="/" element={<HomePage />} />
      <Route path="/catalogo" element={<Suspense fallback={LazyFallback}><CssTransition><CatalogPage /></CssTransition></Suspense>} />
      <Route path="/producto/:id" element={<Suspense fallback={LazyFallback}><CssTransition><ProductPage /></CssTransition></Suspense>} />
      <Route path="/testimonios" element={<Suspense fallback={LazyFallback}><CssTransition><TestimonialsPage /></CssTransition></Suspense>} />
      <Route path="/nosotros" element={<Suspense fallback={LazyFallback}><CssTransition><AboutPage /></CssTransition></Suspense>} />
      <Route path="/contacto" element={<Suspense fallback={LazyFallback}><CssTransition><ContactPage /></CssTransition></Suspense>} />
      <Route path="/ofertas" element={<Suspense fallback={LazyFallback}><CssTransition><OffersPage /></CssTransition></Suspense>} />
      <Route path="/eventos" element={<Suspense fallback={LazyFallback}><CssTransition><EventsPage /></CssTransition></Suspense>} />

      {/* ── Auth ── */}
      <Route path="/login" element={<Suspense fallback={LazyFallback}><CssTransition><LoginPage /></CssTransition></Suspense>} />
      <Route path="/registro" element={<Suspense fallback={LazyFallback}><CssTransition><RegisterPage /></CssTransition></Suspense>} />
      <Route path="/recuperar-contrasena" element={<Suspense fallback={LazyFallback}><CssTransition><ForgotPasswordPage /></CssTransition></Suspense>} />
      <Route path="/restablecer-contrasena" element={<Suspense fallback={LazyFallback}><CssTransition><ResetPasswordPage /></CssTransition></Suspense>} />

      {/* ── Panel de administración (motion transitions, lazy-loaded) ── */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={[ROL.ADMIN]}>
            <AdminRoutes />
          </ProtectedRoute>
        }
      />

      {/* ── Mostrador ── */}
      <Route
        path="/empleado/*"
        element={
          <ProtectedRoute roles={[ROL.ADMIN, ROL.EMPLEADO]}>
            <EmployeeRoutes />
          </ProtectedRoute>
        }
      />

      {/* ── Solo cliente ── */}
      <Route path="/inicio" element={<ProtectedRoute roles={[ROL.CLIENTE]}><Suspense fallback={LazyFallback}><CssTransition><ClientHomePage /></CssTransition></Suspense></ProtectedRoute>} />
      <Route path="/mis-pedidos" element={<ProtectedRoute roles={[ROL.CLIENTE]}><Suspense fallback={LazyFallback}><CssTransition><CustomerOrdersPage /></CssTransition></Suspense></ProtectedRoute>} />
      <Route path="/configuracion" element={<ProtectedRoute roles={[ROL.CLIENTE]}><Suspense fallback={LazyFallback}><CssTransition><SettingsPage /></CssTransition></Suspense></ProtectedRoute>} />
      <Route path="/notificaciones" element={<ProtectedRoute roles={[ROL.CLIENTE]}><Suspense fallback={LazyFallback}><CssTransition><NotificationsPage /></CssTransition></Suspense></ProtectedRoute>} />
      <Route path="/carrito" element={<ProtectedRoute roles={[ROL.CLIENTE]}><Suspense fallback={LazyFallback}><CssTransition><CartPage /></CssTransition></Suspense></ProtectedRoute>} />
      <Route path="/checkout/datos" element={<ProtectedRoute roles={[ROL.CLIENTE]}><Suspense fallback={LazyFallback}><CssTransition><CheckoutDataPage /></CssTransition></Suspense></ProtectedRoute>} />
      <Route path="/checkout/revision" element={<ProtectedRoute roles={[ROL.CLIENTE]}><Suspense fallback={LazyFallback}><CssTransition><CheckoutReviewPage /></CssTransition></Suspense></ProtectedRoute>} />
      <Route path="/checkout/exito" element={<ProtectedRoute roles={[ROL.CLIENTE]}><Suspense fallback={LazyFallback}><CssTransition><OrderSuccessPage /></CssTransition></Suspense></ProtectedRoute>} />
      <Route path="/checkout/fallo" element={<ProtectedRoute roles={[ROL.CLIENTE]}><Suspense fallback={LazyFallback}><CssTransition><PaymentFailedPage /></CssTransition></Suspense></ProtectedRoute>} />
      <Route path="/checkout/pendiente" element={<ProtectedRoute roles={[ROL.CLIENTE]}><Suspense fallback={LazyFallback}><CssTransition><PaymentPendingPage /></CssTransition></Suspense></ProtectedRoute>} />
      <Route path="/esperando-aprobacion" element={<ProtectedRoute roles={[ROL.CLIENTE]}><Suspense fallback={LazyFallback}><CssTransition><EsperandoAprobacionPage /></CssTransition></Suspense></ProtectedRoute>} />

      <Route path="*" element={<RedirigirAInicio />} />
    </Routes>
  );
}
