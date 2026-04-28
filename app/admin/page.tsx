'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'

const MENU = [
  { title: 'Kelola Pengguna', description: 'Tambah & atur akun siswa, guru', icon: '👤', path: '/admin/users', color: 'from-blue-500 to-blue-600' },
  { title: 'Kelola Kelas', description: 'Buat & atur kelas', icon: '🏫', path: '/admin/kelas', color: 'from-violet-500 to-violet-600' },
  { title: 'Kelola Jadwal', description: 'Atur jadwal pelajaran per kelas', icon: '📅', path: '/admin/jadwal', color: 'from-indigo-500 to-indigo-600' },
  { title: 'Pengumuman', description: 'Buat pengumuman untuk semua siswa', icon: '📢', path: '/admin/pengumuman', color: 'from-rose-500 to-rose-600' },
]

const STATS = [
  { key: 'totalSiswa', label: 'Siswa', icon: '🎓', bg: 'bg-blue-50', text: 'text-blue-700' },
  { key: 'totalGuru', label: 'Guru', icon: '👨‍🏫', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { key: 'totalKelas', label: 'Kelas', icon: '🏫', bg: 'bg-violet-50', text: 'text-violet-700' },
  { key: 'totalMateri', label: 'Materi', icon: '📚', bg: 'bg-orange-50', text: 'text-orange-700' },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalSiswa: 0, totalGuru: 0, totalKelas: 0, totalMateri: 0 })

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser()
      if (!currentUser) { router.replace('/login'); return }
      if (currentUser.role !== 'admin') { router.replace('/'); return }
      setUser(currentUser)
      await loadStats()
      setLoading(false)
    }
    init()
  }, [router])

  async function loadStats() {
    const [siswa, guru, kelas, materi] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'siswa'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'guru'),
      supabase.from('kelas').select('*', { count: 'exact', head: true }),
      supabase.from('materi').select('*', { count: 'exact', head: true }),
    ])
    setStats({ totalSiswa: siswa.count || 0, totalGuru: guru.count || 0, totalKelas: kelas.count || 0, totalMateri: materi.count || 0 })
  }

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">⚙️</div>
          <p className="text-gray-500">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-slate-700 to-slate-800 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">⚙️</div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">SANDEQ Admin</h1>
            <p className="text-white/70 text-sm">Selamat datang, {user?.nama}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            Keluar
          </button>
        </div>

        {/* Stats in header */}
        <div className="max-w-4xl mx-auto px-4 pb-5">
          <div className="grid grid-cols-4 gap-2">
            {STATS.map((s) => (
              <div key={s.key} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-lg">{s.icon}</p>
                <p className="text-2xl font-bold text-white">{stats[s.key as keyof typeof stats]}</p>
                <p className="text-white/70 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">Manajemen</p>
        <div className="grid grid-cols-2 gap-3">
          {MENU.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition text-left overflow-hidden group"
            >
              <div className={`bg-gradient-to-r ${item.color} px-4 py-3 flex items-center gap-2`}>
                <span className="text-2xl">{item.icon}</span>
                <h4 className="font-bold text-white text-sm">{item.title}</h4>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
