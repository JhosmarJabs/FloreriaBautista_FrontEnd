import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Check, X, Loader2, FileDown, MessageCircle, Copy, Send,
  ClipboardList, Package, MessageSquarePlus, CheckCheck, Ban, ArrowRightLeft,
} from 'lucide-react';
import { FadeIn, GlassCard, AnimatedButton } from '../../components/Animations';
import {
  AdminService, SupplyOrderDetail, SupplyOrderLinea,
} from '../../services/adminService';
import { InventoryMovement } from '../../types';
import { useToast } from '../../hooks/useToast';
import { formatApiDate } from '../../utils/date';
import { descargarSolicitudPdf, textoSolicitud } from '../../utils/supplyOrderPdf';
import { ESTADO_LINEA, ESTADO_SOLICITUD, estadoLineaDe, formatoMoneda } from '../../utils/supplyOrderUi';

/** Lo que el usuario va capturando por línea antes de mandar la recepción. */
interface Captura {
  cantidadRecibida: number | null; // null = todavía sin decidir
  observacion: string;
  observacionAbierta: boolean;
}

export default function AdminSupplyOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [solicitud, setSolicitud] = useState<SupplyOrderDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [captura, setCaptura]     = useState<Record<string, Captura>>({});

  const [movimientos, setMovimientos]         = useState<InventoryMovement[] | null>(null);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);

  const cargar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await AdminService.getSupplyOrder(id);
      setSolicitud(res.data);
      // La captura arranca con lo que ya esté confirmado en el servidor.
      setCaptura(Object.fromEntries(res.data.lineas.map(l => [l.id, {
        cantidadRecibida: l.cantidadRecibida ?? null,
        observacion: l.observacion ?? '',
        observacionAbierta: !!l.observacion,
      }])));
    } catch (e: any) {
      showToast(e?.message || 'No se pudo cargar la solicitud', 'error');
      setSolicitud(null);
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Estado derivado ────────────────────────────────────────────
  const enCaptura = solicitud?.estado === 'ENVIADA';
  const editable  = solicitud?.estado === 'BORRADOR';

  const resumen = useMemo(() => {
    if (!solicitud) return { completos: 0, parciales: 0, noLlegaron: 0, excedentes: 0, sinDecidir: 0 };
    return solicitud.lineas.reduce((acc, linea) => {
      const estado = estadoLineaDe(linea.cantidadSolicitada, captura[linea.id]?.cantidadRecibida);
      if (estado === 'COMPLETO')  acc.completos++;
      if (estado === 'PARCIAL')   acc.parciales++;
      if (estado === 'NO_LLEGO')  acc.noLlegaron++;
      if (estado === 'EXCEDENTE') acc.excedentes++;
      if (estado === 'PENDIENTE') acc.sinDecidir++;
      return acc;
    }, { completos: 0, parciales: 0, noLlegaron: 0, excedentes: 0, sinDecidir: 0 });
  }, [solicitud, captura]);

  const hayAlgoCapturado = resumen.sinDecidir < (solicitud?.lineas.length ?? 0);
  const todoDecidido     = resumen.sinDecidir === 0;

  // ── Acciones de captura ────────────────────────────────────────
  const fijarCantidad = (linea: SupplyOrderLinea, cantidad: number | null) => {
    setCaptura(prev => ({
      ...prev,
      [linea.id]: { ...prev[linea.id], cantidadRecibida: cantidad },
    }));
  };

  const marcarTodoCompleto = () => {
    if (!solicitud) return;
    setCaptura(prev => Object.fromEntries(solicitud.lineas.map(l => [l.id, {
      ...prev[l.id],
      cantidadRecibida: l.cantidadSolicitada,
    }])));
    showToast(`${solicitud.lineas.length} línea(s) marcadas como recibidas completas`, 'success');
  };

  const alternarObservacion = (lineaId: string) => {
    setCaptura(prev => ({
      ...prev,
      [lineaId]: { ...prev[lineaId], observacionAbierta: !prev[lineaId]?.observacionAbierta },
    }));
  };

  const fijarObservacion = (lineaId: string, texto: string) => {
    setCaptura(prev => ({ ...prev, [lineaId]: { ...prev[lineaId], observacion: texto } }));
  };

  // ── Acciones sobre la solicitud ────────────────────────────────
  const enviarAlProveedor = async () => {
    if (!solicitud) return;
    setGuardando(true);
    try {
      const res = await AdminService.sendSupplyOrder(solicitud.id);
      setSolicitud(res.data);
      showToast(`${solicitud.folio} marcada como enviada`, 'success');
    } catch (e: any) {
      showToast(e?.message || 'No se pudo marcar como enviada', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarRecepcion = async (cerrar: boolean) => {
    if (!solicitud) return;

    // Solo se mandan las líneas con una decisión tomada; si no se cierra la
    // solicitud, las demás quedan pendientes para la siguiente visita.
    const lineas = solicitud.lineas
      .filter(l => captura[l.id]?.cantidadRecibida !== null && captura[l.id]?.cantidadRecibida !== undefined)
      .map(l => ({
        itemId: l.id,
        cantidadRecibida: captura[l.id].cantidadRecibida as number,
        observacion: captura[l.id].observacion.trim() || null,
      }));

    if (lineas.length === 0) {
      showToast('Marca al menos una línea antes de confirmar', 'info');
      return;
    }

    setGuardando(true);
    try {
      const res = await AdminService.receiveSupplyOrder(solicitud.id, { lineas, cerrarSolicitud: cerrar });
      setSolicitud(res.data);
      setMovimientos(null);
      showToast(
        `Recepción registrada · ${ESTADO_SOLICITUD[res.data.estado].label}`,
        'success',
      );
    } catch (e: any) {
      showToast(e?.message || 'No se pudo registrar la recepción', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const cancelarSolicitud = async () => {
    if (!solicitud) return;
    const motivo = window.prompt(`¿Por qué se cancela ${solicitud.folio}?`);
    if (motivo === null) return;

    setGuardando(true);
    try {
      const res = await AdminService.cancelSupplyOrder(solicitud.id, motivo || undefined);
      setSolicitud(res.data);
      showToast(`${solicitud.folio} cancelada`, 'success');
    } catch (e: any) {
      showToast(e?.message || 'No se pudo cancelar la solicitud', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Trae los movimientos reales que generó esta recepción, para cerrar el círculo
  // entre la línea confirmada y la entrada al inventario.
  const cargarMovimientos = async () => {
    if (!solicitud) return;
    setCargandoMovimientos(true);
    try {
      const ids = new Set(solicitud.lineas.map(l => l.inventoryMovementId).filter(Boolean) as string[]);
      const insumos: string[] = [];
      for (const l of solicitud.lineas) {
        if (l.inventoryMovementId && !insumos.includes(l.inventoryItemId)) {
          insumos.push(l.inventoryItemId);
        }
      }

      const respuestas = await Promise.all(
        insumos.map(insumoId => AdminService.getAdminInventoryMovements({ inventoryItemId: insumoId, size: 50 })),
      );

      const encontrados = respuestas
        .flatMap(r => r.data?.items ?? [])
        .filter(m => ids.has(m.id));

      setMovimientos(encontrados);
      if (encontrados.length === 0) showToast('No se encontraron los movimientos generados', 'info');
    } catch (e: any) {
      showToast(e?.message || 'No se pudieron cargar los movimientos', 'error');
    } finally {
      setCargandoMovimientos(false);
    }
  };

  const descargarPdf = () => {
    if (!solicitud) return;
    descargarSolicitudPdf(solicitud);
    showToast(`PDF de ${solicitud.folio} descargado`, 'success');
  };

  const textoParaProveedor = () =>
    solicitud
      ? textoSolicitud(
          solicitud.lineas.map(l => ({
            nombre: l.nombreSnapshot, cantidad: l.cantidadSolicitada, unidad: l.unidadMedida,
          })),
          solicitud.folio,
        )
      : '';

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoParaProveedor());
      showToast('Solicitud copiada al portapapeles', 'success');
    } catch {
      showToast('No se pudo copiar la solicitud', 'error');
    }
  };

  const enviarPorWhatsapp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(textoParaProveedor())}`, '_blank');

  // ── Render ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cargando solicitud…</p>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-sm text-slate-400 font-bold mb-4">No se encontró esta solicitud.</p>
        <button
          onClick={() => navigate('/admin/reabastecimiento/solicitudes')}
          className="px-4 py-2.5 bg-[#1e3a5f] text-white rounded-xl font-black text-[9px] uppercase tracking-widest"
        >
          Volver al historial
        </button>
      </div>
    );
  }

  const estilo = ESTADO_SOLICITUD[solicitud.estado];

  return (
    <div className={`space-y-6 max-w-6xl mx-auto ${enCaptura ? 'pb-40' : 'pb-20'}`}>
      <FadeIn>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <Link
              to="/admin/reabastecimiento/solicitudes"
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Solicitudes
            </Link>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 flex-wrap">
              <ClipboardList className="w-6 h-6 text-blue-600" />
              <span className="font-mono">{solicitud.folio}</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest ${estilo.badge}`}>
                <span className={`size-1.5 rounded-full ${estilo.dot}`} />
                {estilo.label}
              </span>
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
              {formatApiDate(solicitud.fechaSolicitud)}
              {solicitud.proveedor ? ` · ${solicitud.proveedor}` : ''}
              {solicitud.semanaObjetivo ? ` · semana ${solicitud.semanaObjetivo}` : ''}
              {solicitud.usuarioNombre ? ` · generó ${solicitud.usuarioNombre}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={descargarPdf}
              className="px-4 py-2.5 bg-[#1e3a5f] text-white rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:opacity-90 transition-all"
            >
              <FileDown className="w-3.5 h-3.5" /> Descargar PDF
            </button>
            <button
              onClick={enviarPorWhatsapp}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </button>
            <button
              onClick={copiar}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <Copy className="w-3.5 h-3.5" /> Copiar
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Acciones de estado */}
      {editable && (
        <GlassCard className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Esta solicitud sigue en <strong>borrador</strong>. Mándasela al proveedor y márcala como enviada;
            a partir de ahí podrás confirmar la recepción.
          </p>
          <div className="flex gap-2 shrink-0">
            <AnimatedButton
              onClick={enviarAlProveedor}
              disabled={guardando}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 disabled:opacity-60"
            >
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Marcar como enviada
            </AnimatedButton>
            <button
              onClick={cancelarSolicitud}
              disabled={guardando}
              className="px-4 py-3 text-rose-500 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all disabled:opacity-60"
            >
              <Ban className="w-3.5 h-3.5 inline mr-1" /> Cancelar
            </button>
          </div>
        </GlassCard>
      )}

      {/* Líneas */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {enCaptura ? 'Confirmar recepción' : 'Insumos de la solicitud'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {solicitud.lineas.length} insumo(s) · estimado {formatoMoneda(solicitud.totalEstimado)}
            </p>
          </div>

          {enCaptura && (
            <button
              onClick={marcarTodoCompleto}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Marcar todo como recibido completo
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-5 py-4">Insumo</th>
                <th className="px-5 py-4 text-right w-24">Solicitado</th>
                {enCaptura && <th className="px-5 py-4 text-center w-72">Confirmación</th>}
                <th className="px-5 py-4 text-right w-24">Recibido</th>
                <th className="px-5 py-4 text-right w-28">Diferencia</th>
                <th className="px-5 py-4 w-32">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {solicitud.lineas.map(linea => {
                const actual   = captura[linea.id];
                const recibida = actual?.cantidadRecibida ?? null;
                const estadoLinea = enCaptura
                  ? estadoLineaDe(linea.cantidadSolicitada, recibida)
                  : linea.estadoLinea;
                const estiloLinea = ESTADO_LINEA[estadoLinea];
                const diferencia  = recibida === null ? null : recibida - linea.cantidadSolicitada;
                const yaConfirmada = !!linea.inventoryMovementId;

                return (
                  <React.Fragment key={linea.id}>
                    <tr className="text-[11px] align-middle">
                      <td className="px-5 py-3">
                        <p className="font-bold text-slate-700 dark:text-slate-200">{linea.nombreSnapshot}</p>
                        <p className="text-[9px] text-slate-400 font-medium">{linea.origen}</p>
                      </td>
                      <td className="px-5 py-3 text-right font-black font-mono text-slate-600 dark:text-slate-300">
                        {linea.cantidadSolicitada}
                        <span className="text-[9px] text-slate-400 font-bold"> {linea.unidadMedida}</span>
                      </td>

                      {enCaptura && (
                        <td className="px-5 py-3">
                          {yaConfirmada ? (
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 text-center">
                              Ya confirmada
                            </p>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => fijarCantidad(linea, linea.cantidadSolicitada)}
                                title="Llegó completo"
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${
                                  estadoLinea === 'COMPLETO'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" /> Llegó
                              </button>
                              <button
                                onClick={() => fijarCantidad(linea, 0)}
                                title="No llegó"
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${
                                  estadoLinea === 'NO_LLEGO'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" /> No llegó
                              </button>
                              <input
                                type="number"
                                min={0}
                                placeholder="Parcial"
                                value={recibida ?? ''}
                                onChange={e => fijarCantidad(
                                  linea,
                                  e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0),
                                )}
                                className="w-20 px-2 py-1.5 text-center text-xs font-black bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                              <button
                                onClick={() => alternarObservacion(linea.id)}
                                title="Agregar observación"
                                disabled={estadoLinea === 'COMPLETO'}
                                className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors disabled:opacity-30 disabled:hover:text-slate-300"
                              >
                                <MessageSquarePlus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}

                      <td className="px-5 py-3 text-right font-black font-mono text-slate-700 dark:text-slate-200">
                        {recibida ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-5 py-3 text-right font-black font-mono">
                        {diferencia === null ? (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        ) : diferencia === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">0</span>
                        ) : (
                          <span className={diferencia > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-500'}>
                            {diferencia > 0 ? `+${diferencia}` : diferencia}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest ${estiloLinea.badge}`}>
                          {estiloLinea.label}
                        </span>
                      </td>
                    </tr>

                    {/* Observación: colapsada, solo se abre si la línea no llegó completa */}
                    {enCaptura && actual?.observacionAbierta && !yaConfirmada && (
                      <tr>
                        <td colSpan={6} className="px-5 pb-3 pt-0">
                          <input
                            type="text"
                            value={actual.observacion}
                            onChange={e => fijarObservacion(linea.id, e.target.value)}
                            maxLength={255}
                            placeholder={`¿Qué pasó con "${linea.nombreSnapshot}"? Ej. vino marchito, mandaron otro color…`}
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </td>
                      </tr>
                    )}

                    {!enCaptura && linea.observacion && (
                      <tr>
                        <td colSpan={5} className="px-5 pb-3 pt-0">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2">
                            “{linea.observacion}”
                          </p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {solicitud.notas && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-line">
              <span className="font-black text-slate-500 uppercase tracking-widest">Notas: </span>
              {solicitud.notas}
            </p>
          </div>
        )}
      </GlassCard>

      {/* Movimientos generados (solo cuando ya hubo recepción) */}
      {solicitud.lineas.some(l => l.inventoryMovementId) && (
        <GlassCard className="p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Entradas al inventario
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Registradas con el motivo “Recepción {solicitud.folio}”
                </p>
              </div>
            </div>
            {movimientos === null && (
              <button
                onClick={cargarMovimientos}
                disabled={cargandoMovimientos}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-60"
              >
                {cargandoMovimientos ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                Ver movimientos
              </button>
            )}
          </div>

          {movimientos !== null && movimientos.length > 0 && (
            <table className="w-full text-left mt-5">
              <thead className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="py-2">Insumo</th>
                  <th className="py-2 text-right">Cantidad</th>
                  <th className="py-2 text-right">Stock antes → después</th>
                  <th className="py-2">Motivo</th>
                  <th className="py-2 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {movimientos.map(m => (
                  <tr key={m.id} className="text-[11px]">
                    <td className="py-2.5 font-bold text-slate-700 dark:text-slate-200">{m.nombreItem}</td>
                    <td className="py-2.5 text-right font-black font-mono text-emerald-600 dark:text-emerald-400">
                      +{m.cantidad}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-500 dark:text-slate-400">
                      {m.stockAntes} → {m.stockDespues}
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400 font-medium">{m.motivo}</td>
                    <td className="py-2.5 text-right text-slate-400 font-medium">{formatApiDate(m.fechaHora)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlassCard>
      )}

      {/* Resumen fijo + confirmar (solo mientras se captura la recepción) */}
      {enCaptura && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:pl-[var(--admin-sidebar,0px)]">
          <div className="max-w-6xl mx-auto m-4 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-black uppercase tracking-widest">
              <span className="text-emerald-600 dark:text-emerald-400">{resumen.completos} completos</span>
              <span className="text-amber-600 dark:text-amber-400">{resumen.parciales} parciales</span>
              <span className="text-rose-500">{resumen.noLlegaron} no llegaron</span>
              {resumen.excedentes > 0 && (
                <span className="text-blue-600 dark:text-blue-400">{resumen.excedentes} excedentes</span>
              )}
              {resumen.sinDecidir > 0 && (
                <span className="text-slate-400">{resumen.sinDecidir} sin decidir</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {!todoDecidido && hayAlgoCapturado && (
                <button
                  onClick={() => confirmarRecepcion(false)}
                  disabled={guardando}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-60"
                  title="Registra lo capturado y deja la solicitud abierta para otra visita"
                >
                  Confirmar solo lo capturado
                </button>
              )}
              <AnimatedButton
                onClick={() => confirmarRecepcion(true)}
                disabled={guardando || !todoDecidido}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-40"
              >
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar recepción
              </AnimatedButton>
            </div>
          </div>
          {!todoDecidido && (
            <p className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-400 pb-2">
              Faltan {resumen.sinDecidir} línea(s) por decidir para cerrar la solicitud
            </p>
          )}
        </div>
      )}
    </div>
  );
}
