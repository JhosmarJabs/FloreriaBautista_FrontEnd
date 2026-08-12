import React, { useState } from 'react';
import { UsersRound, Users } from 'lucide-react';
import AdminCustomerSegmentsPage from './AdminCustomerSegmentsPage';
import AdminUsersPage from './AdminUsersPage';

type Tab = 'segmentos' | 'usuarios';

/**
 * Módulo de personas: agrupa "Clientes Segmentados" y "Usuarios" en una sola
 * pantalla con dos pestañas. Son vistas del mismo dominio (las personas del
 * sistema), por eso comparten módulo pero se mantienen en ventanas separadas.
 * Por defecto abre en Segmentados; la segunda pestaña lista a todos los usuarios.
 */
export default function AdminPeopleModule({ initialTab = 'segmentos' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const tabCls = (active: boolean) =>
    `px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
      active
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
    }`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Selector de pestañas */}
      <div className="inline-flex items-center gap-1 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
        <button onClick={() => setTab('segmentos')} className={tabCls(tab === 'segmentos')}>
          <UsersRound className="w-4 h-4" /> Clientes Segmentados
        </button>
        <button onClick={() => setTab('usuarios')} className={tabCls(tab === 'usuarios')}>
          <Users className="w-4 h-4" /> Usuarios
        </button>
      </div>

      {/* Ventana activa (render condicional simple, sin AnimatePresence) */}
      {tab === 'segmentos' ? <AdminCustomerSegmentsPage /> : <AdminUsersPage />}
    </div>
  );
}
