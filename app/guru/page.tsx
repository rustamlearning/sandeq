'use client'

import { getDimensiKelas, DIMENSI, DimensiKey } from '@/lib/dimensi'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'
import { PageLoader } from '@/components/ui/Skeleton'
import { Bell, LogOut, BookOpen, PenLine, ClipboardCheck, Medal, BarChart2, Target, Megaphone, FileDown, MessageSquare, CalendarDays, Gamepad2, FlaskConical, ChevronRight, Users, TrendingUp, AlertTriangle } from 'lucide-react'

interface Stats {
  totalMateri: number; totalKuis: number; totalSiswa: number
  hadirHariIni: number; essayBelumDinilai: number; kuisDeadlineDekat: number
  avgNilaiKelas: number; siswaAktifMingguIni: number
}

interface AlertItem {
  id: string; tipe: 'essay' | 'deadline' | 'tidak_aktif'
  pesan: string; path: string; urgensi: 'tinggi' | 'sedang'
}

const menuGroups = [
  {
    label: 'Mengajar',
    items: [
      { icon: BookOpen, title: 'Buat Materi', path: '/guru/materi', bg: 'bg-indigo-500' },
      { icon: PenLine, title: 'Buat Kuis', path: '/guru/kuis', bg: 'bg-violet-500' },
      { icon: ClipboardCheck, title: 'Absensi', path: '/guru/absensi', bg: 'bg-teal-500' },
      { icon: Gamepad2, title: 'Live Quiz', path: '/guru/live', bg: 'bg-cyan-500' },
    ]
  },
  {
    label: 'Penilaian',
    items: [
      { icon: Medal, title: 'Input Nilai', path: '/guru/nilai', bg: 'bg-amber-500' },
      { icon: FileDown, title: 'Export Rapor', path: '/guru/nilai/export', bg: 'bg-blue-500' },
      { icon: Target, title: 'Mastery', path: '/guru/mastery', bg: 'bg-orange-500' },
      { icon: FlaskConical, title: 'Analytics Pro', path: '/guru/analytics-pro', bg: 'bg-red-500' },
    ]
  },
  {
    label: 'Komunikasi & Lainnya',
    items: [
      { icon: Megaphone, title: 'Pengumuman', path: '/guru/pengumuman', bg: 'bg-rose-500' },
      { icon: MessageSquare, title: 'Forum', path: '/forum', bg: 'bg-sky-500' },
      { icon: CalendarDays, title: 'Jadwal', path: '/jadwal', bg: 'bg-slate-500' },
      { icon: BarChart2, title: 'Analytics', path: '/guru/analytics', bg: 'bg-indigo-400' },
    ]
  },
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
    let essayCount = 0, deadlineCount = 0, avgNilai = 0, siswaAktif = 0
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
      if (essayCount > 0) newAlerts.push({ id: 'essay', tipe: 'essay', pesan: `${essayCount} jawaban essay menunggu penilaian`, path: '/guru/kuis', urgensi: essayCount >= 5 ? 'tinggi' : 'sedang' })
      const deadlineData = deadlineRes.data || []
      deadlineCount = deadlineData.length
      deadlineData.slice(0, 2).forEach((k: any) => {
        const sisa = Math.ceil((new Date(k.tanggal_selesai).getTime() - Date.now()) / 86400000)
        newAlerts.push({ id: k.id, tipe: 'deadline', pesan: `"${k.judul}" tutup dalam ${sisa} hari`, path: `/guru/kuis/${k.id}/analytics`, urgensi: sisa <= 1 ? 'tinggi' : 'sedang' })
      })
      const nilaiData = nilaiRes.data || []
      avgNilai = nilaiData.length ? Math.round(nilaiData.reduce((s: number, n: any) => s + (n.nilai_persen || 0), 0) / nilaiData.length) : 0
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
  const hadirPct = stats.totalSiswa > 0 ? Math.round((stats.hadirHariIni / stats.totalSiswa) * 100) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 55%, #6366f1 100%)' }}>
        {/* blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)', transform: 'translate(35%, -35%)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', transform: 'translate(-30%, 30%)' }} />

        {/* Navbar */}
        <div className="relative max-w-5xl mx-auto px-4 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center font-black text-white text-sm">S</div>
            <div>
              <p className="font-black text-white text-base leading-none">SANDEQ</p>
              <p className="text-indigo-300 text-[10px] leading-none mt-0.5">Portal Guru</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block mr-1">
              <p className="text-sm font-semibold text-white leading-none">{user?.nama}</p>
              <p className="text-indigo-300 text-[10px] mt-0.5">Guru</p>
            </div>
            <button onClick={() => router.push('/guru/notifikasi')} className="relative w-9 h-9 bg-white/15 hover:bg-white/25 rounded-xl flex items-center justify-center transition border border-white/20">
              <Bell size={16} className="text-white" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
            <button onClick={async () => { await logout(); router.replace('/login') }} className="w-9 h-9 bg-white/15 hover:bg-white/25 rounded-xl flex items-center justify-center transition border border-white/20">
              <LogOut size={15} className="text-white" />
            </button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative max-w-5xl mx-auto px-4 pt-5 pb-8">
          <p className="text-indigo-300 text-xs mb-0.5">Selamat mengajar 👋</p>
          <h1 className="text-white font-black text-2xl leading-tight mb-1">{nama}</h1>
          <p className="text-indigo-200 text-sm mb-6">Ringkasan kelas hari ini</p>

          {/* Stat Pills — 4 utama */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { emoji: '👥', label: 'Total Siswa', value: stats.totalSiswa, sub: 'terdaftar', accent: 'bg-white/10' },
              { emoji: '✅', label: 'Hadir Hari Ini', value: `${stats.hadirHariIni} (${hadirPct}%)`, sub: 'siswa', accent: 'bg-white/10' },
              { emoji: '📊', label: 'Avg Nilai', value: stats.avgNilaiKelas || '—', sub: 'minggu ini', accent: 'bg-white/10' },
              { emoji: '⚡', label: 'Siswa Aktif', value: stats.siswaAktifMingguIni, sub: '7 hari terakhir', accent: 'bg-white/10' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-3 text-center">
                <div className="text-xl mb-1">{s.emoji}</div>
                <div className="text-white font-black text-lg leading-none">{s.value}</div>
                <div className="text-indigo-200 text-[10px] mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mt-4 space-y-2">
              {alerts.map(alert => (
                <button key={alert.id} onClick={() => router.push(alert.path)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition hover:opacity-90 ${alert.urgensi === 'tinggi' ? 'bg-red-500/20 border border-red-400/30' : 'bg-amber-500/15 border border-amber-400/20'}`}>
                  <AlertTriangle size={15} className={alert.urgensi === 'tinggi' ? 'text-red-300 flex-shrink-0' : 'text-amber-300 flex-shrink-0'} />
                  <span className="text-white/90 text-xs flex-1">{alert.pesan}</span>
                  <ChevronRight size={13} className="text-white/40 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Wave */}
        <svg viewBox="0 0 1440 32" className="w-full block" style={{ marginBottom: -1 }} preserveAspectRatio="none">
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,32 L0,32 Z" fill="var(--bg)" />
        </svg>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-6">

        {/* Quick Actions */}
        <section>
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-3)' }}>Aksi Cepat</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '+ Materi', path: '/guru/materi', bg: 'bg-indigo-600' },
              { label: '+ Kuis', path: '/guru/kuis', bg: 'bg-violet-600' },
              { label: 'Absensi Sekarang', path: '/guru/absensi', bg: 'bg-teal-600' },
              { label: '🎮 Live Quiz', path: '/guru/live', bg: 'bg-cyan-600' },
              ...(stats.essayBelumDinilai > 0 ? [{ label: `Nilai Essay (${stats.essayBelumDinilai})`, path: '/guru/kuis', bg: 'bg-red-600' }] : []),
            ].map(b => (
              <button key={b.path + b.label} onClick={() => router.push(b.path)}
                className={`${b.bg} text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition active:scale-95 shadow-sm`}>
                {b.label}
              </button>
            ))}
          </div>
        </section>

        {/* Stat Cards Row 2 */}
        <section>
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-3)' }}>Konten & Aktivitas</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { emoji: '📖', label: 'Materi', value: stats.totalMateri, sub: 'dibuat', color: 'text-indigo-600' },
              { emoji: '✏️', label: 'Kuis', value: stats.totalKuis, sub: 'dibuat', color: 'text-violet-600' },
              { emoji: '⏳', label: 'Essay Pending', value: stats.essayBelumDinilai, sub: 'belum dinilai', color: stats.essayBelumDinilai > 0 ? 'text-red-600' : 'text-gray-400' },
              { emoji: '⏰', label: 'Deadline Dekat', value: stats.kuisDeadlineDekat, sub: 'dalam 3 hari', color: stats.kuisDeadlineDekat > 0 ? 'text-orange-600' : 'text-gray-400' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="text-xl mb-1">{s.emoji}</div>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-2)' }}>{s.label}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Menu Groups */}
        {menuGroups.map(group => (
          <section key={group.label}>
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-3)' }}>{group.label}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {group.items.map(item => (
                <button key={item.path} onClick={() => router.push(item.path)}
                  className="group relative flex flex-col gap-3 p-4 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                    <item.icon size={18} strokeWidth={2.5} />
                  </div>
                  <h4 className="font-bold text-sm leading-tight" style={{ color: 'var(--text-1)' }}>{item.title}</h4>
                  <ChevronRight size={14} className="absolute top-4 right-4 opacity-25 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--primary)' }} />
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* Dimensi Kelas */}
        {dimensiKelas && (
          <section>
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-3)' }}>Dimensi Belajar Kelas</p>
            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="space-y-3">
                {(Object.keys(DIMENSI) as DimensiKey[]).map(key => {
                  const d = DIMENSI[key]
                  const total = Math.max(Object.values(dimensiKelas).reduce((a, b) => a + b, 0), 1)
                  const pct = Math.round((dimensiKelas[key] / total) * 100)
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span style={{ color: 'var(--text-2)' }}>{d.emoji} {d.label}</span>
                        <span style={{ color: 'var(--text-3)' }}>{pct}%</span>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ background: 'var(--primary-light)' }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        <p className="text-center text-xs pb-4" style={{ color: 'var(--text-3)' }}>SANDEQ · SMAN 6 Pangkep</p>
      </main>
    </div>
  )
}
