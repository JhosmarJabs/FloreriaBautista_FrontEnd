import React from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';

interface Props {
  /** Al cambiar (p. ej. la ruta) se descarta el error y se vuelve a intentar. */
  resetKey: string;
  children: React.ReactNode;
}

interface State {
  fallo: boolean;
}

/**
 * Evita la pantalla en blanco cuando una página no puede cargarse: sin red (una
 * página que no se había visitado no está guardada) o tras un despliegue (el
 * chunk que pide el HTML abierto ya no existe; PwaUpdatePrompt ofrece actualizar).
 */
export default class RutaErrorBoundary extends React.Component<Props, State> {
  // El proyecto no instala @types/react: se declaran a mano los miembros heredados.
  declare props: Props;
  declare setState: (estado: State) => void;
  state: State = { fallo: false };

  static getDerivedStateFromError(): State {
    return { fallo: true };
  }

  componentDidUpdate(anterior: Props) {
    if (this.state.fallo && anterior.resetKey !== this.props.resetKey) {
      this.setState({ fallo: false });
    }
  }

  render() {
    if (!this.state.fallo) return this.props.children;

    const sinRed = !navigator.onLine;
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-32">
        {sinRed ? (
          <WifiOff className="w-16 h-16 text-slate-300 dark:text-slate-500 mb-4" />
        ) : (
          <RefreshCw className="w-16 h-16 text-slate-300 dark:text-slate-500 mb-4" />
        )}
        <h2 className="text-2xl font-bold text-brand-deep dark:text-white mb-2">
          {sinRed ? 'Esta página necesita Internet' : 'No se pudo cargar la página'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
          {sinRed
            ? 'Sin conexión solo puedes ver las páginas que ya habías visitado.'
            : 'Puede haber una versión nueva de la tienda. Vuelve a cargar para continuar.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-brand-deep text-white font-bold rounded-xl hover:bg-brand-deep/90 transition-colors"
        >
          {sinRed ? 'Reintentar' : 'Volver a cargar'}
        </button>
      </div>
    );
  }
}
