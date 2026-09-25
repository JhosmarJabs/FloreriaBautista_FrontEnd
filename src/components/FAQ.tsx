import React from 'react';

export default function FAQ() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-12 animate-[fadeSlideUp_0.5s_ease-out_both]">
          Preguntas Frecuentes
        </h2>
        <div className="space-y-4 animate-[fadeIn_0.5s_ease-out_0.2s_both]">
          <details className="group bg-brand-light p-6 rounded-custom cursor-pointer">
            <summary className="flex justify-between items-center font-bold text-brand-deep list-none">
              ¿Con cuánta anticipación debo hacer mi pedido?
              <span className="group-open:rotate-180 transition-transform">↓</span>
            </summary>
            <p className="mt-4 text-gray-600">Recomendamos realizar pedidos de arreglos comunes con al menos 24 horas de anticipación. Para eventos grandes como bodas, sugerimos contactarnos con 1 mes de antelación.</p>
          </details>
          <details className="group bg-brand-light p-6 rounded-custom cursor-pointer">
            <summary className="flex justify-between items-center font-bold text-brand-deep list-none">
              ¿Qué métodos de pago aceptan?
              <span className="group-open:rotate-180 transition-transform">↓</span>
            </summary>
            <p className="mt-4 text-gray-600">Aceptamos efectivo directamente en tienda, transferencias bancarias y depósitos en OXXO. Para pedidos por WhatsApp, te proporcionaremos los datos de pago al momento.</p>
          </details>
          <details className="group bg-brand-light p-6 rounded-custom cursor-pointer">
            <summary className="flex justify-between items-center font-bold text-brand-deep list-none">
              ¿Puedo personalizar mi arreglo?
              <span className="group-open:rotate-180 transition-transform">↓</span>
            </summary>
            <p className="mt-4 text-gray-600">¡Por supuesto! Puedes elegir el tipo de flores, colores y el tipo de base o envoltorio. Solo menciónalo al realizar tu pedido por WhatsApp.</p>
          </details>
        </div>
      </div>
    </section>
  );
}
