export interface Product {
  id: string;
  nombre: string;
  precioBase: number;
  tipo: string;
  estado: string;
  imagenUrl: string | null;
  stock: number | null;
}

export interface ProductDetail extends Product {
  descripcion?: string;
  esPersonalizable?: boolean;
  visibilidad?: string;
  categorias?: string[];
  catalogos?: string[];
  receta?: RecipeItem[];
}

export interface QuickSaleTemplateItem {
  id: string;
  productId: string;
  nombre: string;
  precio: number;
  icono: string;
  color: string;
}

export interface QuickSaleTemplate {
  id: string;
  nombre: string;
  descripcion: string | null;
  icono: string;
  orden: number;
  items: QuickSaleTemplateItem[];
}

export interface SaveQuickSaleTemplateItemBody {
  productId: string;
  icono: string;
  color: string;
}

export interface SaveQuickSaleTemplateBody {
  nombre: string;
  descripcion?: string | null;
  icono: string;
  orden?: number;
  items: SaveQuickSaleTemplateItemBody[];
}

export interface ProductBody {
  nombre: string;
  descripcion: string;
  precioBase: number;
  tipo: string;
  esPersonalizable: boolean;
  estado: string;
  visibilidad: string;
  imagenUrl: string;
  categorias: string[];
  catalogos: string[];
  receta?: RecipeItem[];
  activo?: boolean;
}

export interface Order {
  id: string;
  estadoPedido: string;
  fechaEntrega: string;
  total: number;
  nombreCliente: string;
  fechaCreacion: string;
  archivado?: boolean;
}

export interface Horario {
  dia: string;
  apertura: string;
  cierre: string;
  cerrado: boolean;
}

export interface SiteSettings {
  nombreTienda: string;
  telefono: string;
  correo: string;
  direccion: string;
  bannerTitulo: string;
  bannerSubtitulo: string;
  bannerCta: string;
  horarios: Horario[];
  destacados: string[];
  anuncioTexto: string;
  anuncioActivo: boolean;
}

export interface Promotion {
  id: string;
  nombre: string;
  codigo?: string | null;
  tipo: 'PORCENTAJE' | 'MONTO_FIJO' | 'COMBO';
  valor: number;
  minimoCompra: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'PROGRAMADO';
  fechaInicio?: string | null;
  fechaFin?: string | null;
  maxUsos?: number | null;
  usosActuales: number;
  aplicarATodaLaTienda: boolean;
  creadoEn: string;
}

export interface PromotionBody {
  nombre: string;
  codigo?: string | null;
  tipo: 'PORCENTAJE' | 'MONTO_FIJO' | 'COMBO';
  valor: number;
  minimoCompra: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'PROGRAMADO';
  fechaInicio?: string | null;
  fechaFin?: string | null;
  maxUsos?: number | null;
  aplicarATodaLaTienda: boolean;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
  /** Suma de importes de TODOS los registros filtrados (no solo la página). */
  sumaTotal?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: PagedResult<T>;
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  data: {
    conectado: boolean;
    estado: string;
    baseDatos: string;
    servidor: string;
    versionPostgres: string;
    conexionesActivas: number;
    conexionesMaximas: number;
    tiempoRespuesta: string;
    tiempoActividad: string;
    mensajeError: string | null;
    consultadoEn: string;
  };
}

export interface Backup {
  id: string;
  nombre: string;
  tamanoBytes: number;
  creadoEn: string;
  enlace: string;
}

export interface BackupsResponse {
  success: boolean;
  message: string;
  data: Backup[] | null;
}

export interface MaintenanceTask {
  tarea: string;
  estado: 'COMPLETADO' | 'ERROR';
  detalle: string;
  mensajeError: string | null;
  ejecutadoEn: string;
  duracionMs: number;
  resultados: string[];
}

export interface MaintenanceResponse {
  success: boolean;
  message: string;
  data: MaintenanceTask[];
}

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  sexo: string | null;
  fechaNacimiento: string | null;
  estado: string;
  correoVerificado: boolean;
  roles: string[];
  creadoEn: string;
}

export interface SingleResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type MeResponse = SingleResponse<User>;

// ─── Database Monitor ─────────────────────────────────────────────────────────
export interface DbTable {
  nombreTabla: string;
  totalFilas: number;
  tamanoTabla: string;
  tamanoIndices: string;
  tamanoTotal: string;
  tamanoTotalBytes: number;
}

export interface DbConnection {
  pid: number;
  usuario: string;
  baseDatos: string;
  estado: string;
  queryActual: string;
  duracionQuery: string;
  ipCliente: string;
}

export interface DbUnusedIndex {
  nombreIndice: string;
  nombreTabla: string;
  columnas: string;
  vecesUsado: number;
  tamano: string;
  recomendacion: string;
}

export interface DbSlowQuery {
  query: string;
  tiempoPromedioMs: number;
  vecesEjecutado: number;
  tiempoTotalMs: number;
  baseDatos: string;
}

export interface DbStatistics {
  tamanoTotalBd: string;
  totalTransacciones: number;
  cacheHits: number;
  cacheMisses: number;
  porcentajeCacheHit: number;
  fechaUltimoVacuum: string;
}

export interface DatabaseMonitorData {
  generadoEn: string;
  tablas: DbTable[];
  conexiones: DbConnection[];
  indicesSinUso: DbUnusedIndex[];
  queriesLentos: DbSlowQuery[];
  estadisticas: DbStatistics;
}

export interface DatabaseMonitorResponse {
  success: boolean;
  message: string;
  data: DatabaseMonitorData;
}

// ─── Flores / Insumos ────────────────────────────────────────────────────────
export interface Flower {
  id: string;
  nombre: string;
  color: string | null;
  precioCosto: number;
  unidadMedida: string;
  esFlorPrimaria: boolean;
  stockActual: number;
  stockMinimo: number;
  estado: string;
  bajoMinimo: boolean;
  creadoEn?: string;
}

export interface RecipeItem {
  inventoryItemId: string;
  flowerNombre: string;
  flowerPrecioCosto: number;
  esFlorPrimaria: boolean;
  cantidad: number;
}

export interface FlowerBody {
  nombre: string;
  color: string;
  precioCosto: number;
  unidadMedida: string;
  esFlorPrimaria: boolean;
  stockMinimo: number;
}

export interface ImportProductsResult {
  archivo: string;
  totalFilas: number;
  insertados: number;
  actualizados: number;
  errores: number;
  detalleErrores: string[];
  ejecutadoEn: string;
  duracionMs: number;
}

export interface ImportProductsResponse {
  success: boolean;
  message: string;
  data: ImportProductsResult;
}

export interface AuditLog {
  id: string;
  usuarioId: string | null;
  usuarioNombre: string | null;
  usuarioCorreo: string | null;
  accion: string;
  entidad: string | null;
  entidadId: string | null;
  detalles: string | null;
  fechaHora: string;
}

export interface SchedulerConfig {
  backupAutomaticoActivo: boolean;
  frecuencia: string;
  diaSemana: number;
  nombreDia: string;
  hora: number;
  horaFormato: string;
  mantenimientoActivo: boolean;
  proximoBackup: string;
  proximoMantenimiento: string;
}

export interface SchedulerConfigResponse {
  success: boolean;
  message: string;
  data: SchedulerConfig;
}

export interface UserBody {
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  password: string;
  roles: string[];
}

export interface InventoryItem {
  id: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  sucursal: string;
  sumaAlCosto: boolean;
  unidadMedida: string;
  precioCosto: number;
  esFlorPrimaria: boolean;
  imagenUrl?: string | null;
  bajoMinimo: boolean;
}

export interface OrderItem {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface OrderDireccion {
  calle: string;
  colonia: string;
  municipio: string;
  estado: string;
  cp?: string | null;
  referencias?: string | null;
}

export interface OrderPayment {
  id: string;
  monto: number;
  tipoPago: string; // ANTICIPO / TOTAL / LIQUIDACION
  metodo: string;
  fechaPago: string;
  estado: string;
}

export interface OrderDetail extends Order {
  tipoPedido?: string;
  canal?: string;
  horaEntrega?: string | null;
  costoEnvio?: number | null;
  saldoPendiente: number;
  metodoPago?: string;
  notas?: string;
  tipoEntrega?: string;
  direccion?: OrderDireccion;
  correoCliente?: string;
  telefonoCliente?: string;
  items?: OrderItem[];
  pagos?: OrderPayment[];
}

export interface AdminCategory {
  id: string;
  nombre: string;
  descripcion: string;
  estado: string;
}

export interface AdminCatalogo {
  id: string;
  nombre: string;
  descripcion: string;
  estado: string;
  imagenUrl: string | null;
}

export interface InventoryKpis {
  totalRegistros: number;
  bajoMinimo: number;
  sumaAlCosto: number;
  sucursales: number;
}

export interface ProductKpis {
  totalProductos: number;
  activos: number;
  borradores: number;
}

export interface CatalogKpis {
  catalogosActivos: number;
  totalProductosListados: number;
  totalCatalogos: number;
}


