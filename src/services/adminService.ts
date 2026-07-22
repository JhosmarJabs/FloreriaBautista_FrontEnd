import {
  HealthCheckResponse,
  BackupsResponse,
  MaintenanceResponse,
  DatabaseMonitorResponse,
  Product,
  ProductDetail,
  ProductBody,
  Order,
  OrderDetail,
  InventoryItem,
  ApiResponse,
  SingleResponse,
  MeResponse,
  User,
  Flower,
  FlowerBody,
  ImportProductsResponse,
  UserBody,
  AuditLog,
  SchedulerConfigResponse,
  AdminCategory,
  AdminCatalogo,
  Promotion,
  PromotionBody,
  QuickSaleTemplate,
  SaveQuickSaleTemplateBody,
  SiteSettings,
  InventoryKpis,
  ProductKpis,
  CatalogKpis,
} from '../types';

const API_BASE = '/api/admin';
const TOKEN_URL = '/api/dev/token';

// Cache del token para evitar múltiples llamadas seguidas
let cachedToken: string | null = null;
let tokenExpiry: number = 0;


// ── Helpers de JWT ─────────────────────────────────────────────────────────
const isJwtExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp es en segundos, Date.now() en ms
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // si no se puede parsear, tratar como expirado
  }
};

// Limpia la sesión y manda al login. Se usa window.location (no useNavigate)
// porque este archivo no es un componente/hook de React.
const redirectToLogin = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('usuario');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const getToken = async (): Promise<string> => {
  // Usar el JWT real del usuario logueado si está disponible y no expirado
  const stored = localStorage.getItem('accessToken');
  if (stored && !stored.startsWith('local-token-')) {
    if (!isJwtExpired(stored)) {
      return stored;
    }
    // El token de la sesión expiró: cerrar sesión y mandar al login en vez
    // de dejar que cada pantalla truene con un "Error al cargar X" genérico.
    console.warn('[AdminService] Token JWT expirado. Redirigiendo a /login.');
    redirectToLogin();
    throw new Error('Sesión expirada. Redirigiendo al inicio de sesión…');
  }

  const now = Date.now();
  // Reusar token de dev si fue obtenido hace menos de 5 minutos
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }
  const response = await fetch(TOKEN_URL);
  if (!response.ok) throw new Error('No se pudo obtener el token de autenticación');
  const token = (await response.text()).trim();
  cachedToken = token;
  tokenExpiry = now + 5 * 60 * 1000; // 5 minutos
  return token;
};


const authHeaders = async () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${await getToken()}`,
});

export const AdminService = {
  // ─── Base de datos ────────────────────────────────────────────
  getDatabaseHealth: async (): Promise<HealthCheckResponse> => {
    const res = await fetch(`${API_BASE}/database/health`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener estado de la base de datos');
    return res.json();
  },

  runMaintenance: async (): Promise<MaintenanceResponse> => {
    const res = await fetch(`${API_BASE}/database/mantenimiento`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al ejecutar mantenimiento');
    return res.json();
  },

  getDatabaseMonitor: async (): Promise<DatabaseMonitorResponse> => {
    const res = await fetch(`${API_BASE}/database/monitor`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener datos del monitor de base de datos');
    return res.json();
  },

  // ─── Respaldos ────────────────────────────────────────────────
  getBackups: async (): Promise<BackupsResponse> => {
    const res = await fetch(`${API_BASE}/backups`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener lista de respaldos');
    return res.json();
  },

  getDriveBackups: async (): Promise<BackupsResponse> => {
    const res = await fetch(`${API_BASE}/backups/drive`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener respaldos de Drive');
    return res.json();
  },

  createFullBackup: async (descripcion: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/backups/full`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ descripcion, formato: 'BACKUP' }),
    });
    if (!res.ok) throw new Error('Error al crear respaldo completo');
    return res.json();
  },

  createTableBackup: async (
    nombreTabla: string,
    descripcion: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/backups/tabla`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ nombreTabla, descripcion }),
    });
    if (!res.ok) throw new Error('Error al crear respaldo de tabla');
    return res.json();
  },

  saveBackupConfig: async (
    frecuencia: string,
    hora: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/backups/config`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ frecuencia, hora }),
    });
    if (!res.ok) throw new Error('Error al guardar configuración de respaldos');
    return res.json();
  },

  getScheduler: async (): Promise<SchedulerConfigResponse> => {
    const res = await fetch(`${API_BASE}/scheduler`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener configuración del scheduler');
    return res.json();
  },

  saveSchedulerConfig: async (body: {
    backupAutomaticoActivo: boolean;
    frecuencia: string;
    diaSemana: number;
    hora: number;
    mantenimientoActivo: boolean;
  }): Promise<SchedulerConfigResponse> => {
    const res = await fetch(`${API_BASE}/scheduler`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Error al guardar configuración de automatización');
    return res.json();
  },

  triggerAutomaticBackup: async (): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/backups/full`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ 
        descripcion: "ejecucion automatica",
        formato: "BACKUP"
      }),
    });
    if (!res.ok) throw new Error('Error al ejecutar respaldo automático manual');
    return res.json();
  },

  restoreBackup: async (backupId: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/backups/${backupId}/restore`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── Productos públicos ───────────────────────────────────────
  getProducts: async (params: {
    busqueda?: string;
    categoria?: string;
    catalogo?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<Product>> => {
    const query = new URLSearchParams();
    if (params.busqueda !== undefined) query.set('busqueda', params.busqueda);
    if (params.categoria !== undefined) query.set('categoria', params.categoria);
    if (params.catalogo !== undefined) query.set('catalogo', params.catalogo);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    const qs = query.toString();
    const res = await fetch(`/api/products${qs ? `?${qs}` : ''}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener productos');
    return res.json();
  },

  // Catálogo para empleados (pedidos físicos): incluye productos SOLO_SUCURSAL
  // que el listado público oculta. Requiere rol ADMIN o EMPLEADO.
  getEmployeeProducts: async (params: {
    busqueda?: string;
    categoria?: string;
    catalogo?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<Product>> => {
    const query = new URLSearchParams();
    if (params.busqueda !== undefined) query.set('busqueda', params.busqueda);
    if (params.categoria !== undefined) query.set('categoria', params.categoria);
    if (params.catalogo !== undefined) query.set('catalogo', params.catalogo);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    const qs = query.toString();
    const res = await fetch(`/api/employee/products${qs ? `?${qs}` : ''}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener productos');
    return res.json();
  },

  // ─── Inventario admin ────────────────────────────────────────
  getAdminInventory: async (params: {
    busqueda?: string;
    sucursal?: string;
    bajoMinimo?: boolean;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<InventoryItem>> => {
    const query = new URLSearchParams();
    if (params.busqueda  !== undefined) query.set('busqueda',   params.busqueda);
    if (params.sucursal  !== undefined) query.set('sucursal',   params.sucursal);
    if (params.bajoMinimo !== undefined) query.set('bajoMinimo', String(params.bajoMinimo));
    if (params.page      !== undefined) query.set('page',       String(params.page));
    if (params.size      !== undefined) query.set('size',       String(params.size));
    const qs = query.toString();
    const res = await fetch(`${API_BASE}/inventory${qs ? `?${qs}` : ''}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener inventario');
    return res.json();
  },

  getAdminInventoryKpis: async (): Promise<SingleResponse<InventoryKpis>> => {
    const res = await fetch(`${API_BASE}/inventory/kpis`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener KPIs de inventario');
    return res.json();
  },

  getAdminProductsKpis: async (): Promise<SingleResponse<ProductKpis>> => {
    const res = await fetch(`${API_BASE}/products/kpis`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener KPIs de productos');
    return res.json();
  },

  getAdminCatalogsKpis: async (): Promise<SingleResponse<CatalogKpis>> => {
    const res = await fetch(`${API_BASE}/catalogos/kpis`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener KPIs de catálogos');
    return res.json();
  },

  getAdminInventoryItemById: async (id: string): Promise<SingleResponse<InventoryItem>> => {
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── Predicción de surtido (Modelos Predictivos — Propuesta 1) ─
  getSupplyForecast: async (id: string): Promise<SingleResponse<any>> => {
    const res = await fetch(`${API_BASE}/inventory/${id}/prediccion-surtido`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  createInventoryItem: async (body: any): Promise<SingleResponse<InventoryItem>> => {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  updateInventoryItem: async (id: string, body: any): Promise<SingleResponse<InventoryItem>> => {
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  deleteInventoryItem: async (id: string): Promise<ApiResponse<any>> => {
    const res = await fetch(`${API_BASE}/inventory/${id}/delete`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  getDashboardStats: async (): Promise<SingleResponse<any>> => {
    const res = await fetch(`${API_BASE}/reports/dashboard`, {
      method: 'GET',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  getSalesReport: async (desde?: string, hasta?: string): Promise<SingleResponse<any>> => {
    const query = new URLSearchParams();
    if (desde) query.set('desde', desde);
    if (hasta) query.set('hasta', hasta);
    const qs = query.toString();
    const res = await fetch(`${API_BASE}/reports/sales${qs ? `?${qs}` : ''}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  getTopProducts: async (top = 10): Promise<SingleResponse<any[]>> => {
    const res = await fetch(`${API_BASE}/reports/top-products?top=${top}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  getTopCustomers: async (top = 10): Promise<SingleResponse<any[]>> => {
    const res = await fetch(`${API_BASE}/reports/top-customers?top=${top}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── Productos admin ──────────────────────────────────────────
  getAdminProducts: async (params: {
    busqueda?: string;
    estado?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<Product>> => {
    const query = new URLSearchParams();
    if (params.busqueda !== undefined) query.set('busqueda', params.busqueda);
    if (params.estado !== undefined) query.set('estado', params.estado);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    const qs = query.toString();
    const res = await fetch(`${API_BASE}/products${qs ? `?${qs}` : ''}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener productos admin');
    return res.json();
  },

  getAdminProductById: async (productId: string): Promise<SingleResponse<ProductDetail>> => {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  createAdminProduct: async (body: ProductBody): Promise<ApiResponse<Product>> => {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Error al crear producto');
    return res.json();
  },

  updateAdminProduct: async (productId: string, body: ProductBody): Promise<ApiResponse<Product>> => {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Error al actualizar producto');
    return res.json();
  },

  // ─── Exportación ──────────────────────────────────────────────
  exportAdminProducts: async (): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/export/products`, {
      headers: { Authorization: `Bearer ${await getToken()}` },
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.blob();
  },

  exportAdminInventory: async (): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/export/inventory`, {
      headers: { Authorization: `Bearer ${await getToken()}` },
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.blob();
  },

  // ─── Importación ──────────────────────────────────────────────
  importAdminProducts: async (file: File): Promise<ImportProductsResponse> => {
    const form = new FormData();
    form.append('archivo', file);
    const res = await fetch(`${API_BASE}/import/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await getToken()}` },
      body: form,
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  importAdminInventory: async (file: File): Promise<void> => {
    const form = new FormData();
    form.append('archivo', file);
    const res = await fetch(`${API_BASE}/import/inventory`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await getToken()}` },
      body: form,
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  },

  importFlowers: async (file: File): Promise<ImportProductsResponse> => {
    const form = new FormData();
    form.append('archivo', file);
    const res = await fetch(`${API_BASE}/import/flowers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await getToken()}` },
      body: form,
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  exportFlowers: async (): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(`${API_BASE}/export/flowers`, {
      headers: { Authorization: `Bearer ${await getToken()}` },
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    const disposition = res.headers.get('content-disposition') ?? '';
    const match = disposition.match(/filename=([^;]+)/);
    const filename = match ? match[1].trim() : 'flores_export.csv';
    return { blob: await res.blob(), filename };
  },

  // ─── Usuario actual ───────────────────────────────────────────
  getCurrentUser: async (): Promise<MeResponse> => {
    const res = await fetch('/api/users/me', {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  updateCurrentUser: async (body: {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    sexo?: string;
    fechaNacimiento?: string;
  }): Promise<MeResponse> => {
    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── Producto público por ID ──────────────────────────────────
  getPublicProductById: async (productId: string): Promise<SingleResponse<ProductDetail>> => {
    const res = await fetch(`/api/products/${productId}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── Pedidos del cliente autenticado ─────────────────────────
  getMyOrders: async (): Promise<ApiResponse<Order>> => {
    const res = await fetch('/api/orders/mis-pedidos', {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── Órdenes admin ────────────────────────────────────────────
  getAdminOrders: async (params: {
    estado?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    size?: number;
    archivado?: boolean;
  } = {}): Promise<ApiResponse<Order>> => {
    const query = new URLSearchParams();
    if (params.estado !== undefined) query.set('estado', params.estado);
    if (params.desde !== undefined) query.set('desde', params.desde);
    if (params.hasta !== undefined) query.set('hasta', params.hasta);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    if (params.archivado !== undefined) query.set('archivado', String(params.archivado));
    const qs = query.toString();
    const res = await fetch(`${API_BASE}/orders${qs ? `?${qs}` : ''}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener órdenes');
    return res.json();
  },

  getAdminOrderById: async (orderId: string): Promise<SingleResponse<OrderDetail>> => {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  createPhysicalOrder: async (body: {
    nombreCliente: string;
    telefono?: string;
    fechaEntrega: string;
    horaEntrega?: string | null;
    tipoPedido: 'INSTANTANEO' | 'ANTICIPADO';
    notas?: string;
    direccion?: { calle: string; colonia: string; municipio: string; estado: string; cp?: string; referencias?: string };
    items: { productId: string; cantidad: number; notas?: string }[];
    montoPagado?: number;
    metodoPago?: string;
  }): Promise<SingleResponse<OrderDetail>> => {
    // Nota: este endpoint vive en /api/orders (OrdersController), no en /api/admin/orders
    const res = await fetch(`/api/orders/physical`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // Registrar un pago (anticipo o liquidación) sobre un pedido ya existente
  registerOrderPayment: async (orderId: string, body: { monto: number; metodo: string }): Promise<SingleResponse<OrderDetail>> => {
    const res = await fetch(`/api/orders/${orderId}/payments`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  updateAdminOrderStatus: async (orderId: string, nuevoEstado: string): Promise<SingleResponse<OrderDetail>> => {
    // Nota: este endpoint vive en /api/orders (OrdersController), no en /api/admin/orders
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ nuevoEstado }),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── Flores / Insumos ─────────────────────────────────────────
  getFlowers: async (params: {
    busqueda?: string;
    color?: string;
    bajoMinimo?: boolean;
    estado?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<Flower>> => {
    const query = new URLSearchParams();
    if (params.busqueda !== undefined) query.set('busqueda', params.busqueda);
    if (params.color !== undefined) query.set('color', params.color);
    if (params.bajoMinimo !== undefined) query.set('bajoMinimo', String(params.bajoMinimo));
    if (params.estado !== undefined) query.set('estado', params.estado);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    const qs = query.toString();
    const res = await fetch(`${API_BASE}/flowers${qs ? `?${qs}` : ''}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener flores/insumos');
    return res.json();
  },

  updateFlower: async (id: string, body: FlowerBody): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/flowers/${id}`, {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  createFlower: async (body: FlowerBody): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/flowers`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── Usuarios admin ───────────────────────────────────────────
  getAdminUsers: async (params: {
    busqueda?: string;
    rol?: string;
    estado?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<User>> => {
    const query = new URLSearchParams();
    if (params.busqueda !== undefined) query.set('busqueda', params.busqueda);
    if (params.rol !== undefined) query.set('rol', params.rol);
    if (params.estado !== undefined) query.set('estado', params.estado);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    const qs = query.toString();
    const res = await fetch(`${API_BASE}/users${qs ? `?${qs}` : ''}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  getAdminUserById: async (userId: string): Promise<ApiResponse<User>> => {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  updateAdminUserStatus: async (
    userId: string,
    activo: boolean,
    motivo: string
  ): Promise<void> => {
    const res = await fetch(`${API_BASE}/users/${userId}/status`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ activo, motivo }),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  },

  updateAdminUserRoles: async (userId: string, roles: string[]): Promise<void> => {
    const res = await fetch(`${API_BASE}/users/${userId}/roles`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ roles }),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  },

  getAuditByEntity: async (entidad: string, entidadId: string): Promise<{ success: boolean; data: AuditLog[] }> => {
    const res = await fetch(`${API_BASE}/audit/${encodeURIComponent(entidad)}/${encodeURIComponent(entidadId)}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  getAuditLogs: async (params: {
    entidad?: string;
    accion?: string;
    usuarioId?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<AuditLog>> => {
    const query = new URLSearchParams();
    if (params.entidad)   query.set('entidad',    params.entidad);
    if (params.accion)    query.set('accion',     params.accion);
    if (params.usuarioId) query.set('usuarioId',  params.usuarioId);
    if (params.desde)     query.set('desde',      params.desde);
    if (params.hasta)     query.set('hasta',      params.hasta);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    const qs = query.toString();
    const res = await fetch(`${API_BASE}/audit${qs ? `?${qs}` : ''}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  createAdminUser: async (body: UserBody): Promise<SingleResponse<User>> => {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error ${res.status}: ${errorText}`);
    }
    return res.json();
  },

  // ─── Promociones ──────────────────────────────────────────────
  getAdminPromotions: async (): Promise<SingleResponse<Promotion[]>> => {
    const res = await fetch(`${API_BASE}/promotions`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  getAdminPromotionById: async (id: string): Promise<SingleResponse<Promotion>> => {
    const res = await fetch(`${API_BASE}/promotions/${id}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  createAdminPromotion: async (body: PromotionBody): Promise<SingleResponse<Promotion>> => {
    const res = await fetch(`${API_BASE}/promotions`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  updateAdminPromotion: async (id: string, body: PromotionBody): Promise<SingleResponse<Promotion>> => {
    const res = await fetch(`${API_BASE}/promotions/${id}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  deleteAdminPromotion: async (id: string): Promise<SingleResponse<null>> => {
    const res = await fetch(`${API_BASE}/promotions/${id}/eliminar`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── Plantillas de Venta Rápida (compartidas ADMIN + EMPLEADO) ──
  getQuickSaleTemplates: async (): Promise<SingleResponse<QuickSaleTemplate[]>> => {
    const res = await fetch('/api/quick-sale-templates', {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  createQuickSaleTemplate: async (body: SaveQuickSaleTemplateBody): Promise<SingleResponse<QuickSaleTemplate>> => {
    const res = await fetch('/api/quick-sale-templates', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  updateQuickSaleTemplate: async (id: string, body: SaveQuickSaleTemplateBody): Promise<SingleResponse<QuickSaleTemplate>> => {
    const res = await fetch(`/api/quick-sale-templates/${id}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  deleteQuickSaleTemplate: async (id: string): Promise<SingleResponse<null>> => {
    const res = await fetch(`/api/quick-sale-templates/${id}/eliminar`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── CMS ──────────────────────────────────────────────────────
  getCms: async (): Promise<SingleResponse<SiteSettings>> => {
    const res = await fetch(`${API_BASE}/cms`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  updateCms: async (body: SiteSettings): Promise<SingleResponse<SiteSettings>> => {
    const res = await fetch(`${API_BASE}/cms`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── Catálogos globales ────────────────────────────────────────
  getCategorias: async (): Promise<SingleResponse<AdminCategory[]>> => {
    const res = await fetch(`${API_BASE}/categories`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener catálogo de categorías');
    return res.json();
  },

  getCatalogos: async (): Promise<SingleResponse<AdminCatalogo[]>> => {
    const res = await fetch(`${API_BASE}/catalogos`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener catálogos');
    return res.json();
  },

  // Catálogos visibles para empleados (endpoint público /api/catalogos): para
  // roles no-admin devuelve solo los catálogos activos. Usado por Venta Rápida
  // para armar las plantillas a partir de catálogos. Devuelve un array plano.
  getPublicCatalogos: async (): Promise<AdminCatalogo[]> => {
    const res = await fetch('/api/catalogos', {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener catálogos');
    return res.json();
  },

  getCatalogoById: async (id: string): Promise<SingleResponse<any>> => {
    const res = await fetch(`${API_BASE}/catalogos/${id}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener catálogo');
    return res.json();
  },

  createCatalog: async (body: any): Promise<SingleResponse<any>> => {
    const res = await fetch(`${API_BASE}/catalogos`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Error al crear catálogo');
    return res.json();
  },

  updateCatalog: async (id: string, body: any): Promise<SingleResponse<any>> => {
    const res = await fetch(`${API_BASE}/catalogos/${id}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Error al actualizar catálogo');
    return res.json();
  },

  // ─── Recomendaciones (Modelos Predictivos — Propuesta 2) ───────
  // Endpoint público (sin auth de admin) — reglas de asociación con fallback a más vendidos.
  getRecommendedProducts: async (productIds: string[], top = 4): Promise<SingleResponse<any[]>> => {
    const ids = productIds.filter(Boolean).join(',');
    const res = await fetch(`/api/products/recomendados?ids=${encodeURIComponent(ids)}&top=${top}`);
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  recalcularReglasAsociacion: async (): Promise<SingleResponse<any>> => {
    const res = await fetch(`${API_BASE}/analytics/reglas-asociacion/recalcular`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── Segmentación de clientes (Modelos Predictivos — Propuesta 3) ──
  getCustomerSegments: async (): Promise<SingleResponse<any[]>> => {
    const res = await fetch(`${API_BASE}/analytics/segmentos-clientes`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  recalcularSegmentosClientes: async (): Promise<SingleResponse<any>> => {
    const res = await fetch(`${API_BASE}/analytics/segmentos-clientes/recalcular`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },
};