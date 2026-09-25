import React from 'react';
import categoriesData from '../data/categories.json';

export default function FeaturedCategories() {
  return (
    <section className="py-20 bg-white" id="arreglos">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-[fadeSlideUp_0.5s_ease-out_both]">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Categorías destacadas</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Encuentra el detalle ideal para cada ocasión.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 animate-[fadeIn_0.6s_ease-out_both]">
          {categoriesData.map((category) => (
            <div key={category.id} className="bg-brand-light rounded-custom overflow-hidden shadow-sm hover:shadow-md transition-all group text-center p-4">
              <img alt={category.title} className="w-full h-48 object-cover rounded-custom mb-4" loading="lazy" decoding="async" width={400} height={192} src={category.image} />
              <h3 className="font-bold mb-2">{category.title}</h3>
              <p className="text-xs text-gray-600 mb-4">{category.description}</p>
              <a className="inline-block bg-brand-deep text-white px-4 py-2 rounded-custom text-sm font-semibold" href={category.link}>Ver arreglos</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
