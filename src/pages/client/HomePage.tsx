import React, { Suspense, useEffect, useRef, useState } from 'react';
import HeroSection from '../../components/HeroSection';
import { useAuth } from '../../hooks/useAuth';
import { useAlAcercarse } from '../../hooks/useAlAcercarse';

const ClientHomePage = React.lazy(() => import('./ClientHomePage'));

const CARGAS = [
  () => import('../../components/FeaturedCategories'),
  () => import('../../components/HowItWorks'),
  () => import('../../components/EventsSection'),
  () => import('../../components/Testimonials'),
  () => import('../../components/Shipping'),
  () => import('../../components/FAQ'),
];
const SECCIONES = CARGAS.map(c => React.lazy(c));

/** Ejecuta fn en el siguiente hueco ocioso; devuelve la función que lo cancela. */
const enIdle = (fn: () => void, timeout: number, fallbackMs: number): (() => void) => {
  if ('requestIdleCallback' in window) {
    const id = requestIdleCallback(fn, { timeout });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(fn, fallbackMs);
  return () => clearTimeout(id);
};

function BelowFold() {
  // Cuántas secciones van montadas. No se montan durante la carga: el layout de
  // cada una generaba tareas largas (TBT). Arrancan al interactuar o cuando el
  // centinela entra en pantalla; el hero ocupa toda la pantalla, así que el
  // centinela queda justo debajo.
  const [montadas, setMontadas] = useState(0);
  const centinela = useRef<HTMLDivElement>(null);
  const anclaPendiente = useRef<string | null>(null);
  const cerca = useAlAcercarse(centinela);

  useEffect(() => {
    if (cerca) setMontadas(n => Math.max(n, 1));
  }, [cerca]);

  useEffect(() => {
    // Un enlace a una sección (#arreglos) necesita que existan todas ya montadas.
    const alAncla = () => {
      const id = location.hash.slice(1);
      if (!id) return;
      anclaPendiente.current = id;
      setMontadas(SECCIONES.length);
    };
    window.addEventListener('hashchange', alAncla);
    if (location.hash) alAncla();
    // Descarga los chunks en segundo plano para que el montaje sea inmediato.
    const cancelar = enIdle(() => CARGAS.forEach(c => { c().catch(() => {}); }), 8000, 3000);
    return () => { window.removeEventListener('hashchange', alAncla); cancelar(); };
  }, []);

  useEffect(() => {
    if (montadas === 0 || montadas >= SECCIONES.length) return;
    return enIdle(() => setMontadas(n => n + 1), 1000, 50);
  }, [montadas]);

  // Tras montar por un ancla, desplaza hasta la sección cuando ya existe.
  useEffect(() => {
    const id = anclaPendiente.current;
    if (!id) return;
    let intentos = 0;
    const buscar = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++intentos > 40) {
        window.clearInterval(buscar);
        anclaPendiente.current = null;
        el?.scrollIntoView();
      }
    }, 50);
    return () => window.clearInterval(buscar);
  }, [montadas]);

  // El min-h reserva al menos una pantalla mientras las secciones cargan: sin él
  // el footer aparece pegado al hero y salta hacia abajo al montarlas (CLS).
  return (
    <div className="min-h-screen">
      <div ref={centinela} aria-hidden="true" className="h-px" />
      {SECCIONES.slice(0, montadas).map((Seccion, i) => (
        <Suspense key={i} fallback={null}>
          <Seccion />
        </Suspense>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { esCliente } = useAuth();

  if (esCliente) {
    return (
      <Suspense fallback={null}>
        <ClientHomePage />
      </Suspense>
    );
  }

  return (
    <main>
      <HeroSection />
      <BelowFold />
    </main>
  );
}
