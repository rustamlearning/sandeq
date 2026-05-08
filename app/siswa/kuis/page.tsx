'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Kuis } from '@/lib/supabase'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileQuestion,
  Lock,
  Play,
  Timer,
} from 'lucide-react'

interface KuisWithStatus extends Kuis {
  guru?: { nama: string }
  sudah_dikerjakan?: boolean
  skor?: number | null
  jumlah_soal?: number
}

function getDeadlineStatus(k: KuisWithStatus): 'belum_buka' | 'open' | 'tutup' | null {
  const now = new Date()
  if (k.tanggal_mulai && new Date(k.tanggal_mulai) > now) return 'belum_buka'
  if (k.tanggal_selesai && new Date(k.tanggal_selesai) < now) return 'tutup'
  return null
}

function formatDeadline(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function DeadlineBadge({ k }: { k: KuisWithStatus }) {
  const now = new Date()
  if (k.tanggal_selesai) {
    const deadline = new Date(k.tanggal_selesai)
    const diffH = (deadline.getTime() - now.getTime()) / 3600000
    if (diffH > 0 && diffH <= 24) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">
          <Timer size={12} /> {Math.round(diffH)}j lagi
        </span>
      )
    }
    if (diffH > 24 && diffH <= 72) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
          <CalendarClock size={12} /> {Math.ceil(diffH / 24)} hari lagi
        </span>
      )
    }
  }
  return null
}

export default function KuisSiswaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [kuisList, setKuisList] = useState<KuisWithStatus[]>([])

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'siswa') { router.replace('/login'); return }
      await load(u)
      setLoading(false)
    }
    init()
  }, [router])

  async function load(currentUser: User) {
    const { data: kuisData } = await supabase
      .from('kuis')
      .select('*, guru:guru_id(nama)')
      .eq('kelas_id', currentUser.kelas_id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (!kuisData) { setKuisList([]); return }

    const kuisIds = kuisData.map((k) => k.id)
    const [{ data: pengerjaan }, { data: soalCount }] = await Promise.all([
      supabase.from('pengerjaan').select('kuis_id, skor').eq('siswa_id', currentUser.id).in('kuis_id', kuisIds),
      supabase.from('soal').select('kuis_id').in('kuis_id', kuisIds),
    ])

    const pengerjaanMap = new Map((pengerjaan || []).map((p) => [p.kuis_id, p.skor]))
    const soalCountMap = new Map<string, number>()
    ;(soalCount || []).forEach((s) => {
      soalCountMap.set(s.kuis_id, (soalCountMap.get(s.kuis_id) || 0) + 1)
    })

    setKuisList(kuisData.map((k: any) => ({
      ...k,
      sudah_dikerjakan: pengerjaanMap.has(k.id),
      skor: pengerjaanMap.get(k.id) ?? null,
      jumlah_soal: soalCountMap.get(k.id) || 0,
    })))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F9FF]">
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 h-16" />
        <div className="max-w-2xl mx-auto px-4 py-5">
          <SkeletonList count={4} />
        </div>
      </div>
    )
  }

  const selesai = kuisList.filter((k) => k.sudah_dikerjakan).length
  const belum = kuisList.filter((k) => !k.sudah_dikerjakan && getDeadlineStatus(k) !== 'tutup' && (k.jumlah_soal || 0) > 0).length
  const avgSkor = selesai > 0
    ? Math.round(kuisList.filter((k) => k.sudah_dikerjakan && k.skor !== null).reduce((s, k) => s + (k.skor || 0), 0) / selesai)
    : null

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-gradient-to-r from-indigo-700 to-indigo-500 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <button
            onClick={() => router.push('/siswa')}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
            aria-label="Kembali ke dashboard siswa"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Kuis & Ulangan</h1>
            <p className="text-white/80 text-sm">{kuisList.length} kuis tersedia</p>
          </div>
        </div>

        {kuisList.length > 0 && (
          <div className="max-w-2xl mx-auto px-4 pb-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Selesai', value: selesai, icon: CheckCircle2 },
              { label: 'Belum', value: belum, icon: Clock3 },
              { label: 'Rata-rata', value: avgSkor !== null ? avgSkor : '–', icon: BarChart3 },
            ].map((s) => {
              const Icon = s.icon
              return (
              <div key={s.label} className="bg-white/15 rounded-xl px-3 py-2 text-center">
                <Icon className="mx-auto h-4 w-4" />
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/70">{s.label}</p>
              </div>
            )})}
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {kuisList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm">
            <EmptyState
              type="kuis"
              title="Belum ada kuis aktif"
              description="Gurumu belum menambahkan kuis untuk kelasmu. Pantau terus ya!"
            />
          </div>
        ) : (
          kuisList.map((k) => {
            const deadlineStatus = getDeadlineStatus(k)
            const tipeColor = k.tipe === 'ulangan' ? 'bg-orange-100 text-orange-700' : 'bg-sky-100 text-sky-700'
            const isClosed = deadlineStatus === 'tutup'
            const isLocked = deadlineStatus === 'belum_buka'

            return (
              <div
                key={k.id}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${
                  k.sudah_dikerjakan ? 'border-green-200' :
                  isClosed ? 'border-gray-200 opacity-60' :
                  'border-gray-100'
                }`}
              >
                <div className={`h-1 ${k.sudah_dikerjakan ? 'bg-green-400' : isClosed ? 'bg-gray-300' : 'bg-[#2E86C1]'}`} />
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                      k.sudah_dikerjakan ? 'bg-green-50' : isClosed ? 'bg-gray-100' : 'bg-violet-50'
                    }`}>
                      {k.sudah_dikerjakan ? <CheckCircle2 size={20} /> : isClosed ? <Lock size={20} /> : isLocked ? <Clock3 size={20} /> : <FileQuestion size={20} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{k.mapel}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipeColor}`}>{k.tipe}</span>
                        <DeadlineBadge k={k} />
                      </div>
                      <h4 className="font-bold text-gray-800 text-sm leading-snug">{k.judul}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {k.jumlah_soal} soal · {k.durasi_menit} menit · {k.guru?.nama || 'Guru'}
                      </p>
                      {k.tanggal_selesai && (
                        <p className={`text-xs mt-1 ${isClosed ? 'text-red-500' : 'text-gray-400'}`}>
                          {isClosed ? 'Ditutup' : 'Deadline'}: {formatDeadline(k.tanggal_selesai)}
                        </p>
                      )}
                      {k.tanggal_mulai && isLocked && (
                        <p className="text-xs text-amber-600 mt-1">
                          Buka: {formatDeadline(k.tanggal_mulai)}
                        </p>
                      )}
                    </div>

                    {k.sudah_dikerjakan && k.skor != null && (
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        (k.skor ?? 0) >= 85 ? 'bg-green-100 text-green-700' :
                        (k.skor ?? 0) >= 70 ? 'bg-blue-100 text-blue-700' :
                        (k.skor ?? 0) >= 60 ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {k.skor}
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    {k.sudah_dikerjakan ? (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                        <CheckCircle2 size={16} /> Sudah dikerjakan
                      </div>
                    ) : isClosed ? (
                      <div className="text-sm text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                        Kuis sudah ditutup
                      </div>
                    ) : isLocked ? (
                      <div className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                        Belum bisa dibuka
                      </div>
                    ) : k.jumlah_soal === 0 ? (
                      <p className="text-xs text-gray-400 italic px-1">Soal belum tersedia</p>
                    ) : (
                      <button
                        onClick={() => router.push(`/siswa/kuis/${k.id}`)}
                        aria-label={`Mulai kerjakan ${k.judul}`}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-700 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-blue-600 transition shadow-sm"
                      >
                        <span className="inline-flex items-center justify-center gap-2">
                          <Play size={15} /> Mulai Kerjakan <ChevronRight size={15} />
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </main>
    </div>
  )
}
