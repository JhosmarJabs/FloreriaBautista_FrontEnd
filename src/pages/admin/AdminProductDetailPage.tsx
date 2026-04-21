import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight, RefreshCw, AlertCircle, Package, Tag, Layers,
  Edit, FlaskConical, Star, Calculator, ImageIcon,
} from 'lucide-react';
import { AdminService } from '../../services/adminService';
import { ProductDetail, AdminCategory, AdminCatalogo } from '../../types';

const ESTADOS_LABEL: Record<string, string> = {
  ACTIVO: 'Activo', INACTIVO: 'Inactivo', BORRADOR: 'Borrador',
};

const TIPO_MAP: Record<string, string> = {
  'ARREGLO_FLORAL': 'Arreglo Floral',
  'RAMO':          'Ramo',
  'FLORES_CORTE':  'Flores de Corte',
  'PLANTA':        'Planta',
  'INSUMOS':       'Insumos',
  'ACCESORIOS':    'Accesorios',
};

const VISIBILIDAD_MAP: Record<string, string> = {
  'PUBLICO': 'Público (Web)',
  'PRIVADO': 'Privado (Solo Admin)',
  'CATALOGO': 'Solo Catálogo PDF',
  'AMBOS': 'Ambos (Web y Catálogo)',
};

export default function AdminProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCategorias, setAllCategorias] = useState<AdminCategory[]>([]);
  const [allCatalogos, setAllCatalogos] = useState<AdminCatalogo[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [resProd, resCats, resCols, resInv] = await Promise.all([
          AdminService.getAdminProductById(id),
          AdminService.getCategorias().catch(() => ({ data: [] })),
          AdminService.getCatalogos().catch(() => ({ data: [] })),
          AdminService.getAdminInventory({ size: 100 }).catch(() => ({ data: { items: [] } }))
        ]);

        setProduct(resProd.data);
        setAllCategorias(resCats.data);
        setAllCatalogos(resCols.data);
        
        // Crear un mapa de inventario para acceso rápido
        const invMap: Record<string, any> = {};
        resInv.data.items.forEach((item: any) => {
          invMap[item.id] = item;
        });
        setInventoryMap(invMap);

      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-full dark:bg-slate-900">
      <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  );

  if (error || !product) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 dark:bg-slate-900">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-sm text-red-500 font-semibold">{error || 'Producto no encontrado'}</p>
      <button onClick={() => navigate('/catalogo')} className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800/50 px-3 py-1.5 rounded-lg">
        Volver al catálogo
      </button>
    </div>
  );

  const receta = product.receta ?? [];
  const costoBase = receta
    .filter(r => r.esFlorPrimaria)
    .reduce((s, r) => s + r.cantidad * r.flowerPrecioCosto, 0);

  const sec = "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl p-5 shadow-sm";
  const lbl = "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 block";

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-none flex items-center justify-between py-3 px-1 border-b border-slate-100 dark:border-slate-700 mb-4">
        <div>
          <nav className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">
            <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors" onClick={() => navigate('/catalogo')}>Catálogo</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 dark:text-slate-300">Detalle de Producto</span>
          </nav>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {product.nombre}
            <span className="ml-2 text-xs font-mono text-slate-400 dark:text-slate-500 font-normal">{id?.slice(0, 8).toUpperCase()}</span>
          </h1>
        </div>
        <button
          onClick={() => navigate(`/admin/productos/editar/${id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
        >
          <Edit className="w-3.5 h-3.5" />
          Editar producto
        </button>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-4">

            {/* Info básica */}
            <div className={sec}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-blue-500" /> Información del Producto
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className={lbl}>Nombre</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{product.nombre}</p>
                </div>
                <div>
                  <p className={lbl}>Precio de venta</p>
                  <p className="text-xl font-black text-blue-600 dark:text-blue-400">${product.precioBase.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                {product.descripcion && (
                  <div className="col-span-2">
                    <p className={lbl}>Descripción</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{product.descripcion}</p>
                  </div>
                )}
                <div>
                  <p className={lbl}>Tipo</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 rounded-full text-xs font-bold">
                    <Layers className="w-3 h-3" />{TIPO_MAP[product.tipo] ?? product.tipo}
                  </span>
                </div>
                <div>
                  <p className={lbl}>Estado</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    product.estado === 'ACTIVO' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${product.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {ESTADOS_LABEL[product.estado] ?? product.estado}
                  </span>
                </div>
                {product.esPersonalizable !== undefined && (
                  <div>
                    <p className={lbl}>Personalizable</p>
                    <span className={`text-xs font-bold ${product.esPersonalizable ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {product.esPersonalizable ? 'Sí' : 'No'}
                    </span>
                  </div>
                )}
                <div>
                  <p className={lbl}>Visibilidad</p>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {VISIBILIDAD_MAP[product.visibilidad ?? ''] ?? product.visibilidad ?? 'No especificada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Imagen */}
            {product.imagenUrl && (
              <div className={sec}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-pink-500" /> Imagen principal
                </p>
                <img
                  src={product.imagenUrl}
                  alt={product.nombre}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-64 object-cover rounded-xl border border-slate-100 dark:border-slate-700/50"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            {/* Receta */}
            <div className={sec}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <FlaskConical className="w-3.5 h-3.5 text-indigo-500" /> Receta del Arreglo
              </p>

              {receta.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700 mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                          <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Insumo</th>
                          <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Cantidad</th>
                          <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Costo unit.</th>
                          <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                        {receta.map(item => {
                          const detailedItem = inventoryMap[item.inventoryItemId];
                          return (
                            <tr key={item.inventoryItemId} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                    {detailedItem?.imagenUrl ? (
                                      <img src={detailedItem.imagenUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <Package className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-slate-800 dark:text-slate-200">{item.flowerNombre}</p>
                                      {item.esFlorPrimaria && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 rounded-full text-[9px] font-black">
                                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />Primaria
                                        </span>
                                      )}
                                    </div>
                                    {detailedItem && (
                                      <p className="text-[10px] text-slate-400 font-medium">Stock: {detailedItem.stockActual} {detailedItem.unidadMedida}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{item.cantidad}</span>
                              </td>
                              <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 text-xs">
                                ${item.flowerPrecioCosto.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`font-black text-sm ${item.esFlorPrimaria ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                  ${(item.cantidad * item.flowerPrecioCosto).toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Calculator className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Resumen de costos</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Costo total de insumos</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        ${receta.reduce((s, r) => s + r.cantidad * r.flowerPrecioCosto, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-indigo-200 dark:border-indigo-800/50 pt-2">
                      <span className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        Costo base (solo flores primarias)
                      </span>
                      <span className="font-black text-indigo-700 dark:text-indigo-300">${costoBase.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-indigo-200 dark:border-indigo-800/50 pt-2">
                      <span className="font-bold text-blue-700 dark:text-blue-400">Precio de venta actual</span>
                      <span className="font-black text-blue-700 dark:text-blue-300">${product.precioBase.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {costoBase > 0 && (
                      <div className="flex justify-between text-xs border-t border-indigo-100 dark:border-indigo-800/20 pt-1 text-slate-400 dark:text-slate-500">
                        <span>Margen aplicado</span>
                        <span className="font-bold">×{(product.precioBase / costoBase).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-300 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <FlaskConical className="w-8 h-8 mb-2" />
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Sin receta definida</p>
                  <button onClick={() => navigate(`/admin/productos/editar/${id}`)} className="mt-3 text-xs text-blue-500 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300">
                    Agregar receta →
                  </button>
                </div>
              )}
            </div>

            <div className={sec}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-amber-500" /> Clasificación Global
              </p>
              
              <div className="mb-6">
                <p className={lbl}>Todas las Categorías en DB</p>
                <div className="flex flex-wrap gap-2">
                  {allCategorias.length > 0 ? allCategorias.map(c => {
                    const isSelected = product.categorias?.includes(c.nombre);
                    return (
                      <span key={c.id} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                        isSelected 
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-slate-800'
                      }`}>
                        {c.nombre}
                      </span>
                    );
                  }) : <p className="text-[10px] text-slate-400 italic">No hay categorías registradas</p>}
                </div>
              </div>

              <div>
                <p className={lbl}>Todos los Catálogos (Festividades) en DB</p>
                <div className="flex flex-wrap gap-2">
                  {allCatalogos.length > 0 ? allCatalogos.map(c => {
                    const isSelected = product.catalogos?.includes(c.nombre);
                    return (
                      <span key={c.id} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                        isSelected 
                          ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-slate-800'
                      }`}>
                        {c.nombre}
                      </span>
                    );
                  }) : <p className="text-[10px] text-slate-400 italic">No hay catálogos registrados</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Ficha rápida</p>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Tipo', value: TIPO_MAP[product.tipo] ?? product.tipo },
                  { label: 'Estado', value: ESTADOS_LABEL[product.estado] ?? product.estado },
                  { label: 'Precio venta', value: `$${product.precioBase.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
                  { label: 'Costo base', value: receta.length > 0 ? `$${costoBase.toFixed(2)}` : '—' },
                  { label: 'Insumos', value: String(receta.length) },
                  { label: 'Personalizable', value: product.esPersonalizable ? 'Sí' : 'No' },
                  { label: 'Stock', value: product.stock != null ? String(product.stock) : '—' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500">{r.label}</span>
                    <span className={`font-bold ${r.label === 'Costo base' ? 'text-indigo-600 dark:text-indigo-400' : r.label === 'Precio venta' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
