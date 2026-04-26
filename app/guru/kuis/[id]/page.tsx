'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Kuis, Soal } from '@/lib/supabase'

type TipeSoal = 'pilgan' | 'benar_salah' | 'isian'

export default function KelolaKuisPage() {
  const router = useRouter()
  const params = useParams()
  const kuisId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [kuis, setKuis] = useState<Kuis | null>(null)
  const [soalList, setSoalList] = useState<Soal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form soal
  const [tipe, setTipe] = useState<TipeSoal>('pilgan')
  const [teks, setTeks] = useState('')
  const [pilihanA, setPilihanA] = useState('')
  const [pilihanB, setPilihanB] = useState('')
  const [pilihanC, setPilihanC] = useState('')
  const [pilihanD, setPilihanD] = useState('')
  const [pilihanE, setPilihanE] = useState('')
  const [jawaban, setJawaban] = useState('')
  const [pembahasan, setPembahasan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'guru') {
        router.replace('/login')
        return
      }
      setUser(u)
      await Promise.all([loadKuis(), loadSoal()])
      setLoading(false)
    }
    init()
  }, [router, kuisId])

  async function loadKuis() {
    const { data } = await supabase.from('kuis').select('*').eq('id', kuisId).single()
    setKuis(data)
  }

  async function loadSoal() {
    const { data } = await supabase
      .from('soal')
      .select('*')
      .eq('kuis_id', kuisId)
      .order('id', { ascending: true })
    setSoalList(data || [])
  }

  function resetForm() {
    setTeks('')
    setPilihanA('')
    setPilihanB('')
    setPilihanC('')
    setPilihanD('')
    setPilihanE('')
    setJawaban('')
    setPembahasan('')
    setTipe('pilgan')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    let pilihan: string[] | null = null
    let jawabanFinal = jawaban

    if (tipe === 'pilgan') {
      pilihan = [pilihanA, pilihanB, pilihanC, pilihanD, pilihanE]
    } else if (tipe === 'benar_salah') {
      pilihan = ['Benar', 'Salah']
    }

    const { error } = await supabase.from('soal').insert({
      kuis_id: kuisId,
      teks,
      tipe,
      pilihan,
      jawaban: jawabanFinal,
      pembahasan: pembahasan || null,
    })

    setSubmitting(false)
    if (error) {
      alert('Gagal: ' + error.message)
      return
    }

    resetForm()
    setShowForm(false)
    await loadSoal()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus soal ini?')) return
    await supabase.from('soal').delete().eq('id', id)
    await loadSoal()
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/guru/kuis')} className="text-gray-500 hover:text-gray-700">
              ← Kembali
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{kuis?.judul}</h1>
              <p className="text-xs text-gray-500">{soalList.length} soal · {kuis?.mapel}</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'Tutup' : '+ Tambah Soal'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Tambah Soal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Soal</label>
                <select
                  value={tipe}
                  onChange={(e) => {
                    setTipe(e.target.value as TipeSoal)
                    setJawaban('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pilgan">Pilihan Ganda</option>
                  <option value="benar_salah">Benar / Salah</option>
                  <option value="isian">Isian Singkat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan</label>
                <textarea
                  value={teks}
                  onChange={(e) => setTeks(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {tipe === 'pilgan' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Pilihan Jawaban</label>
                  {[
                    { label: 'A', val: pilihanA, set: setPilihanA },
                    { label: 'B', val: pilihanB, set: setPilihanB },
                    { label: 'C', val: pilihanC, set: setPilihanC },
                    { label: 'D', val: pilihanD, set: setPilihanD },
                    { label: 'E', val: pilihanE, set: setPilihanE },
                  ].map((p) => (
                    <div key={p.label} className="flex items-center gap-2">
                      <span className="font-medium w-6">{p.label}.</span>
                      <input
                        type="text"
                        value={p.val}
                        onChange={(e) => p.set(e.target.value)}
                        required
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                  <div className="pt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jawaban Benar</label>
                    <select
                      value={jawaban}
                      onChange={(e) => setJawaban(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih jawaban</option>
                      {pilihanA && <option value={pilihanA}>A. {pilihanA}</option>}
                      {pilihanB && <option value={pilihanB}>B. {pilihanB}</option>}
                      {pilihanC && <option value={pilihanC}>C. {pilihanC}</option>}
                      {pilihanD && <option value={pilihanD}>D. {pilihanD}</option>}
                      {pilihanE && <option value={pilihanE}>E. {pilihanE}</option>}
                    </select>
                  </div>
                </div>
              )}

              {tipe === 'benar_salah' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jawaban Benar</label>
                  <select
                    value={jawaban}
                    onChange={(e) => setJawaban(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih</option>
                    <option value="Benar">Benar</option>
                    <option value="Salah">Salah</option>
                  </select>
                </div>
              )}

              {tipe === 'isian' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jawaban Benar (case-insensitive)
                  </label>
                  <input
                    type="text"
                    value={jawaban}
                    onChange={(e) => setJawaban(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pembahasan (opsional)</label>
                <textarea
                  value={pembahasan}
                  onChange={(e) => setPembahasan(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Soal'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {soalList.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-500">Belum ada soal. Klik "Tambah Soal" untuk mulai.</p>
            </div>
          ) : (
            soalList.map((s, idx) => (
              <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded uppercase">
                    {s.tipe.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Hapus
                  </button>
                </div>
                <p className="font-medium text-gray-800 mb-2">
                  {idx + 1}. {s.teks}
                </p>
                {s.pilihan && (
                  <ul className="space-y-1 text-sm text-gray-600 mb-2">
                    {s.pilihan.map((p, i) => (
                      <li key={i} className={p === s.jawaban ? 'text-green-700 font-medium' : ''}>
                        {String.fromCharCode(65 + i)}. {p} {p === s.jawaban && '✓'}
                      </li>
                    ))}
                  </ul>
                )}
                {!s.pilihan && (
                  <p className="text-sm text-green-700 font-medium mb-2">
                    Jawaban: {s.jawaban} ✓
                  </p>
                )}
                {s.pembahasan && (
                  <p className="text-xs text-gray-500 mt-2 italic">Pembahasan: {s.pembahasan}</p>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}