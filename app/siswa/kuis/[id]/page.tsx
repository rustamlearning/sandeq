'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from "@/lib/supabase"
import { awardXp } from '@/lib/gamification'
import { catatDimensiAktivitas, getDimensiFromMapel } from '@/lib/dimensi'

type TipeSoal = 'pg' | 'true_false' | 'isian' | 'essay' | 'matching'

interface Soal {
  id: string
  tipe: TipeSoal
  teks: string
  pilihan?: string[]
  pasangan?: { kiri: string; kanan: string }[]
  jawaban_benar?: string
  poin: number
  urutan: number
}

interface Kuis {
  id: string
  judul: string
  deskripsi?: string
  durasi_menit?: number
  max_attempt?: number
  acak_soal?: boolean
  acak_pilihan?: boolean
  tanggal_buka?: string
  tanggal_tutup?: string
  mapel?: string
}

export default function KuisAttemptPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  

  const [kuis, setKuis] = useState<Kuis | null>(null)
  const [soalList, setSoalList] = useState<Soal[]>([])
  const [jawaban, setJawaban] = useState<Record<string, string | string[]>>({})
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sisaWaktu, setSisaWaktu] = useState<number | null>(null)
  const [mulaiAt, setMulaiAt] = useState<number>(Date.now())

  // Shuffle helper
  const shuffle = <T,>(arr: T[]): T[] =>
    [...arr].sort(() => Math.random() - 0.5)

  useEffect(() => {
    loadKuis()
  }, [id])

  // Timer countdown
  useEffect(() => {
    if (!sisaWaktu || sisaWaktu <= 0) return
    const interval = setInterval(() => {
      setSisaWaktu(prev => {
        if (!prev || prev <= 1) {
          clearInterval(interval)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [sisaWaktu])

  async function loadKuis() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Load kuis
    const { data: kuisData, error: kuisErr } = await supabase
      .from('kuis')
      .select('*')
      .eq('id', id)
      .single()

    if (kuisErr || !kuisData) { setError('Kuis tidak ditemukan'); setLoading(false); return }

    // Validasi tanggal
    const now = new Date()
    if (kuisData.tanggal_buka && new Date(kuisData.tanggal_buka) > now) {
      setError('Kuis belum dibuka'); setLoading(false); return
    }
    if (kuisData.tanggal_tutup && new Date(kuisData.tanggal_tutup) < now) {
      setError('Kuis sudah ditutup'); setLoading(false); return
    }

    // Cek max attempt
    if (kuisData.max_attempt) {
      const { count } = await supabase
        .from('kuis_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('kuis_id', id)
        .eq('user_id', user.id)
        .eq('selesai', true)

      if ((count ?? 0) >= kuisData.max_attempt) {
        setError(`Kamu sudah mengerjakan kuis ini ${count} kali (maksimal ${kuisData.max_attempt}x)`)
        setLoading(false); return
      }
    }

    // Load soal
    const { data: soalData } = await supabase
      .from('soal')
      .select('*')
      .eq('kuis_id', id)
      .order('urutan')

    let soal: Soal[] = soalData ?? []
    if (kuisData.acak_soal) soal = shuffle(soal)
    if (kuisData.acak_pilihan) {
      soal = soal.map(s =>
        s.tipe === 'pg' && s.pilihan
          ? { ...s, pilihan: shuffle(s.pilihan) }
          : s
      )
    }

    // Buat attempt baru
    const { count: attemptCount } = await supabase
      .from('kuis_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('kuis_id', id)
      .eq('user_id', user.id)

    const { data: attempt, error: attemptErr } = await supabase
      .from('kuis_attempts')
      .insert({
        kuis_id: id,
        user_id: user.id,
        attempt_number: (attemptCount ?? 0) + 1,
        started_at: new Date().toISOString(),
        selesai: false,
      })
      .select()
      .single()

    if (attemptErr || !attempt) { setError('Gagal memulai kuis'); setLoading(false); return }

    setKuis(kuisData)
    setSoalList(soal)
    setAttemptId(attempt.id)
    setMulaiAt(Date.now())
    if (kuisData.durasi_menit) setSisaWaktu(kuisData.durasi_menit * 60)
    setLoading(false)
  }

  const handleJawaban = (soalId: string, nilai: string | string[]) => {
    setJawaban(prev => ({ ...prev, [soalId]: nilai }))
  }

  const handleMatchingPilih = (soalId: string, kiri: string, kanan: string) => {
    setJawaban(prev => {
      const existing = (prev[soalId] as string[] | undefined) ?? []
      // Format: ["kiri1::kanan1", "kiri2::kanan2"]
      const filtered = existing.filter(e => !e.startsWith(kiri + '::'))
      return { ...prev, [soalId]: [...filtered, `${kiri}::${kanan}`] }
    })
  }

  async function handleSubmit() {
    if (submitting || !attemptId) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const durasiDetik = Math.round((Date.now() - mulaiAt) / 1000)

    // Hitung nilai per soal
    let nilaiPG = 0, nilaiEssay = 0, totalPoin = 0, needsGrading = false

    const jawabanRows = soalList.map(soal => {
      const jawSiswa = jawaban[soal.id]
      let benar = false
      let poinDapat = 0
      let jawStr = ''
      let jawJsonb: unknown = null

      if (soal.tipe === 'pg' || soal.tipe === 'true_false') {
        jawStr = (jawSiswa as string) ?? ''
        benar = jawStr.toLowerCase() === (soal.jawaban_benar ?? '').toLowerCase()
        poinDapat = benar ? soal.poin : 0
        nilaiPG += poinDapat
      } else if (soal.tipe === 'isian') {
        jawStr = (jawSiswa as string) ?? ''
        // Fuzzy: trim + lowercase
        benar = jawStr.trim().toLowerCase() === (soal.jawaban_benar ?? '').trim().toLowerCase()
        poinDapat = benar ? soal.poin : 0
        nilaiPG += poinDapat
      } else if (soal.tipe === 'matching') {
        const pairs = (jawSiswa as string[] | undefined) ?? []
        jawJsonb = pairs
        // Partial scoring
        const kunciPairs = soal.pasangan?.map(p => `${p.kiri}::${p.kanan}`) ?? []
        const benarCount = pairs.filter(p => kunciPairs.includes(p)).length
        poinDapat = Math.round((benarCount / (kunciPairs.length || 1)) * soal.poin)
        benar = poinDapat === soal.poin
        nilaiPG += poinDapat
      } else if (soal.tipe === 'essay') {
        jawStr = (jawSiswa as string) ?? ''
        needsGrading = true
        nilaiEssay = 0 // Tunggu guru grade
      }

      totalPoin += soal.poin

      return {
        attempt_id: attemptId,
        soal_id: soal.id,
        jawaban: jawStr || null,
        jawaban_jsonb: jawJsonb,
        benar,
        poin_didapat: poinDapat,
        poin_max: soal.poin,
        waktu_jawab: durasiDetik,
      }
    })

    // Insert semua jawaban
    await supabase.from('jawaban_attempts').insert(jawabanRows)

    // Hitung nilai persen (essay belum dihitung)
    const nilaiPersen = totalPoin > 0
      ? Math.round(((nilaiPG) / totalPoin) * 100)
      : 0

    // Update attempt
    await supabase.from('kuis_attempts').update({
      submitted_at: new Date().toISOString(),
      selesai: true,
      durasi_aktual_detik: durasiDetik,
      nilai_pg: nilaiPG,
      nilai_essay: nilaiEssay,
      nilai_total: nilaiPG,
      nilai_persen: nilaiPersen,
      needs_grading: needsGrading,
    }).eq('id', attemptId)

    // Award XP
    if (nilaiPersen >= 60) {
      const xpAmount = nilaiPersen >= 80 ? 60 : nilaiPersen >= 60 ? 30 : 5;
      await awardXp(user.id, xpAmount, nilaiPersen >= 60 ? 'Selesaikan quiz' : 'Mencoba quiz', 'kuis', id)
    }
    const dimensiKuis = getDimensiFromMapel(kuis?.mapel || '')
    await catatDimensiAktivitas(user.id, 'kuis', id, dimensiKuis, kuis?.judul)
    router.push(`/siswa/kuis/${id}/result?attempt=${attemptId}`)
   }
    const formatWaktu = (detik: number) => {
    const m = Math.floor(detik / 60).toString().padStart(2, '0')
    const s = (detik % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const sudahDijawab = (soalId: string) => {
    const j = jawaban[soalId]
    if (!j) return false
    if (Array.isArray(j)) return j.length > 0
    return j.trim().length > 0
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-sm">
        <p className="text-red-700 font-medium">{error}</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 underline text-sm">
          Kembali
        </button>
      </div>
    </div>
  )

  const sudahJawab = soalList.filter(s => sudahDijawab(s.id)).length

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 text-sm">{kuis?.judul}</h1>
            <p className="text-xs text-gray-500">{sudahJawab}/{soalList.length} soal dijawab</p>
          </div>
          {sisaWaktu !== null && (
            <div className={`font-mono font-bold text-lg px-3 py-1 rounded-lg ${
              sisaWaktu < 60 ? 'bg-red-100 text-red-700' :
              sisaWaktu < 300 ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {formatWaktu(sisaWaktu)}
            </div>
          )}
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 bg-blue-500 rounded-full transition-all"
              style={{ width: `${(sudahJawab / soalList.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Soal list */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {soalList.map((soal, idx) => (
          <div
            key={soal.id}
            id={`soal-${soal.id}`}
            className={`bg-white rounded-xl border-2 p-5 transition-all ${
              sudahDijawab(soal.id) ? 'border-green-300' : 'border-gray-200'
            }`}
          >
            {/* Nomor + poin */}
            <div className="flex items-start justify-between mb-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                sudahDijawab(soal.id)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {idx + 1}
              </span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {soal.poin} poin
              </span>
            </div>

            {/* Pertanyaan */}
            <p className="text-gray-800 font-medium mb-4 leading-relaxed">
              {soal.teks}
            </p>

            {/* Input berdasarkan tipe */}
            {soal.tipe === 'pg' && soal.pilihan && (
              <div className="space-y-2">
                {soal.pilihan.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleJawaban(soal.id, p)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                      jawaban[soal.id] === p
                        ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span className="font-bold mr-2 text-gray-400">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {p}
                  </button>
                ))}
              </div>
            )}

            {soal.tipe === 'true_false' && (
              <div className="flex gap-3">
                {['Benar', 'Salah'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleJawaban(soal.id, opt)}
                    className={`flex-1 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                      jawaban[soal.id] === opt
                        ? opt === 'Benar'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {opt === 'Benar' ? '✓ Benar' : '✗ Salah'}
                  </button>
                ))}
              </div>
            )}

            {soal.tipe === 'isian' && (
              <input
                type="text"
                value={(jawaban[soal.id] as string) ?? ''}
                onChange={e => handleJawaban(soal.id, e.target.value)}
                placeholder="Ketik jawabanmu..."
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
              />
            )}

            {soal.tipe === 'essay' && (
              <div>
                <textarea
                  value={(jawaban[soal.id] as string) ?? ''}
                  onChange={e => handleJawaban(soal.id, e.target.value)}
                  placeholder="Tulis jawabanmu di sini..."
                  rows={5}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none"
                />
                <p className="text-xs text-orange-500 mt-1">
                  ✍️ Jawaban essay akan dinilai oleh guru
                </p>
              </div>
            )}

            {soal.tipe === 'matching' && soal.pasangan && (
              <MatchingInput
                pasangan={soal.pasangan}
                selected={(jawaban[soal.id] as string[]) ?? []}
                onChange={(pairs) => handleJawaban(soal.id, pairs)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Submit bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {sudahJawab < soalList.length && (
            <p className="text-xs text-center text-orange-500 mb-2">
              ⚠️ {soalList.length - sudahJawab} soal belum dijawab
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all ${
              submitting
                ? 'bg-gray-400 cursor-not-allowed'
                : sudahJawab === soalList.length
                ? 'bg-green-600 hover:bg-green-700 active:scale-95'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {submitting ? 'Mengirim...' : sudahJawab === soalList.length ? '✓ Kumpulkan Jawaban' : 'Kumpulkan Sekarang'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Matching component
function MatchingInput({
  pasangan,
  selected,
  onChange,
}: {
  pasangan: { kiri: string; kanan: string }[]
  selected: string[]
  onChange: (pairs: string[]) => void
}) {
  const kananOptions = pasangan.map(p => p.kanan)
  const [shuffledKanan] = useState(() => [...kananOptions].sort(() => Math.random() - 0.5))

  const getMatch = (kiri: string) => {
    const found = selected.find(s => s.startsWith(kiri + '::'))
    return found ? found.split('::')[1] : null
  }

  const pilih = (kiri: string, kanan: string) => {
    const filtered = selected.filter(s => !s.startsWith(kiri + '::') && !s.endsWith('::' + kanan))
    onChange([...filtered, `${kiri}::${kanan}`])
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Klik kanan untuk mencocokkan dengan kiri</p>
      {pasangan.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm font-medium text-blue-800">
            {p.kiri}
          </div>
          <span className="text-gray-400">→</span>
          <div className="flex-1">
            <select
              value={getMatch(p.kiri) ?? ''}
              onChange={e => pilih(p.kiri, e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="">-- pilih --</option>
              {shuffledKanan.map((k, j) => (
                <option key={j} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  )
}
