'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Kuis } from '@/lib/supabase'

interface KuisWithStatus extends Kuis {
  guru?: { nama: string }
  sudah_dikerjakan?: boolean
  skor?: number | null
  jumlah_soal?: number
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
      .eq('aktif', true)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Memuat kuis...</p>
        </div>
      </div>
    )
  }

  const selesai = kuisList.filter((k) => k.sudah_dikerjakan).length
  const belum = kuisList.filter((k) => !k.sudah_dikerjakan && (k.jumlah_soal || 0) > 0).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/siswa')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-bold"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold leading-tight">Kuis & Ulangan</h1>
            <p className="text-blue-200 text-xs">{kuisList.length} kuis tersedia</p>
          </div>
        </div>

        {/* Mini stats */}
        {kuisList.length > 0 && (
          <div className="max-w-2xl mx-auto px-4 pb-4 flex gap-3">
            <div className="flex-1 bg-white/15 rounded-xl px-3 py-2 text-center">
              <p className="text-xl font-bold">{selesai}</p>
              <p className="text-xs text-blue-200">Selesai</p>
            </div>
            <div className="flex-1 bg-white/15 rounded-xl px-3 py-2 text-center">
              <p className="text-xl font-bold">{belum}</p>
              <p className="text-xs text-blue-200">Belum dikerjakan</p>
            </div>
            <div className="flex-1 bg-white/15 rounded-xl px-3 py-2 text-center">
              <p className="text-xl font-bold">
                {selesai > 0
                  ? Math.round(
                      kuisList
                        .filter((k) => k.sudah_dikerjakan && k.skor !== null)
                        .reduce((s, k) => s + (k.skor || 0), 0) / selesai
                    )
                  : '-'}
              </p>
              <p className="text-xs text-blue-200">Rata-rata</p>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {kuisList.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-semibold text-gray-700">Belum ada kuis aktif</p>
            <p className="text-sm text-gray-500 mt-1">Gurumu belum menambahkan kuis untuk kelasmu.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {kuisList.map((k) => {
              const tipeColor = k.tipe === 'ulangan'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-sky-100 text-sky-700'

              return (
                <div
                  key={k.id}
                  className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${
                    k.sudah_dikerjakan ? 'border-green-200' : 'border-gray-100'
                  }`}
                >
                  {/* Top bar accent */}
                  <div className={`h-1 ${k.sudah_dikerjakan ? 'bg-green-400' : 'bg-blue-500'}`} />

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                        k.sudah_dikerjakan ? 'bg-green-50' : 'bg-blue-50'
                      }`}>
                        {k.sudah_dikerjakan ? '✅' : k.tipe === 'ulangan' ? '📝' : '🧩'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                            {k.mapel}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipeColor}`}>
                            {k.tipe}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm leading-snug">{k.judul}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {k.jumlah_soal} soal · {k.durasi_menit} menit · {k.guru?.nama || 'Guru'}
                        </p>
                      </div>

                      {/* Score badge */}
                      {k.sudah_dikerjakan && k.skor !== null && (
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                          k.skor >= 85 ? 'bg-green-100 text-green-700' :
                          k.skor >= 70 ? 'bg-blue-100 text-blue-700' :
                          k.skor >= 60 ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {k.skor}
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div className="mt-3">
                      {k.sudah_dikerjakan ? (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                          <span>✓ Sudah dikerjakan</span>
                        </div>
                      ) : k.jumlah_soal === 0 ? (
                        <p className="text-xs text-gray-400 italic px-1">Soal belum tersedia</p>
                      ) : (
                        <button
                          onClick={() => router.push(`/siswa/kuis/${k.id}`)}
                          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-sm"
                        >
                          Mulai Kerjakan →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
