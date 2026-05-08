import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={styles.container}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              ...styles.toast,
              background: toast.type === 'error'   ? '#e03030'
                        : toast.type === 'warning' ? '#e07000'
                        : '#0a0a0a',
            }}
          >
            <span style={styles.icon}>
              {toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : '✓'}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const styles = {
  container: {
    position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
    zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
    alignItems: 'center', pointerEvents: 'none',
  },
  toast: {
    display: 'flex', alignItems: 'center', gap: 10,
    color: '#f5f3ef', fontFamily: 'Space Mono, monospace',
    fontSize: 11, letterSpacing: 1, padding: '12px 22px',
    boxShadow: '0 4px 16px rgba(0,0,0,.25)', whiteSpace: 'nowrap',
    maxWidth: '90vw', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  icon: { fontSize: 12, opacity: .85, flexShrink: 0 },
};
