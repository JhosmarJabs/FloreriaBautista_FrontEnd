import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, Heart, MapPin, Phone, Leaf, Award, Wrench } from 'lucide-react';
import { motion } from 'motion/react';

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-32 space-y-16 min-h-screen">
      {/* 1. Hero Section */}
      <section className="flex flex-col md:flex-row items-center gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 space-y-6"
        >
          <h1 className="font-serif font-bold leading-tight text-brand-deep text-4xl md:text-5xl">
            Sobre <span className="text-[#D4AF37] italic">nosotros</span>
          </h1>
          <p className="text-slate-600 max-w-lg leading-relaxed text-lg">
            Creamos momentos inolvidables a través de la elegancia y frescura de nuestras flores en Huitzitzilingo. Una tradición que florece con cada detalle.
          </p>
          <div className="pt-4">
            <Link to="/catalogo" className="inline-flex bg-brand-deep text-white px-8 py-4 rounded-xl font-bold items-center gap-2 hover:bg-opacity-90 transition-colors">
              Explorar Catálogos
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 w-full"
        >
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
            <img 
              className="w-full h-full object-cover" 
              alt="Elegantes arreglos florales en un entorno minimalista" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMHl0AAGUYdkAPH26cZ6yHaPKgfDneNmbgv1E0nbC-CgTEkDxAgxvguLd15BK4CgzsxG5T3PzW5OLrfkEp8PTglCnfu7gn6cedyic3J4lvfQIjUkYroe_pvm7WH1lh9EyDRzmTbMyUdWirAODPA1MqWzKQIbrFEdmOq1HkS6bPMIfqlBMWHj4h3_jn9jlAIkRBw1OWOVhpaNOZ9SIb3wgIiW-SXWkqfMB-ZG1URyeJLe1DSrxaH9CXgoVOyeB6cTnr-TepGIRrJ_gZ"
            />
          </div>
        </motion.div>
      </section>

      {/* 2. Historia Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center space-y-6"
      >
        <h2 className="text-3xl font-serif font-bold text-brand-deep">Nuestra historia</h2>
        <div className="text-slate-600 leading-relaxed text-lg space-y-4">
          <p>
            Florería Bautista nació como un sueño familiar en el corazón de Huitzitzilingo. Lo que comenzó como un pequeño jardín de pasión por la botánica local, se ha transformado en un referente de elegancia floral en nuestra región.
          </p>
          <p>
            Con décadas de dedicación, nos hemos especializado en transformar sentimientos en arte floral, manteniendo siempre la calidez de nuestras raíces y la excelencia en cada pétalo. Cada arreglo que sale de nuestro taller lleva consigo la historia de nuestra tierra y el compromiso de nuestra familia.
          </p>
        </div>
        <div className="pt-6">
          <span className="text-[#D4AF37] font-serif italic text-2xl">— Familia Bautista</span>
        </div>
      </motion.section>

      {/* 3. Misión y Valores Section */}
      <section className="bg-slate-50 rounded-[3rem] p-8 md:p-12 border border-slate-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-12"
        >
          <h2 className="text-3xl font-serif font-bold text-brand-deep">Compromiso con la Excelencia</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">Nuestros valores fundamentales definen cada interacción y cada creación que entregamos.</p>
        </motion.div>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12"
        >
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-coral shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-serif text-[#D4AF37]">Calidad</h3>
            <p className="text-slate-600">Seleccionamos las flores más frescas y hermosas para cada diseño, garantizando durabilidad y belleza.</p>
          </motion.div>
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-coral shadow-sm">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-serif text-[#D4AF37]">Puntualidad</h3>
            <p className="text-slate-600">Entregas precisas para que tus sorpresas lleguen siempre en el momento perfecto, sin excepciones.</p>
          </motion.div>
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-coral shadow-sm">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-serif text-[#D4AF37]">Atención Personalizada</h3>
            <p className="text-slate-600">Asesoría única para crear el arreglo que exactamente imaginas, adaptándonos a cada ocasión.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* 4. Qué hacemos Section */}
      <section className="space-y-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-serif font-bold text-brand-deep">Nuestros Servicios</h2>
        </motion.div>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <motion.div variants={itemVariants} className="group relative aspect-square rounded-3xl overflow-hidden">
            <img 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              alt="Decoración floral para eventos especiales" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWACwMMxdCJvSkZ_NU_5x2bh7b5-OhNWYbjLyWTCdqLia_PeZALdvN6m6_pb3lxHcw8ndVcCqklfOhJNpSmC9RVKZH-T4jql-8bMvGZ8XCIgMVritGjZwE189_LEOJ9J3NExnEKWF2jqAb6RdO4ZXzI4ez7VuHw8HJMnJT1H02BZp9iogn7PwVDyY4iHqqvKeqGjlQ6VnJVqS2MT8ONw8pI_u3hcW7RUUFNURiMzpJwA1mGRAFAY_qioJSGLGyzxURYqhnBz0C9SJR"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/20 to-transparent flex flex-col justify-end p-8 text-white">
              <h4 className="text-xl font-bold font-serif mb-2">Eventos Especiales</h4>
              <p className="text-sm text-slate-200">Bodas, XV años y celebraciones únicas.</p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="group relative aspect-square rounded-3xl overflow-hidden">
            <img 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              alt="Arreglos florales funerarios respetuosos" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDs7swqFI17XHogEwFaKvoabu67rRm3ZuGqmq-AtZXZnDd5MvZqmOhaAVEWcrSwRrJtfWUwY6qoSJRjA7G2EzSGrQ19n72AfOv4tgbrf1nzAUr28QUseLtmABWQ4P8CixsH7M6qQgBG6Ao5aAMcPeb99OBtIl831XrPLxi042w8Gw0LCcwIyc7FlvgP4zFu3_qDJACUQQvO61ZQm1Lti9HjquMGQMKiVbfcV07LYkAKM1BE_tdtooqI2m2ulSpoQiefAy-PSKJ8R2GF"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/20 to-transparent flex flex-col justify-end p-8 text-white">
              <h4 className="text-xl font-bold font-serif mb-2">Servicios Funerarios</h4>
              <p className="text-sm text-slate-200">Acompañamiento con respeto y elegancia.</p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="group relative aspect-square rounded-3xl overflow-hidden">
            <img 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              alt="Decoración floral para interiores y oficinas" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxt7Cfdh_je23fY-NL3U4GYNtbIuHJzjaORfngciCPQT3VczV35TtygFiSMz1Wow61njTn7q0qY7SyJC3yIflpl5IcH0xhifGoYHLQTlDKc-SinbJBfJlX_NyvNU2_AX_QK84xiX2wQqbB3HMBSXps0K6j3mKdiYMHDuk7fmoKuMSj62sqvRDMnMaLt6wTOexadQLGK8RmOWHaJgNvdsRpZ5FaO9bTpMMpBt_bSG0uI_QVX3WlCi247VqPgUkF_5QpW089AAntyLGb"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/20 to-transparent flex flex-col justify-end p-8 text-white">
              <h4 className="text-xl font-bold font-serif mb-2">Decoración</h4>
              <p className="text-sm text-slate-200">Espacios llenos de vida y armonía.</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 5. Equipo Section */}
      <section className="flex flex-col md:flex-row items-center gap-12 py-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex justify-center md:justify-end"
        >
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-[#D4AF37]/20 rounded-full blur-xl"></div>
            <img 
              className="relative w-64 h-64 object-cover rounded-full border-4 border-white shadow-xl" 
              alt="Retrato del propietario de la florería" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIKpsYG-QhurOfhjjr3a5_ft9gAIJO8Ir-9_TeHbDfQQK7TOLPP0QHOrTgBnAYze42IyfWvjpW6oNH2zxpAfIC1k73xeiayI2PN8JC7PfnIE-v25LpWkrVnGcAEH_dgqqCzxwTFemtF76DhXshlQXPCAyGDDnh-IzngG85tKRuGOwQmYUZRtz8D5-GUpBULqZZvLQ-4vbvDO8IRal2DlSeTlnTpfuitnIsOSMfnxsXlf6C4aok2lpdj77OdcoP9FL-B9Z3J-q1Du69"
            />
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 space-y-6 text-center md:text-left"
        >
          <span className="text-brand-coral font-bold tracking-widest uppercase text-xs">El Alma de la Florería</span>
          <h2 className="text-4xl font-serif font-bold text-brand-deep">Quién está detrás</h2>
          <h3 className="text-xl font-serif text-[#D4AF37] italic">Sr. Bautista — Director Creativo</h3>
          <p className="text-slate-600 leading-relaxed text-lg">
            Con más de 25 años de experiencia en el arte floral, el Sr. Bautista ha dedicado su vida a estudiar la flora local de la región. Su visión combina la tradición artesanal con tendencias contemporáneas, asegurando que cada cliente reciba una pieza única.
          </p>
          <div className="flex gap-4 justify-center md:justify-start">
            <Leaf className="w-6 h-6 text-brand-deep" />
            <Award className="w-6 h-6 text-brand-deep" />
            <Wrench className="w-6 h-6 text-brand-deep" />
          </div>
        </motion.div>
      </section>

      {/* 6. Contacto & CTA Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-12 pt-16"
      >
        <div className="space-y-8">
          <h2 className="text-3xl font-serif font-bold text-brand-deep">Datos Prácticos</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <MapPin className="w-6 h-6 text-brand-coral shrink-0 mt-1" />
              <div>
                <p className="font-bold text-brand-deep text-lg">Dirección</p>
                <p className="text-slate-500">Calle Principal #12, Huitzitzilingo, México</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-brand-coral shrink-0 mt-1" />
              <div>
                <p className="font-bold text-brand-deep text-lg">Horario</p>
                <p className="text-slate-500">Lun - Sáb: 9:00 AM - 8:00 PM<br/>Dom: 10:00 AM - 4:00 PM</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="w-6 h-6 text-brand-coral shrink-0 mt-1" />
              <div>
                <p className="font-bold text-brand-deep text-lg">Teléfono</p>
                <p className="text-slate-500">+52 (555) 123-4567</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-brand-deep rounded-3xl p-10 flex flex-col justify-center items-center text-center space-y-6 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full -mr-16 -mt-16"></div>
          <h3 className="text-3xl font-serif font-bold">¿Listo para regalar belleza?</h3>
          <p className="text-slate-300 text-lg">Explora nuestros catálogos curados de temporada y encuentra el detalle perfecto.</p>
          <Link to="/catalogo" className="inline-block bg-[#D4AF37] text-brand-deep px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-lg">
            Ver catálogo completo
          </Link>
        </div>
      </motion.section>
    </main>
  );
}
