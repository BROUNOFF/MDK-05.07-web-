import { createContext, useCallback, useContext, useState } from 'react';
import { Check, X } from 'lucide-react';

// Короткие всплывающие уведомления в правом нижнем углу
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((text, type = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, text, type }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg ${
              t.type === 'error' ? 'bg-white text-black border border-black' : 'bg-black text-white'
            }`}
          >
            {t.type === 'error' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
