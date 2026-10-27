import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  MessageCircle, QrCode, Unlink, Send, RefreshCw, Users, Bell, Smartphone,
  History, Loader2, AlertCircle, CheckCircle2, Plus, Pencil, Power, X, Copy,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { parseApiDate } from '../../utils/date';
import {
  WhatsAppService, errorWhatsApp,
  WhatsAppEstado, WhatsAppConfiguracion, WhatsAppDestinatario,
  WhatsAppMensaje, WhatsAppVincular, EstadoWhatsApp,
} from '../../services/whatsappService';

// ── Constantes ────────────────────────────────────────────────

const QR_REFRESCO_MS = 30_000;
const QR_SONDEO_MS = 3_000;
const QR_TOPE_MS = 3 * 60_000;
const MAX_ACTIVOS = 5;
const REGEX_TELEFONO = /^52\d{10,11}$/;

const ESTADOS_PEDIDO: { valor: string; etiqueta: string }[] = [
  { valor: 'EN_PREPARACION', etiqueta: 'En preparación' },
  { valor: 'EN_RUTA', etiqueta: 'En ruta' },
  { valor: 'ENTREGADO', etiqueta: 'Entregado' },
  { valor: 'CANCELADO', etiqueta: 'Cancelado' },
  { valor: 'PENDIENTE_ANULACION', etiqueta: 'Pendiente de anulación' },
];

const EVENTOS: { clave: keyof WhatsAppConfiguracion; etiqueta: string }[] = [
  { clave: 'notificarPedidoNuevo', etiqueta: 'Pedido nuevo' },
  { clave: 'notificarCambioEstado', etiqueta: 'Cambio de estado de pedido' },
  { clave: 'notificarStockBajo', etiqueta: 'Stock bajo' },
  { clave: 'notificarVentaInstantanea', etiqueta: 'Venta instantánea' },
  { clave: 'notificarReabastecimiento', etiqueta: 'Reabastecimiento (Alexa)' },
];

const ETIQUETA_ESTADO: Record<EstadoWhatsApp, { texto: string; cls: string }> = {
  CONECTADO: { texto: 'Conectado', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  CONECTANDO: { texto: 'Conectando', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  DESCONECTADO: { texto: 'Desconectado', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
  SERVICIO_NO_DISPONIBLE: { texto: 'Servicio no disponible', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
  NO_CONFIGURADO: { texto: 'No configurado', cls: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
};

const ETIQUETA_MENSAJE: Record<string, string> = {
  PENDIENTE: 'text-amber-600 dark:text-amber-300',
  ENVIADO: 'text-emerald-600 dark:text-emerald-300',
  FALLIDO: 'text-rose-600 dark:text-rose-300',
  EXPIRADO: 'text-slate-500',
};

function fechaHora(valor: string | null | undefined): string {
  const d = parseApiDate(valor ?? null);
  return d ? d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
}

// ── UI base ───────────────────────────────────────────────────

function Seccion({ icono, titulo, children, accion }: {
  icono: React.ReactNode; titulo: string; children: React.ReactNode; accion?: React.ReactNode;
}) {
  return (
    <section className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
          {icono}{titulo}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

function ErrorCaja({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 px-4 py-3 text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{mensaje}</span>
      {onReintentar && <button onClick={onReintentar} className="font-bold underline">Reintentar</button>}
    </div>
  );
}

function Cargando() {
  return <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin" />Cargando…</div>;
}

const btn = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const btnPrimario = `${btn} bg-blue-600 hover:bg-blue-700 text-white`;
const btnSecundario = `${btn} bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200`;
const btnPeligro = `${btn} bg-rose-600 hover:bg-rose-700 text-white`;
const input = 'w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

/** Modal de confirmación con condicional simple (sin AnimatePresence: no cierra con motion v12 + React 19). */
function Confirmar({ titulo, texto, confirmar, peligro, onConfirmar, onCancelar, ocupado }: {
  titulo: string; texto: string; confirmar: string; peligro?: boolean;
  onConfirmar: () => void; onCancelar: () => void; ocupado?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onCancelar}>
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">{titulo}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">{texto}</p>
        <div className="flex justify-end gap-2">
          <button className={btnSecundario} onClick={onCancelar} disabled={ocupado}>Cancelar</button>
          <button className={peligro ? btnPeligro : btnPrimario} onClick={onConfirmar} disabled={ocupado}>
            {ocupado && <Loader2 className="w-4 h-4 animate-spin" />}{confirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────

export default function AdminWhatsAppPage() {
  const { showToast } = useToast();

  // Conexión
  const [estado, setEstado] = useState<WhatsAppEstado | null>(null);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);
  const [confirmarDesvincular, setConfirmarDesvincular] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);

  // Vincular (el QR solo vive en este estado: nunca en storage ni caché)
  const [qr, setQr] = useState<WhatsAppVincular | null>(null);
  const [qrAgotado, setQrAgotado] = useState(false);
  const qrInicio = useRef(0);
  const intervalos = useRef<number[]>([]);

  const cargarEstado = useCallback(async () => {
    try {
      const e = await WhatsAppService.estado();
      setEstado(e);
      setErrorEstado(null);
      return e;
    } catch (err) {
      setErrorEstado(errorWhatsApp(err, 'No se pudo cargar el estado.'));
      return null;
    }
  }, []);

  const detenerQr = useCallback(() => {
    intervalos.current.forEach(id => window.clearInterval(id));
    intervalos.current = [];
  }, []);

  const cerrarQr = useCallback(() => {
    detenerQr();
    setQr(null);
    setQrAgotado(false);
  }, [detenerQr]);

  useEffect(() => {
    cargarEstado();
    return () => detenerQr(); // al salir: se detienen los intervalos y se descarta el QR
  }, [cargarEstado, detenerQr]);

  const pedirQr = useCallback(async (): Promise<boolean> => {
    try {
      const { data } = await WhatsAppService.vincular();
      setQr(data);
      return true;
    } catch (err) {
      showToast(errorWhatsApp(err, 'No se pudo generar el QR.'), 'error');
      return false;
    }
  }, [showToast]);

  const vincular = async () => {
    detenerQr();
    setQrAgotado(false);
    setOcupado('vincular');
    const ok = await pedirQr();
    setOcupado(null);
    if (!ok) return;

    qrInicio.current = Date.now();
    const sondeo = window.setInterval(async () => {
      if (Date.now() - qrInicio.current > QR_TOPE_MS) {
        detenerQr();
        setQr(null);
        setQrAgotado(true);
        return;
      }
      const e = await cargarEstado();
      if (e?.estado === 'CONECTADO') {
        cerrarQr();
        showToast('WhatsApp conectado', 'success');
      }
    }, QR_SONDEO_MS);
    const refresco = window.setInterval(() => {
      if (Date.now() - qrInicio.current <= QR_TOPE_MS) pedirQr();
    }, QR_REFRESCO_MS);
    intervalos.current = [sondeo, refresco];
  };

  const desvincular = async () => {
    setOcupado('desvincular');
    try {
      await WhatsAppService.desvincular();
      showToast('WhatsApp desvinculado', 'success');
      setConfirmarDesvincular(false);
      await cargarEstado();
    } catch (err) {
      showToast(errorWhatsApp(err), 'error');
    } finally {
      setOcupado(null);
    }
  };

  const prueba = async (recipientId?: string) => {
    setOcupado(`prueba-${recipientId ?? 'todos'}`);
    try {
      const { data } = await WhatsAppService.prueba(recipientId);
      showToast(`Prueba encolada para ${data.encolados} destinatario(s)`, 'success');
      cargarMensajes();
    } catch (err) {
      showToast(errorWhatsApp(err), 'error');
    } finally {
      setOcupado(null);
    }
  };

  // Destinatarios
  const [destinatarios, setDestinatarios] = useState<WhatsAppDestinatario[] | null>(null);
  const [errorDest, setErrorDest] = useState<string | null>(null);
  const [form, setForm] = useState<{ id: string | null; nombre: string; telefono: string } | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const cargarDestinatarios = useCallback(async () => {
    try {
      setDestinatarios(await WhatsAppService.destinatarios());
      setErrorDest(null);
    } catch (err) {
      setErrorDest(errorWhatsApp(err, 'No se pudieron cargar los destinatarios.'));
    }
  }, []);

  const editar = async (d: WhatsAppDestinatario) => {
    try {
      const det = await WhatsAppService.destinatario(d.id);
      setForm({ id: d.id, nombre: det.nombre, telefono: det.telefono ?? '' });
      setErrorForm(null);
    } catch (err) {
      showToast(errorWhatsApp(err), 'error');
    }
  };

  const guardarDestinatario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const nombre = form.nombre.trim();
    const telefono = form.telefono.replace(/\D/g, '');
    if (!nombre || nombre.length > 100) { setErrorForm('El nombre es obligatorio (máx. 100 caracteres).'); return; }
    if (!REGEX_TELEFONO.test(telefono)) { setErrorForm('Teléfono: solo dígitos, 12 o 13, empezando con 52.'); return; }

    setOcupado('guardar-dest');
    try {
      const actual = destinatarios?.find(x => x.id === form.id);
      const res = form.id
        ? await WhatsAppService.actualizarDestinatario(form.id, { nombre, telefono, activo: actual?.activo ?? true })
        : await WhatsAppService.crearDestinatario({ nombre, telefono });
      showToast(res.message || 'Destinatario guardado', res.data.verificado === false ? 'info' : 'success');
      setForm(null);
      await cargarDestinatarios();
    } catch (err) {
      setErrorForm(errorWhatsApp(err));
    } finally {
      setOcupado(null);
    }
  };

  const alternarActivo = async (d: WhatsAppDestinatario) => {
    setOcupado(`activo-${d.id}`);
    try {
      const det = await WhatsAppService.destinatario(d.id);
      await WhatsAppService.actualizarDestinatario(d.id, { nombre: det.nombre, telefono: det.telefono ?? '', activo: !d.activo });
      showToast(d.activo ? 'Destinatario desactivado' : 'Destinatario activado', 'success');
      await cargarDestinatarios();
    } catch (err) {
      showToast(errorWhatsApp(err), 'error');
    } finally {
      setOcupado(null);
    }
  };

  // Eventos
  const [config, setConfig] = useState<WhatsAppConfiguracion | null>(null);
  const [errorConfig, setErrorConfig] = useState<string | null>(null);

  const cargarConfig = useCallback(async () => {
    try {
      setConfig(await WhatsAppService.configuracion());
      setErrorConfig(null);
    } catch (err) {
      setErrorConfig(errorWhatsApp(err, 'No se pudo cargar la configuración.'));
    }
  }, []);

  const guardarConfig = async () => {
    if (!config) return;
    setOcupado('config');
    try {
      const res = await WhatsAppService.guardarConfiguracion(config);
      setConfig(res.data);
      showToast('Configuración guardada', 'success');
      cargarEstado();
    } catch (err) {
      showToast(errorWhatsApp(err), 'error');
    } finally {
      setOcupado(null);
    }
  };

  const alternarEstadoPedido = (valor: string) => {
    if (!config) return;
    const lista = config.estadosNotificados.includes(valor)
      ? config.estadosNotificados.filter(e => e !== valor)
      : [...config.estadosNotificados, valor];
    setConfig({ ...config, estadosNotificados: lista });
  };

  // Versión (la sugerida se pega a mano en Render; "Reconectar" reinicia la conexión)
  const [versionSugerida, setVersionSugerida] = useState<string | null>(null);
  const [avisoVersion, setAvisoVersion] = useState<string | null>(null);
  const [confirmarReinicio, setConfirmarReinicio] = useState(false);

  const detectarVersion = async () => {
    setOcupado('detectar');
    setAvisoVersion(null);
    setVersionSugerida(null);
    try {
      const r = await WhatsAppService.versionSugerida();
      if (r.version) setVersionSugerida(r.version);
      else setAvisoVersion('No se pudo detectar');
    } catch {
      setAvisoVersion('No se pudo detectar');
    } finally {
      setOcupado(null);
    }
  };

  const copiarVersion = async () => {
    if (!versionSugerida) return;
    try {
      await navigator.clipboard.writeText(versionSugerida);
      showToast('Versión copiada', 'success');
    } catch {
      // Respaldo silencioso: el texto de la versión queda seleccionable.
    }
  };

  const reiniciar = async () => {
    setOcupado('reiniciar');
    try {
      const res = await WhatsAppService.reiniciar();
      setConfirmarReinicio(false);
      showToast(res.message, 'success');
      cargarEstado();
    } catch (err) {
      setConfirmarReinicio(false);
      showToast(errorWhatsApp(err), 'error');
    } finally {
      setOcupado(null);
    }
  };

  // Historial
  const [mensajes, setMensajes] = useState<WhatsAppMensaje[] | null>(null);
  const [errorMensajes, setErrorMensajes] = useState<string | null>(null);

  const cargarMensajes = useCallback(async () => {
    try {
      setMensajes(await WhatsAppService.mensajes(50));
      setErrorMensajes(null);
    } catch (err) {
      setErrorMensajes(errorWhatsApp(err, 'No se pudo cargar el historial.'));
    }
  }, []);

  useEffect(() => {
    cargarDestinatarios();
    cargarConfig();
    cargarMensajes();
  }, [cargarDestinatarios, cargarConfig, cargarMensajes]);

  const noConfigurado = estado !== null && !estado.configurado;
  const conectado = estado?.estado === 'CONECTADO';
  const activos = destinatarios?.filter(d => d.activo).length ?? 0;
  const insignia = estado ? ETIQUETA_ESTADO[estado.estado] ?? ETIQUETA_ESTADO.DESCONECTADO : null;

  return (
    <div className="w-full space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            <MessageCircle className="w-6 h-6 text-emerald-500" />WhatsApp
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Avisos internos por WhatsApp: vinculación, destinatarios, eventos y versión.
          </p>
        </div>
        {insignia && (
          <span className={`w-fit rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-widest ${insignia.cls}`}>
            {insignia.texto}
          </span>
        )}
      </div>

      {noConfigurado && (
        <ErrorCaja mensaje="WhatsApp no está configurado en el servidor (faltan las variables de Evolution). El módulo queda solo de lectura y no se envía nada." />
      )}

      {/* 1. Conexión */}
      <Seccion icono={<Smartphone className="w-4 h-4" />} titulo="Conexión">
        {errorEstado ? <ErrorCaja mensaje={errorEstado} onReintentar={cargarEstado} />
          : !estado ? <Cargando />
          : (
            <div className="space-y-4">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</dt>
                  <dd className="font-bold text-slate-800 dark:text-slate-100">{insignia?.texto}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Número vinculado</dt>
                  <dd className="font-bold text-slate-800 dark:text-slate-100">{estado.numeroVinculado ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Última verificación</dt>
                  <dd className="font-bold text-slate-800 dark:text-slate-100">{fechaHora(estado.ultimaVerificacionEn)}</dd>
                </div>
              </dl>
              {!estado.habilitado && estado.configurado && (
                <p className="text-xs text-amber-600 dark:text-amber-300">Los avisos están deshabilitados (interruptor general en «Eventos»).</p>
              )}
              <div className="flex flex-wrap gap-2">
                {!conectado && (
                  <button className={btnPrimario} onClick={vincular} disabled={noConfigurado || ocupado === 'vincular'}>
                    {ocupado === 'vincular' ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}Vincular
                  </button>
                )}
                {conectado && (
                  <button className={btnSecundario} onClick={() => setConfirmarDesvincular(true)} disabled={!!ocupado}>
                    <Unlink className="w-4 h-4" />Desvincular
                  </button>
                )}
                <button className={btnSecundario} onClick={() => prueba()} disabled={!conectado || activos === 0 || !!ocupado}>
                  {ocupado === 'prueba-todos' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Mensaje de prueba
                </button>
                <button className={btnSecundario} onClick={cargarEstado} aria-label="Actualizar estado">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
      </Seccion>

      {/* 2. Vincular (QR) */}
      {(qr || qrAgotado) && (
        <Seccion icono={<QrCode className="w-4 h-4" />} titulo="Vincular"
          accion={<button className={btnSecundario} onClick={cerrarQr} aria-label="Cerrar"><X className="w-4 h-4" /></button>}>
          {qrAgotado ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">El código expiró sin escanearse.</p>
              <button className={btnPrimario} onClick={vincular}><RefreshCw className="w-4 h-4" />Volver a generar</button>
            </div>
          ) : qr && (
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {qr.qrBase64 ? (
                <img
                  src={`data:image/png;base64,${qr.qrBase64}`}
                  alt="Código QR para vincular WhatsApp"
                  className="w-[260px] min-w-[240px] h-auto rounded-xl border border-slate-200 bg-white p-2"
                />
              ) : (
                <div className="w-[260px] h-[260px] flex items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400">
                  Generando QR…
                </div>
              )}
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>En el teléfono del número secundario: WhatsApp → <b>Dispositivos vinculados</b> → <b>Vincular un dispositivo</b> y escanea el código.</p>
                {qr.pairingCode && (
                  <p>O vincula con número de teléfono usando el código: <span className="font-mono text-lg font-black tracking-widest text-slate-900 dark:text-white">{qr.pairingCode}</span></p>
                )}
                <p className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="w-3 h-3 animate-spin" />Esperando el escaneo; el código se renueva cada 30 s.</p>
              </div>
            </div>
          )}
        </Seccion>
      )}

      {/* 3. Destinatarios */}
      <Seccion icono={<Users className="w-4 h-4" />} titulo={`Destinatarios (${activos}/${MAX_ACTIVOS} activos)`}
        accion={!form && (
          <button className={btnPrimario} onClick={() => { setForm({ id: null, nombre: '', telefono: '52' }); setErrorForm(null); }}
            disabled={activos >= MAX_ACTIVOS}>
            <Plus className="w-4 h-4" />Agregar
          </button>
        )}>
        {form && (
          <form onSubmit={guardarDestinatario} className="mb-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-start rounded-xl bg-slate-50 dark:bg-slate-900/40 p-4">
            <label className="text-xs font-bold text-slate-500">Nombre
              <input className={`${input} mt-1`} value={form.nombre} maxLength={100}
                onChange={e => setForm({ ...form, nombre: e.target.value })} autoFocus />
            </label>
            <label className="text-xs font-bold text-slate-500">Teléfono (52 + número)
              <input className={`${input} mt-1`} value={form.telefono} inputMode="numeric" maxLength={13}
                onChange={e => setForm({ ...form, telefono: e.target.value.replace(/\D/g, '') })} placeholder="5217711234567" />
            </label>
            <div className="flex gap-2 md:mt-5">
              <button type="submit" className={btnPrimario} disabled={ocupado === 'guardar-dest'}>
                {ocupado === 'guardar-dest' && <Loader2 className="w-4 h-4 animate-spin" />}Guardar
              </button>
              <button type="button" className={btnSecundario} onClick={() => setForm(null)}>Cancelar</button>
            </div>
            {errorForm && <p className="md:col-span-3 text-xs font-semibold text-rose-600">{errorForm}</p>}
          </form>
        )}

        {errorDest ? <ErrorCaja mensaje={errorDest} onReintentar={cargarDestinatarios} />
          : !destinatarios ? <Cargando />
          : destinatarios.length === 0 || activos === 0 ? (
            <>
              <p className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-4 h-4" />No hay destinatarios activos; no se enviará nada.
              </p>
              {destinatarios.length > 0 && listaDestinatarios(destinatarios)}
            </>
          ) : listaDestinatarios(destinatarios)}
      </Seccion>

      {/* 4. Eventos */}
      <Seccion icono={<Bell className="w-4 h-4" />} titulo="Eventos"
        accion={config && (
          <button className={btnPrimario} onClick={guardarConfig} disabled={ocupado === 'config'}>
            {ocupado === 'config' && <Loader2 className="w-4 h-4 animate-spin" />}Guardar
          </button>
        )}>
        {errorConfig ? <ErrorCaja mensaje={errorConfig} onReintentar={cargarConfig} />
          : !config ? <Cargando />
          : (
            <div className="space-y-5">
              <Interruptor etiqueta="Habilitado (interruptor general)" valor={config.habilitado}
                onChange={v => setConfig({ ...config, habilitado: v })} destacado />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EVENTOS.map(ev => (
                  <Interruptor key={ev.clave} etiqueta={ev.etiqueta} valor={config[ev.clave] as boolean}
                    onChange={v => setConfig({ ...config, [ev.clave]: v })} />
                ))}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Estados de pedido que se notifican</p>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS_PEDIDO.map(e => (
                    <label key={e.valor} className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                      <input type="checkbox" checked={config.estadosNotificados.includes(e.valor)}
                        onChange={() => alternarEstadoPedido(e.valor)} disabled={!config.notificarCambioEstado} />
                      {e.etiqueta}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
      </Seccion>

      {/* 5. Versión de WhatsApp Web */}
      <Seccion icono={<RefreshCw className="w-4 h-4" />} titulo="Versión de WhatsApp Web">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <button className={btnSecundario} onClick={detectarVersion} disabled={ocupado === 'detectar'}>
              {ocupado === 'detectar' && <Loader2 className="w-4 h-4 animate-spin" />}Detectar última versión
            </button>
            {versionSugerida && (
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span>Versión sugerida:</span>
                <span className="font-bold select-all">{versionSugerida}</span>
                <button className={btnSecundario} onClick={copiarVersion}>
                  <Copy className="w-4 h-4" />Copiar
                </button>
              </div>
            )}
            <button className={btnSecundario} onClick={() => setConfirmarReinicio(true)} disabled={ocupado === 'reiniciar'}>
              <Power className="w-4 h-4" />Reconectar
            </button>
          </div>
          {avisoVersion && <p className="text-xs font-semibold text-amber-600">{avisoVersion}</p>}
          <p className="text-xs text-slate-400">
            Si WhatsApp no conecta después de una actualización: 1) pulsa Reconectar; 2) si sigue sin conectar, copia la versión sugerida y pégala en Render, en el servicio de Evolution → Environment → CONFIG_SESSION_PHONE_VERSION → Save. Render reinicia el servicio en unos minutos.
          </p>
        </div>
      </Seccion>

      {/* 6. Historial */}
      <Seccion icono={<History className="w-4 h-4" />} titulo="Historial (últimos 50)"
        accion={<button className={btnSecundario} onClick={cargarMensajes} aria-label="Actualizar historial"><RefreshCw className="w-4 h-4" /></button>}>
        {errorMensajes ? <ErrorCaja mensaje={errorMensajes} onReintentar={cargarMensajes} />
          : !mensajes ? <Cargando />
          : mensajes.length === 0 ? <p className="text-sm text-slate-400">Todavía no hay mensajes.</p>
          : (
            <>
              <table className="hidden md:table w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="py-2">Fecha</th><th>Evento</th><th>Destinatario</th><th>Estado</th><th>Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {mensajes.map((m, i) => (
                    <tr key={i} className="text-slate-700 dark:text-slate-200">
                      <td className="py-2 whitespace-nowrap">{fechaHora(m.creadoEn)}</td>
                      <td>{m.tipoEvento}</td>
                      <td>{m.destinatario}</td>
                      <td className={`font-bold ${ETIQUETA_MENSAJE[m.estado] ?? ''}`}>{m.estado}</td>
                      <td className="text-xs text-slate-500 max-w-[240px] truncate" title={m.ultimoError ?? ''}>{m.ultimoError ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="md:hidden space-y-2">
                {mensajes.map((m, i) => (
                  <li key={i} className="rounded-xl border border-slate-100 dark:border-slate-700 p-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{m.tipoEvento}</span>
                      <span className={`font-bold ${ETIQUETA_MENSAJE[m.estado] ?? ''}`}>{m.estado}</span>
                    </div>
                    <p className="text-slate-500">{m.destinatario}</p>
                    <p className="text-xs text-slate-400">{fechaHora(m.creadoEn)}</p>
                    {m.ultimoError && <p className="text-xs text-rose-500">{m.ultimoError}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
      </Seccion>

      {confirmarDesvincular && (
        <Confirmar titulo="¿Desvincular WhatsApp?" peligro confirmar="Desvincular" ocupado={ocupado === 'desvincular'}
          texto="Se cerrará la sesión del número. Los avisos dejarán de enviarse hasta que vuelvas a escanear el QR."
          onConfirmar={desvincular} onCancelar={() => setConfirmarDesvincular(false)} />
      )}
      {confirmarReinicio && (
        <Confirmar titulo="¿Reconectar WhatsApp?" confirmar="Reconectar" ocupado={ocupado === 'reiniciar'}
          texto="Se reiniciará la conexión con WhatsApp. Durante un momento no se enviarán avisos."
          onConfirmar={reiniciar} onCancelar={() => setConfirmarReinicio(false)} />
      )}
    </div>
  );

  // Lista de destinatarios (tabla en escritorio, tarjetas en móvil). Usa el estado de la página.
  function listaDestinatarios(lista: WhatsAppDestinatario[]) {
    const verificado = (v: boolean | null) =>
      v === true ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" />Sí</span>
        : v === false ? <span className="text-rose-600">Sin WhatsApp</span>
        : <span className="text-slate-400">Sin verificar</span>;
    const acciones = (d: WhatsAppDestinatario) => (
      <div className="flex flex-wrap gap-2">
        <button className={btnSecundario} onClick={() => editar(d)} aria-label={`Editar ${d.nombre}`}><Pencil className="w-3 h-3" /></button>
        <button className={btnSecundario} onClick={() => alternarActivo(d)} disabled={ocupado === `activo-${d.id}` || (!d.activo && activos >= MAX_ACTIVOS)}>
          {d.activo ? 'Desactivar' : 'Activar'}
        </button>
        <button className={btnSecundario} onClick={() => prueba(d.id)} disabled={!d.activo || !conectado || !!ocupado}>
          <Send className="w-3 h-3" />Enviar prueba
        </button>
      </div>
    );
    return (
      <>
        <table className="hidden md:table w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="py-2">Nombre</th><th>Teléfono</th><th>Activo</th><th>WhatsApp</th><th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {lista.map(d => (
              <tr key={d.id} className={`text-slate-700 dark:text-slate-200 ${d.activo ? '' : 'opacity-60'}`}>
                <td className="py-2 font-semibold">{d.nombre}</td>
                <td className="font-mono">{d.telefonoEnmascarado}</td>
                <td>{d.activo ? 'Sí' : 'No'}</td>
                <td>{verificado(d.verificado)}</td>
                <td className="py-2">{acciones(d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="md:hidden space-y-2">
          {lista.map(d => (
            <li key={d.id} className={`rounded-xl border border-slate-100 dark:border-slate-700 p-3 text-sm space-y-2 ${d.activo ? '' : 'opacity-60'}`}>
              <div className="flex justify-between gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-100">{d.nombre}</span>
                <span className="text-xs">{d.activo ? 'Activo' : 'Inactivo'}</span>
              </div>
              <p className="font-mono text-slate-500">{d.telefonoEnmascarado} · {verificado(d.verificado)}</p>
              {acciones(d)}
            </li>
          ))}
        </ul>
      </>
    );
  }
}

const Interruptor: React.FC<{
  etiqueta: string; valor: boolean; onChange: (v: boolean) => void; destacado?: boolean;
}> = ({ etiqueta, valor, onChange, destacado }) => {
  return (
    <label className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 cursor-pointer ${destacado ? 'border-blue-200 dark:border-blue-500/40 bg-blue-50/50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-600'}`}>
      <span className={`text-sm ${destacado ? 'font-black' : 'font-semibold'} text-slate-700 dark:text-slate-200`}>{etiqueta}</span>
      <button
        type="button"
        role="switch"
        aria-checked={valor}
        onClick={() => onChange(!valor)}
        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${valor ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${valor ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
};
