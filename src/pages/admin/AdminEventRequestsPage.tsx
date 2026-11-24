import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarHeart, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, Phone, Mail } from 'lucide-react';
import { FadeIn } from '../../components/Animations';
import { SortableColumnHeader } from '../../components/SortableColumnHeader';
import { useLocalSort } from '../../hooks/useLocalSort';
import { useToast } from '../../hooks/useToast';
import { formatApiDate } from '../../utils/date';
import {
  ESTADOS_SOLICITUD,
  SolicitudesEventoService,
  etiquetaTipoEvento,
  mensajeDeErrorSolicitud,
  type EstadoSolicitudEvento,
  type SolicitudEvento,
} from '../../services/solicitudesEventoService';

const PAGE_SIZE = 50;
const MENSAJE_CORTO = 80;

type FiltroEstado = EstadoSolicitudEvento | '';

const FILTROS: { value: FiltroEstado; label: string }[] = [
  { value: '', label: 'Todos' },
  ...ESTADOS_SOLICITUD,
];

const badgeEstado: Record<EstadoSolicitudEvento, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
  CONTACTADA: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30',
  CERRADA: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600',
};

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminEventRequestsPage() {
  const { showToast } = useToast();

  const [filtro, setFiltro] = useState<FiltroEstado>('PENDIENTE');
  const [pagina, setPagina] = useState(1);
  const [items, setItems] = useState<SolicitudEvento[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState<Set<string>>(new Set());
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  // Evita que una respuesta lenta pise a una más reciente (cambio rápido de filtro/página).
  const peticion = useRef(0);

  const cargar = useCallback(async () => {
    const id = ++peticion.current;
    setCargando(true);
    setError(null);
    try {
      const res = await SolicitudesEventoService.listarAdmin({ estado: filtro, page: pagina, size: PAGE_SIZE });
      if (id !== peticion.current) return;
      setItems(res.items);
      setTotal(res.total);
      setTotalPaginas(Math.max(1, res.totalPaginas));
    } catch (err) {
      if (id !== peticion.current) return;
      setItems([]);
      setError(mensajeDeErrorSolicitud(err, 'No pudimos cargar las solicitudes.'));
    } finally {
      if (id === peticion.current) setCargando(false);
    }
  }, [filtro, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  const { datosPaginados, sortConfig, toggleSort } = useLocalSort<SolicitudEvento>({
    datos: items,
    pageSize: PAGE_SIZE,
  });

  const cambiarFiltro = (valor: FiltroEstado) => {
    setFiltro(valor);
    setPagina(1);
  };

  const cambiarEstado = async (s: SolicitudEvento, estado: EstadoSolicitudEvento) => {
    if (estado === s.estado) return;
    setActualizando(prev => new Set(prev).add(s.id));
    try {
      const actualizada = await SolicitudesEventoService.cambiarEstado(s.id, estado);
      setItems(prev => prev.map(x => (x.id === s.id ? actualizada : x)));
    } catch (err) {
      showToast(mensajeDeErrorSolicitud(err, 'No pudimos cambiar el estado.'), 'error');
    } finally {
      setActualizando(prev => {
        const n = new Set(prev);
        n.delete(s.id);
        return n;
      });
    }
  };

  const alternarMensaje = (id: string) =>
    setExpandidos(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const thFijo = 'px-5 py-3.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap text-left';

  return (
    <div className="w-full h-full space-y-6">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1e3a5f] dark:bg-blue-600 text-[#eab308] dark:text-blue-100 rounded-xl shadow-lg">
              <CalendarHeart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Solicitudes de eventos</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Cotizaciones que piden los clientes desde la página de eventos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={cargar}
            disabled={cargando}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all disabled:opacity-60 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>
      </FadeIn>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por estado">
        {FILTROS.map(f => (
          <button
            key={f.value || 'todos'}
            type="button"
            data-testid={`filtro-${f.value || 'todos'}`}
            aria-pressed={filtro === f.value}
            onClick={() => cambiarFiltro(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
              filtro === f.value
                ? 'bg-[#1e3a5f] dark:bg-blue-600 text-white border-transparent shadow'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
        {!cargando && !error && (
          <span className="ml-auto text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {total} {total === 1 ? 'solicitud' : 'solicitudes'}
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden min-h-[300px] shadow-sm flex flex-col">
        {cargando && items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-bold uppercase tracking-widest">Cargando solicitudes...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 px-6 text-center" role="alert">
            <AlertTriangle className="w-12 h-12 text-red-400" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{error}</p>
            <button
              type="button"
              onClick={cargar}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-300 py-20">
            <CalendarHeart className="w-16 h-16 opacity-20" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay solicitudes</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1 max-h-[70vh] custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50 sticky top-0 z-10">
                  <SortableColumnHeader label="Solicitada" field="creadoEn" sortConfig={sortConfig} onToggle={toggleSort} />
                  <SortableColumnHeader label="Cliente" field="clienteNombre" sortConfig={sortConfig} onToggle={toggleSort} />
                  <SortableColumnHeader label="Tipo" field="tipoEvento" sortConfig={sortConfig} onToggle={toggleSort} />
                  <SortableColumnHeader label="Fecha del evento" field="fechaEvento" sortConfig={sortConfig} onToggle={toggleSort} />
                  <SortableColumnHeader label="Invitados" field="invitadosAprox" sortConfig={sortConfig} onToggle={toggleSort} align="right" />
                  <SortableColumnHeader label="Contacto" field="nombreContacto" sortConfig={sortConfig} onToggle={toggleSort} />
                  <th className={thFijo}>Mensaje</th>
                  <SortableColumnHeader label="Estado" field="estado" sortConfig={sortConfig} onToggle={toggleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {datosPaginados.map(s => {
                  const largo = (s.mensaje?.length ?? 0) > MENSAJE_CORTO;
                  const abierto = expandidos.has(s.id);
                  return (
                    <tr key={s.id} data-testid="fila-solicitud" className="align-top hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{fechaHora(s.creadoEn)}</td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-900 dark:text-white">{s.clienteNombre || '—'}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">{etiquetaTipoEvento(s.tipoEvento)}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">{formatApiDate(s.fechaEvento)}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-200 text-right">{s.invitadosAprox ?? '—'}</td>
                      <td className="px-5 py-4 text-sm min-w-[200px]">
                        <p className="font-bold text-slate-900 dark:text-white">{s.nombreContacto}</p>
                        <a href={`tel:${s.telefonoContacto}`} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline">
                          <Phone className="w-3.5 h-3.5 shrink-0" /> {s.telefonoContacto}
                        </a>
                        {s.correoContacto && (
                          <a href={`mailto:${s.correoContacto}`} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:underline break-all">
                            <Mail className="w-3.5 h-3.5 shrink-0" /> {s.correoContacto}
                          </a>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300 min-w-[220px] max-w-[320px]">
                        {s.mensaje ? (
                          <>
                            <span className="whitespace-pre-wrap break-words">
                              {largo && !abierto ? `${s.mensaje.slice(0, MENSAJE_CORTO)}…` : s.mensaje}
                            </span>
                            {largo && (
                              <button
                                type="button"
                                onClick={() => alternarMensaje(s.id)}
                                className="ml-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {abierto ? 'ver menos' : 'ver más'}
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <select
                          aria-label={`Estado de la solicitud de ${s.nombreContacto}`}
                          data-testid="select-estado"
                          value={s.estado}
                          disabled={actualizando.has(s.id)}
                          onChange={e => cambiarEstado(s, e.target.value as EstadoSolicitudEvento)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-60 ${badgeEstado[s.estado]}`}
                        >
                          {ESTADOS_SOLICITUD.map(e => (
                            <option key={e.value} value={e.value} className="text-slate-900 bg-white">{e.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!error && totalPaginas > 1 && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 dark:border-slate-700/50 text-sm font-bold text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina <= 1 || cargando}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span>Página {pagina} de {totalPaginas}</span>
            <button
              type="button"
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina >= totalPaginas || cargando}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
