'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  GraduationCap,
  Megaphone,
  School,
  Settings,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const MENU = [
  { title: 'Kelola Pengguna', description: 'Tambah dan atur akun siswa, guru', icon: Users, path: '/admin/users', tone: 'text-blue-700 bg-blue-50 ring-blue-100' },
  { title: 'Kelola Kelas', description: 'Buat dan rapikan rombel', icon: School, path: '/admin/kelas', tone: 'text-violet-700 bg-violet-50 ring-violet-100' },
  { title: 'Kelola Jadwal', description: 'Atur pelajaran per kelas', icon: CalendarDays, path: '/admin/jadwal', tone: 'text-indigo-700 bg-indigo-50 ring-indigo-100' },
  { title: 'Pengumuman', description: 'Kirim info untuk sekolah', icon: Megaphone, path: '/admin/pengumuman', tone: 'text-rose-700 bg-rose-50 ring-rose-100' },
]

const STATS_CONFIG = [
  { key: 'totalSiswa', label: 'Siswa', icon: GraduationCap, tone: 'text-blue-700 bg-blue-50 ring-blue-100' },
  { key: 'totalGuru', label: 'Guru', icon: Users, tone: 'text-emerald-700 bg-emerald-50 ring-emerald-100' },
  { key: 'totalKelas', label: 'Kelas', icon: School, tone: 'text-violet-700 bg-violet-50 ring-violet-100' },
  { key: 'totalMateri', label: 'Materi', icon: BookOpen, tone: 'text-orange-700 bg-orange-50 ring-orange-100' },
]

const BAR_COLORS = ['#1A4A7A', '#2E86C1', '#6BA7CF', '#F0B45B', '#7BAE92', '#8A9BB0', '#445B72']

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
    const [{ data: kelasList }, { data: siswaList }, { data: absensi }, { count: kuisCount }, { data: pengerjaan }] = await Promise.all([
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
      setKuisStats({ totalKuis: kuisCount || 0, totalPengerjaan: pengerjaan.length, avgSkor: avg })
    }
  }

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="app-canvas flex items-center justify-center">
        <div className="surface-card rounded-lg px-5 py-4 text-center">
          <Settings className="mx-auto mb-3 h-6 w-6 animate-pulse text-[#1A4A7A]" />
          <p className="text-sm text-slate-500">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  const totalAbsensi = absensiData.reduce((s, a) => s + a.count, 0)
  const hadirRate = totalAbsensi > 0 ? Math.round(((absensiData.find((a) => a.status === 'Hadir')?.count || 0) / totalAbsensi) * 100) : 0

  return (
    <div className="app-canvas">
      <header className="border-b border-white/70 bg-white/78 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1A4A7A] text-white flex items-center justify-center shadow-sm">
            <Settings size={18} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-slate-950">SANDEQ Admin</h1>
            <p className="text-slate-500 text-sm">Selamat datang, {user?.nama}</p>
          </div>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-md text-sm font-medium transition shadow-sm">
            <DoorOpen size={15} />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 lg:py-8 space-y-7">
        <section>
          <p className="text-sm font-medium text-slate-500">Panel operasional</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-[-0.01em] text-slate-950">Ringkasan sekolah</h2>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {STATS_CONFIG.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.key} className="surface-card rounded-lg p-4">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${s.tone}`}>
                  <Icon size={19} />
                </div>
                <p className="text-3xl font-semibold text-slate-950">{stats[s.key as keyof typeof stats]}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            )
          })}
        </section>

        <section>
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-slate-950">Manajemen</h3>
            <p className="text-sm text-slate-500">Kelola struktur dasar aplikasi belajar.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MENU.map((item) => {
              const Icon = item.icon as LucideIcon
              return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="group bg-white/90 rounded-lg border border-white/80 p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ring-1 ${item.tone}`}>
                  <Icon size={20} />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
              </button>
            )})}
          </div>
        </section>

        <section>
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-slate-950">Analytics</h3>
            <p className="text-sm text-slate-500">Sinyal cepat untuk aktivitas akademik.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Total Kuis', value: kuisStats.totalKuis, icon: ClipboardList, tone: 'text-violet-700 bg-violet-50 ring-violet-100' },
              { label: 'Pengerjaan', value: kuisStats.totalPengerjaan, icon: BarChart3, tone: 'text-blue-700 bg-blue-50 ring-blue-100' },
              { label: 'Rata-rata Skor', value: kuisStats.avgSkor > 0 ? `${kuisStats.avgSkor}` : '-', icon: BarChart3, tone: 'text-emerald-700 bg-emerald-50 ring-emerald-100' },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="hairline-card rounded-lg p-4">
                  <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-md ring-1 ${s.tone}`}>
                    <Icon size={17} />
                  </div>
                  <p className="text-2xl font-semibold text-slate-950">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="surface-card rounded-lg p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Siswa per kelas</h3>
              {kelasData.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Belum ada data</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={kelasData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="nama" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip
                      formatter={(val) => [`${val} siswa`, 'Jumlah']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="siswa" radius={[0, 4, 4, 0]}>
                      {kelasData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="surface-card rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">Rekap absensi</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ring-1 ${
                  hadirRate >= 90 ? 'bg-green-100 text-green-700' :
                  hadirRate >= 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {hadirRate}% hadir
                </span>
              </div>
              {totalAbsensi === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Belum ada data</p>
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
                      label={(props: any) => `${props.status} ${((props.percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {absensiData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(val) => [`${val} catatan`, '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex gap-3 flex-wrap justify-center mt-1">
                {absensiData.map((a) => (
                  <div key={a.status} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: a.fill }} />
                    <span className="text-xs text-slate-500">{a.status}: {a.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
