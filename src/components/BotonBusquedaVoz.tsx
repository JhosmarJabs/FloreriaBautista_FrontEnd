import React, { useEffect } from 'react';
import { Check, Download, Loader2, Lock, Mic, MicOff, Search, ShieldCheck, Volume2, WifiOff, X } from 'lucide-react';
import type { BusquedaVoz, EstadoVoz } from '../hooks/useBusquedaVoz';

const MENSAJES: Partial<Record<EstadoVoz, { texto: string; icono: React.ReactNode }>> = {
  'requiere-internet': {
    texto: 'La búsqueda por voz necesita Internet en este navegador. Escribe lo que buscas.',
    icono: <WifiOff className="w-6 h-6" aria-hidden="true" />,
  },
  denegado: {
    texto: 'Permite el micrófono desde el candado de la barra de direcciones para buscar por voz.',
    icono: <Lock className="w-6 h-6" aria-hidden="true" />,
  },
  'sin-microfono': { texto: 'No encontramos un micrófono.', icono: <MicOff className="w-6 h-6" aria-hidden="true" /> },
  'sin-voz': {
    texto: 'No te escuchamos. Toca el micrófono e inténtalo de nuevo.',
    icono: <Volume2 className="w-6 h-6" aria-hidden="true" />,
  },
  'error-red': {
    texto: 'Se perdió la conexión. Escribe lo que buscas.',
    icono: <WifiOff className="w-6 h-6" aria-hidden="true" />,
  },
  error: {
    texto: 'No pudimos usar el micrófono. Escribe lo que buscas.',
    icono: <MicOff className="w-6 h-6" aria-hidden="true" />,
  },
};

/** Micrófono dentro de la caja de búsqueda pública del catálogo. No se renderiza sin reconocimiento de voz. */
export default function BotonBusquedaVoz({ voz }: { voz: BusquedaVoz }) {
  const escuchando = voz.estado === 'escuchando';

  // Escape detiene la escucha.
  useEffect(() => {
    if (!escuchando) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') voz.detener();
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [escuchando, voz]);

  if (!voz.soportada) return null;

  return (
    <button
      type="button"
      onClick={() => (escuchando ? voz.detener() : voz.iniciar())}
      aria-label="Buscar por voz"
      aria-pressed={escuchando}
      className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1A3B5B] ${
        escuchando ? 'bg-[#D4AF37] text-[#1A3B5B]' : 'bg-[#1A3B5B]/5 text-[#1A3B5B] hover:bg-[#1A3B5B]/10'
      }`}
    >
      {escuchando ? <Mic className="w-5 h-5 motion-safe:animate-pulse" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
    </button>
  );
}

interface PanelProps {
  voz: BusquedaVoz;
  abierto: boolean;
  online: boolean;
  /** Texto de la búsqueda vigente y cuántos productos coinciden (para anunciar el resultado). */
  textoBusqueda: string;
  totalResultados: number;
  onCerrar: () => void;
  /** «Escribir mi búsqueda»: cierra el panel y lleva el foco a la caja. */
  onEscribir: () => void;
}

/** Panel de dictado bajo la caja: escuchando, resultado y mensajes de error. */
export function PanelBusquedaVoz({ voz, abierto, online, textoBusqueda, totalResultados, onCerrar, onEscribir }: PanelProps) {
  const { estado } = voz;
  if (!abierto || estado === 'reposo') return null;

  const resultado =
    totalResultados > 0
      ? `${totalResultados} resultado${totalResultados === 1 ? '' : 's'} para «${textoBusqueda}»`
      : `Sin resultados para «${textoBusqueda}»`;
  const mensaje = MENSAJES[estado];
  const cerrar = (
    <button
      type="button"
      onClick={onCerrar}
      aria-label="Cerrar"
      className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 grid place-items-center shrink-0 hover:bg-slate-200"
    >
      <X className="w-5 h-5" aria-hidden="true" />
    </button>
  );

  let cuerpo: React.ReactNode = null;
  if (estado === 'escuchando') {
    cuerpo = (
      <>
        <div className="flex items-center justify-between gap-2.5">
          <h2 id="estado-voz" className="text-[17px] font-black text-[#1A3B5B]">Escuchando… di lo que buscas</h2>
          <button
            type="button"
            onClick={voz.detener}
            aria-label="Detener búsqueda por voz"
            className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 grid place-items-center shrink-0 hover:bg-slate-200"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex gap-1.5 items-center justify-center h-[58px] my-2" aria-hidden="true">
          {[18, 38, 54, 34, 22].map((alto, i) => (
            <i
              key={i}
              className={`w-2 rounded-full motion-safe:animate-pulse ${i % 2 === 0 ? 'bg-[#D4AF37]' : 'bg-[#1A3B5B]'}`}
              style={{ height: alto, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <p
          id="transcripcion"
          className={`min-h-9 mb-1.5 text-center font-extrabold break-words ${voz.parcial ? 'text-2xl text-[#1A3B5B]' : 'text-[15px] text-slate-500 font-semibold'}`}
        >
          {voz.parcial || 'Por ejemplo: «rosas rojas»'}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={voz.detener}
            className="flex-1 basis-40 min-h-11 rounded-xl border-2 border-slate-200 bg-white text-[#1A3B5B] font-extrabold text-sm hover:bg-slate-50"
          >
            Detener (Esc)
          </button>
        </div>
      </>
    );
  } else if (estado === 'procesando') {
    cuerpo = (
      <h2 className="text-[17px] font-black text-[#1A3B5B] flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Buscando «{voz.texto}»…
      </h2>
    );
  } else if (estado === 'ok') {
    cuerpo = (
      <div className="flex items-center justify-between gap-2.5">
        <h2 className="text-[17px] font-black text-[#1A3B5B] flex items-center gap-2 min-w-0 break-words">
          <Check className="w-5 h-5 shrink-0" aria-hidden="true" /> <span className="min-w-0">{resultado}</span>
        </h2>
        {cerrar}
      </div>
    );
  } else if (mensaje) {
    cuerpo = (
      <>
        <div className="flex items-center justify-between gap-2.5">
          <h2 className="text-[17px] font-black text-[#1A3B5B]">Búsqueda por voz</h2>
          {cerrar}
        </div>
        <div className="flex gap-3 items-start mt-2" role="alert">
          <div className="w-[46px] h-[46px] rounded-full bg-amber-50 text-amber-700 border border-amber-200 grid place-items-center shrink-0">
            {mensaje.icono}
          </div>
          <p className="font-bold text-slate-800 leading-snug">{mensaje.texto}</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={onEscribir}
            className="flex-1 basis-40 min-h-11 rounded-xl bg-[#1A3B5B] text-white font-extrabold text-sm inline-flex items-center justify-center gap-1.5 hover:bg-[#15324c]"
          >
            <Search className="w-4 h-4" aria-hidden="true" /> Escribir mi búsqueda
          </button>
          {estado === 'sin-voz' && (
            <button
              type="button"
              onClick={voz.iniciar}
              className="flex-1 basis-40 min-h-11 rounded-xl border-2 border-slate-200 bg-white text-[#1A3B5B] font-extrabold text-sm inline-flex items-center justify-center gap-1.5 hover:bg-slate-50"
            >
              <Mic className="w-4 h-4" aria-hidden="true" /> Intentar de nuevo
            </button>
          )}
        </div>
      </>
    );
  }

  const mostrarAviso = estado !== 'requiere-internet';
  const mostrarInstalar = voz.instalable && online;
  return (
    <div
      id="panel-voz"
      role="dialog"
      aria-label="Búsqueda por voz"
      className="mt-3 w-full rounded-3xl bg-white text-slate-800 p-4 border border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.35)]"
    >
      {cuerpo}
      {(mostrarAviso || mostrarInstalar) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-0.5">
          {mostrarAviso && (
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-600">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              {voz.modoLocal ? 'Tu voz se procesa en tu teléfono.' : 'Tu voz la procesa el servicio de reconocimiento de tu navegador; no la guardamos.'}
            </p>
          )}
          {mostrarInstalar && !voz.modoLocal && <BotonInstalarVoz voz={voz} oscuro={false} />}
        </div>
      )}
      <div className="sr-only" aria-live="polite" role="status">
        {estado === 'escuchando' ? 'Escuchando… di lo que buscas' : estado === 'ok' ? resultado : mensaje?.texto ?? ''}
      </div>
    </div>
  );
}

function BotonInstalarVoz({ voz, oscuro }: { voz: BusquedaVoz; oscuro: boolean }) {
  if (voz.instalando) {
    return (
      <p className={`flex items-center gap-1.5 text-[13px] font-semibold ${oscuro ? 'text-[#dbe6f1]' : 'text-slate-600'}`}>
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Descargando la voz en español…
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={() => void voz.instalar()}
      className={`min-h-11 inline-flex items-center gap-1.5 self-start text-[13.5px] font-extrabold underline underline-offset-4 ${oscuro ? 'text-white' : 'text-[#1A3B5B]'}`}
    >
      <Download className="w-4 h-4" aria-hidden="true" /> Usar la voz también sin Internet
    </button>
  );
}

/** Pista bajo la caja («di, por ejemplo, rosas rojas»), la nota de privacidad local y la opción sin Internet. */
export function PistaBusquedaVoz({ voz, panelAbierto, online }: { voz: BusquedaVoz; panelAbierto: boolean; online: boolean }) {
  if (!voz.soportada || panelAbierto) return null;
  return (
    <div className="mt-2.5 text-[13.5px] font-semibold text-[#dbe6f1] flex flex-wrap items-center gap-x-3 gap-y-0.5">
      <span className="inline-flex items-center gap-1.5">
        <Mic className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" /> Toca el micrófono y di, por ejemplo, «rosas rojas»
      </span>
      {voz.localDisponible && (
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" /> Tu voz se procesa en tu teléfono.
        </span>
      )}
      {voz.instalable && online && <BotonInstalarVoz voz={voz} oscuro />}
    </div>
  );
}
