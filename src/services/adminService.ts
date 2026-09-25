import {
  HealthCheckResponse,
  BackupsResponse,
  BackupJobsResponse,
  MaintenanceResponse,
  DatabaseMonitorResponse,
  Product,
  ProductDetail,
  ProductBody,
  Order,
  OrderDetail,
  InventoryItem,
  InventoryMovement,
  RegisterMovementRequest,
  ApiResponse,
  PagedResult,
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
  Oferta,
  SaveOfertaBody,
  OfertaPublica,
  Descuento,
  SaveDescuentoBody,
  DescuentoPublico,
  PricingItem,
  PricingBreakdown,
  TemporadaProxima,
  QuickSaleTemplate,
  SaveQuickSaleTemplateBody,
  SiteSettings,
  InventoryKpis,
  ProductKpis,
  SeasonalCatalogKpis,
  EmployeeExpense,
  CashCut,
  ErrorReport,
  ResolucionAccion,
} from '../types';
import { isJwtExpired, limpiarSesion } from '../utils/auth';
import { apiCache } from './apiCache';

const API_BASE = '/api/admin';
const TOKEN_URL = '/api/dev/token';

// ── Direcciones del cliente ──────────────────────────────────────
export interface UserAddress {
  id: string;
  etiqueta?: string | null;
  calle: string;
  colonia: string;
  municipio: string;
  estado: string;
  cp?: string | null;
  referencias?: string | null;
  esPrincipal: boolean;
}

export type AddressInput = Omit<UserAddress, 'id'>;

// ── Solicitudes de reabastecimiento ──────────────────────────────
export type SupplyOrderEstado =
  | 'BORRADOR' | 'ENVIADA' | 'RECIBIDA_PARCIAL' | 'RECIBIDA' | 'CANCELADA';

export type SupplyOrderLineaEstado =
  | 'PENDIENTE' | 'COMPLETO' | 'PARCIAL' | 'NO_LLEGO' | 'EXCEDENTE';

export interface SupplyOrderListItem {
  id: string;
  folio: string;
  estado: SupplyOrderEstado;
  proveedor?: string | null;
  fechaSolicitud: string;
  fechaEnvio?: string | null;
  fechaRecepcion?: string | null;
  semanaObjetivo?: string | null;
  totalLineas: number;
  lineasConfirmadas: number;
  porcentajeRecibido: number;
  totalEstimado: number;
}

export interface SupplyOrderLinea {
  id: string;
  inventoryItemId: string;
  nombreSnapshot: string;
  unidadMedida?: string | null;
  cantidadSolicitada: number;
  cantidadRecibida?: number | null;
  estadoLinea: SupplyOrderLineaEstado;
  precioUnitario?: number | null;
  origen: string;
  observacion?: string | null;
  recibidoEn?: string | null;
  inventoryMovementId?: string | null;
  diferencia: number;
}

export interface SupplyOrderDetail extends SupplyOrderListItem {
  notas?: string | null;
  usuarioId: string;
  usuarioNombre?: string | null;
  lineas: SupplyOrderLinea[];
}

export interface SupplyOrderInput {
  proveedor?: string | null;
  semanaObjetivo?: string | null;
  notas?: string | null;
  lineas: { inventoryItemId: string; cantidad: number; origen?: string }[];
}

export interface SupplyOrderReceiveInput {
  lineas: {
    itemId: string;
    cantidadRecibida: number;
    precioUnitario?: number | null;
    observacion?: string | null;
  }[];
  cerrarSolicitud: boolean;
}

// ── Creación de pedido web ───────────────────────────────────────
export interface WebOrderInput {
  fechaEntrega: string;        // YYYY-MM-DD
  horaEntrega?: string | null; // HH:mm:ss (opcional)
  tipoPedido: 'INSTANTANEO' | 'ANTICIPADO';
  notas?: string | null;
  costoEnvio?: number;
  direccion: {
    calle: string;
    colonia: string;
    municipio: string;
    estado: string;
    cp?: string | null;
    referencias?: string | null;
  };
  items: { productId: string; cantidad: number; notas?: string | null }[];
  codigoCupon?: string | null;
}

// ── Solicitudes de venta instantanea (admin) ────────────────────
export interface SolicitudVentaInstantaneaAdmin {
  id: string;
  customerId: string;
  nombreCliente: string;
  telefonoCliente: string | null;
  productId: string;
  nombreProducto: string;
  imagenProducto: string | null;
  cantidad: number;
  estado: string;  // PENDIENTE | ACEPTADA | RECHAZADA | EXPIRADA
  creadaEn: string;
  escaladaAEmpleadoEn: string | null;
  decididaEn: string | null;
  decididaPorNombre: string | null;
  motivoRechazo: string | null;
  motivoExpiracion: string | null;
  reservaExpiraEn: string | null;
  orderId: string | null;
}

// Cache del token para evitar múltiples llamadas seguidas
let cachedToken: string | null = null;
let tokenExpiry: number = 0;


// Limpia la sesión y manda al login. Se usa window.location (no useNavigate)
// porque este archivo no es un componente/hook de React. `limpiarSesion` borra
// también la clave heredada 'user', que si sobrevive revive una sesión vieja.
const redirectToLogin = () => {
  limpiarSesion();
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

/**
 * Extrae el mensaje real del backend. ExceptionMiddleware responde `{ status, message }`
 * y la validación de [ApiController] responde ProblemDetails con `errors`; en ambos casos
 * el usuario merece ver el motivo ("Stock insuficiente…") y no un "Error 400" pelón.
 */
const errorMessage = async (res: Response, fallback: string): Promise<string> => {
  try {
    const body = await res.json();
    if (typeof body?.message === 'string' && body.message) return body.message;
    if (body?.errors) {
      const detalles = Object.values(body.errors as Record<string, string[]>).flat();
      if (detalles.length > 0) return detalles.join(' ');
    }
    if (typeof body?.title === 'string' && body.title) return body.title;
  } catch {
    /* respuesta sin JSON: se usa el mensaje genérico */
  }
  return `${fallback} (error ${res.status})`;
};

async function cachedGet<T>(url: string, errorMsg: string): Promise<T> {
  const hit = apiCache.get(url);
  if (hit) return hit as T;
  const res = await fetch(url, { headers: await authHeaders() });
  if (!res.ok) throw new Error(await errorMessage(res, errorMsg));
  const json = await res.json();
  apiCache.set(url, json);
  return json;
}

async function mutate<T>(
  method: string, url: string, body?: unknown, invalidatePattern?: string, errorMsg = 'Error'
): Promise<T> {
  if (invalidatePattern) apiCache.invalidate(invalidatePattern);
  const res = await fetch(url, {
    method,
    headers: await authHeaders(),
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, errorMsg));
  return res.json();
}

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
  getBackups: async (): Promise<BackupJobsResponse> => {
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

  createFullBackup: async (
    descripcion: string,
    destino: string = 'DRIVE'
  ): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/backups/full`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ descripcion, formato: 'BACKUP', destino }),
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
    return cachedGet(`${API_BASE}/inventory${qs ? `?${qs}` : ''}`, 'Error al obtener inventario');
  },

  getInventoryIndex: async (): Promise<{ items: InventoryItem[]; sincronizadoEn: string }> => {
    const res = await fetch(`${API_BASE}/inventory/index`, { headers: await authHeaders() });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al cargar índice de inventario'));
    const json = await res.json();
    return json.data;
  },

  getInventoryDelta: async (desde: string): Promise<{ items: InventoryItem[]; sincronizadoEn: string }> => {
    const res = await fetch(`${API_BASE}/inventory/delta?desde=${encodeURIComponent(desde)}`, { headers: await authHeaders() });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al sincronizar inventario'));
    const json = await res.json();
    return json.data;
  },

  getAdminInventoryKpis: async (): Promise<SingleResponse<InventoryKpis>> => {
    return cachedGet(`${API_BASE}/inventory/kpis`, 'Error al obtener KPIs de inventario');
  },

  getAdminInventoryMovements: async (params: {
    inventoryItemId?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<InventoryMovement>> => {
    const query = new URLSearchParams();
    if (params.inventoryItemId) query.set('inventoryItemId', params.inventoryItemId);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    const qs = query.toString();
    return cachedGet(`${API_BASE}/inventory/movements${qs ? `?${qs}` : ''}`, 'Error al obtener movimientos de inventario');
  },

  registerAdminInventoryMovement: async (
    body: RegisterMovementRequest,
  ): Promise<SingleResponse<InventoryMovement>> => {
    apiCache.invalidate('/inventory');
    const res = await fetch(`${API_BASE}/inventory/movements`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || 'Error al registrar el movimiento');
    return json;
  },

  getAdminProductsKpis: async (): Promise<SingleResponse<ProductKpis>> => {
    return cachedGet(`${API_BASE}/products/kpis`, 'Error al obtener KPIs de productos');
  },

  getAdminCatalogsKpis: async (): Promise<SingleResponse<SeasonalCatalogKpis>> => {
    return cachedGet(`${API_BASE}/catalogos/kpis`, 'Error al obtener KPIs de catálogos');
  },

  getAdminInventoryItemById: async (id: string): Promise<SingleResponse<InventoryItem>> => {
    return cachedGet(`${API_BASE}/inventory/${id}`, 'Error al obtener insumo');
  },

  // ─── Predicción de surtido (Modelos Predictivos — Propuesta 1) ─
  getSupplyForecast: async (id: string): Promise<SingleResponse<any>> => {
    return cachedGet(`${API_BASE}/inventory/${id}/prediccion-surtido`, 'Error al obtener predicción de surtido');
  },

  getReabastecimiento: async (refresh = false): Promise<SingleResponse<any[]>> => {
    if (refresh) apiCache.invalidate('/inventory/reabastecimiento');
    return cachedGet(`${API_BASE}/inventory/reabastecimiento${refresh ? '?refresh=true' : ''}`, 'Error al obtener reabastecimiento');
  },

  // ─── Solicitudes de reabastecimiento ──────────────────────────
  // La lista armada con la predicción del modelo se vuelve un documento persistente:
  // se genera, se manda al proveedor y después se confirma la recepción línea por línea.
  getSupplyOrders: async (params: {
    estado?: SupplyOrderEstado | '';
    desde?: string;
    hasta?: string;
    page?: number;
    size?: number;
  } = {}): Promise<SingleResponse<PagedResult<SupplyOrderListItem>>> => {
    const qs = new URLSearchParams();
    if (params.estado) qs.set('estado', params.estado);
    if (params.desde)  qs.set('desde', params.desde);
    if (params.hasta)  qs.set('hasta', params.hasta);
    qs.set('page', String(params.page ?? 1));
    qs.set('size', String(params.size ?? 20));

    return cachedGet(`${API_BASE}/supply-orders?${qs}`, 'Error al obtener las solicitudes');
  },

  getSupplyOrder: async (id: string): Promise<SingleResponse<SupplyOrderDetail>> => {
    return cachedGet(`${API_BASE}/supply-orders/${id}`, 'Error al obtener la solicitud');
  },

  createSupplyOrder: async (body: SupplyOrderInput): Promise<SingleResponse<SupplyOrderDetail>> => {
    apiCache.invalidate('/supply-orders');
    const res = await fetch(`${API_BASE}/supply-orders`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al generar la solicitud'));
    return res.json();
  },

  updateSupplyOrder: async (id: string, body: SupplyOrderInput): Promise<SingleResponse<SupplyOrderDetail>> => {
    apiCache.invalidate('/supply-orders');
    const res = await fetch(`${API_BASE}/supply-orders/${id}`, {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al actualizar la solicitud'));
    return res.json();
  },

  sendSupplyOrder: async (id: string): Promise<SingleResponse<SupplyOrderDetail>> => {
    apiCache.invalidate('/supply-orders');
    const res = await fetch(`${API_BASE}/supply-orders/${id}/enviar`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al marcar la solicitud como enviada'));
    return res.json();
  },

  receiveSupplyOrder: async (
    id: string,
    body: SupplyOrderReceiveInput,
  ): Promise<SingleResponse<SupplyOrderDetail>> => {
    apiCache.invalidate('/supply-orders');
    apiCache.invalidate('/inventory');
    const res = await fetch(`${API_BASE}/supply-orders/${id}/recepcion`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al registrar la recepción'));
    return res.json();
  },

  cancelSupplyOrder: async (id: string, motivo?: string): Promise<SingleResponse<SupplyOrderDetail>> => {
    apiCache.invalidate('/supply-orders');
    const res = await fetch(`${API_BASE}/supply-orders/${id}/cancelar`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ motivo: motivo ?? null }),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al cancelar la solicitud'));
    return res.json();
  },

  createInventoryItem: async (body: any): Promise<SingleResponse<InventoryItem>> => {
    apiCache.invalidate('/inventory');
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  updateInventoryItem: async (id: string, body: any): Promise<SingleResponse<InventoryItem>> => {
    apiCache.invalidate('/inventory');
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  deleteInventoryItem: async (id: string): Promise<ApiResponse<any>> => {
    apiCache.invalidate('/inventory');
    const res = await fetch(`${API_BASE}/inventory/${id}/delete`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  getDashboardStats: async (): Promise<SingleResponse<any>> => {
    return cachedGet(`${API_BASE}/reports/dashboard`, 'Error al obtener estadísticas del dashboard');
  },

  getSalesReport: async (desde?: string, hasta?: string): Promise<SingleResponse<any>> => {
    const query = new URLSearchParams();
    if (desde) query.set('desde', desde);
    if (hasta) query.set('hasta', hasta);
    const qs = query.toString();
    return cachedGet(`${API_BASE}/reports/sales${qs ? `?${qs}` : ''}`, 'Error al obtener reporte de ventas');
  },

  getTopProducts: async (top = 10): Promise<SingleResponse<any[]>> => {
    return cachedGet(`${API_BASE}/reports/top-products?top=${top}`, 'Error al obtener top productos');
  },

  getTopCustomers: async (top = 10): Promise<SingleResponse<any[]>> => {
    return cachedGet(`${API_BASE}/reports/top-customers?top=${top}`, 'Error al obtener top clientes');
  },

  // ─── Productos admin ──────────────────────────────────────────
  getAdminProducts: async (params: {
    busqueda?: string;
    estado?: string;
    page?: number;
    size?: number;
    sortBy?: string;
  } = {}): Promise<ApiResponse<Product>> => {
    const query = new URLSearchParams();
    if (params.busqueda !== undefined) query.set('busqueda', params.busqueda);
    if (params.estado !== undefined) query.set('estado', params.estado);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    if (params.sortBy !== undefined) query.set('sortBy', params.sortBy);
    const qs = query.toString();
    return cachedGet(`${API_BASE}/products${qs ? `?${qs}` : ''}`, 'Error al obtener productos admin');
  },

  getProductsIndex: async (): Promise<{ items: Product[]; sincronizadoEn: string }> => {
    const res = await fetch(`${API_BASE}/products/index`, { headers: await authHeaders() });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al cargar índice de productos'));
    const json = await res.json();
    return json.data;
  },

  getProductsDelta: async (desde: string): Promise<{ items: Product[]; sincronizadoEn: string }> => {
    const res = await fetch(`${API_BASE}/products/delta?desde=${encodeURIComponent(desde)}`, { headers: await authHeaders() });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al sincronizar productos'));
    const json = await res.json();
    return json.data;
  },

  getAdminProductById: async (productId: string): Promise<SingleResponse<ProductDetail>> => {
    return cachedGet(`${API_BASE}/products/${productId}`, 'Error al obtener producto');
  },

  createAdminProduct: async (body: ProductBody): Promise<ApiResponse<Product>> => {
    apiCache.invalidate('/products');
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Error al crear producto');
    return res.json();
  },

  updateAdminProduct: async (productId: string, body: ProductBody): Promise<ApiResponse<Product>> => {
    apiCache.invalidate('/products');
    apiCache.invalidate('/products/kpis');
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

  // ─── Direcciones del usuario ──────────────────────────────────
  getMyAddresses: async (): Promise<UserAddress[]> => {
    const res = await fetch('/api/users/me/addresses', {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.data ?? [];
  },

  createMyAddress: async (body: AddressInput): Promise<UserAddress> => {
    const res = await fetch('/api/users/me/addresses', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return (await res.json()).data;
  },

  updateMyAddress: async (id: string, body: AddressInput): Promise<UserAddress> => {
    const res = await fetch(`/api/users/me/addresses/${id}`, {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return (await res.json()).data;
  },

  setMyAddressPrincipal: async (id: string): Promise<UserAddress> => {
    const res = await fetch(`/api/users/me/addresses/${id}/principal`, {
      method: 'PATCH',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return (await res.json()).data;
  },

  deleteMyAddress: async (id: string): Promise<void> => {
    const res = await fetch(`/api/users/me/addresses/${id}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  },

  // ─── Pedidos web + pago Mercado Pago ──────────────────────────
  createWebOrder: async (body: WebOrderInput): Promise<{ id: string; total: number; saldoPendiente: number }> => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return (await res.json()).data;
  },

  createMpPreference: async (orderId: string): Promise<{ preferenceId: string; initPoint: string }> => {
    const res = await fetch('/api/payments/mercadopago/preference', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) {
      // 503 = pago en línea no configurado todavía
      let msg = `Error ${res.status}`;
      try { msg = (await res.json()).message || msg; } catch { /* noop */ }
      throw new Error(msg);
    }
    return (await res.json()).data;
  },

  confirmMpPayment: async (paymentId: string): Promise<{ orderId: string; estado: string; acreditado: boolean }> => {
    const res = await fetch('/api/payments/mercadopago/confirm', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ paymentId }),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return (await res.json()).data;
  },

  // Confirma el pago buscándolo en MP por id de orden (sin payment_id, ej. localhost).
  confirmMpOrder: async (orderId: string): Promise<{ orderId: string; estado: string; acreditado: boolean }> => {
    const res = await fetch('/api/payments/mercadopago/confirm-order', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return (await res.json()).data;
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
    const res = await fetch('/api/orders/my', {
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
    return cachedGet(`${API_BASE}/orders${qs ? `?${qs}` : ''}`, 'Error al obtener órdenes');
  },

  getOrdersDelta: async (desde: string): Promise<{ items: Order[]; sincronizadoEn: string }> => {
    const res = await fetch(`${API_BASE}/orders/delta?desde=${encodeURIComponent(desde)}`, { headers: await authHeaders() });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al sincronizar pedidos'));
    const json = await res.json();
    return json.data;
  },

  getAdminOrderById: async (orderId: string): Promise<SingleResponse<OrderDetail>> => {
    return cachedGet(`${API_BASE}/orders/${orderId}`, 'Error al obtener orden');
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
    idLocalOffline?: string;
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
    return cachedGet(`${API_BASE}/flowers${qs ? `?${qs}` : ''}`, 'Error al obtener flores/insumos');
  },

  updateFlower: async (id: string, body: FlowerBody): Promise<{ success: boolean; message: string }> => {
    apiCache.invalidate('/flowers');
    const res = await fetch(`${API_BASE}/flowers/${id}`, {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  createFlower: async (body: FlowerBody): Promise<{ success: boolean; message: string }> => {
    apiCache.invalidate('/flowers');
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
    return cachedGet(`${API_BASE}/users${qs ? `?${qs}` : ''}`, 'Error al obtener usuarios');
  },

  getAdminUserById: async (userId: string): Promise<ApiResponse<User>> => {
    return cachedGet(`${API_BASE}/users/${userId}`, 'Error al obtener usuario');
  },

  updateAdminUserStatus: async (
    userId: string,
    activo: boolean,
    motivo: string
  ): Promise<void> => {
    apiCache.invalidate('/users');
    const res = await fetch(`${API_BASE}/users/${userId}/status`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ activo, motivo }),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  },

  updateAdminUserRoles: async (userId: string, roles: string[]): Promise<void> => {
    apiCache.invalidate('/users');
    const res = await fetch(`${API_BASE}/users/${userId}/roles`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ roles }),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  },

  // ─── Responsable de turno ──────────────────────────────────────
  getResponsableTurno: async (): Promise<SingleResponse<User | null>> => {
    return cachedGet(`${API_BASE}/users/responsable-turno`, 'Error al obtener responsable de turno');
  },

  asignarResponsableTurno: async (userId: string): Promise<SingleResponse<null>> => {
    apiCache.invalidate('/users');
    const res = await fetch(`${API_BASE}/users/${userId}/responsable-turno`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al asignar responsable de turno'));
    return res.json();
  },

  quitarResponsableTurno: async (): Promise<SingleResponse<null>> => {
    apiCache.invalidate('/users');
    const res = await fetch(`${API_BASE}/users/responsable-turno`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al quitar responsable de turno'));
    return res.json();
  },

  getAuditByEntity: async (entidad: string, entidadId: string): Promise<{ success: boolean; data: AuditLog[] }> => {
    return cachedGet(`${API_BASE}/audit/${encodeURIComponent(entidad)}/${encodeURIComponent(entidadId)}`, 'Error al obtener auditoría');
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
    return cachedGet(`${API_BASE}/audit${qs ? `?${qs}` : ''}`, 'Error al obtener logs de auditoría');
  },

  createAdminUser: async (body: UserBody): Promise<SingleResponse<User>> => {
    apiCache.invalidate('/users');
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
    return cachedGet(`${API_BASE}/promotions`, 'Error al obtener promociones');
  },

  getAdminPromotionById: async (id: string): Promise<SingleResponse<Promotion>> => {
    return cachedGet(`${API_BASE}/promotions/${id}`, 'Error al obtener promoción');
  },

  createAdminPromotion: async (body: PromotionBody): Promise<SingleResponse<Promotion>> => {
    apiCache.invalidate('/promotions');
    const res = await fetch(`${API_BASE}/promotions`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  updateAdminPromotion: async (id: string, body: PromotionBody): Promise<SingleResponse<Promotion>> => {
    apiCache.invalidate('/promotions');
    const res = await fetch(`${API_BASE}/promotions/${id}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  deleteAdminPromotion: async (id: string): Promise<SingleResponse<null>> => {
    apiCache.invalidate('/promotions');
    const res = await fetch(`${API_BASE}/promotions/${id}/eliminar`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── Ofertas (admin) ────────────────────────────────────────────
  getAdminOfertas: async (): Promise<SingleResponse<Oferta[]>> => {
    return cachedGet(`${API_BASE}/offers`, 'Error al obtener ofertas');
  },

  createOferta: async (body: SaveOfertaBody): Promise<SingleResponse<Oferta>> => {
    return mutate('POST', `${API_BASE}/offers`, body, '/offers', 'Error al crear oferta');
  },

  updateOferta: async (id: string, body: SaveOfertaBody): Promise<SingleResponse<Oferta>> => {
    return mutate('POST', `${API_BASE}/offers/${id}`, body, '/offers', 'Error al actualizar oferta');
  },

  deleteOferta: async (id: string): Promise<SingleResponse<null>> => {
    return mutate('POST', `${API_BASE}/offers/${id}/eliminar`, undefined, '/offers', 'Error al eliminar oferta');
  },

  // ─── Descuentos (admin) ─────────────────────────────────────────
  getAdminDescuentos: async (): Promise<SingleResponse<Descuento[]>> => {
    return cachedGet(`${API_BASE}/discounts`, 'Error al obtener descuentos');
  },

  createDescuento: async (body: SaveDescuentoBody): Promise<SingleResponse<Descuento>> => {
    return mutate('POST', `${API_BASE}/discounts`, body, '/discounts', 'Error al crear descuento');
  },

  updateDescuento: async (id: string, body: SaveDescuentoBody): Promise<SingleResponse<Descuento>> => {
    return mutate('POST', `${API_BASE}/discounts/${id}`, body, '/discounts', 'Error al actualizar descuento');
  },

  deleteDescuento: async (id: string): Promise<SingleResponse<null>> => {
    return mutate('POST', `${API_BASE}/discounts/${id}/eliminar`, undefined, '/discounts', 'Error al eliminar descuento');
  },

  // ─── Ofertas y descuentos (público) ─────────────────────────────
  getOfertasPublicas: async (): Promise<ApiResponse<OfertaPublica[]>> => {
    const res = await fetch('/api/offers');
    if (!res.ok) throw new Error('Error al obtener ofertas');
    return res.json();
  },

  getDescuentosPublicos: async (): Promise<ApiResponse<DescuentoPublico[]>> => {
    const res = await fetch('/api/discounts');
    if (!res.ok) throw new Error('Error al obtener descuentos');
    return res.json();
  },

  // ─── Temporadas (público) ───────────────────────────────────────
  getTemporadasProximas: async (): Promise<TemporadaProxima[]> => {
    const res = await fetch('/api/catalogos/temporadas-proximas');
    if (!res.ok) throw new Error('Error al obtener temporadas');
    return res.json();
  },

  // ─── Pricing / cupón (requiere auth) ────────────────────────────
  calcularPricing: async (items: PricingItem[], codigoCupon?: string): Promise<ApiResponse<PricingBreakdown>> => {
    const res = await fetch('/api/cart/calcular', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ items, codigoCupon: codigoCupon ?? '' }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || 'Error al calcular precio');
    }
    return res.json();
  },

  aplicarCupon: async (items: PricingItem[], codigoCupon: string): Promise<ApiResponse<PricingBreakdown>> => {
    const res = await fetch('/api/cart/aplicar-cupon', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ items, codigoCupon }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || 'Cupón inválido');
    }
    return res.json();
  },

  // ─── Plantillas de Venta Rápida (compartidas ADMIN + EMPLEADO) ──
  // soloActivas=true -> solo plantillas publicadas (POS). Omitir -> todas (editor admin).
  getQuickSaleTemplates: async (soloActivas = false): Promise<SingleResponse<QuickSaleTemplate[]>> => {
    const qs = soloActivas ? '?soloActivas=true' : '';
    return cachedGet(`/api/quick-sale-templates${qs}`, 'Error al obtener plantillas');
  },

  createQuickSaleTemplate: async (body: SaveQuickSaleTemplateBody): Promise<SingleResponse<QuickSaleTemplate>> => {
    apiCache.invalidate('/quick-sale-templates');
    const res = await fetch('/api/quick-sale-templates', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  updateQuickSaleTemplate: async (id: string, body: SaveQuickSaleTemplateBody): Promise<SingleResponse<QuickSaleTemplate>> => {
    apiCache.invalidate('/quick-sale-templates');
    const res = await fetch(`/api/quick-sale-templates/${id}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  deleteQuickSaleTemplate: async (id: string): Promise<SingleResponse<null>> => {
    apiCache.invalidate('/quick-sale-templates');
    const res = await fetch(`/api/quick-sale-templates/${id}/eliminar`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── CMS ──────────────────────────────────────────────────────
  getCms: async (): Promise<SingleResponse<SiteSettings>> => {
    return cachedGet(`${API_BASE}/cms`, 'Error al obtener configuración CMS');
  },

  updateCms: async (body: SiteSettings): Promise<SingleResponse<SiteSettings>> => {
    apiCache.invalidate('/cms');
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
    return cachedGet(`${API_BASE}/categories`, 'Error al obtener catálogo de categorías');
  },

  getCatalogos: async (): Promise<SingleResponse<AdminCatalogo[]>> => {
    return cachedGet(`${API_BASE}/catalogos`, 'Error al obtener catálogos');
  },

  // Catálogos visibles para empleados (endpoint público /api/catalogos): para
  // roles no-admin devuelve solo los catálogos activos. Usado por Venta Rápida
  // para armar las plantillas a partir de catálogos. Devuelve un array plano.
  getPublicCatalogos: async (): Promise<AdminCatalogo[]> => {
    return cachedGet('/api/catalogos', 'Error al obtener catálogos');
  },

  getCatalogoById: async (id: string): Promise<SingleResponse<any>> => {
    return cachedGet(`${API_BASE}/catalogos/${id}`, 'Error al obtener catálogo');
  },

  createCatalog: async (body: any): Promise<SingleResponse<any>> => {
    apiCache.invalidate('/catalogos');
    const res = await fetch(`${API_BASE}/catalogos`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Error al crear catálogo');
    return res.json();
  },

  updateCatalog: async (id: string, body: any): Promise<SingleResponse<any>> => {
    apiCache.invalidate('/catalogos');
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
    return cachedGet(`${API_BASE}/analytics/segmentos-clientes`, 'Error al obtener segmentos de clientes');
  },

  recalcularSegmentosClientes: async (): Promise<SingleResponse<any>> => {
    const res = await fetch(`${API_BASE}/analytics/segmentos-clientes/recalcular`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  // ─── Caja del empleado: gastos, cortes y reportes de error ────────
  // Contraparte de /api/employee: aquí el admin sí puede filtrar por empleado y
  // por rango de fechas, porque es quien tiene permitido ver la operación completa.

  getEmployeeExpenses: async (params: {
    usuarioId?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<EmployeeExpense>> => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][],
    ).toString();
    return cachedGet(`${API_BASE}/expenses${qs ? `?${qs}` : ''}`, 'Error al obtener los gastos');
  },

  getCashCuts: async (params: {
    usuarioId?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<CashCut>> => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][],
    ).toString();
    return cachedGet(`${API_BASE}/cash-cuts${qs ? `?${qs}` : ''}`, 'Error al obtener los cortes de caja');
  },

  getErrorReports: async (params: { estado?: string; page?: number; size?: number } = {}):
    Promise<ApiResponse<ErrorReport>> => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][],
    ).toString();
    return cachedGet(`${API_BASE}/error-reports${qs ? `?${qs}` : ''}`, 'Error al obtener los reportes');
  },

  resolveErrorReport: async (
    reporteId: string,
    body: { accion: ResolucionAccion; nota?: string; rechazar?: boolean },
  ): Promise<SingleResponse<ErrorReport>> => {
    apiCache.invalidate('/error-reports');
    const res = await fetch(`${API_BASE}/error-reports/${reporteId}/resolver`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al resolver el reporte'));
    return res.json();
  },

  // ─── Venta Instantanea (cliente) ──────────────────────────────

  crearSolicitudVentaInstantanea: async (body: {
    productId: string;
    cantidad: number;
  }): Promise<SingleResponse<{
    id: string;
    productId: string;
    productoNombre: string;
    cantidad: number;
    estado: string;
    motivoRechazo: string | null;
    creadaEn: string;
    reservaExpiraEn: string | null;
  }>> => {
    const res = await fetch('/api/solicitudes-venta-instantanea', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al crear solicitud de venta instantanea'));
    return res.json();
  },

  getSolicitudVentaInstantanea: async (solicitudId: string): Promise<SingleResponse<{
    id: string;
    productId: string;
    productoNombre: string;
    cantidad: number;
    estado: string;
    motivoRechazo: string | null;
    creadaEn: string;
    reservaExpiraEn: string | null;
  }>> => {
    const res = await fetch(`/api/solicitudes-venta-instantanea/${solicitudId}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al consultar solicitud'));
    return res.json();
  },

  // ─── Venta Instantanea (admin) ─────────────────────────────────

  getAdminSolicitudesInstantaneas: async (params: {
    estado?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<SolicitudVentaInstantaneaAdmin>> => {
    const query = new URLSearchParams();
    if (params.estado) query.set('estado', params.estado);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    const qs = query.toString();
    return cachedGet(
      `${API_BASE}/solicitudes-venta-instantanea${qs ? `?${qs}` : ''}`,
      'Error al obtener solicitudes de venta instantanea');
  },

  aceptarSolicitudInstantanea: async (
    solicitudId: string
  ): Promise<SingleResponse<SolicitudVentaInstantaneaAdmin>> => {
    return mutate('POST',
      `${API_BASE}/solicitudes-venta-instantanea/${solicitudId}/aceptar`,
      undefined,
      'solicitudes-venta-instantanea',
      'Error al aceptar solicitud');
  },

  rechazarSolicitudInstantanea: async (
    solicitudId: string,
    motivoRechazo?: string
  ): Promise<SingleResponse<SolicitudVentaInstantaneaAdmin>> => {
    return mutate('POST',
      `${API_BASE}/solicitudes-venta-instantanea/${solicitudId}/rechazar`,
      { motivoRechazo: motivoRechazo ?? null },
      'solicitudes-venta-instantanea',
      'Error al rechazar solicitud');
  },

  expirarSolicitudesInstantaneas: async (): Promise<SingleResponse<{
    escaladas: number;
    expiradasSinRespuesta: number;
    reservasLiberadas: number;
  }>> => {
    return mutate('POST',
      `${API_BASE}/orders/expirar-solicitudes-instantaneas`,
      undefined,
      'solicitudes-venta-instantanea',
      'Error al expirar solicitudes');
  },
};
