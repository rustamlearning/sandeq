'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, backHref, actions }: PageHeaderProps) {
  const router = useRouter()
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/78 text-slate-950 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
        {backHref && (
          <button
            onClick={() => router.push(backHref)}
            aria-label="Kembali"
            className="w-9 h-9 bg-slate-100/80 hover:bg-white rounded-md flex items-center justify-center transition flex-shrink-0 text-slate-700 shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-lg leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-slate-500 text-xs truncate">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  )
}
