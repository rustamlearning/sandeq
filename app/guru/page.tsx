'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'
import { PageLoader } from '@/components/ui/Skeleton'
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Download,
  LogOut,
  Megaphone,
  MessageSquare,
  PenLine,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const menuItems: { title: string; description: string; icon: LucideIcon; path: string; iconBg: string; featured: boolean }[] = [
  { title: 'Buat Materi', description: 'Tambah bahan belajar', icon: BookOpen, path: '/guru/materi', iconBg: 'bg-blue-50 text-blue-700 ring-blue-100', featured: false },
  { title: 'Buat Kuis', description: 'Susun latihan dan ulangan', icon: PenLine, path: '/guru/kuis', iconBg: 'bg-violet-50 text-violet-700 ring-violet-100', featured: false },
  { title: 'Absensi', description: 'Catat kehadiran kelas', icon: ClipboardCheck, path: '/guru/absensi', iconBg: 'bg-emerald-50 text-emerald-700 ring-emerald-100', featured: false },
  { title: 'Input Nilai', description: 'Masukkan nilai siswa', icon: ClipboardList, path: '/guru/nilai', iconBg: 'bg-amber-50 text-amber-700 ring-amber-100', featured: false },
  { title: 'Export Rapor', description: 'Unduh rapor PDF', icon: Download, path: '/guru/nilai/export', iconBg: 'bg-teal-50 text-teal-700 ring-teal-100', featured: true },
  { title: 'Jadwal', description: 'Lihat agenda mengajar', icon: CalendarDays, path: '/jadwal', iconBg: 'bg-indigo-50 text-indigo-700 ring-indigo-100', featured: false },
  { title: 'Mastery Tracker', description: 'Pantau penguasaan materi', icon: Target, path: '/guru/mastery', iconBg: 'bg-orange-50 text-orange-700 ring-orange-100', featured: false },
  { title: 'Analytics Kelas', description: 'Baca perkembangan siswa', icon: BarChart3, path: '/guru/analytics', iconBg: 'bg-blue-50 text-blue-700 ring-blue-100', featured: true },
  { title: 'Forum', description: 'Diskusi dengan siswa', icon: MessageSquare, path: '/forum', iconBg: 'bg-sky-50 text-sky-700 ring-sky-100', featured: false },
  { title: 'Pengumuman', description: 'Kirim info kelas', icon: Megaphone, path: '/guru/pengumuman', iconBg: 'bg-rose-50 text-rose-700 ring-rose-100', featured: false },
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
      supabase.from('kuis').select('id').eq('guru_id', guruId).eq('is_published', true),
    ])
    setStats({ totalMateri: materi.count || 0, totalKuis: kuis.count || 0 })

    const ids = (kuisIds.data || []).map((k) => k.id)
    let notifTotal = 0
    if (ids.length > 0) {
      const [pengerjaan, deadline] = await Promise.all([
        supabase.from('pengerjaan').select('id', { count: 'exact', head: true }).in('kuis_id', ids).gte('created_at', threeDaysAgo),
        supabase.from('kuis').select('id', { count: 'exact', head: true }).eq('guru_id', guruId).eq('is_published', true).lte('tanggal_selesai', threeDaysLater).gte('tanggal_selesai', new Date().toISOString()),
      ])
      notifTotal = (pengerjaan.count || 0) + (deadline.count || 0)
    }
    setNotifCount(notifTotal)
  }

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  if (loading) return <PageLoader />

  return (
    <div className="app-canvas">
      <header className="border-b border-white/70 bg-white/78 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A4A7A] rounded-lg flex items-center justify-center text-sm font-semibold text-white shadow-sm">
              S
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-tight text-slate-950">SANDEQ</h1>
              <p className="text-slate-500 text-xs">Portal Guru</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.nama}</p>
              <p className="text-slate-500 text-xs">Guru</p>
            </div>
            <button
              onClick={() => router.push('/guru/notifikasi')}
              aria-label="Notifikasi"
              className="relative w-9 h-9 bg-white hover:bg-slate-50 rounded-md flex items-center justify-center transition border border-slate-200 text-slate-700 shadow-sm"
            >
              <Bell size={17} />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
            <button
              onClick={handleLogout}
              aria-label="Keluar dari aplikasi"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white hover:bg-slate-50 rounded-md transition border border-slate-200 text-slate-700 shadow-sm"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
        <section className="mb-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-medium text-slate-500">Selamat mengajar, {user?.nama?.split(' ')[0]}</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-[-0.01em] text-slate-950">Studio pembelajaran</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Siapkan materi, pantau kelas, dan tindak lanjuti progres siswa dari satu tempat.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 mb-6">
          <div className="surface-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <BookOpen className="h-5 w-5 text-[#1A4A7A]" />
              <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-medium ring-1 ring-blue-100">Total</span>
            </div>
            <p className="text-3xl font-semibold text-slate-950">{stats.totalMateri}</p>
            <p className="text-sm text-slate-500 mt-1">Materi dibuat</p>
          </div>
          <div className="surface-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <PenLine className="h-5 w-5 text-violet-700" />
              <span className="text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md font-medium ring-1 ring-violet-100">Total</span>
            </div>
            <p className="text-3xl font-semibold text-slate-950">{stats.totalKuis}</p>
            <p className="text-sm text-slate-500 mt-1">Kuis dibuat</p>
          </div>
        </section>

        <div className="mb-3">
          <h3 className="text-lg font-semibold text-slate-950">Alur kerja utama</h3>
          <p className="text-sm text-slate-500">Aksi yang paling sering dipakai guru.</p>
        </div>
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                aria-label={item.title}
                className={`group relative flex items-center gap-4 rounded-lg p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] ${
                  item.featured ? 'bg-[#fff8ec] border border-[#f0b45b]/35' : 'bg-white/90 border border-white/80'
                }`}
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ${item.iconBg}`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm text-slate-900">{item.title}</h4>
                  <p className="text-xs mt-0.5 text-slate-500 truncate">{item.description}</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:text-[#2E86C1]" />
              </button>
            )
          })}
        </section>
      </main>
    </div>
  )
}
