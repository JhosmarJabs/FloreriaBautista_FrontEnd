import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

const CLAVE_DESCARTE = 'pwa-instalar-descartado';
const DIAS_SIN_MOSTRAR = 14;

/** Evento de Chrome/Edge/Android; no está en los tipos del DOM. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function yaInstalada(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

function descartadoHacePoco(): boolean {
  try {
    const cuando = Number(localStorage.getItem(CLAVE_DESCARTE));
    return !!cuando && Date.now() - cuando < DIAS_SIN_MOSTRAR * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/** Safari en iPhone/iPad: no dispara `beforeinstallprompt`, la instalación es manual. */
function esSafariIos(): boolean {
  const ua = navigator.userAgent;
  const esIos = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return esIos && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

/** Tarjeta para instalar la tienda como app. Se oculta 14 días si se descarta. */
export default function InstallPrompt() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const ios = esSafariIos();

  useEffect(() => {
    if (yaInstalada() || descartadoHacePoco()) return;

    if (ios) {
      setVisible(true);
      return;
    }

    const alPoderInstalar = (e: Event) => {
      e.preventDefault(); // evita la mini-barra del navegador; se ofrece desde la tarjeta
      setEvento(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const alInstalar = () => setVisible(false);

    window.addEventListener('beforeinstallprompt', alPoderInstalar);
    window.addEventListener('appinstalled', alInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', alPoderInstalar);
      window.removeEventListener('appinstalled', alInstalar);
    };
  }, [ios]);

  if (!visible) return null;

  const descartar = () => {
    try {
      localStorage.setItem(CLAVE_DESCARTE, String(Date.now()));
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  const instalar = async () => {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    setEvento(null); // el evento solo sirve una vez
    if (outcome === 'accepted') setVisible(false);
    else descartar();
  };

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-6 sm:bottom-6 z-[90] sm:max-w-sm animate-[toastIn_0.3s_ease-out_both]">
      <div className="flex items-start gap-3 p-4 rounded-2xl shadow-2xl bg-white border border-slate-200">
        <img src="/pwa-192x192.png" alt="" className="w-10 h-10 shrink-0 object-contain" />
        <div className="flex-grow">
          <p className="text-sm font-bold text-brand-deep">Instala Florería Bautista</p>
          {ios ? (
            <p className="text-xs text-slate-600 mt-1">
              Toca <Share className="inline w-3.5 h-3.5 -mt-0.5" aria-label="Compartir" /> <strong>Compartir</strong> y
              luego <strong>Agregar a inicio</strong>.
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-600 mt-1">Ábrela desde tu pantalla de inicio, como una app.</p>
              <button
                onClick={instalar}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-deep text-white text-xs font-bold rounded-lg hover:bg-brand-deep/90 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar
              </button>
            </>
          )}
        </div>
        <button
          onClick={descartar}
          aria-label="Ahora no"
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
