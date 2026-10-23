import React, { useState, useEffect } from 'react';
import {
  Settings,
  Monitor,
  CreditCard,
  ChevronRight,
  Save,
  RefreshCw,
  Moon,
  Sun
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading]             = useState(true);
  const [isDarkMode, setIsDarkMode]       = useState(false);

  useEffect(() => {
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

  const sections = [
    { id: 'general',       label: 'Sistema & Apariencia', icon: Monitor       },
    { id: 'payments',      label: 'Pagos',                icon: CreditCard  },
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
          <p className="text-sm text-slate-400 ml-12">Apariencia del panel y pasarelas de pago</p>
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
                  { name: 'Mercado Pago',           abbr: 'MP',   desc: 'Tarjetas, débito y saldo Mercado Pago', bg: 'bg-[#009EE3]',   connected: true  },
                  { name: 'Transferencia bancaria', abbr: 'SPEI', desc: 'Pagos locales en México',       bg: 'bg-emerald-600', connected: true  },
                ].map(({ name, abbr, desc, bg }) => (
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
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg">Conectado</span>
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