import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, Check, Copy, Eye, FileText, Pencil, Plus, RefreshCw, Save, Trash2, X,
} from 'lucide-react';
import { AdminService } from '../../services/adminService';
import { useToast } from '../../hooks/useToast';
import type { DocumentoLegalAdmin, SeccionLegal, SiteSettings } from '../../types';
import { VARIABLES_LEGALES } from '../../constants/legal';
import { reemplazarVariables, variablesDesconocidas } from '../../utils/textoLegal';
import { formatApiDate } from '../../utils/date';
import TextoLegal from '../../components/legal/TextoLegal';

// Mismos límites que valida el servidor (ContenidoLegalService).
const TITULO_MIN = 3;
const TITULO_MAX = 150;
const MAX_SECCIONES = 40;
const SECCION_TITULO_MAX = 200;
const CUERPO_MAX = 8_000;
const CUERPOS_TOTAL_MAX = 60_000;
const NOTAS_MAX = 4_000;

interface Formulario {
  titulo: string;
  secciones: SeccionLegal[];
  notasRevision: string;
  revisado: boolean;
}

const desdeDocumento = (d: DocumentoLegalAdmin): Formulario => ({
  titulo: d.titulo,
  secciones: d.secciones.map((s) => ({ ...s })),
  notasRevision: d.notasRevision ?? '',
  revisado: !d.esProvisional,
});

/** Descarta las secciones con título y cuerpo vacíos (igual que el servidor). */
const sinVacias = (secciones: SeccionLegal[]) =>
  secciones.filter((s) => s.titulo.trim() !== '' || s.cuerpo.trim() !== '');

function validar(f: Formulario, esFaq: boolean): string[] {
  const errores: string[] = [];
  const nombreSec = esFaq ? 'pregunta' : 'sección';
  const titulo = f.titulo.trim();
  if (titulo.length < TITULO_MIN || titulo.length > TITULO_MAX) {
    errores.push(`El título es obligatorio y debe tener de ${TITULO_MIN} a ${TITULO_MAX} caracteres.`);
  }
  const secciones = sinVacias(f.secciones);
  if (secciones.length > MAX_SECCIONES) errores.push(`Máximo ${MAX_SECCIONES} ${esFaq ? 'preguntas' : 'secciones'}.`);
  let total = 0;
  secciones.forEach((s, i) => {
    const n = i + 1;
    if (!s.titulo.trim()) errores.push(`La ${nombreSec} ${n} necesita ${esFaq ? 'la pregunta' : 'un título'}.`);
    if (s.titulo.trim().length > SECCION_TITULO_MAX) errores.push(`El título de la ${nombreSec} ${n} pasa de ${SECCION_TITULO_MAX} caracteres.`);
    if (!s.cuerpo.trim()) errores.push(`La ${nombreSec} ${n} necesita ${esFaq ? 'la respuesta' : 'contenido'}.`);
    if (s.cuerpo.trim().length > CUERPO_MAX) errores.push(`El contenido de la ${nombreSec} ${n} pasa de ${CUERPO_MAX} caracteres.`);
    total += s.cuerpo.trim().length;
  });
  if (total > CUERPOS_TOTAL_MAX) errores.push(`El contenido total pasa de ${CUERPOS_TOTAL_MAX} caracteres.`);
  if (f.notasRevision.length > NOTAS_MAX) errores.push(`Las notas de revisión pasan de ${NOTAS_MAX} caracteres.`);
  const desconocidas = new Set<string>();
  [f.titulo, ...secciones.flatMap((s) => [s.titulo, s.cuerpo])].forEach((t) =>
    variablesDesconocidas(t).forEach((v) => desconocidas.add(v)),
  );
  desconocidas.forEach((v) => errores.push(`Variable no reconocida: {{${v}}}.`));
  return errores;
}

const inp = 'w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-all';
const lbl = 'block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider';
const btnSec = 'flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 bg-white dark:bg-slate-800 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-500/50 px-3 py-2 rounded-xl transition-all disabled:opacity-50';

export default function AdminContenidoLegalPage() {
  const { showToast } = useToast();
  const [docs, setDocs] = useState<DocumentoLegalAdmin[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState<Formulario | null>(null);
  const [original, setOriginal] = useState<string>('');
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [copiada, setCopiada] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(false);
    try {
      const [res, cms] = await Promise.all([
        AdminService.getContenidoLegal(),
        AdminService.getCms().catch(() => null),
      ]);
      setDocs(res.data);
      setSettings(cms?.data ?? null);
    } catch {
      setErrorCarga(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const sucio = !!form && JSON.stringify(form) !== original;

  // Aviso del navegador si se cierra la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!sucio) return;
    const aviso = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [sucio]);

  const confirmarDescarte = () => !sucio || window.confirm('Tienes cambios sin guardar. ¿Quieres descartarlos?');

  const abrir = (d: DocumentoLegalAdmin) => {
    if (editando === d.slug) return;
    if (!confirmarDescarte()) return;
    const f = desdeDocumento(d);
    setEditando(d.slug);
    setForm(f);
    setOriginal(JSON.stringify(f));
    setVistaPrevia(false);
  };

  const cerrar = () => {
    if (!confirmarDescarte()) return;
    setEditando(null);
    setForm(null);
    setOriginal('');
    setVistaPrevia(false);
  };

  const docActual = docs.find((d) => d.slug === editando) ?? null;
  const esFaq = editando === 'preguntas-frecuentes';
  const errores = useMemo(() => (form ? validar(form, esFaq) : []), [form, esFaq]);

  const cambiar = (parcial: Partial<Formulario>) => setForm((f) => (f ? { ...f, ...parcial } : f));
  const cambiarSeccion = (i: number, parcial: Partial<SeccionLegal>) =>
    setForm((f) => (f ? { ...f, secciones: f.secciones.map((s, idx) => (idx === i ? { ...s, ...parcial } : s)) } : f));
  const mover = (i: number, delta: -1 | 1) =>
    setForm((f) => {
      if (!f) return f;
      const j = i + delta;
      if (j < 0 || j >= f.secciones.length) return f;
      const copia = [...f.secciones];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return { ...f, secciones: copia };
    });
  const eliminar = (i: number) => {
    if (!window.confirm(`¿Eliminar ${esFaq ? 'esta pregunta' : 'esta sección'}?`)) return;
    setForm((f) => (f ? { ...f, secciones: f.secciones.filter((_, idx) => idx !== i) } : f));
  };
  const agregar = () =>
    setForm((f) => (f ? { ...f, secciones: [...f.secciones, { titulo: '', cuerpo: '' }] } : f));

  const copiarVariable = async (v: string) => {
    try {
      await navigator.clipboard.writeText(`{{${v}}}`);
      setCopiada(v);
      setTimeout(() => setCopiada((c) => (c === v ? null : c)), 1500);
    } catch {
      showToast('No se pudo copiar. Escríbela a mano.', 'error');
    }
  };

  const guardar = async () => {
    if (!form || !editando || errores.length > 0) return;
    setGuardando(true);
    try {
      const res = await AdminService.updateContenidoLegal(editando, {
        titulo: form.titulo.trim(),
        secciones: sinVacias(form.secciones).map((s) => ({ titulo: s.titulo.trim(), cuerpo: s.cuerpo.trim() })),
        notasRevision: form.notasRevision.trim() || null,
        esProvisional: !form.revisado,
      });
      setDocs((prev) => prev.map((d) => (d.slug === res.data.slug ? res.data : d)));
      showToast(res.message || 'Página actualizada.', 'success');
      setEditando(null);
      setForm(null);
      setOriginal('');
      setVistaPrevia(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo guardar la página.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const faltantes = useMemo(() => {
    if (!settings) return [];
    const f: string[] = [];
    if (!settings.razonSocial?.trim()) f.push('razón social');
    if (!settings.rfc?.trim()) f.push('RFC');
    if (!settings.telefono?.trim()) f.push('teléfono');
    if (!settings.correo?.trim()) f.push('correo');
    return f;
  }, [settings]);

  const fecha = (d: DocumentoLegalAdmin) =>
    formatApiDate(d.actualizadoEn, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Páginas legales y ayuda</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Edita el aviso de privacidad, los términos, las políticas y las preguntas frecuentes</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/admin/cms" className={btnSec}><ArrowLeft className="w-3.5 h-3.5" /> Personalizar sitio</Link>
          <button type="button" onClick={cargar} disabled={cargando || sucio} className={btnSec}>
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} /> Recargar
          </button>
        </div>
      </div>

      {/* Datos del negocio que faltan */}
      {faltantes.length > 0 && (
        <div role="status" className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Faltan datos del negocio: {faltantes.join(', ')}. Complétalos en{' '}
            <Link to="/admin/cms" className="font-bold underline">Personalizar sitio</Link>.
          </p>
        </div>
      )}

      {cargando && (
        <div role="status" aria-label="Cargando" className="space-y-3 animate-pulse">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
        </div>
      )}

      {!cargando && errorCarga && (
        <div role="alert" className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-500/30 rounded-2xl p-8 text-center">
          <p className="text-sm text-slate-700 dark:text-slate-200 mb-4">No se pudieron cargar las páginas legales.</p>
          <button type="button" onClick={cargar} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-black transition-all">Reintentar</button>
        </div>
      )}

      {/* Lista de documentos */}
      {!cargando && !errorCarga && (
        <ul className="grid grid-cols-1 gap-3">
          {docs.map((d) => (
            <li
              key={d.slug}
              className={`bg-white dark:bg-slate-800 border rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 flex-wrap ${editando === d.slug ? 'border-purple-400 dark:border-purple-500' : 'border-slate-200 dark:border-slate-700'}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-black text-slate-800 dark:text-white break-words">{d.titulo}</h2>
                  {d.esProvisional ? (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">Provisional</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">Revisado</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Actualizado {fecha(d)}{d.actualizadoPorNombre ? ` por ${d.actualizadoPorNombre}` : ''}
                </p>
              </div>
              <button type="button" onClick={() => abrir(d)} className={btnSec} aria-label={`Editar ${d.titulo}`}>
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Editor */}
      {form && docActual && (
        <section aria-label={`Editar ${docActual.titulo}`} className="bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-500/40 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Editando: {docActual.titulo}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" onClick={() => setVistaPrevia((v) => !v)} className={btnSec} aria-pressed={vistaPrevia}>
                <Eye className="w-3.5 h-3.5" /> {vistaPrevia ? 'Volver a editar' : 'Vista previa'}
              </button>
              <button type="button" onClick={cerrar} className={btnSec}><X className="w-3.5 h-3.5" /> Cancelar</button>
              <button
                type="button"
                onClick={guardar}
                disabled={guardando || errores.length > 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-black shadow-lg shadow-purple-600/20 transition-all disabled:opacity-60"
              >
                <Save className="w-4 h-4" /> {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>

          {errores.length > 0 && (
            <div role="alert" className="px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-700 dark:text-red-400">
              <p className="font-black mb-1">Corrige esto para poder guardar:</p>
              <ul className="list-disc pl-5 space-y-0.5">{errores.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          )}

          {vistaPrevia ? (
            <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 text-slate-800 dark:text-slate-200">
              <h3 className="font-serif font-bold text-brand-deep dark:text-sky-200 text-2xl mb-6 break-words">{reemplazarVariables(form.titulo, settings)}</h3>
              {sinVacias(form.secciones).length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">Esta información estará disponible pronto.</p>
              ) : (
                <div className="space-y-6">
                  {sinVacias(form.secciones).map((s, i) => (
                    <section key={i}>
                      <h4 className="text-lg font-bold text-brand-deep dark:text-sky-200 mb-2 break-words">{reemplazarVariables(s.titulo, settings)}</h4>
                      <TextoLegal cuerpo={s.cuerpo} settings={settings} />
                    </section>
                  ))}
                </div>
              )}
            </article>
          ) : (
            <>
              <div>
                <label htmlFor="legal-titulo" className={lbl}>Título</label>
                <input id="legal-titulo" type="text" value={form.titulo} onChange={(e) => cambiar({ titulo: e.target.value })} className={inp} />
                <p className="text-[11px] text-slate-400 mt-1">{form.titulo.trim().length}/{TITULO_MAX}</p>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-2">
                <p>Deja una línea en blanco para separar párrafos. Empieza una línea con &quot;- &quot; para hacer una lista.</p>
                <div>
                  <p className="font-bold mb-1">Variables (se reemplazan con los datos del negocio):</p>
                  <div className="flex flex-wrap gap-2">
                    {VARIABLES_LEGALES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => copiarVariable(v)}
                        className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-slate-200 dark:border-slate-600 transition-all"
                        aria-label={`Copiar la variable ${v}`}
                      >
                        {`{{${v}}}`} {copiada === v ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {form.secciones.map((s, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400">{esFaq ? 'Pregunta' : 'Sección'} {i + 1}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir ${esFaq ? 'pregunta' : 'sección'} ${i + 1}`} className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                        <button type="button" onClick={() => mover(i, 1)} disabled={i === form.secciones.length - 1} aria-label={`Bajar ${esFaq ? 'pregunta' : 'sección'} ${i + 1}`} className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                        <button type="button" onClick={() => eliminar(i)} aria-label={`Eliminar ${esFaq ? 'pregunta' : 'sección'} ${i + 1}`} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor={`legal-sec-t-${i}`} className={lbl}>{esFaq ? 'Pregunta' : 'Título'}</label>
                      <input id={`legal-sec-t-${i}`} type="text" value={s.titulo} onChange={(e) => cambiarSeccion(i, { titulo: e.target.value })} className={inp} />
                    </div>
                    <div>
                      <label htmlFor={`legal-sec-c-${i}`} className={lbl}>{esFaq ? 'Respuesta' : 'Contenido'}</label>
                      <textarea
                        id={`legal-sec-c-${i}`}
                        value={s.cuerpo}
                        onChange={(e) => cambiarSeccion(i, { cuerpo: e.target.value })}
                        rows={Math.min(16, Math.max(4, s.cuerpo.split('\n').length + 1))}
                        className={`${inp} resize-y`}
                      />
                      <p className="text-[11px] text-slate-400 mt-1">{s.cuerpo.trim().length}/{CUERPO_MAX}</p>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={agregar} className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 px-3 py-2 rounded-xl transition-all">
                  <Plus className="w-3.5 h-3.5" /> {esFaq ? 'Agregar pregunta' : 'Agregar sección'}
                </button>
              </div>

              <div>
                <label htmlFor="legal-notas" className={lbl}>Notas de revisión (solo las ve el administrador)</label>
                <textarea id="legal-notas" value={form.notasRevision} onChange={(e) => cambiar({ notasRevision: e.target.value })} rows={6} className={`${inp} resize-y`} />
                <p className="text-[11px] text-slate-400 mt-1">{form.notasRevision.length}/{NOTAS_MAX}</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.revisado} onChange={(e) => cambiar({ revisado: e.target.checked })} className="mt-0.5 w-4 h-4 accent-purple-600" />
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-bold">Revisado y aprobado.</span>{' '}
                  <span className="text-slate-400 dark:text-slate-500">Desmarcado, la página sigue marcada como provisional aquí en el panel.</span>
                </span>
              </label>
            </>
          )}
        </section>
      )}
    </div>
  );
}
