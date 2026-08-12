import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, TrendingUp, PlusCircle, Trash2, Copy, RefreshCw, Loader2,
  ClipboardList, Flower2, Package, MessageCircle, AlertTriangle, Sparkles,
  FileText, History,
} from 'lucide-react';
import { FadeIn, GlassCard, AnimatedButton } from '../../components/Animations';
import { AdminService } from '../../services/adminService';
import { useToast } from '../../hooks/useToast';

// Un insumo con la predicción del modelo S1 (regresión de consumo semanal).
interface ReabItem {
  inventoryItemId: string;
  nombre: string;
  unidadMedida?: string | null;
  stockActual: number;
  stockMinimo: number;
  consumoPredicho: number;
  cantidadSugerida: number;
  semanaObjetivo: string;
  temporadaObjetivo?: string | null;
  bajoMinimo: boolean;
}

interface ListaItem {
  id: string;
  nombre: string;
  cantidad: number;
  origen: string;
}

const STORAGE_KEY = 'REABASTECIMIENTO_LISTA';

export default function AdminReplenishmentPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [insumos, setInsumos] = useState<ReabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [proveedor, setProveedor] = useState('');
  const [generando, setGenerando] = useState(false);
  const [lista, setLista] = useState<ListaItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const cargarReabastecimiento = async (forzar = false) => {
    setLoading(true);
    try {
      const res = await AdminService.getReabastecimiento(forzar);
      setInsumos(res.data || []);
    } catch {
      showToast('Error al calcular el reabastecimiento con el modelo', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReabastecimiento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }, [lista]);

  const agregarInsumo = (id: string, nombre: string, cantidad: number, origen: string) => {
    setLista(prev => {
      const existente = prev.find(i => i.id === id);
      if (existente) {
        return prev.map(i => i.id === id ? { ...i, cantidad } : i);
      }
      return [...prev, { id, nombre, cantidad, origen }];
    });
  };

  const handleAgregar = (insumo: ReabItem) => {
    const cantidad = Math.max(1, insumo.cantidadSugerida);
    const origen = insumo.temporadaObjetivo
      ? `Modelo S1 · ${insumo.semanaObjetivo} · ${insumo.temporadaObjetivo}`
      : `Modelo S1 · ${insumo.semanaObjetivo}`;
    agregarInsumo(insumo.inventoryItemId, insumo.nombre, cantidad, origen);
    showToast(`"${insumo.nombre}" agregado a la lista (${cantidad} ${insumo.unidadMedida ?? 'u'})`, 'success');
  };

  const agregarTodosSugeridos = () => {
    const conSugerencia = insumos.filter(i => i.cantidadSugerida > 0);
    conSugerencia.forEach(handleAgregar);
    if (conSugerencia.length === 0) showToast('Ningún insumo requiere surtido esta semana', 'info');
  };

  const actualizarCantidad = (id: string, cantidad: number) => {
    setLista(prev => prev.map(i => i.id === id ? { ...i, cantidad: Math.max(1, cantidad) } : i));
  };

  const quitarDeLista = (id: string) => setLista(prev => prev.filter(i => i.id !== id));

  const limpiarLista = () => {
    if (window.confirm('¿Vaciar toda la lista de reabastecimiento?')) setLista([]);
  };

  const textoLista = () => {
    const encabezado = 'Lista de reabastecimiento — Florería Bautista\n\n';
    const cuerpo = lista.map(i => `• ${i.nombre} — Cantidad: ${i.cantidad} (${i.origen})`).join('\n');
    return encabezado + cuerpo;
  };

  const copiarLista = async () => {
    try {
      await navigator.clipboard.writeText(textoLista());
      showToast('Lista copiada al portapapeles', 'success');
    } catch {
      showToast('No se pudo copiar la lista', 'error');
    }
  };

  const enviarPorWhatsapp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(textoLista())}`;
    window.open(url, '_blank');
  };

  // Convierte la lista local (localStorage) en una solicitud persistente en el
  // backend y navega a su detalle. El borrador local se limpia solo si el POST
  // tuvo éxito, para no perder el trabajo si la red falla.
  const generarSolicitud = async () => {
    if (lista.length === 0) return;
    setGenerando(true);
    try {
      const res = await AdminService.createSupplyOrder({
        proveedor: proveedor.trim() || null,
        semanaObjetivo: insumos[0]?.semanaObjetivo ?? null,
        lineas: lista.map(i => ({
          inventoryItemId: i.id,
          cantidad: i.cantidad,
          origen: i.origen,
        })),
      });
      const creada = res.data;
      localStorage.removeItem(STORAGE_KEY);
      setLista([]);
      showToast(`Solicitud ${creada.folio} generada`, 'success');
      navigate(`/admin/reabastecimiento/solicitudes/${creada.id}`);
    } catch (e: any) {
      showToast(e?.message || 'No se pudo generar la solicitud', 'error');
    } finally {
      setGenerando(false);
    }
  };

  const semana = insumos[0]?.semanaObjetivo;
  const totalSugeridos = insumos.filter(i => i.cantidadSugerida > 0).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Truck className="w-6 h-6 text-blue-600" /> Reabastecimiento de insumos
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Cuánto surtir de cada insumo la próxima semana, según el modelo de predicción de consumo (Solución 1)
              {semana ? ` · semana ${semana}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin/reabastecimiento/solicitudes')}
              className="px-5 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <History className="w-4 h-4" /> Historial
            </button>
            <AnimatedButton
              onClick={() => cargarReabastecimiento(true)}
              disabled={loading}
              className="px-5 py-3 bg-[#1e3a5f] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Recalcular
            </AnimatedButton>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabla principal: insumos con predicción del modelo */}
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Insumos a surtir</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Ordenados por cantidad sugerida · Random Forest
                  </p>
                </div>
              </div>
              {!loading && totalSugeridos > 0 && (
                <button
                  onClick={agregarTodosSugeridos}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Agregar los {totalSugeridos} sugeridos
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ejecutando el modelo por insumo…</p>
              </div>
            ) : insumos.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-sm text-slate-400 font-bold">No hay insumos con historial de consumo para predecir.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-5 py-4 w-10">#</th>
                      <th className="px-5 py-4">Insumo</th>
                      <th className="px-5 py-4 text-right">Stock</th>
                      <th className="px-5 py-4 text-right">Consumo predicho</th>
                      <th className="px-5 py-4 text-right">Sugerido</th>
                      <th className="px-5 py-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {insumos.map((i, idx) => (
                      <tr
                        key={i.inventoryItemId}
                        className={`text-[11px] hover:bg-slate-50/40 dark:hover:bg-slate-900/30 ${i.cantidadSugerida > 0 ? '' : 'opacity-60'}`}
                      >
                        <td className="px-5 py-3 font-black text-slate-300">{idx + 1}</td>
                        <td className="px-5 py-3">
                          <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            {i.nombre}
                            {i.bajoMinimo && (
                              <span title="Stock por debajo del mínimo" className="inline-flex items-center gap-1 text-rose-500">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          {i.temporadaObjetivo && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-pink-500">{i.temporadaObjetivo}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-mono">
                          <span className={i.bajoMinimo ? 'text-rose-500 font-black' : 'text-slate-500 dark:text-slate-400 font-bold'}>
                            {i.stockActual}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600"> / {i.stockMinimo}</span>
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-slate-500 dark:text-slate-400 font-mono">
                          {i.consumoPredicho} <span className="text-[9px] text-slate-400">{i.unidadMedida}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`font-black font-mono ${i.cantidadSugerida > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300'}`}>
                            {i.cantidadSugerida > 0 ? `+${i.cantidadSugerida}` : '0'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => handleAgregar(i)}
                            disabled={i.cantidadSugerida <= 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-40 disabled:hover:bg-emerald-50 disabled:hover:text-emerald-600"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Agregar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <span className="font-black text-slate-500">Cómo se calcula:</span> el modelo Random Forest predice el
                consumo de la próxima semana por insumo; se surte hasta cubrir el consumo predicho o, si el insumo está
                por debajo del mínimo, al menos reponer el mínimo:
                <span className="font-mono"> max(0, max(consumo predicho, stock mínimo) − stock actual)</span>. Los insumos
                por debajo del mínimo se marcan con ⚠.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Panel lateral: lista para el proveedor */}
        <div className="lg:col-span-1">
          <GlassCard className="p-0 overflow-hidden sticky top-6">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Lista para Proveedor</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{lista.length} insumo(s)</p>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
              {lista.length === 0 ? (
                <div className="p-8 text-center">
                  <Flower2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-bold">Agrega insumos desde la tabla de la izquierda.</p>
                </div>
              ) : (
                lista.map(item => (
                  <div key={item.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{item.nombre}</p>
                      <p className="text-[9px] text-slate-400 font-medium truncate">{item.origen}</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={e => actualizarCantidad(item.id, parseInt(e.target.value) || 1)}
                      className="w-14 px-2 py-1.5 text-center text-xs font-black bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button onClick={() => quitarDeLista(item.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {lista.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    Proveedor (opcional)
                  </label>
                  <input
                    type="text"
                    value={proveedor}
                    onChange={e => setProveedor(e.target.value)}
                    placeholder="Nombre del proveedor"
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  onClick={generarSolicitud}
                  disabled={generando}
                  className="w-full py-3 bg-[#1e3a5f] text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#254c7d] transition-all disabled:opacity-60"
                >
                  {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Generar solicitud
                </button>
                <p className="text-[9px] text-slate-400 leading-relaxed text-center px-1">
                  Crea un documento persistente con folio para exportar a PDF y confirmar la recepción línea por línea.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={enviarPorWhatsapp}
                    className="py-2.5 bg-emerald-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button
                    onClick={copiarLista}
                    className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </button>
                </div>
                <button
                  onClick={limpiarLista}
                  className="w-full py-2.5 text-rose-500 rounded-xl font-bold uppercase text-[9px] tracking-widest hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                >
                  Vaciar lista
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
