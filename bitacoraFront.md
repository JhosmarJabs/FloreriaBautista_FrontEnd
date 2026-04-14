# Bitácora de Desarrollo - Frontend

## [14 de Abril de 2026] - Ajustes en Estructura de Productos y Estandarización Final

### Cambios Realizados

#### 🏗️ Refactorización de la Entidad Producto (API V2)
Se ajustó la comunicación con el backend para cumplir con la nueva especificación de la API:
- **`visibilidad`**: Se agregó el campo `visibilidad` (string) a las interfaces `ProductBody` y `ProductDetail`. Se implementó un selector en `ProductManagementPage.tsx` con opciones: `PUBLICO`, `PRIVADO` y `CATALOGO`.
- **Simplificación de Recetas**: Se modificó la estructura de envío de la receta en el POST/PUT. Ahora solo se envían `inventoryItemId` y `cantidad`, eliminando la redundancia de nombres y precios que el backend ya posee.
- **Detalle de Producto**: Se actualizó `AdminProductDetailPage.tsx` para mostrar la visibilidad actual del producto.

#### 📦 Control de Versiones
- **Commit**: `v 1.2.0 feat: Estandarización Premium de Interfaces Administrativas y Refactorización de Productos (API V2)`

#### 🎨 Rediseño Premium y Consistencia Visual (Fase Final)
Se completó la migración de todos los módulos administrativos al nuevo estándar de diseño "Premium Business Intelligence":
- **Módulos Actualizados**: Pagos (`AdminPaymentsPage.tsx`), Reportes (`ReportsPage.tsx`), Monitoreo (`AdminSystemMonitoringPage.tsx`) y Recetas (`AdminRecipeManagementPage.tsx`).
- **Visualizaciones Matemáticas**: Implementación de gráficas de análisis de demanda con SVG animados y Framer Motion en la sección de reportes.
- **Micro-interacciones**: Uso sistemático de transiciones escalonadas y efectos de elevación en tarjetas y botones.

#### 🌑 Modo Oscuro Administrativo (Soporte Completo)
- **Consolidación General**: Se aseguró la compatibilidad total con `dark mode` en el Dashboard, Inventario, Usuarios, Pedidos y Configuración.
- **Ajustes de Contraste**: Refinamiento de la paleta `slate-800/900` para fondos y `blue-500` para acentuación, optimizando la legibilidad industrial.

#### ⚙️ Configuración y UI/UX
- **`AdminSettingsPage.tsx`**: Eliminación del botón "Guardar" manual; los cambios de configuración y tema ahora son persistentes e inmediatos.
- **Legibilidad**: Ajuste de contrastes en textos secundarios e iconos de acción en todas las vistas.

---

## [13 de Abril de 2026] - Gestión Integral de Insumos y Dashboard Dinámico

### Cambios Realizados

#### 📦 Inventario Administrativo (CRUD Completo)
- **`AdminNewInsumoPage.tsx`**: Refactorizado para modo dual (Creación/Edición). Ahora detecta el ID en la URL para cargar datos existentes.
- **Integración de Imágenes**: Conexión con `ImageUploader` para persistencia de imágenes mediante Cloudinary. Soporte para pre-visualizar la imagen actual al editar.
- **Borrado Lógico**: Botón de "Eliminar Insumo" agregado al formulario de edición, utilizando el nuevo endpoint `POST /delete` para desactivación (safe delete).
- **Corrección de Stock**: Habilitada la edición directa del stock actual desde el formulario de actualización.
- **`AdminInventoryPage.tsx`**: Simplificación de la tabla de acciones (ahora solo botón Editar). Los movimientos y el historial se centralizarán en la vista de edición.

#### 📊 Dashboard y Reportes
- **Dashboard Real**: Eliminación de datos estáticos (DataService). Ahora consume métricas reales mediante `AdminService.getDashboardStats()`.
- **KPIs Dinámicos**: Ventas totales, Pedidos, Ticket promedio y Nuevos clientes obtenidos directamente de la base de datos (últimos 30 días). Se implementó validación para mostrar **" -- "** en caso de error o ausencia de datos en el servidor.
- **Gráfica de Ventas**: Mapeo dinámico de los últimos 7 días con identificación automática del día "HOY".
- **Alertas de Stock**: Listado real de insumos críticos sincronizado con los niveles de stock actual y mínimo del servidor.

#### 🛠️ Servicios y Rutas
- **`adminService.ts`**:
  - `updateInventoryItem`: Cambiado de `PUT` a `POST` para cumplir con restricciones de arquitectura.
  - `deleteInventoryItem`: Implementado mediante `POST /api/admin/inventory/{id}/delete`.
  - `getDashboardStats`: Nuevo método para obtener métricas consolidadas.
- **`AppRoutes.tsx`**: Registrada la ruta `/admin/inventario/editar/:id`.

---

## [13 de Abril de 2026] - Desarrollo de Vistas Administrativas de Catálogo y Pedidos

### Cambios Realizados

#### Nuevas páginas creadas
- **`src/pages/admin/AdminProductsListPage.tsx`** (`/admin/catalogo`): Lista completa de productos del catálogo con filtros por búsqueda y estado, tabla paginada con imagen, tipo, precio, stock y acciones (ver detalle, editar). Incluye stats cards y botón de nuevo producto.
- **`src/pages/admin/AdminRecipeManagementPage.tsx`** (`/admin/catalogo/recetas`): Vista global de gestión de recetas. Muestra todos los productos activos; al hacer clic en uno se expande un panel inline con la composición de insumos, costos y costo base. Permite navegar directo al formulario de edición de la receta.
- **`src/pages/admin/AdminCmsPage.tsx`** (`/admin/cms`): Gestión de contenido del sitio. Permite configurar banners del hero (con toggle activo/inactivo), horarios de atención por día, productos destacados y datos de contacto (nombre, teléfono, correo, dirección). Nota: endpoint backend `/api/admin/cms` pendiente de implementación en servidor.
- **`src/components/AdminLayout.tsx`**: Rediseño completo del Sidebar. Se simplificó el acceso a "Productos", se independizó la gestión de contenido ("Personalizar Sitio") y se reubicó el control de colapso del menú en la parte inferior para mayor limpieza visual. Se añadieron las vistas de Catálogos y Promociones.
- **`src/pages/admin/AdminProductsListPage.tsx`**: Centralización de la gestión. Ahora incluye botones destacados para "Nuevo Producto" y "Gestión de Recetas", eliminando la necesidad de submenús en el sidebar.
- **`src/pages/admin/AdminCatalogsPage.tsx`** (`/admin/catalogos`): Nueva vista de gestión de Catálogos y Colecciones para agrupar productos por temporada (ej. Día de madres, San Valentín). Integrada con Tailwind dark mode y widgets de métricas.
- **`src/pages/admin/AdminPromotionsPage.tsx`** (`/admin/promociones`): Nueva vista de gestión de Promociones y Descuentos. Soporte visual para Cupones (Monto fijo o porcentaje) y Combos de regalo con estado y periodo de canjes.
- **`src/pages/admin/AdminSettingsPage.tsx`** (`/admin/configuracion`): Limpieza profunda de responsabilidades, cediendo su información pública al CMS. Se añadió el toggle explícito y envío de estado reactivo para **Modo Oscuro**, aplicable inmediatamente sobre el Documento.
- **`src/pages/admin/DashboardPage.tsx`** (`/dashboard`): Refinado el frontend del Dashboard para tener excelente compatibilidad con el **Modo Oscuro**, adaptando encabezados (`h1`, `h2`), colores de los KPIs (cards) y encabezados de la tabla y celdas para un soporte limpio y sin cortes visuales.
- **`src/pages/employee/ProductManagementPage.tsx`** (`/admin/productos/nuevo`): Refactorizado para usar el **Inventario General** en la sección de recetas. Se implementó una **carga inmediata** (muestra los primeros 10 insumos al hacer focus) y búsqueda insensible para agilizar la creación de productos. Ahora calcula automáticamente el "Costo Base" y "Precio Sugerido" basándose en el `PrecioCosto` real.
- **`src/pages/admin/AdminOrdersListPage.tsx`** (`/admin/pedidos`): Implementada la lista completa de pedidos con filtros avanzados (estado, fechas, búsqueda) y paginación server-side. Se integró una lógica de resiliencia que muestra filas de respaldo ("N/A" y asteriscos) en caso de fallas en la API para mantener la integridad visual del Dashboard y la lista de pedidos.
- **`src/pages/admin/AdminOrderDetailPage.tsx`** (`/admin/pedidos/:id`): Detalle completo de un pedido. Incluye barra de progreso visual del flujo de estados, información de cliente, entrega y dirección, tabla de productos del pedido y panel lateral con resumen y acciones rápidas para cambio de estado. Reemplaza el uso de la página de empleado.

#### Actualizaciones de infraestructura
- **`src/types.ts`**: Se agregaron los tipos `OrderItem` y `OrderDetail` (extiende `Order` con campos de pago, dirección, notas, cliente y lista de items).
- **`src/services/adminService.ts`**: Se agregaron los métodos `getAdminOrderById` (`GET /api/admin/orders/:id`) y `updateAdminOrderStatus` (`PUT /api/admin/orders/:id/estado`). Se importó `OrderDetail` desde types.
- **`src/routes/AppRoutes.tsx`**: Se registraron 6 rutas nuevas: `/admin/catalogo`, `/admin/catalogo/recetas`, `/admin/cms`, `/admin/productos/:id` y se reemplazaron `/admin/pedidos` y `/admin/pedidos/:id` con las páginas admin correspondientes.
- **`src/components/AdminLayout.tsx`**: Se convirtió "Catálogo" de link simple a submenu expandible (igual que "Operación técnica") con 3 subitems: Lista de productos, Gestión de recetas y CMS — Contenido. Se agregaron los iconos `FlaskConical` y `Layout` de lucide-react.

### Estado Actual
Las 6 vistas prioritarias del admin están desarrolladas e integradas. El sidebar refleja correctamente la navegación con submenu de Catálogo. Las vistas de Pedidos (lista y detalle) son ahora propias del admin y no comparten componente con el empleado.

### Pendiente (backend)
- Endpoint `/api/admin/cms` para persistir configuración del CMS.
- Endpoint `/api/admin/orders/:id` para detalle de pedido individual.
- Endpoint `/api/admin/orders/:id/estado` para actualización de estado de pedido.

---

## [13 de Abril de 2026] - Implementación de la Pantalla de Contacto

### Cambios Realizados
- **Creación de nueva página:** Se desarrolló `src/pages/client/ContactPage.tsx` con un diseño moderno (UI premium, animaciones usando framer motion), que incluye un formulario de contacto y una sección con la información y horarios de la sucursal.
- **Configuración de rutas:** Se agregó la ruta `/contacto` en `src/routes/AppRoutes.tsx`.
- **Integración de enlaces de navegación:**
  - Se añadió la opción "Contacto" al menú principal de visitantes en `src/components/Navigation.tsx`.
  - Se agregó la opción "Contacto" en el menú de clientes en `src/components/NavbarCliente.tsx`.
  - Se integró el enlace "Contacto" en la sección de enlaces rápidos del pie de página (`src/components/Footer.tsx`).

### Estado Actual
La vista de contacto se encuentra 100% integrada y accesible desde cualquier rol que vea las barras de navegación públicas/cliente o el pie de página de la tienda.

---
## [13 de Abril de 2026] - Integración API GET /api/admin/inventory en AdminInventoryPage

### Cambios Realizados
- **`src/types.ts`**: Se agregó la interfaz `InventoryItem` con los campos `id`, `nombre`, `stockActual`, `stockMinimo`, `sucursal`, `sumaAlCosto`, `unidadMedida`, `bajoMinimo`.
- **`src/services/adminService.ts`**: Se agregó el método `getAdminInventory` que consume `GET /api/admin/inventory` con parámetros opcionales `busqueda`, `sucursal`, `bajoMinimo`, `page`, `size`. Acepta paginación server-side.
- **`src/pages/admin/AdminInventoryPage.tsx`**:
  - El tab **"Productos"** fue reemplazado en su data source: ya no usa `getAdminProducts` sino `getAdminInventory`.
  - Se agregaron estados: `invBusqueda`, `invSucursal`, `invBajoMin`, `invPage`, `invTotal`, `invTotalPags`.
  - `loadInventory` se convirtió en `useCallback` con dependencias de filtros, con carga paginada (20 por página).
  - Los filtros del tab ahora son: búsqueda por nombre, sucursal (texto), toggle de bajo mínimo — todos server-side.
  - La tabla ahora muestra columnas: Artículo, Unidad, Sucursal, Stock actual, Stock mínimo, Nivel (barra), Estado.
  - `getStatusInfo` ahora usa `stockActual` y `stockMinimo` reales del item (antes usaba `stock` y mínimo hardcodeado de 5).
  - Stats cards actualizadas: Total registros, Bajo mínimo, Suma al costo, Sucursales activas.
  - Se agregó paginación en el footer del tab inventario.

---
## [13 de Abril de 2026] - Reestructuración del Sidebar Administrativo

### Cambios Realizados
- **`src/components/AdminLayout.tsx`**: Se reestructuró el orden del sidebar según la jerarquía del negocio:
  1. Dashboard
  2. Pedidos (link directo)
  3. Catálogo (submenu: Lista de productos, Agregar producto, Gestión de recetas, CMS — Contenido)
  4. Inventario
  5. Usuarios
  6. Reportes
  7. Configuración
  8. [Divisor Sistema]
  9. Operación técnica (submenu: Respaldos, Exportación/importación, Usuarios técnicos, Monitoreo)
- Se eliminó "Pagos" del sidebar (no contemplado en la spec de vistas).
- Se actualizó `TECH_OPS_ITEMS` para reflejar las 4 vistas correctas de operación técnica (removiendo Auditoría del menú visible).
- Se eliminó `MAIN_NAV` como array genérico; el nav ahora es explícito para mejor control del orden.
- Se removieron los imports no utilizados (`CreditCard`, `ShieldAlert`).

---
## [12 de Abril de 2026] - Revisión de Requerimientos y Desarrollo de Vistas de Recuperación

### 🚀 Cambios y Tareas Realizadas
- Se realizó un mapeo exhaustivo entre el documento de diseño de vistas (`vistas_a_desarrollar.md`) y el árbol de componentes del Frontend en `src/pages/`.
- Se generó un reporte detallado identificando las vistas construidas y faltantes.
- **Implementación de Vistas de Recuperación**: Se desarrollaron las interfaces `ForgotPasswordPage.tsx` y `ResetPasswordPage.tsx` en `src/pages/auth/`.
- Se actualizó el sistema de enrutamiento principal (`AppRoutes.tsx`) integrando `/recuperar-contrasena` y `/restablecer-contrasena`, y se enlazaron con éxito desde la pantalla de inicio de sesión (`LoginPage.tsx`). Las nuevas vistas mantienen el diseño estético de marca.

### 🚧 Problemas / Blockers
- N/A

### 📅 Próximos Pasos (Next Steps)
- Continuar con el desarrollo de las vistas faltantes del administrador (gestión de recetas, CMS) y los modales interactivos para el punto de venta del empleado (plantillas dinámicas).
- Conectar completamente las nuevas vistas con el backend en el flujo completo de vida real.

---
## [13 de Abril de 2026] - Ajustes en Vistas de Autenticación y Layout

### Cambios Realizados
- **Renovación del Catálogo Público (`CatalogPage.tsx`):** Se mejoró el diseño base de la vista de cliente sin rehacer el componente. Se incluyó un nuevo Hero banner con degradado inmersivo y elementos desenfocados (glassmorphism/blur decorations). Se rediseñaron las tarjetas de producto para tener interacciones mucho más entretenidas al hacer hover (la tarjeta se eleva, los botones invierten sus colores, iconos que rotan) y se reubicó la información flotante en las miniaturas.
- **Modernización del panel de Filtros del Catálogo (Estilo Ebay/Yandex Horizontal):** Se eliminó el bloque gigante e invasivo inferior para reemplazarlo por una barra horizontal minimalista. Se usaron "Pill Dropdowns" (botones ovalados con menús desplegables) integrados directamente, categorizados por "Ocasión", "Precio" (convertido de slider a menú) y un nuevo filtro lógico de "Disponibilidad / En Stock".
- **Integración de API Oficial en Catálogo (`CatalogPage.tsx`):** Se modificó el `useEffect` para que enrutara dinámicamente las llamadas al backend dependiendo de la sesión activa. Ahora los visitantes anónimos y clientes verificados utilizan el endpoint de catálogo público (`/api/products`), y únicamente el equipo de administración y reportes carga `getAdminProducts` (`/api/admin/products`).
- **Layout de Recuperación de Contraseña:** Se actualizó la lógica en `src/components/Layout.tsx` para ocultar la barra de navegación y el pie de página en las rutas `/recuperar-contrasena` y `/restablecer-contrasena`, igualando así la experiencia de usuario limpia que tienen las páginas de login y registro.
- **Navegación del Botón Regresar:** Se corrigió en `src/pages/auth/LoginPage.tsx` el funcionamiento del botón "Regresar" para que redirija explícitamente a la página de inicio (`/`) en lugar de retroceder en el historial (evitando bucles infinitos entre la página de login y la de recuperación de contraseña).

---
## [13 de Abril de 2026] - Correcciones Críticas en Inventario Administrativo

### Cambios Realizados
- **Reconstrucción de `AdminInventoryPage.tsx`**: Se solucionaron errores graves de JSX y cierres de etiquetas que impedían el renderizado. Se optimizó el uso de `AnimatePresence` y `motion.div` para asegurar que los datos del inventario se visualicen correctamente al cambiar de pestaña.
- **Reorganización y Renombrado de Pestañas**:
    - **Pestaña "Flores"**: Antes llamada "Flores / Insumos", ahora se enfoca exclusivamente en materia prima (flores y follaje para recetas).
    - **Pestaña "Insumos"**: Reemplaza a la pestaña "Productos". Aquí es donde se muestra el stock de inventario general (floreros, cintas, accesorios y productos terminados), atendiendo la solicitud del usuario de ubicar estos elementos bajo la categoría de "Insumos".
- **Mejora de Modales**: Se limpiaron y estabilizaron los modales de importar, exportar, añadir y editar, eliminando redundancias y mejorando el flujo visual.
- **CatalogPage.tsx**: Corrección menor de etiquetas en el contenedor de animaciones.
