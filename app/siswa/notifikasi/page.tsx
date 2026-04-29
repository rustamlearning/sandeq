'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'

interface Notif {
  id: string
  tipe: 'pengumuman' | 'kuis_deadline' | 'kuis_baru'
  judul: string
  deskripsi: string
  waktu: string
  path: string
  urgent?: boolean
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  if (h < 24) return `${h} jam lalu`
  if (d < 7) return `${d} hari lalu`
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function timeUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return 'Kurang dari 1 jam'
  if (h < 24) return `${h} jam lagi`
  return `${d} hari lagi`
}

const TIPE_CONFIG = {
  pengumuman: { icon: '📢', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', label: 'Pengumuman' },
  kuis_baru: { icon: '✏️', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', label: 'Kuis Baru' },
  kuis_deadline: { icon: '⏰', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: 'Deadline' },
}

export default function NotifikasiPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifs, setNotifs] = useState<Notif[]>([])

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'siswa') { router.replace('/login'); return }
      await load(u)
      setLoading(false)
    }
    init()
  }, [router])

  async function load(u: User) {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
    const threeDaysLater = new Date(now.getTime() + 3 * 86400000).toISOString()

    const [{ data: pengumuman }, { data: kuisData }, { data: pengerjaan }] = await Promise.all([
      supabase.from('pengumuman').select('id, judul, konten, created_at, kategori')
        .gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }).limit(10),
      supabase.from('kuis').select('id, judul, mapel, tanggal_selesai, created_at')
        .eq('kelas_id', u.kelas_id).eq('aktif', true)
        .order('created_at', { ascending: false }),
      supabase.from('pengerjaan').select('kuis_id').eq('siswa_id', u.id),
    ])

    const selesaiSet = new Set((pengerjaan || []).map((p) => p.kuis_id))
    const result: Notif[] = []

    // Pengumuman baru (last 7 days)
    for (const p of (pengumuman || [])) {
      result.push({
        id: `pengumuman-${p.id}`,
        tipe: 'pengumuman',
        judul: p.judul,
        deskripsi: p.konten?.slice(0, 80) + (p.konten?.length > 80 ? '...' : '') || '',
        waktu: p.created_at,
        path: '/siswa/pengumuman',
      })
    }

    // Kuis baru (last 3 days) dan kuis deadline (next 3 days)
    for (const k of (kuisData || [])) {
      const kCreated = new Date(k.created_at)
      const diffCreatedH = (now.getTime() - kCreated.getTime()) / 3600000

      // Kuis baru di 3 hari terakhir yang belum dikerjakan
      if (diffCreatedH <= 72 && !selesaiSet.has(k.id)) {
        result.push({
          id: `kuis-baru-${k.id}`,
          tipe: 'kuis_baru',
          judul: `Kuis baru: ${k.judul}`,
          deskripsi: k.mapel,
          waktu: k.created_at,
          path: '/siswa/kuis',
        })
      }

      // Deadline dalam 3 hari ke depan yang belum dikerjakan
      if (k.tanggal_selesai && !selesaiSet.has(k.id)) {
        const deadline = new Date(k.tanggal_selesai)
        const diffDeadlineH = (deadline.getTime() - now.getTime()) / 3600000
        if (diffDeadlineH > 0 && diffDeadlineH <= 72) {
          result.push({
            id: `kuis-deadline-${k.id}`,
            tipe: 'kuis_deadline',
            judul: `Deadline: ${k.judul}`,
            deskripsi: `${k.mapel} · Selesai dalam ${timeUntil(k.tanggal_selesai)}`,
            waktu: k.tanggal_selesai,
            path: `/siswa/kuis/${k.id}`,
            urgent: diffDeadlineH <= 24,
          })
        }
      }
    }

    // Sort: urgent deadline first, then by waktu desc
    result.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1
      if (!a.urgent && b.urgent) return 1
      // deadline notifs sort by deadline time ascending, others by created desc
      if (a.tipe === 'kuis_deadline' && b.tipe === 'kuis_deadline') {
        return new Date(a.waktu).getTime() - new Date(b.waktu).getTime()
      }
      return new Date(b.waktu).getTime() - new Date(a.waktu).getTime()
    })

    setNotifs(result)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🔔</div>
          <p className="text-gray-500">Memuat notifikasi...</p>
        </div>
      </div>
    )
  }

  const urgentCount = notifs.filter((n) => n.urgent).length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#0A2D52] to-[#1A4A7A] shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <button
            onClick={() => router.push('/siswa')}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Notifikasi</h1>
            <p className="text-white/80 text-sm">
              {notifs.length} notifikasi{urgentCount > 0 ? ` · ${urgentCount} mendesak` : ''}
            </p>
          </div>
          {urgentCount > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {urgentCount} urgent
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-2">
        {notifs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <p className="font-semibold text-gray-700">Semua beres!</p>
            <p className="text-sm text-gray-400 mt-1">Tidak ada notifikasi baru dalam 7 hari terakhir</p>
          </div>
        ) : (
          notifs.map((n) => {
            const cfg = TIPE_CONFIG[n.tipe]
            return (
              <button
                key={n.id}
                onClick={() => router.push(n.path)}
                className={`w-full text-left bg-white rounded-xl shadow-sm border ${
                  n.urgent ? 'border-red-300 ring-1 ring-red-200' : cfg.border
                } overflow-hidden hover:shadow-md transition`}
              >
                {n.urgent && <div className="h-1 bg-red-500" />}
                <div className="p-4 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center text-xl flex-shrink-0`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                      {n.urgent && (
                        <span className="text-xs font-bold text-red-600 animate-pulse">⚠️ Mendesak</span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-800 text-sm leading-snug">{n.judul}</p>
                    {n.deskripsi && <p className="text-xs text-gray-500 mt-0.5 truncate">{n.deskripsi}</p>}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-400 whitespace-nowrap">
                      {n.tipe === 'kuis_deadline' ? timeUntil(n.waktu) : timeAgo(n.waktu)}
                    </p>
                    <span className="text-gray-300 text-sm">›</span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </main>
    </div>
  )
}
