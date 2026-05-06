'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Award, BarChart3, BookOpen, Home, User } from 'lucide-react'

const items = [
  { href: '/siswa', label: 'Beranda', icon: Home },
  { href: '/siswa/materi', label: 'Materi', icon: BookOpen },
  { href: '/siswa/kuis', label: 'Kuis', icon: Award },
  { href: '/siswa/nilai', label: 'Nilai', icon: BarChart3 },
  { href: '/profil', label: 'Profil', icon: User },
]

export default function SiswaBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed bottom-0 left-0 right-0 border-t border-white/70 bg-white/82 shadow-[0_-16px_40px_rgba(18,61,100,0.08)] backdrop-blur-xl md:hidden z-40 safe-bottom"
    >
      <div className="grid grid-cols-5 max-w-lg mx-auto px-2">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.href === '/siswa'
            ? pathname === '/siswa'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center py-2 px-1 min-h-[58px] rounded-md transition-colors ${
                active ? 'text-[#1A4A7A]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {active && <span className="absolute inset-x-2 top-1 h-8 rounded-md bg-[#eef6fb]" />}
              <Icon className="relative" size={21} strokeWidth={active ? 2.5 : 2} />
              <span className={`relative mt-0.5 text-[10px] ${active ? 'font-bold text-[#1A4A7A]' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
