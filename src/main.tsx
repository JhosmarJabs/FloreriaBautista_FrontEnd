import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * En producción el CSS carga sin bloquear el pintado (ver cssNoBloqueante en
 * vite.config.ts): se espera a que esté aplicado para no montar la app sin
 * estilos. En desarrollo no existe el <link> y se monta de inmediato.
 */
function cssListo(): Promise<void> {
  const link = document.getElementById('app-css') as HTMLLinkElement | null;
  if (!link || link.media === 'all') return Promise.resolve();
  return new Promise(resolve => {
    const listo = () => { link.media = 'all'; resolve(); };
    link.addEventListener('load', listo, { once: true });
    link.addEventListener('error', listo, { once: true });
  });
}

cssListo().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
