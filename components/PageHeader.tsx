'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  subtitle?: string
  right?: ReactNode
  onBack?: () => void
}

export function PageHeader({ title, subtitle, right, onBack }: PageHeaderProps) {
  const router = useRouter()
  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack ?? (() => router.back())}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition"
          style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}
          aria-label="Kembali"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base leading-tight truncate" style={{ color: 'var(--text-1)' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{subtitle}</p>
          )}
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
    </div>
  )
}
