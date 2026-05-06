import { HTMLAttributes } from 'react'
import SandeqLogo from '@/components/SandeqLogo'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string
  height?: string
}

export function Skeleton({ width, height, className = '', style, ...props }: SkeletonProps) {
  return (
    <div
      className={`skeleton rounded-lg ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  )
}

export function LoadingMark({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex h-16 w-16 items-center justify-center ${className}`} aria-hidden="true">
      <div className="absolute inset-0 rounded-2xl bg-white/80 shadow-[0_20px_50px_rgba(18,61,100,0.12)] ring-1 ring-white/80 backdrop-blur-xl" />
      <div className="absolute inset-1 rounded-[1rem] bg-gradient-to-br from-white via-[#eef6fb] to-white" />
      <SandeqLogo className="relative h-10 w-10 animate-fade-in-up" />
      <div className="absolute -bottom-2 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[#1A4A7A]/60"
            style={{ animation: `loadingDot 1.15s ease-in-out ${i * 0.14}s infinite` }}
          />
        ))}
      </div>
    </div>
  )
}

export function LoadingState({
  title = 'Memuat halaman',
  description = 'Menyiapkan data terbaru untukmu.',
  className = '',
}: {
  title?: string
  description?: string
  className?: string
}) {
  return (
    <div className={`app-canvas flex min-h-screen items-center justify-center px-6 ${className}`}>
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <LoadingMark />
        <div className="mt-7 space-y-2">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-sm leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="surface-card rounded-lg p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <Skeleton className="h-10 w-full mt-4 rounded-xl" />
    </div>
  )
}

export function SkeletonMenuGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="surface-card rounded-lg p-4 flex items-center gap-4">
          <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-card rounded-lg p-4 flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-12 h-8 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonStatRow() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="surface-card rounded-lg p-4 text-center space-y-2">
          <Skeleton className="h-6 w-8 mx-auto rounded-full" />
          <Skeleton className="h-7 w-12 mx-auto" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
      ))}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="app-canvas">
      <div className="h-16 border-b border-white/70 bg-white/70 backdrop-blur-xl" />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="surface-card rounded-lg p-5">
          <div className="flex items-center gap-4">
            <LoadingMark className="h-14 w-14" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
          </div>
        </div>
        <SkeletonStatRow />
        <div className="mt-6">
          <Skeleton className="h-5 w-16 mb-3" />
          <SkeletonMenuGrid />
        </div>
      </div>
    </div>
  )
}
