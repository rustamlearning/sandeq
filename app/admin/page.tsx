'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalGuru: 0,
    totalKelas: 0,
    totalMateri: 0,
  })

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        router.replace('/login')
        return
      }

      if (currentUser.role !== 'admin') {
        router.replace('/')
        return
      }

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

    setStats({
      totalSiswa: siswa.count || 0,
      totalGuru: guru.count || 0,
      totalKelas: kelas.count || 0,
      totalMateri: materi.count || 0,
    })
  }

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">SANDEQ Admin</h1>
            <p className="text-sm text-gray-500">Selamat datang, {user?.nama}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Siswa" value={stats.totalSiswa} color="blue" />
          <StatCard label="Total Guru" value={stats.totalGuru} color="green" />
          <StatCard label="Total Kelas" value={stats.totalKelas} color="purple" />
          <StatCard label="Total Materi" value={stats.totalMateri} color="orange" />
        </div>

        {/* Menu */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Manajemen</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MenuCard
            title="Kelola Pengguna"
            description="Tambah & atur akun siswa, guru"
            onClick={() => router.push('/admin/users')}
          />
          <MenuCard
            title="Kelola Kelas"
            description="Buat & atur kelas"
            onClick={() => router.push('/admin/kelas')}
          />
          <MenuCard
            title="Kelola Jadwal"
            description="Atur jadwal pelajaran per kelas"
            onClick={() => router.push('/admin/jadwal')}
          />
          <MenuCard
            title="Pengumuman"
            description="Buat pengumuman sekolah"
            onClick={() => router.push('/admin/pengumuman')}
          />
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
  }

  return (
    <div className={`${colorMap[color]} rounded-xl p-4`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}

function MenuCard({
  title,
  description,
  onClick,
}: {
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition text-left border border-gray-100"
    >
      <h4 className="font-semibold text-gray-800">{title}</h4>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </button>
  )
}