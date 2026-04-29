'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'
import {
  BookOpen, PenLine, ClipboardList, Award, FileDown,
  Calendar, Target, BarChart2, MessageSquare, Megaphone,
  Bell, LogOut, ChevronRight,
} from 'lucide-react'

const PRIMARY_MENU = [
  {
    title: 'Buat Materi',
    description: 'Susun materi pelajaran dengan block editor',
    icon: BookOpen,
    path: '/guru/materi',
    color: 'from-[#0A2D52] to-[#1A4A7A]',
  },
  {
    title: 'Buat Kuis',
    description: 'Buat ulangan & latihan soal',
    icon: PenLine,
    path: '/guru/kuis',
    color: 'from-violet-700 to-violet-500',
  },
]

const SECONDARY_MENU = [
  { title: 'Absensi',      icon: ClipboardList,  path: '/guru/absensi',       iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { title: 'Input Nilai',  icon: Award,           path: '/guru/nilai',          iconBg: 'bg-amber-100',   iconColor: 'text-amber-600'   },
  { title: 'Export Rapor', icon: FileDown,         path: '/guru/nilai/export',   iconBg: 'bg-teal-100',    iconColor: 'text-teal-600'    },
  { title: 'Jadwal',       icon: Calendar,         path: '/jadwal',              iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600'  },
  { title: 'Mastery',      icon: Target,           path: '/guru/mastery',        iconBg: 'bg-orange-100',  iconColor: 'text-orange-600'  },
  { title: 'Analytics',    icon: BarChart2,        path: '/guru/analytics',      iconBg: 'bg-blue-100',    iconColor: 'text-blue-600'    },
  { title: 'Forum',        icon: MessageSquare,    path: '/forum',               iconBg: 'bg-sky-100',     iconColor: 'text-sky-600'     },
  { title: 'Pengumuman',   icon: Megaphone,        path: '/guru/pengumuman',     iconBg: 'bg-rose-100',    iconColor: 'text-rose-600'    },
]

export default function GuruDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalMateri: 0, totalKuis: 0 })
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser()
      if (!currentUser) { router.replace('/login'); return }
      if (currentUser.role !== 'guru') { router.replace('/'); return }
      setUser(currentUser)
      await loadStats(currentUser.id)
      setLoading(false)
    }
    init()
  }, [router])

  async function loadStats(guruId: string) {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
    const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString()
    const [materi, kuis, kuisIds] = await Promise.all([
      supabase.from('materi').select('*', { count: 'exact', head: true }).eq('guru_id', guruId),
      supabase.from('kuis').select('*', { count: 'exact', head: true }).eq('guru_id', guruId),
      supabase.from('kuis').select('id').eq('guru_id', guruId).eq('aktif', true),
    ])
    setStats({ totalMateri: materi.count || 0, totalKuis: kuis.count || 0 })

    const ids = (kuisIds.data || []).map((k) => k.id)
    let notifTotal = 0
    if (ids.length > 0) {
      const [pengerjaan, deadline] = await Promise.all([
        supabase.from('pengerjaan').select('id', { count: 'exact', head: true }).in('kuis_id', ids).gte('created_at', threeDaysAgo),
        supabase.from('kuis').select('id', { count: 'exact', head: true }).eq('guru_id', guruId).eq('aktif', true).lte('tanggal_selesai', threeDaysLater).gte('tanggal_selesai', new Date().toISOString()),
      ])
      notifTotal = (pengerjaan.count || 0) + (deadline.count || 0)
    }
    setNotifCount(notifTotal)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#1A4A7A] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Memuat dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0A2D52] to-[#1A4A7A]">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black text-white text-lg tracking-tight">
              S
            </div>
            <div>
              <p className="font-black text-white text-base leading-tight tracking-tight">SANDEQ</p>
              <p className="text-white/50 text-[11px] font-medium">Portal Guru</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/guru/notifikasi')}
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
              onClick={async () => { await logout(); router.replace('/login') }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition"
            >
              <LogOut className="w-3.5 h-3.5 text-white/70" />
              <span className="text-white/70 text-xs font-medium">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-black text-slate-800">
            Halo, {user?.nama?.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">Siap mengajar hari ini?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Materi Dibuat', value: stats.totalMateri, icon: BookOpen, accent: 'text-[#1A4A7A] bg-[#E8F1FB]' },
            { label: 'Kuis Dibuat',   value: stats.totalKuis,   icon: PenLine,  accent: 'text-violet-600 bg-violet-50' },
          ].map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className={`w-9 h-9 ${accent} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-3xl font-black text-slate-800">{value}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Primary actions */}
        <div className="grid grid-cols-2 gap-3">
          {PRIMARY_MENU.map(({ title, description, icon: Icon, path, color }) => (
            <button
              key={path}
              onClick={() => router.push(path)}
              className={`relative bg-gradient-to-br ${color} p-5 rounded-2xl text-left shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}
            >
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
              <Icon className="w-7 h-7 text-white mb-3" strokeWidth={1.75} />
              <p className="font-bold text-white text-sm leading-tight">{title}</p>
              <p className="text-white/65 text-xs mt-1 leading-snug">{description}</p>
            </button>
          ))}
        </div>

        {/* Secondary menu */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Menu Lainnya</p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
            {SECONDARY_MENU.map(({ title, icon: Icon, path, iconBg, iconColor }) => (
              <button
                key={path}
                onClick={() => router.push(path)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <span className="flex-1 text-sm font-semibold text-slate-700">{title}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
