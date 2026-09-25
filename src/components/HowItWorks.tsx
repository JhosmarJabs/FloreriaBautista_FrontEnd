import React from 'react';

export default function HowItWorks() {
  return (
    <section className="py-20 bg-brand-accent/30" id="como-funciona">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-[fadeSlideUp_0.6s_ease-out_both]">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Cómo funciona</h2>
          <p className="text-gray-600">Tu pedido listo en 3 sencillos pasos.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center animate-[fadeIn_0.6s_ease-out_0.2s_both]">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-deep text-white rounded-full flex items-center justify-center mb-6 text-2xl font-bold">1</div>
            <h3 className="text-xl font-bold mb-3">Elige tu arreglo</h3>
            <p className="text-gray-600">Selecciona una categoría y un diseño que te encante.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-deep text-white rounded-full flex items-center justify-center mb-6 text-2xl font-bold">2</div>
            <h3 className="text-xl font-bold mb-3">Personaliza y paga</h3>
            <p className="text-gray-600">Agrega una dedicatoria, elige la fecha y realiza el pago en línea de forma segura.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-deep text-white rounded-full flex items-center justify-center mb-6 text-2xl font-bold">3</div>
            <h3 className="text-xl font-bold mb-3">Recibe tu entrega</h3>
            <p className="text-gray-600">Entregamos a domicilio en Huautla y zonas cercanas con el mayor cuidado.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
