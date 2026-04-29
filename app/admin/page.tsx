'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'

const MENU = [
  { title: 'Kelola Pengguna', description: 'Tambah & atur akun siswa, guru', icon: '👤', path: '/admin/users', color: 'from-blue-500 to-blue-600' },
  { title: 'Kelola Kelas', description: 'Buat & atur kelas', icon: '🏫', path: '/admin/kelas', color: 'from-violet-500 to-violet-600' },
  { title: 'Kelola Jadwal', description: 'Atur jadwal pelajaran per kelas', icon: '📅', path: '/admin/jadwal', color: 'from-indigo-500 to-indigo-600' },
  { title: 'Pengumuman', description: 'Buat pengumuman untuk semua siswa', icon: '📢', path: '/admin/pengumuman', color: 'from-rose-500 to-rose-600' },
]

const STATS_CONFIG = [
  { key: 'totalSiswa', label: 'Siswa', icon: '🎓' },
  { key: 'totalGuru', label: 'Guru', icon: '👨‍🏫' },
  { key: 'totalKelas', label: 'Kelas', icon: '🏫' },
  { key: 'totalMateri', label: 'Materi', icon: '📚' },
]

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#818cf8', '#4f46e5']

interface KelasCount { nama: string; siswa: number }
interface AbsensiCount { status: string; count: number; fill: string }

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalSiswa: 0, totalGuru: 0, totalKelas: 0, totalMateri: 0 })
  const [kelasData, setKelasData] = useState<KelasCount[]>([])
  const [absensiData, setAbsensiData] = useState<AbsensiCount[]>([])
  const [kuisStats, setKuisStats] = useState({ totalKuis: 0, totalPengerjaan: 0, avgSkor: 0 })

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser()
      if (!currentUser) { router.replace('/login'); return }
      if (currentUser.role !== 'admin') { router.replace('/'); return }
      setUser(currentUser)
      await Promise.all([loadStats(), loadAnalytics()])
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

  async function loadAnalytics() {
    const [{ data: kelasList }, { data: siswaList }, { data: absensi }, { data: kuis }, { data: pengerjaan }] = await Promise.all([
      supabase.from('kelas').select('id, nama').order('nama'),
      supabase.from('users').select('kelas_id').eq('role', 'siswa'),
      supabase.from('absensi').select('status'),
      supabase.from('kuis').select('id', { count: 'exact', head: true }),
      supabase.from('pengerjaan').select('skor'),
    ])

    // Siswa per kelas
    if (kelasList && siswaList) {
      const countMap = new Map<string, number>()
      siswaList.forEach((s) => { if (s.kelas_id) countMap.set(s.kelas_id, (countMap.get(s.kelas_id) || 0) + 1) })
      setKelasData(kelasList.map((k) => ({ nama: k.nama, siswa: countMap.get(k.id) || 0 })).filter((k) => k.siswa > 0))
    }

    // Absensi breakdown
    if (absensi) {
      const map: Record<string, number> = {}
      absensi.forEach((a) => { map[a.status] = (map[a.status] || 0) + 1 })
      setAbsensiData([
        { status: 'Hadir', count: map.hadir || 0, fill: '#10b981' },
        { status: 'Sakit', count: map.sakit || 0, fill: '#f59e0b' },
        { status: 'Izin', count: map.izin || 0, fill: '#3b82f6' },
        { status: 'Alpha', count: map.alpha || 0, fill: '#ef4444' },
      ])
    }

    // Kuis stats
    if (pengerjaan) {
      const scores = pengerjaan.filter((p) => p.skor !== null).map((p) => p.skor as number)
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      setKuisStats({ totalKuis: kuis?.length || 0, totalPengerjaan: pengerjaan.length, avgSkor: avg })
    }
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

  const totalAbsensi = absensiData.reduce((s, a) => s + a.count, 0)
  const hadirRate = totalAbsensi > 0 ? Math.round(((absensiData.find((a) => a.status === 'Hadir')?.count || 0) / totalAbsensi) * 100) : 0

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-gradient-to-r from-[#1A4A7A] to-[#2E86C1] shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">⚙️</div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">SANDEQ Admin</h1>
            <p className="text-white/70 text-sm">Selamat datang, {user?.nama}</p>
          </div>
          <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
            Keluar
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-4 pb-5">
          <div className="grid grid-cols-4 gap-2">
            {STATS_CONFIG.map((s) => (
              <div key={s.key} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-lg">{s.icon}</p>
                <p className="text-2xl font-bold text-white">{stats[s.key as keyof typeof stats]}</p>
                <p className="text-white/70 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Management menu */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">Manajemen</p>
          <div className="grid grid-cols-2 gap-3">
            {MENU.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition text-left overflow-hidden"
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
        </div>

        {/* Analytics section */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">Analytics</p>

          {/* Kuis quick stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Total Kuis', value: kuisStats.totalKuis, icon: '📋', color: 'text-violet-700 bg-violet-50' },
              { label: 'Pengerjaan', value: kuisStats.totalPengerjaan, icon: '✏️', color: 'text-blue-700 bg-blue-50' },
              { label: 'Rata-rata Skor', value: kuisStats.avgSkor > 0 ? `${kuisStats.avgSkor}` : '–', icon: '📊', color: 'text-emerald-700 bg-emerald-50' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-4 ${s.color.split(' ')[1]}`}>
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Siswa per kelas bar chart */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Siswa per Kelas</h3>
              {kelasData.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">Belum ada data</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={kelasData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="nama" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip
                      formatter={(val) => [`${val} siswa`, 'Jumlah']}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Bar dataKey="siswa" radius={[0, 4, 4, 0]}>
                      {kelasData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Absensi pie chart */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Rekap Absensi</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  hadirRate >= 90 ? 'bg-green-100 text-green-700' :
                  hadirRate >= 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {hadirRate}% hadir
                </span>
              </div>
              {totalAbsensi === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">Belum ada data</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={absensiData.filter((a) => a.count > 0)}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {absensiData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(val) => [`${val} catatan`, '']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {/* Legend */}
              <div className="flex gap-3 flex-wrap justify-center mt-1">
                {absensiData.map((a) => (
                  <div key={a.status} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: a.fill }} />
                    <span className="text-xs text-gray-500">{a.status}: {a.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
