import React, { useState, useEffect } from 'react';
import HeroSection from '../../components/HeroSection';
import FeaturedCategories from '../../components/FeaturedCategories';
import HowItWorks from '../../components/HowItWorks';
import EventsSection from '../../components/EventsSection';
import Testimonials from '../../components/Testimonials';
import Shipping from '../../components/Shipping';
import FAQ from '../../components/FAQ';
import ClientHomePage from './ClientHomePage';
import { esCliente } from '../../utils/auth';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('usuario') || localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  const isClient = esCliente(user);

  if (isClient) {
    return <ClientHomePage user={user} />;
  }

  return (
    <main>
      <HeroSection />
      <FeaturedCategories />
      <HowItWorks />
      <EventsSection />
      <Testimonials />
      <Shipping />
      <FAQ />
    </main>
  );
}
