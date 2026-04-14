import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Truck, Gift, CheckCircle, Info, ChevronRight, Inbox, Trash2, CheckCircle2 } from 'lucide-react';
import { FadeIn, StaggerContainer, GlassCard, AnimatedButton } from '../../components/Animations';

const initialNotifications = [
  {
    id: 1,
    title: '¡Tu pedido está en camino!',
    message: 'El repartidor ha salido con tu ramo "Amanecer Primaveral". Prepárate para recibirlo.',
    time: '10:30 AM',
    type: 'delivery',
    unread: true,
    group: 'Hoy'
  },
  {
    id: 2,
    title: '20% de Descuento en Tulipanes',
    message: 'Solo por hoy, usa el código TULI20 y sorprende a esa persona especial.',
    time: '08:15 AM',
    type: 'promo',
    unread: true,
    group: 'Hoy'
  },
  {
    id: 3,
    title: 'Pedido entregado exitosamente',
    message: 'El ramo para la Sra. Elena fue entregado en la dirección proporcionada.',
    time: 'Ayer, 04:45 PM',
    type: 'success',
    unread: false,
    group: 'Anterior'
  },
  {
    id: 4,
    title: 'Nueva política de entregas',
    message: 'Hemos ampliado nuestra zona de cobertura en la zona norte de la ciudad.',
    time: 'Lunes, 12:00 PM',
    type: 'info',
    unread: false,
    group: 'Anterior'
  }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const filteredNotifications = onlyUnread 
    ? notifications.filter(n => n.unread) 
    : notifications;

  const groups = Array.from(new Set(filteredNotifications.map(n => n.group)));

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="bg-[#f8fafc] dark:bg-slate-900 min-h-screen pt-28 pb-20 transition-colors">
      <main className="max-w-3xl mx-auto px-6">
        {/* Header Section */}
        <FadeIn>
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#1a3b5b] dark:bg-blue-600 text-[#facc15] dark:text-blue-100 rounded-xl shadow-lg shadow-[#1a3b5b]/20 dark:shadow-blue-900/40">
                  <Bell className="w-6 h-6" />
                </div>
                <h1 className="text-4xl font-black text-[#1a3b5b] dark:text-white tracking-tight">Notificaciones</h1>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Gestiona tus avisos, pedidos y promociones exclusivas.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={markAllAsRead}
                className="text-xs font-black uppercase tracking-widest text-[#1a3b5b] dark:text-blue-400 hover:underline flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Marcar todo como leído
              </button>
              
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
              
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">No leídas</span>
                <button 
                  onClick={() => setOnlyUnread(!onlyUnread)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${onlyUnread ? 'bg-[#1a3b5b] dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <motion.div 
                    animate={{ x: onlyUnread ? 26 : 2 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-white dark:bg-slate-200 rounded-full shadow-sm"
                  />
                </button>
              </div>
            </div>
          </header>
        </FadeIn>

        {/* Notification Feed */}
        <div className="space-y-12">
          {filteredNotifications.length > 0 ? (
            groups.map(group => (
              <section key={group}>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full ${
                    group === 'Hoy' ? 'text-[#1a3b5b] dark:text-blue-100 bg-[#facc15] dark:bg-blue-600' : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {group}
                  </h2>
                  <div className="flex-grow h-px bg-slate-100 dark:bg-slate-800"></div>
                </div>
                
                <StaggerContainer className="space-y-4">
                  {filteredNotifications.filter(n => n.group === group).map(notification => (
                    <GlassCard 
                      key={notification.id}
                      className={`p-6 group relative overflow-hidden transition-all duration-300 ${
                        !notification.unread ? 'opacity-70 dark:opacity-50 grayscale-[0.3]' : 'shadow-xl shadow-[#1a3b5b]/5 dark:shadow-blue-900/10'
                      } ${notification.unread ? 'bg-white/80 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700' : 'bg-white/40 dark:bg-slate-900/40 border-slate-50 dark:border-slate-800'}`}
                    >
                      {notification.unread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#facc15] dark:bg-blue-500"></div>
                      )}
                      
                      <div className="flex gap-6">
                        <div className={`flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110 ${
                          notification.type === 'delivery' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          notification.type === 'promo' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                          notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                          'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                        }`}>
                          {notification.type === 'delivery' && <Truck className="h-7 w-7" />}
                          {notification.type === 'promo' && <Gift className="h-7 w-7" />}
                          {notification.type === 'success' && <CheckCircle className="h-7 w-7" />}
                          {notification.type === 'info' && <Info className="h-7 w-7" />}
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight group-hover:text-[#1a3b5b] dark:group-hover:text-blue-400 transition-colors">
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                {notification.time}
                              </span>
                              <button 
                                onClick={() => deleteNotification(notification.id)}
                                className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">
                            {notification.message}
                          </p>
                          
                          <AnimatedButton className="text-[#1a3b5b] dark:text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:underline">
                            Ver detalle 
                            <ChevronRight className="h-3 w-3" />
                          </AnimatedButton>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </StaggerContainer>
              </section>
            ))
          ) : (
            <FadeIn>
              <div className="flex flex-col items-center justify-center py-32 text-center bg-white dark:bg-slate-800/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6">
                  <Inbox className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Bandeja vacía</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-medium">
                  Te avisaremos cuando haya actualizaciones sobre tus pedidos o nuevas promociones.
                </p>
                <AnimatedButton 
                  onClick={() => setOnlyUnread(false)}
                  className="mt-8 px-8 py-3 bg-[#1a3b5b] dark:bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#1a3b5b]/20 dark:shadow-blue-900/40"
                >
                  Ver todas las notificaciones
                </AnimatedButton>
              </div>
            </FadeIn>
          )}
        </div>
      </main>
    </div>
  );
}
