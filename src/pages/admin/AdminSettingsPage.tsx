import React, { useState, useEffect } from 'react';
import {
  Settings,
  Monitor,
  Bell,
  Shield,
  CreditCard,
  Mail,
  ChevronRight,
  Save,
  RefreshCw,
  Moon,
  Sun
} from 'lucide-react';
import { DataService } from '../../services/dataService';

const inputClass =
  'w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-400/50 focus:border-blue-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all';

const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5';

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings]           = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [isDarkMode, setIsDarkMode]       = useState(false);

  useEffect(() => {
    const data = DataService.getSettings();
    setSettings(data);
    
    // Check dark mode state from document
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    setLoading(false);
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const updateSystem      = (f: string, v: string)  => setSettings((s: any) => ({ ...s, system:        { ...s.system,        [f]: v } }));
  const updateNotification= (f: string, v: boolean) => setSettings((s: any) => ({ ...s, notifications: { ...s.notifications, [f]: v } }));

  const sections = [
    { id: 'general',       label: 'Sistema & Apariencia', icon: Monitor       },
    { id: 'notifications', label: 'Notificaciones',       icon: Bell        },
    { id: 'security',      label: 'Seguridad',            icon: Shield      },
    { id: 'payments',      label: 'Pagos',                icon: CreditCard  },
    { id: 'emails',        label: 'Emails Operativos',    icon: Mail        },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Configuración del Sistema</h1>
          </div>
          <p className="text-sm text-slate-400 ml-12">Moneda, correos automáticos, notificaciones operativas y apariencia</p>
        </div>
      </div>

      {/* ── Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-2 space-y-0.5">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  id === activeSection
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-opacity ${id === activeSection ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-5">

          {/* ── Sistema & Apariencia ── */}
          {activeSection === 'general' && (
            <div className="space-y-5">
              
              {/* Apariencia */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Apariencia del Panel</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center shrink-0">
                        {isDarkMode ? <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> : <Sun className="w-5 h-5 text-indigo-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Modo Oscuro</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Cambia la apariencia del panel de administración a colores oscuros.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={isDarkMode}
                        onChange={e => toggleDarkMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Sistema */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Parámetros del Sistema</h3>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Moneda principal</label>
                      <div className="relative">
                        <select value={settings.system?.currency ?? 'MXN'} onChange={e => updateSystem('currency', e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-9`}>
                          <option value="MXN">Peso Mexicano (MXN)</option>
                          <option value="USD">Dólar Americano (USD)</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Límite de Días para pago (Pendiente)</label>
                      <input type="number" min="1" max="30" value={settings.system?.autoCancelDays ?? 3} onChange={e => updateSystem('autoCancelDays', e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── Notifications ── */}
          {activeSection === 'notifications' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Reglas Operativas - Notificar al sistema</h3>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {[
                  { id: 'orderConfirmation', label: 'Nuevo pedido recibido',  desc: 'Notificar a los administradores al recibir un pedido de clientes' },
                  { id: 'lowStockAlerts',    label: 'Alertas de stock bajo',   desc: 'Notificar automáticamente cuando un producto llegue al mínimo'      },
                  { id: 'weeklyReports',     label: 'Reportes semanales',      desc: 'Generar resumen automático de ventas en Dashboard'                },
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={settings.notifications?.[item.id] ?? false}
                        onChange={e => updateNotification(item.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4 after:shadow-sm" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {activeSection === 'security' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Seguridad de la cuenta</h3>
              </div>
              <div className="p-6 space-y-5">
                {[
                  { label: 'Contraseña actual',          ph: '••••••••' },
                  { label: 'Nueva contraseña',           ph: '••••••••' },
                  { label: 'Confirmar nueva contraseña', ph: '••••••••' },
                ].map(({ label, ph }) => (
                  <div key={label}>
                    <label className={labelClass}>{label}</label>
                    <input type="password" placeholder={ph} className={inputClass} />
                  </div>
                ))}
                <button className="px-4 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 active:scale-[.98] text-white rounded-xl text-sm font-bold transition-all mt-2">
                  Actualizar contraseña
                </button>

                <div className="pt-5 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Autenticación de dos factores (2FA)</h4>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">App de autenticación</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Usa Google Authenticator u otra app compatible</p>
                    </div>
                    <button className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                      Configurar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Payments ── */}
          {activeSection === 'payments' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Integración de Pasarelas de pago</h3>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { name: 'Stripe',                abbr: 'STR',  desc: 'Tarjetas de crédito y débito',  bg: 'bg-blue-600',    connected: true  },
                  { name: 'PayPal',                abbr: 'PPL',  desc: 'Pagos internacionales',          bg: 'bg-[#00457C]',   connected: false },
                  { name: 'Transferencia bancaria', abbr: 'SPEI', desc: 'Pagos locales en México',       bg: 'bg-emerald-600', connected: true  },
                ].map(({ name, abbr, desc, bg, connected }) => (
                  <div key={name} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-8 ${bg} rounded-lg flex items-center justify-center text-white text-[10px] font-black`}>
                        {abbr}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{desc}</p>
                      </div>
                    </div>
                    {connected
                      ? <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg">Conectado</span>
                      : <button className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all">Conectar</button>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Emails ── */}
          {activeSection === 'emails' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Plantillas de Email Transaccionales</h3>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { id: 'order_confirmation', name: 'Confirmación de pedido al Cliente', subject: '¡Gracias por tu compra en Florería Bautista!'   },
                  { id: 'order_shipped',      name: 'Pedido enviado',         subject: 'Tu pedido #{order_id} está en camino'       },
                  { id: 'order_delivered',    name: 'Pedido entregado',       subject: 'Tu pedido ha sido entregado'                },
                  { id: 'admin_alert',        name: 'Alerta a Sistema',             subject: '¡Nuevo pedido recibido de {amount} MXN!'                },
                ].map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-slate-800 transition-all cursor-pointer group">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{t.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Asunto: {t.subject}</p>
                    </div>
                    <button className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shrink-0 ml-4">
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}