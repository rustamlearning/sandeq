'use client'
import { useRouter } from 'next/navigation'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, backHref, actions }: PageHeaderProps) {
  const router = useRouter()
  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
        {backHref && (
          <button
            onClick={() => router.push(backHref)}
            aria-label="Kembali"
            className="w-9 h-9 bg-white/15 hover:bg-white/25 rounded-xl flex items-center justify-center transition flex-shrink-0 focus-visible:ring-2 focus-visible:ring-white"
          >
            ←
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-blue-200 text-xs truncate">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  )
}
