import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-[toastIn_0.3s_ease-out_both]"
          >
            <div className={`
              flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border
              ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/50 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-500/90 border-red-400/50 text-white' : ''}
              ${toast.type === 'info' ? 'bg-[#1A3B5B]/90 border-white/20 text-white' : ''}
            `}>
              <div className="flex-shrink-0">
                {toast.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                {toast.type === 'error' && <AlertCircle className="w-6 h-6" />}
                {toast.type === 'info' && <Info className="w-6 h-6" />}
              </div>
              <p className="font-bold text-sm">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
