'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'
import { ArrowLeft, Bell, CheckCircle2, ClipboardList, MessageSquare, Timer, TriangleAlert } from 'lucide-react'

interface Notif {
  id: string
  tipe: 'kuis_dikerjakan' | 'forum_reply' | 'kuis_deadline'
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
  kuis_dikerjakan: { icon: ClipboardList, bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', label: 'Kuis Dikerjakan' },
  forum_reply:     { icon: MessageSquare, bg: 'bg-sky-50',    border: 'border-sky-200',    text: 'text-sky-700',    label: 'Forum' },
  kuis_deadline:   { icon: Timer, bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: 'Deadline' },
}

export default function GuruNotifikasiPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifs, setNotifs] = useState<Notif[]>([])

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'guru') { router.replace('/login'); return }
      await load(u)
      setLoading(false)
    }
    init()
  }, [router])

  async function load(u: User) {
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString()
    const threeDaysLater = new Date(now.getTime() + 3 * 86400000).toISOString()

    const [{ data: kuisGuru }, { data: forumPosts }] = await Promise.all([
      supabase.from('kuis').select('id, judul, tanggal_selesai').eq('guru_id', u.id).eq('is_published', true),
      supabase.from('forum').select('id').eq('author_id', u.id).is('parent_id', null),
    ])

    const kuisIds = (kuisGuru || []).map((k) => k.id)
    const forumIds = (forumPosts || []).map((f) => f.id)

    const [{ data: pengerjaan }, { data: forumReplies }] = await Promise.all([
      kuisIds.length > 0
        ? supabase.from('pengerjaan').select('kuis_id, created_at, siswa_id').in('kuis_id', kuisIds).gte('created_at', threeDaysAgo).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      forumIds.length > 0
        ? supabase.from('forum').select('id, konten, author_nama, created_at, parent_id').in('parent_id', forumIds).gte('created_at', threeDaysAgo).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ])

    const result: Notif[] = []
    const kuisMap = new Map((kuisGuru || []).map((k) => [k.id, k]))

    // Group pengerjaan by kuis
    const pengerjaanByKuis = new Map<string, number>()
    for (const p of (pengerjaan || [])) {
      pengerjaanByKuis.set(p.kuis_id, (pengerjaanByKuis.get(p.kuis_id) || 0) + 1)
    }
    for (const [kuisId, count] of pengerjaanByKuis) {
      const k = kuisMap.get(kuisId)
      if (!k) continue
      // Use most recent submission time
      const latest = (pengerjaan || []).filter((p) => p.kuis_id === kuisId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      result.push({
        id: `kuis-${kuisId}`,
        tipe: 'kuis_dikerjakan',
        judul: `${count} siswa mengerjakan "${k.judul}"`,
        deskripsi: `dalam 3 hari terakhir`,
        waktu: latest?.created_at || now.toISOString(),
        path: `/guru/kuis/${kuisId}/analytics`,
      })
    }

    // Deadline kuis dalam 3 hari ke depan
    for (const k of (kuisGuru || [])) {
      if (!k.tanggal_selesai) continue
      const deadline = new Date(k.tanggal_selesai)
      const diffH = (deadline.getTime() - now.getTime()) / 3600000
      if (diffH > 0 && diffH <= 72) {
        result.push({
          id: `deadline-${k.id}`,
          tipe: 'kuis_deadline',
          judul: `Deadline: ${k.judul}`,
          deskripsi: `Kuis tutup dalam ${timeUntil(k.tanggal_selesai)}`,
          waktu: k.tanggal_selesai,
          path: `/guru/kuis`,
          urgent: diffH <= 24,
        })
      }
    }

    // Forum replies
    for (const r of (forumReplies || [])) {
      result.push({
        id: `forum-${r.id}`,
        tipe: 'forum_reply',
        judul: `${r.author_nama} membalas pertanyaanmu`,
        deskripsi: r.konten?.slice(0, 80) + (r.konten?.length > 80 ? '...' : '') || '',
        waktu: r.created_at,
        path: '/forum',
      })
    }

    result.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1
      if (!a.urgent && b.urgent) return 1
      if (a.tipe === 'kuis_deadline' && b.tipe !== 'kuis_deadline') return -1
      if (a.tipe !== 'kuis_deadline' && b.tipe === 'kuis_deadline') return 1
      return new Date(b.waktu).getTime() - new Date(a.waktu).getTime()
    })

    setNotifs(result)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 animate-pulse text-[#1A4A7A]" />
          <p className="text-gray-500">Memuat notifikasi...</p>
        </div>
      </div>
    )
  }

  const urgentCount = notifs.filter((n) => n.urgent).length

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <button onClick={() => router.push('/guru')} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition" aria-label="Kembali ke dashboard guru">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Notifikasi</h1>
            <p className="text-white/80 text-sm">{notifs.length} notifikasi{urgentCount > 0 ? ` · ${urgentCount} mendesak` : ''}</p>
          </div>
          {urgentCount > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{urgentCount} urgent</div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-2">
        {notifs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-11 w-11 text-emerald-500" />
            <p className="font-semibold text-gray-700">Tidak ada notifikasi baru</p>
            <p className="text-sm text-gray-400 mt-1">Aktivitas siswa & deadline akan muncul di sini</p>
          </div>
        ) : (
          notifs.map((n) => {
            const cfg = TIPE_CONFIG[n.tipe]
            const Icon = cfg.icon
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
                    <Icon size={19} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      {n.urgent && <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 animate-pulse"><TriangleAlert size={12} /> Mendesak</span>}
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
