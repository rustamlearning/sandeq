'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getLevelInfo } from '@/lib/gamification'
import BottomNav from '@/components/BottomNav'
import { Bell, LogOut, Bot, MessageSquare, Newspaper, Calendar } from 'lucide-react'

const QUICK_MENU = [
  { label: 'AI Tutor',    icon: Bot,          path: '/siswa/ai-tutor',      bg: 'bg-violet-50',  color: 'text-violet-600' },
  { label: 'Forum',       icon: MessageSquare, path: '/forum',               bg: 'bg-sky-50',     color: 'text-sky-600'   },
  { label: 'Pengumuman',  icon: Newspaper,     path: '/siswa/pengumuman',    bg: 'bg-rose-50',    color: 'text-rose-600'  },
  { label: 'Jadwal',      icon: Calendar,      path: '/jadwal',              bg: 'bg-indigo-50',  color: 'text-indigo-600'},
]

export default function SiswaDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ materiCount: 0, kuisCount: 0, pengumumanCount: 0 })
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => { init() }, [])

  const init = async () => {
    const u = await getCurrentUser()
    if (!u || u.role !== 'siswa') { router.push('/login'); return }
    setUser(u)
    if (u.kelas_id) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString()
      const [materiRes, kuisRes, pengumumanRes, recentPengumuman, deadlineKuis] = await Promise.all([
        supabase.from('materi').select('id', { count: 'exact', head: true }).eq('kelas_id', u.kelas_id),
        supabase.from('kuis').select('id', { count: 'exact', head: true }).eq('kelas_id', u.kelas_id),
        supabase.from('pengumuman').select('id', { count: 'exact', head: true }),
        supabase.from('pengumuman').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('kuis').select('id', { count: 'exact', head: true }).eq('kelas_id', u.kelas_id).eq('aktif', true).lte('tanggal_selesai', threeDaysLater).gte('tanggal_selesai', new Date().toISOString()),
      ])
      setStats({ materiCount: materiRes.count || 0, kuisCount: kuisRes.count || 0, pengumumanCount: pengumumanRes.count || 0 })
      setNotifCount((recentPengumuman.count || 0) + (deadlineKuis.count || 0))
    }
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-8 h-8 border-4 border-[#1A4A7A] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const xp = user.xp || 0
  const levelInfo = getLevelInfo(xp)
  const xpToNext = levelInfo.maxXp - xp
  const xpProgress = Math.min(100, Math.round(((xp - levelInfo.minXp) / (levelInfo.maxXp - levelInfo.minXp)) * 100)) || 0

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0A2D52] to-[#1A4A7A]">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black text-white text-lg">S</div>
            <div>
              <p className="font-black text-white text-base leading-tight tracking-tight">SANDEQ</p>
              <p className="text-white/50 text-[11px] font-medium">Portal Siswa</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/siswa/notifikasi')}
              className="relative w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition"
            >
              <Bell className="w-4 h-4 text-white" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
            <button
              onClick={async () => { await logout(); router.push('/login') }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition"
            >
              <LogOut className="w-3.5 h-3.5 text-white/70" />
              <span className="text-white/70 text-xs font-medium">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* XP Hero Card */}
        <div className="relative bg-gradient-to-br from-[#0A2D52] via-[#1A4A7A] to-[#1464A8] text-white rounded-3xl p-6 shadow-xl overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 right-8 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
              {levelInfo.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-xs font-medium">Halo, {user.nama?.split(' ')[0]}!</p>
              <p className="font-black text-lg leading-tight mt-0.5">{levelInfo.title}</p>
              <p className="text-white/70 text-xs font-medium">Lv {levelInfo.level} · {xp.toLocaleString()} XP</p>
              <div className="mt-3">
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/50 mt-1 font-medium">
                  {xpToNext > 0 ? `${xpToNext.toLocaleString()} XP lagi ke Level ${levelInfo.level + 1}` : '🌟 MAX LEVEL!'}
                </p>
              </div>
            </div>
            {user.current_streak > 0 && (
              <div className="bg-orange-500/25 border border-orange-400/25 px-2.5 py-2 rounded-xl text-center flex-shrink-0">
                <p className="text-xl">🔥</p>
                <p className="text-xs font-black">{user.current_streak}</p>
                <p className="text-[10px] text-white/50">hari</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Materi',      value: stats.materiCount,     color: 'text-[#1A4A7A]', bg: 'bg-[#E8F1FB]' },
            { label: 'Kuis',        value: stats.kuisCount,       color: 'text-violet-600', bg: 'bg-violet-50'  },
            { label: 'Pengumuman',  value: stats.pengumumanCount, color: 'text-rose-600',   bg: 'bg-rose-50'    },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick access */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Akses Cepat</p>
          <div className="grid grid-cols-4 gap-2.5">
            {QUICK_MENU.map(({ label, icon: Icon, path, bg, color }) => (
              <button
                key={path}
                onClick={() => router.push(path)}
                className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
