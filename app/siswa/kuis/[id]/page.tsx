'use client'

import { useEffect, useState, useCallback } from 'react'
import { useToast } from '@/components/Toast'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Kuis, Soal } from '@/lib/supabase'

export default function KerjakanKuisPage() {
  const router = useRouter()
  const { toast } = useToast()
  const params = useParams()
  const kuisId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [kuis, setKuis] = useState<Kuis | null>(null)
  const [soalList, setSoalList] = useState<Soal[]>([])
  const [loading, setLoading] = useState(true)

  const [currentIdx, setCurrentIdx] = useState(0)
  const [jawaban, setJawaban] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0) // detik
  const [submitting, setSubmitting] = useState(false)
  const [hasil, setHasil] = useState<{ skor: number; benar: number; total: number } | null>(null)

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'siswa') {
        router.replace('/login')
        return
      }
      setUser(u)

      // Cek apakah sudah dikerjakan
      const { data: existing } = await supabase
        .from('pengerjaan')
        .select('id, skor')
        .eq('siswa_id', u.id)
        .eq('kuis_id', kuisId)
        .maybeSingle()

      if (existing) {
        toast('info', 'Kamu sudah pernah mengerjakan kuis ini')
        router.replace('/siswa/kuis')
        return
      }

      const [{ data: kuisData }, { data: soalData }] = await Promise.all([
        supabase.from('kuis').select('*').eq('id', kuisId).single(),
        supabase.from('soal').select('*').eq('kuis_id', kuisId).order('id', { ascending: true }),
      ])

      if (!kuisData || !soalData || soalData.length === 0) {
        toast('error', 'Kuis tidak tersedia')
        router.replace('/siswa/kuis')
        return
      }

      setKuis(kuisData)
      setSoalList(soalData)
      setTimeLeft((kuisData.durasi_menit || 30) * 60)
      setLoading(false)
    }
    init()
  }, [router, kuisId])

  const handleSubmit = useCallback(async () => {
    if (!user || submitting) return
    setSubmitting(true)

    // Hitung skor
    let benar = 0
    soalList.forEach((s) => {
      const userJawab = (jawaban[s.id] || '').trim()
      const correct = s.jawaban.trim()
      if (s.tipe === 'isian') {
        if (userJawab.toLowerCase() === correct.toLowerCase()) benar++
      } else {
        if (userJawab === correct) benar++
      }
    })

    const skor = Math.round((benar / soalList.length) * 100)

    await supabase.from('pengerjaan').insert({
      siswa_id: user.id,
      kuis_id: kuisId,
      jawaban_siswa: jawaban,
      skor,
    })

    // Kalau ulangan, masukkan ke nilai
    if (kuis?.tipe === 'ulangan') {
      await supabase.from('nilai').insert({
        siswa_id: user.id,
        mapel: kuis.mapel,
        komponen: kuis.judul,
        bobot: 1,
        nilai: skor,
        semester: 1,
        diinput_oleh: kuis.guru_id,
        catatan: 'Otomatis dari ulangan',
      })
    }

    setHasil({ skor, benar, total: soalList.length })
    setSubmitting(false)
  }, [user, submitting, soalList, jawaban, kuis, kuisId])

  // Timer countdown
  useEffect(() => {
    if (loading || hasil || timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval)
          handleSubmit()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [loading, hasil, timeLeft, handleSubmit])

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat kuis...</p>
      </div>
    )
  }

  // Halaman hasil
  if (hasil) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">{hasil.skor >= 75 ? '🎉' : hasil.skor >= 50 ? '👍' : '💪'}</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Selesai!</h1>
          <p className="text-gray-500 mb-6">{kuis?.judul}</p>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Nilai Kamu</p>
            <p className="text-6xl font-bold text-blue-600">{hasil.skor}</p>
            <p className="text-sm text-gray-600 mt-2">
              {hasil.benar} dari {hasil.total} jawaban benar
            </p>
          </div>

          {kuis?.tipe === 'ulangan' && (
            <p className="text-xs text-gray-500 mb-4">
              Nilai ini sudah otomatis tersimpan di rapor kamu.
            </p>
          )}

          <button
            onClick={() => router.push('/siswa/kuis')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Kembali ke Daftar Kuis
          </button>
        </div>
      </div>
    )
  }

  const soal = soalList[currentIdx]
  const totalSoal = soalList.length
  const terjawab = Object.keys(jawaban).filter((k) => jawaban[k]).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header dengan timer */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-800 text-sm">{kuis?.judul}</h1>
            <p className="text-xs text-gray-500">
              {terjawab}/{totalSoal} terjawab
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-mono font-bold text-lg ${
            timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Navigasi nomor soal */}
        <div className="flex flex-wrap gap-2 mb-6">
          {soalList.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentIdx(idx)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                idx === currentIdx
                  ? 'bg-blue-600 text-white'
                  : jawaban[s.id]
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Soal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
          <p className="text-xs text-gray-500 mb-2">Soal {currentIdx + 1} dari {totalSoal}</p>
          <p className="text-lg text-gray-800 mb-6 whitespace-pre-wrap">{soal.teks}</p>

          {soal.tipe === 'pilgan' && soal.pilihan && (
            <div className="space-y-2">
              {soal.pilihan.map((p, i) => {
                if (!p) return null
                const isSelected = jawaban[soal.id] === p
                return (
                  <button
                    key={i}
                    onClick={() => setJawaban({ ...jawaban, [soal.id]: p })}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                    {p}
                  </button>
                )
              })}
            </div>
          )}

          {soal.tipe === 'benar_salah' && (
            <div className="space-y-2">
              {['Benar', 'Salah'].map((p) => {
                const isSelected = jawaban[soal.id] === p
                return (
                  <button
                    key={p}
                    onClick={() => setJawaban({ ...jawaban, [soal.id]: p })}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          )}

          {soal.tipe === 'isian' && (
            <input
              type="text"
              value={jawaban[soal.id] || ''}
              onChange={(e) => setJawaban({ ...jawaban, [soal.id]: e.target.value })}
              placeholder="Ketik jawaban kamu di sini..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500"
            />
          )}
        </div>

        {/* Tombol navigasi */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50"
          >
            ← Sebelumnya
          </button>

          {currentIdx < totalSoal - 1 ? (
            <button
              onClick={() => setCurrentIdx(currentIdx + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Selanjutnya →
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm(`Yakin selesai? ${terjawab}/${totalSoal} soal terjawab.`)) {
                  handleSubmit()
                }
              }}
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 font-medium"
            >
              {submitting ? 'Mengirim...' : 'Selesai & Kirim'}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}