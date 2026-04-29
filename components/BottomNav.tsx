'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, BookOpen, PenLine, Trophy, User } from 'lucide-react'

const NAV_ITEMS = [
  { icon: Home,     label: 'Beranda', path: '/siswa'             },
  { icon: BookOpen, label: 'Materi',  path: '/siswa/materi'      },
  { icon: PenLine,  label: 'Kuis',    path: '/siswa/kuis'        },
  { icon: Trophy,   label: 'Ranking', path: '/siswa/leaderboard' },
  { icon: User,     label: 'Profil',  path: '/profil'            },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-100 safe-bottom">
      <div className="max-w-lg mx-auto flex items-center">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const active =
            path === '/siswa'
              ? pathname === '/siswa'
              : pathname === path || pathname.startsWith(path + '/')
          return (
            <button
              key={path}
              onClick={() => router.push(path)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                active ? 'text-[#1A4A7A]' : 'text-gray-400 hover:text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.75} />
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
