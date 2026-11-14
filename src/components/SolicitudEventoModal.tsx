import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';
import {
  SolicitudesEventoService,
  TIPOS_EVENTO,
  mensajeDeErrorSolicitud,
  type TipoEvento,
} from '../services/solicitudesEventoService';
import { todayISO } from '../utils/date';

interface Props {
  tipoInicial: TipoEvento;
  nombreInicial?: string;
  correoInicial?: string;
  onClose: () => void;
  onEnviada: () => void;
}

const MAX_MENSAJE = 1000;
const MAX_INVITADOS = 5000;
const FORMATO_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function aISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Suma días a una fecha "YYYY-MM-DD" en hora local y la devuelve en el mismo formato. */
function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return aISO(d);
}

/** Misma normalización que el servidor: sin espacios ni guiones y sin "+52" inicial. */
function normalizarTelefono(valor: string): string {
  let t = valor.replace(/\s/g, '').replace(/-/g, '');
  if (t.startsWith('+52')) t = t.slice(3);
  return t;
}

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-deep/30 focus:border-brand-deep disabled:opacity-60';
const labelCls = 'block text-sm font-bold text-slate-700 mb-1';
const errCls = 'text-xs text-red-600 mt-1';

/**
 * Formulario de solicitud de cotización de evento. Render condicional simple
 * (lo monta el padre solo cuando está abierto): sin AnimatePresence, que en
 * motion v12 + React 19 deja los modales sin cerrar.
 */
export default function SolicitudEventoModal({ tipoInicial, nombreInicial = '', correoInicial = '', onClose, onEnviada }: Props) {
  const manana = useMemo(() => sumarDias(todayISO(), 1), []);
  const limite = useMemo(() => {
    const d = new Date(`${todayISO()}T00:00:00`);
    d.setFullYear(d.getFullYear() + 2);
    return aISO(d);
  }, []);

  const [tipo, setTipo] = useState<TipoEvento>(tipoInicial);
  const [fecha, setFecha] = useState('');
  const [invitados, setInvitados] = useState('');
  const [nombre, setNombre] = useState(nombreInicial);
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState(correoInicial);
  const [mensaje, setMensaje] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const validar = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!fecha) e.fecha = 'Elige la fecha del evento.';
    else if (fecha < manana) e.fecha = 'La fecha del evento debe ser a partir de mañana.';
    else if (fecha > limite) e.fecha = 'La fecha del evento no puede ser mayor a 2 años.';

    if (invitados.trim() !== '') {
      const n = Number(invitados);
      if (!Number.isInteger(n) || n < 1 || n > MAX_INVITADOS) e.invitados = `Los invitados deben estar entre 1 y ${MAX_INVITADOS}.`;
    }

    const nom = nombre.trim();
    if (nom.length < 2 || nom.length > 150) e.nombre = 'El nombre debe tener entre 2 y 150 caracteres.';

    if (!/^\d{10}$/.test(normalizarTelefono(telefono))) e.telefono = 'El teléfono debe tener 10 dígitos.';

    const cor = correo.trim();
    if (cor && (cor.length > 150 || !FORMATO_CORREO.test(cor))) e.correo = 'El correo no tiene un formato válido.';

    if (mensaje.trim().length > MAX_MENSAJE) e.mensaje = `El mensaje no puede superar los ${MAX_MENSAJE} caracteres.`;
    return e;
  };

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (enviando) return;
    const e = validar();
    setErrores(e);
    setErrorServidor(null);
    if (Object.keys(e).length > 0) return;

    setEnviando(true);
    try {
      await SolicitudesEventoService.crear({
        tipoEvento: tipo,
        fechaEvento: fecha,
        invitadosAprox: invitados.trim() === '' ? null : Number(invitados),
        nombreContacto: nombre.trim(),
        telefonoContacto: telefono.trim(),
        correoContacto: correo.trim() || null,
        mensaje: mensaje.trim() || null,
      });
      onEnviada();
    } catch (err) {
      setErrorServidor(mensajeDeErrorSolicitud(err, 'No pudimos enviar tu solicitud. Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  };

  // Portal a <body>: un ancestro con transform (transiciones de página) rompería `fixed`.
  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={enviando ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="solicitud-evento-titulo"
        className="bg-white w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 id="solicitud-evento-titulo" className="text-2xl font-serif font-bold text-slate-900">Solicitar cotización</h2>
            <p className="text-sm text-slate-500 mt-1">Cuéntanos de tu evento y te contactaremos para cotizar.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            aria-label="Cerrar"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={enviar} noValidate className="px-6 pb-6 pt-4 space-y-4">
          <div>
            <label htmlFor="se-tipo" className={labelCls}>Tipo de evento</label>
            <select id="se-tipo" data-testid="se-tipo" value={tipo} onChange={e => setTipo(e.target.value as TipoEvento)} disabled={enviando} className={inputCls}>
              {TIPOS_EVENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="se-fecha" className={labelCls}>Fecha del evento</label>
              <input id="se-fecha" data-testid="se-fecha" type="date" min={manana} max={limite} value={fecha} onChange={e => setFecha(e.target.value)} disabled={enviando} className={inputCls} />
              {errores.fecha && <p className={errCls}>{errores.fecha}</p>}
            </div>
            <div>
              <label htmlFor="se-invitados" className={labelCls}>Invitados aprox. <span className="font-normal text-slate-400">(opcional)</span></label>
              <input id="se-invitados" data-testid="se-invitados" type="number" inputMode="numeric" min={1} max={MAX_INVITADOS} value={invitados} onChange={e => setInvitados(e.target.value)} disabled={enviando} className={inputCls} />
              {errores.invitados && <p className={errCls}>{errores.invitados}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="se-nombre" className={labelCls}>Nombre de contacto</label>
            <input id="se-nombre" data-testid="se-nombre" type="text" maxLength={150} value={nombre} onChange={e => setNombre(e.target.value)} disabled={enviando} className={inputCls} autoComplete="name" />
            {errores.nombre && <p className={errCls}>{errores.nombre}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="se-telefono" className={labelCls}>Teléfono</label>
              <input id="se-telefono" data-testid="se-telefono" type="tel" inputMode="tel" maxLength={20} value={telefono} onChange={e => setTelefono(e.target.value)} disabled={enviando} className={inputCls} autoComplete="tel" placeholder="10 dígitos" />
              {errores.telefono && <p className={errCls}>{errores.telefono}</p>}
            </div>
            <div>
              <label htmlFor="se-correo" className={labelCls}>Correo <span className="font-normal text-slate-400">(opcional)</span></label>
              <input id="se-correo" data-testid="se-correo" type="email" maxLength={150} value={correo} onChange={e => setCorreo(e.target.value)} disabled={enviando} className={inputCls} autoComplete="email" />
              {errores.correo && <p className={errCls}>{errores.correo}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="se-mensaje" className={labelCls}>Mensaje <span className="font-normal text-slate-400">(opcional)</span></label>
            <textarea id="se-mensaje" data-testid="se-mensaje" rows={3} value={mensaje} onChange={e => setMensaje(e.target.value)} disabled={enviando} className={`${inputCls} resize-none`} placeholder="Lugar, estilo de flores, presupuesto aproximado..." />
            <div className="flex justify-between">
              <span className={errores.mensaje ? errCls : 'text-xs text-transparent'}>{errores.mensaje ?? '.'}</span>
              <span className={`text-xs mt-1 ${mensaje.length > MAX_MENSAJE ? 'text-red-600 font-bold' : 'text-slate-400'}`}>{mensaje.length}/{MAX_MENSAJE}</span>
            </div>
          </div>

          {errorServidor && (
            <div role="alert" data-testid="se-error" className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-700">
              {errorServidor}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={enviando} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" data-testid="se-enviar" disabled={enviando} className="px-6 py-3 rounded-xl bg-brand-deep text-white font-bold hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
              {enviando ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
