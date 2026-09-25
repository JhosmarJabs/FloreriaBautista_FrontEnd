import React, { Suspense, useEffect, useState } from 'react';
import HeroSection from '../../components/HeroSection';
import { useAuth } from '../../hooks/useAuth';

const ClientHomePage = React.lazy(() => import('./ClientHomePage'));
const FeaturedCategories = React.lazy(() => import('../../components/FeaturedCategories'));
const HowItWorks = React.lazy(() => import('../../components/HowItWorks'));
const EventsSection = React.lazy(() => import('../../components/EventsSection'));
const Testimonials = React.lazy(() => import('../../components/Testimonials'));
const Shipping = React.lazy(() => import('../../components/Shipping'));
const FAQ = React.lazy(() => import('../../components/FAQ'));

const SECCIONES = [FeaturedCategories, HowItWorks, EventsSection, Testimonials, Shipping, FAQ];

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
  // Cuántas secciones van montadas. Se montan de una en una, cada una en su
  // propio hueco ocioso: montar las seis juntas generaba tareas largas de
  // 300-500 ms en móvil (TBT y forced reflow en Lighthouse).
  const [montadas, setMontadas] = useState(0);

  useEffect(() => {
    let fired = false;
    const trigger = () => {
      if (fired) return;
      fired = true;
      setMontadas(1);
      window.removeEventListener('scroll', trigger);
    };
    window.addEventListener('scroll', trigger, { passive: true, once: true });
    const cancelar = enIdle(trigger, 8000, 4000);
    return () => {
      window.removeEventListener('scroll', trigger);
      cancelar();
    };
  }, []);

  useEffect(() => {
    if (montadas === 0 || montadas >= SECCIONES.length) return;
    return enIdle(() => setMontadas(n => n + 1), 1000, 50);
  }, [montadas]);

  // El min-h reserva al menos una pantalla mientras las secciones cargan: sin él
  // el footer aparece pegado al hero y salta hacia abajo al montarlas (CLS).
  return (
    <div className="min-h-screen">
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
