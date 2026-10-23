/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  /** URL completa del hub de SignalR en producción (vacía en desarrollo: usa el proxy de Vite). */
  readonly VITE_HUB_URL?: string;
}
