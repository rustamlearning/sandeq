'use client'
import { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '!',
}

const styles: Record<ToastType, string> = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-amber-500 text-white',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 20)
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 350)
    }, toast.duration ?? 3500)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium max-w-sm pointer-events-auto transition-all duration-300',
        styles[toast.type],
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
      ].join(' ')}
    >
      <span className="w-5 h-5 bg-white/25 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
        {icons[toast.type]}
      </span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 350) }}
        aria-label="Tutup notifikasi"
        className="opacity-70 hover:opacity-100 transition text-lg leading-none flex-shrink-0"
      >
        ×
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration }])
  }, [])

  const value: ToastContextValue = {
    toast: addToast,
    success: (m) => addToast(m, 'success'),
    error: (m) => addToast(m, 'error'),
    info: (m) => addToast(m, 'info'),
    warning: (m) => addToast(m, 'warning'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-20 left-0 right-0 flex flex-col items-center gap-2 z-[200] pointer-events-none px-4">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
