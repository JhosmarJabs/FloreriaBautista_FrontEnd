/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  /** URL completa del hub de SignalR en producción (vacía en desarrollo: usa el proxy de Vite). */
  readonly VITE_HUB_URL?: string;
}

// ── Sensores y voz (PWA del cliente: recorrido a la sucursal y búsqueda por voz) ──────────────
// Declaraciones mínimas de lo que `lib.dom` de TypeScript 5.8 no trae.

interface ReconocimientoVozAlternativa {
  readonly transcript: string;
  readonly confidence: number;
}
interface ReconocimientoVozResultado {
  readonly isFinal: boolean;
  readonly length: number;
  [indice: number]: ReconocimientoVozAlternativa;
}
interface ReconocimientoVozEvento extends Event {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [indice: number]: ReconocimientoVozResultado };
}
interface ReconocimientoVozError extends Event {
  readonly error: string;
  readonly message?: string;
}
interface ReconocimientoVoz extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  /** Reconocimiento en el dispositivo (Chrome reciente). */
  processLocally?: boolean;
  onresult: ((e: ReconocimientoVozEvento) => void) | null;
  onerror: ((e: ReconocimientoVozError) => void) | null;
  onend: ((e: Event) => void) | null;
  onstart: ((e: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface ReconocimientoVozConstructor {
  new (): ReconocimientoVoz;
  /** Chrome reciente: ¿hay reconocimiento disponible (en el dispositivo) para estos idiomas? */
  available?: (opciones: { langs: string[]; processLocally?: boolean }) => Promise<string>;
  install?: (opciones: { langs: string[]; processLocally?: boolean }) => Promise<boolean | void>;
}

interface Window {
  SpeechRecognition?: ReconocimientoVozConstructor;
  webkitSpeechRecognition?: ReconocimientoVozConstructor;
}

interface DeviceOrientationEvent {
  /** Safari iOS: rumbo respecto al norte magnético. */
  readonly webkitCompassHeading?: number;
}
