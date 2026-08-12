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
  QuickSaleTemplate,
  SaveQuickSaleTemplateBody,
  SiteSettings,
  InventoryKpis,
  ProductKpis,
  SeasonalCatalogKpis,
} from '../types';

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
}

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
    const res = await fetch(`${API_BASE}/inventory/movements${qs ? `?${qs}` : ''}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener movimientos de inventario');
    return res.json();
  },

  registerAdminInventoryMovement: async (
    body: RegisterMovementRequest,
  ): Promise<SingleResponse<InventoryMovement>> => {
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
    const res = await fetch(`${API_BASE}/products/kpis`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener KPIs de productos');
    return res.json();
  },

  getAdminCatalogsKpis: async (): Promise<SingleResponse<SeasonalCatalogKpis>> => {
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

  // Lista de reabastecimiento: insumos con la predicción del modelo S1 (Propuesta 1).
  // Por defecto lee del caché del backend; refresh=true fuerza recalcular el modelo.
  getReabastecimiento: async (refresh = false): Promise<SingleResponse<any[]>> => {
    const res = await fetch(`${API_BASE}/inventory/reabastecimiento${refresh ? '?refresh=true' : ''}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
    return res.json();
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

    const res = await fetch(`${API_BASE}/supply-orders?${qs}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al obtener las solicitudes'));
    return res.json();
  },

  getSupplyOrder: async (id: string): Promise<SingleResponse<SupplyOrderDetail>> => {
    const res = await fetch(`${API_BASE}/supply-orders/${id}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al obtener la solicitud'));
    return res.json();
  },

  createSupplyOrder: async (body: SupplyOrderInput): Promise<SingleResponse<SupplyOrderDetail>> => {
    const res = await fetch(`${API_BASE}/supply-orders`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al generar la solicitud'));
    return res.json();
  },

  updateSupplyOrder: async (id: string, body: SupplyOrderInput): Promise<SingleResponse<SupplyOrderDetail>> => {
    const res = await fetch(`${API_BASE}/supply-orders/${id}`, {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al actualizar la solicitud'));
    return res.json();
  },

  sendSupplyOrder: async (id: string): Promise<SingleResponse<SupplyOrderDetail>> => {
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
    const res = await fetch(`${API_BASE}/supply-orders/${id}/recepcion`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al registrar la recepción'));
    return res.json();
  },

  cancelSupplyOrder: async (id: string, motivo?: string): Promise<SingleResponse<SupplyOrderDetail>> => {
    const res = await fetch(`${API_BASE}/supply-orders/${id}/cancelar`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ motivo: motivo ?? null }),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al cancelar la solicitud'));
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
  // soloActivas=true -> solo plantillas publicadas (POS). Omitir -> todas (editor admin).
  getQuickSaleTemplates: async (soloActivas = false): Promise<SingleResponse<QuickSaleTemplate[]>> => {
    const qs = soloActivas ? '?soloActivas=true' : '';
    const res = await fetch(`/api/quick-sale-templates${qs}`, {
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