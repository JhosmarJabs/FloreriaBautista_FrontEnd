import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Loader2,
  RefreshCw,
  Wallet,
  Calculator,
} from 'lucide-react';

import { AdminService } from '../../services/adminService';
import { useToast } from '../../hooks/useToast';
import { parseApiDate } from '../../utils/date';
import type {
  CashCut,
  EmployeeExpense,
  ErrorReport,
  ResolucionAccion,
} from '../../types';
import { SortableColumnHeader } from '../../components/SortableColumnHeader';
import type { SortConfig } from '../../hooks/useLocalSort';

/**
 * Supervisión de la caja de los empleados: la bandeja de reportes de error, los
 * gastos de personal y los cortes de caja.
 *
 * Es la contraparte administrativa de la app móvil: lo que el empleado solo ve
 * de sí mismo y solo de hoy, aquí se ve de todos y de cualquier fecha.
 */

type Pestana = 'reportes' | 'gastos' | 'cortes';

const ACCIONES: { valor: ResolucionAccion; etiqueta: string; descripcion: string }[] = [
  { valor: 'CORREGIDO',  etiqueta: 'Corregido',  descripcion: 'Ya ajusté el registro por otro lado.' },
  { valor: 'INVALIDADO', etiqueta: 'Invalidar',  descripcion: 'El registro se marca ANULADO y deja de contar.' },
  { valor: 'CANCELADO',  etiqueta: 'Cancelar',   descripcion: 'El registro se marca ANULADO y deja de contar.' },
  { valor: 'SIN_CAMBIO', etiqueta: 'Sin cambio', descripcion: 'Revisado, el registro se queda como está.' },
];

const dinero = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const fechaHora = (iso: string) => parseApiDate(iso)?.toLocaleString('es-MX') ?? iso;

export default function AdminCashControlPage() {
  const { showToast } = useToast();

  const [pestana, setPestana] = useState<Pestana>('reportes');
  const [reportes, setReportes] = useState<ErrorReport[]>([]);
  const [gastos, setGastos] = useState<EmployeeExpense[]>([]);
  const [cortes, setCortes] = useState<CashCut[]>([]);
  const [cargando, setCargando] = useState(true);
  const [resolviendo, setResolviendo] = useState<string | null>(null);

  // Reporte abierto en el panel de resolución, con la acción elegida.
  const [enResolucion, setEnResolucion] = useState<ErrorReport | null>(null);
  const [accion, setAccion] = useState<ResolucionAccion>('SIN_CAMBIO');
  const [nota, setNota] = useState('');

  const [sortGastos, setSortGastos] = useState<SortConfig>({ field: '', order: null });
  const [sortCortes, setSortCortes] = useState<SortConfig>({ field: '', order: null });
  const toggleSortGastos = useCallback((field: string) => {
    setSortGastos(prev => {
      if (prev.field !== field) return { field, order: 'asc' };
      if (prev.order === 'asc') return { field, order: 'desc' };
      return { field: '', order: null };
    });
  }, []);
  const toggleSortCortes = useCallback((field: string) => {
    setSortCortes(prev => {
      if (prev.field !== field) return { field, order: 'asc' };
      if (prev.order === 'asc') return { field, order: 'desc' };
      return { field: '', order: null };
    });
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [r, g, c] = await Promise.all([
        AdminService.getErrorReports({ size: 50 }),
        AdminService.getEmployeeExpenses({ size: 50 }),
        AdminService.getCashCuts({ size: 50 }),
      ]);
      setReportes(r.data.items);
      setGastos(g.data.items);
      setCortes(c.data.items);
    } catch (e: any) {
      showToast(e.message || 'No se pudieron cargar los datos de caja', 'error');
    } finally {
      setCargando(false);
    }
  }, [showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const pendientes = useMemo(
    () => reportes.filter(r => r.estado === 'PENDIENTE' || r.estado === 'EN_REVISION'),
    [reportes],
  );

  async function resolver(rechazar: boolean) {
    if (!enResolucion) return;

    setResolviendo(enResolucion.id);
    try {
      await AdminService.resolveErrorReport(enResolucion.id, {
        accion,
        nota: nota.trim() || undefined,
        rechazar,
      });
      showToast(rechazar ? 'Reporte rechazado' : 'Reporte resuelto', 'success');
      setEnResolucion(null);
      setNota('');
      setAccion('SIN_CAMBIO');
      await cargar();
    } catch (e: any) {
      showToast(e.message || 'No se pudo resolver el reporte', 'error');
    } finally {
      setResolviendo(null);
    }
  }

  const pestanas: { id: Pestana; etiqueta: string; icono: ReactNode; contador?: number }[] = [
    { id: 'reportes', etiqueta: 'Reportes de error', icono: <Inbox className="w-4 h-4" />, contador: pendientes.length },
    { id: 'gastos',   etiqueta: 'Gastos de personal', icono: <Wallet className="w-4 h-4" /> },
    { id: 'cortes',   etiqueta: 'Cortes de caja',     icono: <Calculator className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 py-2 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tight">
            Control de <span className="text-[#eab308] italic">Caja</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium italic">
            "Lo que registran los empleados, visto de lado a lado."
          </p>
        </div>
        <button
          onClick={cargar}
          className="p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[#1e3a5f] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          aria-label="Recargar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {pestanas.map(p => (
          <button
            key={p.id}
            onClick={() => setPestana(p.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
              pestana === p.id
                ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                : 'bg-white text-[#1e3a5f] border-slate-200 hover:bg-slate-50'
            }`}
          >
            {p.icono}
            {p.etiqueta}
            {p.contador ? (
              <span className="ml-1 rounded-full bg-amber-400 text-amber-950 px-2 text-[11px] font-black">
                {p.contador}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : pestana === 'reportes' ? (
        <section className="space-y-3">
          {reportes.length === 0 ? (
            <Vacio texto="No hay reportes de error." />
          ) : (
            reportes.map(r => (
              <article
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-slate-600">
                      {r.tipoRegistro}
                    </span>
                    <EstadoReporte estado={r.estado} />
                  </div>
                  <span className="text-xs text-slate-500">{fechaHora(r.fechaHora)}</span>
                </div>

                <p className="text-sm text-slate-800">{r.motivo}</p>

                <p className="text-xs text-slate-500">
                  Reportado por <strong>{r.empleado ?? 'un empleado'}</strong> · registro{' '}
                  <code className="text-[11px]">{r.registroId.slice(0, 8)}</code>
                </p>

                {r.estado === 'RESUELTO' || r.estado === 'RECHAZADO' ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {r.resolucionAccion} · {r.resolucionNota || 'Sin nota'}
                    {r.fechaResolucion ? ` · ${fechaHora(r.fechaResolucion)}` : ''}
                  </p>
                ) : (
                  <button
                    onClick={() => { setEnResolucion(r); setAccion('SIN_CAMBIO'); setNota(''); }}
                    className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:translate-y-[-1px] transition-transform"
                  >
                    Revisar y resolver
                  </button>
                )}
              </article>
            ))
          )}
        </section>
      ) : pestana === 'gastos' ? (
        <TablaOrdenable
          vacio="No hay gastos registrados."
          sortConfig={sortGastos}
          columnas={[
            { label: 'Empleado', field: 'empleado', sortable: true },
            { label: 'Concepto', field: 'concepto' },
            { label: 'Importe', field: 'importe', sortable: true },
            { label: 'Estado', field: 'estado' },
            { label: 'Fecha', field: 'fechaHora', sortable: true },
          ]}
          onToggleSort={toggleSortGastos}
          datos={gastos}
          renderFila={g => [
            g.empleado ?? '—',
            g.concepto,
            dinero(g.importe),
            g.estado === 'ANULADO'
              ? <span className="text-rose-600 font-semibold">Anulado</span>
              : g.incluidoEnCorte ? 'En corte' : 'Registrado',
            fechaHora(g.fechaHora),
          ]}
        />
      ) : (
        <TablaOrdenable
          vacio="No hay cortes de caja."
          sortConfig={sortCortes}
          columnas={[
            { label: 'Empleado', field: 'empleado', sortable: true },
            { label: 'Día', field: 'fechaLocal', sortable: true },
            { label: 'Vendido', field: 'totalVentas', sortable: true },
            { label: 'Efectivo', field: 'totalEfectivo' },
            { label: 'Gastos', field: 'totalGastos' },
            { label: 'Diferencia', field: 'diferencia', sortable: true },
            { label: 'Estado', field: 'estado' },
          ]}
          onToggleSort={toggleSortCortes}
          datos={cortes}
          renderFila={c => [
            c.empleado ?? '—',
            c.fechaLocal,
            dinero(c.totalVentas),
            dinero(c.totalEfectivo),
            dinero(c.totalGastos),
            <span
              className={
                c.diferencia === 0 ? 'text-emerald-600 font-semibold'
                : c.diferencia < 0 ? 'text-rose-600 font-semibold'
                : 'text-amber-600 font-semibold'
              }
            >
              {dinero(c.diferencia)}
            </span>,
            c.estado === 'ANULADO'
              ? <span className="text-rose-600 font-semibold">Anulado</span>
              : 'Cerrado',
          ]}
        />
      )}

      {/* Panel de resolución. Render condicional simple, sin AnimatePresence. */}
      {enResolucion && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4 shadow-2xl">
            <h2 className="text-xl font-serif font-bold text-[#1e3a5f]">Resolver reporte</h2>
            <p className="text-sm text-slate-600">{enResolucion.motivo}</p>

            <div className="space-y-2">
              {ACCIONES.map(a => (
                <label
                  key={a.valor}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    accion === a.valor ? 'border-[#1e3a5f] bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="accion"
                    className="mt-1"
                    checked={accion === a.valor}
                    onChange={() => setAccion(a.valor)}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">{a.etiqueta}</span>
                    <span className="block text-xs text-slate-500">{a.descripcion}</span>
                  </span>
                </label>
              ))}
            </div>

            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Nota para el expediente (opcional)"
              rows={3}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm"
            />

            <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Los registros económicos no se borran: invalidar o cancelar los marca ANULADO y deja
              constancia en la bitácora. Las ventas se cancelan desde el flujo de pedidos.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => resolver(false)}
                disabled={resolviendo !== null}
                className="flex-1 rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {resolviendo ? 'Guardando…' : 'Resolver'}
              </button>
              <button
                onClick={() => resolver(true)}
                disabled={resolviendo !== null}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"
              >
                Rechazar
              </button>
              <button
                onClick={() => setEnResolucion(null)}
                disabled={resolviendo !== null}
                className="rounded-xl px-4 py-3 text-sm font-bold text-slate-500 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EstadoReporte({ estado }: { estado: ErrorReport['estado'] }) {
  const estilos: Record<ErrorReport['estado'], string> = {
    PENDIENTE:   'bg-amber-100 text-amber-800',
    EN_REVISION: 'bg-blue-100 text-blue-800',
    RESUELTO:    'bg-emerald-100 text-emerald-800',
    RECHAZADO:   'bg-slate-200 text-slate-700',
  };

  return (
    <span className={`rounded-lg px-2 py-1 text-[11px] font-black uppercase tracking-wider ${estilos[estado]}`}>
      {estado === 'RESUELTO' ? <CheckCircle2 className="mr-1 inline h-3 w-3" /> : null}
      {estado.replace('_', ' ')}
    </span>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-400">
      {texto}
    </div>
  );
}

interface ColumnaConfig {
  label: string;
  field: string;
  sortable?: boolean;
}

function TablaOrdenable<T extends Record<string, any>>({
  columnas,
  datos,
  renderFila,
  vacio,
  sortConfig,
  onToggleSort,
}: {
  columnas: ColumnaConfig[];
  datos: T[];
  renderFila: (item: T) => ReactNode[];
  vacio: string;
  sortConfig: SortConfig;
  onToggleSort: (field: string) => void;
}) {
  const datosOrdenados = useMemo(() => {
    if (!sortConfig.field || !sortConfig.order) return datos;
    const dir = sortConfig.order === 'asc' ? 1 : -1;
    return [...datos].sort((a, b) => {
      const va = a[sortConfig.field] ?? '';
      const vb = b[sortConfig.field] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb), 'es') * dir;
    });
  }, [datos, sortConfig]);

  if (datosOrdenados.length === 0) return <Vacio texto={vacio} />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 text-left">
          <tr>
            {columnas.map(c =>
              c.sortable ? (
                <Fragment key={c.field}>
                  <SortableColumnHeader
                    label={c.label}
                    field={c.field}
                    sortConfig={sortConfig}
                    onToggle={onToggleSort}
                    className="px-4"
                  />
                </Fragment>
              ) : (
                <th key={c.field} className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {c.label}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {datosOrdenados.map((item, i) => (
            <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
              {renderFila(item).map((celda, j) => (
                <td key={j} className="px-4 py-3 text-slate-700 dark:text-slate-300">{celda}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
