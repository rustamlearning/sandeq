'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backPath?: string
  onBack?: () => void
  actions?: React.ReactNode
  /** Extra row below the title row (filter chips, tabs, etc.) */
  bottom?: React.ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  backPath,
  onBack,
  actions,
  bottom,
}: PageHeaderProps) {
  const router = useRouter()
  const handleBack = onBack ?? (backPath ? () => router.push(backPath) : undefined)

  return (
    <header className="bg-gradient-to-r from-[#0A2D52] to-[#1A4A7A] shadow-lg sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
        {handleBack && (
          <button
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-lg transition flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-white/60 text-xs mt-0.5">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>
        )}
      </div>
      {bottom && (
        <div className="max-w-4xl mx-auto px-4 pb-3">{bottom}</div>
      )}
    </header>
  )
}
