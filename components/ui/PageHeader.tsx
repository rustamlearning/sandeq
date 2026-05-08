'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  actions?: React.ReactNode
  badge?: React.ReactNode
}

export function PageHeader({ title, subtitle, backHref, actions, badge }: PageHeaderProps) {
  const router = useRouter()
  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.88)', borderColor: 'var(--border)' }}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        {backHref && (
          <button
            onClick={() => router.push(backHref)}
            aria-label="Kembali"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition flex-shrink-0 hover:bg-slate-100"
            style={{ color: 'var(--text-2)' }}
          >
            <ArrowLeft size={17} />
          </button>
        )}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h1 className="font-bold text-base leading-tight truncate" style={{ color: 'var(--text-1)' }}>{title}</h1>
          {badge}
          {subtitle && <p className="text-xs truncate hidden sm:block" style={{ color: 'var(--text-3)' }}>— {subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  )
}
