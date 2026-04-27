'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'

const menuItems = [
  { title: 'Buat Materi', description: 'Tambah materi pelajaran', icon: '📖', path: '/guru/materi', color: 'from-blue-500 to-blue-600' },
  { title: 'Buat Kuis', description: 'Buat ulangan & latihan', icon: '✏️', path: '/guru/kuis', color: 'from-violet-500 to-violet-600' },
  { title: 'Absensi', description: 'Catat kehadiran siswa', icon: '📋', path: '/guru/absensi', color: 'from-emerald-500 to-emerald-600' },
  { title: 'Input Nilai', description: 'Masukkan nilai siswa', icon: '🏅', path: '/guru/nilai', color: 'from-amber-500 to-amber-600' },
  { title: 'Forum', description: 'Diskusi dengan siswa', icon: '💬', path: '/forum', color: 'from-sky-500 to-sky-600' },
  { title: 'Pengumuman', description: 'Buat pengumuman kelas', icon: '📢', path: '/guru/pengumuman', color: 'from-rose-500 to-rose-600' },
  { title: 'Analytics Kelas', description: 'Lihat progress & data siswa', icon: '📊', path: '/guru/analytics', color: 'from-indigo-600 to-blue-700' },
]

export default function GuruDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalMateri: 0, totalKuis: 0 })

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
    const [materi, kuis] = await Promise.all([
      supabase.from('materi').select('*', { count: 'exact', head: true }).eq('guru_id', guruId),
      supabase.from('kuis').select('*', { count: 'exact', head: true }).eq('guru_id', guruId),
    ])
    setStats({ totalMateri: materi.count || 0, totalKuis: kuis.count || 0 })
  }

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Memuat dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg font-bold">
              S
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">SANDEQ</h1>
              <p className="text-blue-200 text-xs">Portal Guru</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.nama}</p>
              <p className="text-blue-200 text-xs">Guru</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm bg-white/15 hover:bg-white/25 rounded-lg transition border border-white/20"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Selamat mengajar, {user?.nama?.split(' ')[0]} 👋</h2>
          <p className="text-slate-500 text-sm mt-0.5">Hari ini ada yang perlu diperbarui?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">📖</span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">Total</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.totalMateri}</p>
            <p className="text-sm text-slate-500 mt-1">Materi dibuat</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">✏️</span>
              <span className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full font-medium">Total</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.totalKuis}</p>
            <p className="text-sm text-slate-500 mt-1">Kuis dibuat</p>
          </div>
        </div>

        {/* Menu */}
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Menu Utama</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`group relative p-5 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                item.featured
                  ? `bg-gradient-to-br ${item.color} text-white shadow-md md:col-span-1`
                  : 'bg-white border border-slate-100 shadow-sm hover:border-blue-100'
              }`}
            >
              <span className="text-2xl mb-3 block">{item.icon}</span>
              <h4 className={`font-semibold text-sm ${item.featured ? 'text-white' : 'text-slate-800'}`}>
                {item.title}
              </h4>
              <p className={`text-xs mt-0.5 ${item.featured ? 'text-white/75' : 'text-slate-400'}`}>
                {item.description}
              </p>
              {item.featured && (
                <div className="absolute top-3 right-3 w-2 h-2 bg-yellow-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
