'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'

export default function GuruDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMateri: 0,
    totalKuis: 0,
  })

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        router.replace('/login')
        return
      }

      if (currentUser.role !== 'guru') {
        router.replace('/')
        return
      }

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

    setStats({
      totalMateri: materi.count || 0,
      totalKuis: kuis.count || 0,
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">SANDEQ Guru</h1>
            <p className="text-sm text-gray-500">Selamat mengajar, {user?.nama}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 text-blue-700 rounded-xl p-4">
            <p className="text-sm font-medium opacity-80">Materi Saya</p>
            <p className="text-3xl font-bold mt-1">{stats.totalMateri}</p>
          </div>
          <div className="bg-green-50 text-green-700 rounded-xl p-4">
            <p className="text-sm font-medium opacity-80">Kuis Saya</p>
            <p className="text-3xl font-bold mt-1">{stats.totalKuis}</p>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-4">Menu</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MenuCard
            title="Buat Materi"
            description="Tambah materi pelajaran"
            onClick={() => router.push('/guru/materi')}
          />
          <MenuCard
            title="Buat Kuis"
            description="Buat ulangan & latihan"
            onClick={() => router.push('/guru/kuis')}
          />
          <MenuCard
            title="Absensi"
            description="Catat kehadiran siswa"
            onClick={() => router.push('/guru/absensi')}
          />
          <MenuCard
            title="Input Nilai"
            description="Masukkan nilai siswa"
            onClick={() => router.push('/guru/nilai')}
          />
          <MenuCard
            title="Forum"
            description="Diskusi dengan siswa"
            onClick={() => router.push('/forum')}
          />
          <MenuCard
            title="Pengumuman"
            description="Buat pengumuman kelas"
            onClick={() => router.push('/guru/pengumuman')}
          />
        </div>
      </main>
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