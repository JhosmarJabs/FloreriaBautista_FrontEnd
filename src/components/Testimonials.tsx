import React from 'react';
import testimonialsData from '../data/testimonials.json';

export default function Testimonials() {
  const displayTestimonials = testimonialsData.slice(0, 3);

  return (
    <section className="py-20 bg-white" id="opiniones">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 animate-[fadeSlideUp_0.5s_ease-out_both]">
          Lo que dicen nuestros clientes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-[fadeIn_0.6s_ease-out_0.2s_both]">
          {displayTestimonials.map((testimonial) => (
            <div key={testimonial.id} className="p-8 bg-brand-light rounded-custom border border-transparent hover:border-brand-coral transition-colors">
              <div className="flex text-brand-coral mb-4">
                <span>{'★'.repeat(testimonial.rating)}</span>
              </div>
              <p className="italic text-gray-700 mb-6">"{testimonial.text}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-deep rounded-full flex items-center justify-center text-white font-bold">{testimonial.initials}</div>
                <div>
                  <p className="font-bold">{testimonial.author}</p>
                  <p className="text-xs text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
