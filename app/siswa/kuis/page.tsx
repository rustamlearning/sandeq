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
      if (!u || u.role !== 'siswa') {
        router.replace('/login')
        return
      }
      await load(u)
      setLoading(false)
    }
    init()
  }, [router])

  async function load(currentUser: User) {
    // Ambil kuis aktif untuk kelas siswa
    const { data: kuisData } = await supabase
      .from('kuis')
      .select('*, guru:guru_id(nama)')
      .eq('kelas_id', currentUser.kelas_id)
      .eq('aktif', true)
      .order('created_at', { ascending: false })

    if (!kuisData) {
      setKuisList([])
      return
    }

    // Ambil pengerjaan siswa & jumlah soal per kuis
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

    const enriched: KuisWithStatus[] = kuisData.map((k: any) => ({
      ...k,
      sudah_dikerjakan: pengerjaanMap.has(k.id),
      skor: pengerjaanMap.get(k.id) ?? null,
      jumlah_soal: soalCountMap.get(k.id) || 0,
    }))

    setKuisList(enriched)
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/siswa')} className="text-gray-500 hover:text-gray-700">
            ← Kembali
          </button>
          <h1 className="text-xl font-bold text-gray-800">Kuis & Ulangan</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {kuisList.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">Belum ada kuis aktif untuk kelas kamu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kuisList.map((k) => (
              <div key={k.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                    {k.mapel}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    k.tipe === 'ulangan' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {k.tipe}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">{k.judul}</h4>
                <p className="text-sm text-gray-500 mb-3">
                  {k.jumlah_soal} soal · {k.durasi_menit} menit · Oleh {k.guru?.nama || 'Guru'}
                </p>

                {k.sudah_dikerjakan ? (
                  <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg">
                    <span className="text-sm text-green-700 font-medium">
                      ✓ Sudah dikerjakan
                    </span>
                    <span className="text-lg font-bold text-green-700">
                      {k.skor !== null ? `${k.skor}` : '-'}
                    </span>
                  </div>
                ) : k.jumlah_soal === 0 ? (
                  <p className="text-sm text-gray-400 italic">Belum ada soal</p>
                ) : (
                  <button
                    onClick={() => router.push(`/siswa/kuis/${k.id}`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Mulai Kerjakan
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}