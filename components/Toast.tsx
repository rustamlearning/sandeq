'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
}

const STYLES = {
  success: { border: 'border-l-emerald-500', icon: 'text-emerald-500' },
  error:   { border: 'border-l-red-500',     icon: 'text-red-500'     },
  info:    { border: 'border-l-brand',        icon: 'text-brand'       },
  warning: { border: 'border-l-amber-500',   icon: 'text-amber-500'   },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-[92vw] max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.type]
          const s = STYLES[t.type]
          return (
            <div
              key={t.id}
              className={`bg-white border border-gray-100 border-l-4 ${s.border} rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 pointer-events-auto animate-slide-up`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${s.icon}`} />
              <p className="text-sm text-gray-800 font-medium flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-gray-300 hover:text-gray-500 transition flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
