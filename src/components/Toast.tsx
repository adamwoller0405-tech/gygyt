import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (text: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((text: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const remove = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none mx-auto">
        {toasts.map(t => {
          const icon = t.type === 'success' ? <CheckCircle size={18} /> : t.type === 'error' ? <XCircle size={18} /> : <AlertTriangle size={18} />;
          const colors = t.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : t.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
          return (
            <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl bg-bg-panel/90 shadow-2xl animate-slide-in ${colors}`}>
              {icon}
              <span className="text-xs font-bold flex-1">{t.text}</span>
              <button onClick={() => remove(t.id)} className="opacity-50 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
