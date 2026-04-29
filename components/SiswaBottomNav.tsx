'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/siswa', label: 'Beranda', icon: '🏠' },
  { href: '/siswa/materi', label: 'Materi', icon: '📚' },
  { href: '/siswa/kuis', label: 'Kuis', icon: '✏️' },
  { href: '/siswa/nilai', label: 'Nilai', icon: '📊' },
  { href: '/profil', label: 'Profil', icon: '⭐' },
]

export default function SiswaBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-1px_12px_rgba(0,0,0,0.06)] md:hidden z-40 safe-bottom"
    >
      <div className="grid grid-cols-5 max-w-lg mx-auto">
        {items.map((item) => {
          const active = item.href === '/siswa'
            ? pathname === '/siswa'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-2 px-1 min-h-[56px] transition-colors ${
                active ? 'text-blue-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className={`text-xl leading-none transition-transform ${active ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className={`mt-0.5 text-[10px] ${active ? 'font-bold text-blue-700' : 'font-medium'}`}>
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
