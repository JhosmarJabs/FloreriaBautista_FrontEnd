import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { TARIFAS_ENVIO } from '../utils/envio';

const precio = (n: number) => (n === 0 ? 'Gratis' : `$${n} MXN`);

// Las tarifas salen de utils/envio.ts: si cambian allá, esta sección no queda desactualizada.
const ZONAS = [
  { zona: 'San Felipe Orizatlán', costo: TARIFAS_ENVIO.local },
  { zona: 'Resto de Hidalgo', costo: TARIFAS_ENVIO.estatal },
  { zona: 'Estados colindantes', costo: TARIFAS_ENVIO.vecino },
  { zona: 'Resto del país', costo: TARIFAS_ENVIO.nacional },
];

export default function Shipping() {
  return (
    <section className="py-20 bg-brand-light" id="envios">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto bg-white p-10 rounded-custom shadow-sm border border-brand-accent animate-[fadeSlideUp_0.6s_ease-out_both]">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-brand-accent text-brand-deep rounded-full flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold">Envíos a Domicilio</h2>
          </div>
          <p className="text-lg text-gray-700 mb-8">
            Llevamos tus flores a domicilio con servicio puntual y cuidadoso. El costo depende del código postal de entrega.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ZONAS.map((z) => (
              <div key={z.zona} className="bg-brand-light p-4 rounded-custom border border-brand-accent">
                <h3 className="font-bold text-brand-deep text-base">{z.zona}</h3>
                <p className="text-sm">{precio(z.costo)}</p>
              </div>
            ))}
          </div>
          <p className="mt-8">
            <Link to="/envios-y-entregas" className="text-brand-deep font-semibold hover:underline">
              Consulta la política de envíos
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
