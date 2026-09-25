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

function BelowFold() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let fired = false;
    const trigger = () => {
      if (fired) return;
      fired = true;
      setVisible(true);
      window.removeEventListener('scroll', trigger);
    };
    window.addEventListener('scroll', trigger, { passive: true, once: true });
    const idle = 'requestIdleCallback' in window
      ? requestIdleCallback(trigger, { timeout: 8000 })
      : setTimeout(trigger, 4000);
    return () => {
      window.removeEventListener('scroll', trigger);
      if ('requestIdleCallback' in window) cancelIdleCallback(idle as number);
      else clearTimeout(idle as number);
    };
  }, []);

  // El min-h reserva al menos una pantalla mientras las secciones cargan: sin él
  // el footer aparece pegado al hero y salta hacia abajo al montarlas (CLS).
  return (
    <div className="min-h-screen">
      {visible && (
        <Suspense fallback={null}>
          <FeaturedCategories />
          <HowItWorks />
          <EventsSection />
          <Testimonials />
          <Shipping />
          <FAQ />
        </Suspense>
      )}
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
