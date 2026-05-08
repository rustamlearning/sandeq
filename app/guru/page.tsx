'use client'

import { getDimensiKelas, DIMENSI, DimensiKey } from '@/lib/dimensi'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'
import { PageLoader } from '@/components/ui/Skeleton'
import { Bell, LogOut } from 'lucide-react'

interface Stats {
  totalMateri: number
  totalKuis: number
  totalSiswa: number
  hadirHariIni: number
  essayBelumDinilai: number
  kuisDeadlineDekat: number
  avgNilaiKelas: number
  siswaAktifMingguIni: number
}

interface AlertItem {
  id: string
  tipe: 'essay' | 'deadline' | 'tidak_aktif'
  pesan: string
  path: string
  urgensi: 'tinggi' | 'sedang'
}

const menuItems = [
  { title: 'Buat Materi', icon: '📖', path: '/guru/materi', iconBg: 'bg-indigo-100 text-indigo-600' },
  { title: 'Buat Kuis', icon: '✏️', path: '/guru/kuis', iconBg: 'bg-indigo-100 text-indigo-600' },
  { title: 'Absensi', icon: '📋', path: '/guru/absensi', iconBg: 'bg-indigo-100 text-indigo-600' },
  { title: 'Input Nilai', icon: '🏅', path: '/guru/nilai', iconBg: 'bg-amber-100 text-amber-600' },
  { title: 'Analytics', icon: '📊', path: '/guru/analytics', iconBg: 'bg-indigo-100 text-indigo-700' },
  { title: 'Mastery', icon: '🎯', path: '/guru/mastery', iconBg: 'bg-orange-100 text-orange-600' },
  { title: 'Pengumuman', icon: '📢', path: '/guru/pengumuman', iconBg: 'bg-rose-100 text-rose-600' },
  { title: 'Export Rapor', icon: '📄', path: '/guru/nilai/export', iconBg: 'bg-blue-100 text-blue-600' },
  { title: 'Forum', icon: '💬', path: '/forum', iconBg: 'bg-sky-100 text-sky-600' },
  { title: 'Jadwal', icon: '📅', path: '/jadwal', iconBg: 'bg-indigo-100 text-indigo-600' },
  { title: 'Live Quiz', icon: '🎮', path: '/guru/live', iconBg: 'bg-indigo-100 text-indigo-600' },
  { title: 'Analytics Pro', icon: '🔬', path: '/guru/analytics-pro', iconBg: 'bg-red-100 text-red-600' },
]

export default function GuruDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalMateri: 0, totalKuis: 0, totalSiswa: 0,
    hadirHariIni: 0, essayBelumDinilai: 0,
    kuisDeadlineDekat: 0, avgNilaiKelas: 0, siswaAktifMingguIni: 0,
  })
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [notifCount, setNotifCount] = useState(0)
  const [dimensiKelas, setDimensiKelas] = useState<Record<DimensiKey, number> | null>(null)

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser()
      if (!currentUser) { router.replace('/login'); return }
      if (currentUser.role !== 'guru') { router.replace('/'); return }
      setUser(currentUser)
      await loadStats(currentUser.id, currentUser.kelas_id ?? undefined)
      setLoading(false)
    }
    init()
  }, [router])

  async function loadStats(guruId: string, kelasId?: string) {
    const now = new Date()
    const hariIni = now.toISOString().split('T')[0]
    const tigaHariLagi = new Date(Date.now() + 3 * 86400000).toISOString()
    const semingguLalu = new Date(Date.now() - 7 * 86400000).toISOString()

    const [materiRes, kuisRes, siswaRes, absensiRes, kuisIds] = await Promise.all([
      supabase.from('materi').select('*', { count: 'exact', head: true }).eq('guru_id', guruId),
      supabase.from('kuis').select('*', { count: 'exact', head: true }).eq('guru_id', guruId),
      kelasId
        ? supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'siswa').eq('kelas_id', kelasId)
        : supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'siswa'),
      kelasId
        ? supabase.from('absensi').select('*', { count: 'exact', head: true }).eq('tanggal', hariIni).eq('status', 'hadir').eq('kelas_id', kelasId)
        : { count: 0 },
      supabase.from('kuis').select('id').eq('guru_id', guruId),
    ])

    const ids = (kuisIds.data || []).map((k: any) => k.id)
    let essayCount = 0
    let deadlineCount = 0
    let avgNilai = 0
    let siswaAktif = 0
    const newAlerts: AlertItem[] = []

    if (ids.length > 0) {
      const [essayRes, deadlineRes, nilaiRes] = await Promise.all([
        supabase.from('kuis_attempts').select('id, kuis:kuis_id(judul)', { count: 'exact' })
          .in('kuis_id', ids).eq('needs_grading', true).eq('selesai', true).limit(5),
        supabase.from('kuis').select('id, judul, tanggal_selesai')
          .eq('guru_id', guruId).eq('is_published', true)
          .lte('tanggal_selesai', tigaHariLagi).gte('tanggal_selesai', now.toISOString()),
        supabase.from('kuis_attempts').select('nilai_persen')
          .in('kuis_id', ids).eq('selesai', true).gte('submitted_at', semingguLalu),
      ])

      essayCount = essayRes.count || 0
      if (essayCount > 0) {
        newAlerts.push({ id: 'essay', tipe: 'essay', pesan: `${essayCount} jawaban essay menunggu penilaian`, path: '/guru/kuis', urgensi: essayCount >= 5 ? 'tinggi' : 'sedang' })
      }

      const deadlineData = deadlineRes.data || []
      deadlineCount = deadlineData.length
      deadlineData.slice(0, 2).forEach((k: any) => {
        const sisa = Math.ceil((new Date(k.tanggal_selesai).getTime() - Date.now()) / 86400000)
        newAlerts.push({ id: k.id, tipe: 'deadline', pesan: `"${k.judul}" tutup dalam ${sisa} hari`, path: `/guru/kuis/${k.id}/analytics`, urgensi: sisa <= 1 ? 'tinggi' : 'sedang' })
      })

      const nilaiData = nilaiRes.data || []
      avgNilai = nilaiData.length
        ? Math.round(nilaiData.reduce((s: number, n: any) => s + (n.nilai_persen || 0), 0) / nilaiData.length)
        : 0
    }

    if (kelasId) {
      const { count } = await supabase.from('users').select('id', { count: 'exact', head: true })
        .eq('role', 'siswa').eq('kelas_id', kelasId).gte('updated_at', semingguLalu)
      siswaAktif = count || 0
    }

    setStats({
      totalMateri: materiRes.count || 0, totalKuis: kuisRes.count || 0,
      totalSiswa: siswaRes.count || 0, hadirHariIni: absensiRes.count || 0,
      essayBelumDinilai: essayCount, kuisDeadlineDekat: deadlineCount,
      avgNilaiKelas: avgNilai, siswaAktifMingguIni: siswaAktif,
    })
    setAlerts(newAlerts)
    setNotifCount(essayCount + deadlineCount)
    if (kelasId) getDimensiKelas(kelasId).then(setDimensiKelas)
  }

  if (loading) return <PageLoader />
  const nama = user?.nama?.split(' ')[0] ?? 'Guru'

  return (
    <div className="app-canvas">
      <header className="border-b border-white/70 bg-white/78 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg font-bold">S</div>
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
            <button onClick={() => router.push('/guru/notifikasi')}
              className="relative w-9 h-9 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center transition border border-white/20">
              <Bell size={17} />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
            <button onClick={async () => { await logout(); router.replace('/login') }}
              className="px-3 py-1.5 text-sm bg-white/15 hover:bg-white/25 rounded-lg transition border border-white/20 flex items-center gap-1">
              <LogOut size={15} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Selamat mengajar, {nama} 👋</h2>
          <p className="text-slate-500 text-sm mt-0.5">Berikut ringkasan kelas hari ini</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon="👥" label="Total Siswa" value={stats.totalSiswa} color="text-indigo-600" sub="terdaftar" />
          <StatCard icon="✅" label="Hadir Hari Ini" value={stats.hadirHariIni} color="text-green-600" sub="siswa" />
          <StatCard icon="📊" label="Avg Nilai" value={stats.avgNilaiKelas || '-'} color="text-indigo-600" sub="minggu ini" />
          <StatCard icon="⚡" label="Siswa Aktif" value={stats.siswaAktifMingguIni} color="text-orange-600" sub="7 hari terakhir" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon="📖" label="Materi" value={stats.totalMateri} color="text-indigo-600" sub="dibuat" />
          <StatCard icon="✏️" label="Kuis" value={stats.totalKuis} color="text-indigo-600" sub="dibuat" />
          <StatCard icon="⏳" label="Essay Pending" value={stats.essayBelumDinilai} color={stats.essayBelumDinilai > 0 ? 'text-red-600' : 'text-gray-400'} sub="belum dinilai" />
          <StatCard icon="⏰" label="Deadline Dekat" value={stats.kuisDeadlineDekat} color={stats.kuisDeadlineDekat > 0 ? 'text-orange-600' : 'text-gray-400'} sub="dalam 3 hari" />
        </div>

        {alerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">⚠️ Perlu Perhatian</h3>
            {alerts.map(alert => (
              <button key={alert.id} onClick={() => router.push(alert.path)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition hover:shadow-md ${
                  alert.urgensi === 'tinggi' ? 'bg-red-50 border-red-200 hover:border-red-400' : 'bg-orange-50 border-orange-200 hover:border-orange-400'
                }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{alert.tipe === 'essay' ? '📝' : alert.tipe === 'deadline' ? '⏰' : '🚨'}</span>
                  <span className={`text-sm font-medium ${alert.urgensi === 'tinggi' ? 'text-red-800' : 'text-orange-800'}`}>{alert.pesan}</span>
                </div>
                <span className="text-xs text-gray-400">Buka →</span>
              </button>
            ))}
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Aksi Cepat</h3>
          <div className="flex gap-2 flex-wrap">
            <QuickBtn label="+ Materi" onClick={() => router.push('/guru/materi')} color="bg-indigo-600" />
            <QuickBtn label="+ Kuis" onClick={() => router.push('/guru/kuis')} color="bg-indigo-600" />
            <QuickBtn label="Absensi Sekarang" onClick={() => router.push('/guru/absensi')} color="bg-indigo-600" />
            <QuickBtn label="🎮 Live Quiz" onClick={() => router.push('/guru/live')} color="bg-indigo-600" />
            {stats.essayBelumDinilai > 0 && (
              <QuickBtn label={`Nilai Essay (${stats.essayBelumDinilai})`} onClick={() => router.push('/guru/kuis')} color="bg-red-600" />
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Menu</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {menuItems.map((item) => (
              <button key={item.path} onClick={() => router.push(item.path)}
                className="group p-4 rounded-2xl text-left transition-all hover:-translate-y-0.5 hover:shadow-md bg-white border border-slate-100 shadow-sm hover:border-indigo-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${item.iconBg}`}>
                  {item.icon}
                </div>
                <h4 className="font-semibold text-sm text-slate-800">{item.title}</h4>
              </button>
            ))}
          </div>
        </div>

        {dimensiKelas && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-slate-700 mb-4">Dimensi Belajar Kelas</h3>
            <div className="space-y-3">
              {(Object.keys(DIMENSI) as DimensiKey[]).map(key => {
                const d = DIMENSI[key]
                const total = Math.max(Object.values(dimensiKelas).reduce((a, b) => a + b, 0), 1)
                const pct = Math.round((dimensiKelas[key] / total) * 100)
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{d.emoji} {d.label}</span>
                      <span className="text-gray-400">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-indigo-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, color, sub }: { icon: string; label: string; value: any; color: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className="text-2xl mb-2">{icon}</div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  )
}

function QuickBtn({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} className={`${color} text-white text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition active:scale-95`}>
      {label}
    </button>
  )
}