'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Kuis, Kelas } from '@/lib/supabase'

const MAPEL_LIST = [
  'Matematika','Bahasa Indonesia','Bahasa Inggris','Fisika','Kimia',
  'Biologi','Sejarah','Geografi','Ekonomi','Sosiologi',
  'PPKn','Pendidikan Agama','Seni Budaya','Penjaskes','Informatika',
]

export default function KuisGuruPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [kuisList, setKuisList] = useState<Kuis[]>([])
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [showForm, setShowForm] = useState(false)

  const [judul, setJudul] = useState('')
  const [mapel, setMapel] = useState(MAPEL_LIST[0])
  const [kelasId, setKelasId] = useState('')
  const [tipe, setTipe] = useState<'latihan' | 'ulangan'>('latihan')
  const [durasi, setDurasi] = useState('30')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'guru') { router.replace('/login'); return }
      setUser(u)
      await Promise.all([loadKuis(u.id), loadKelas()])
      setLoading(false)
    }
    init()
  }, [router])

  async function loadKuis(guruId: string) {
    const { data } = await supabase.from('kuis').select('*').eq('guru_id', guruId).order('created_at', { ascending: false })
    setKuisList(data || [])
  }

  async function loadKelas() {
    const { data } = await supabase.from('kelas').select('*').order('tingkat', { ascending: true })
    setKelasList(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    const { data, error } = await supabase.from('kuis').insert({ judul, mapel, kelas_id: kelasId, guru_id: user.id, tipe, durasi_menit: parseInt(durasi), aktif: true }).select().single()
    setSubmitting(false)
    if (error || !data) { alert('Gagal membuat kuis: ' + (error?.message || '')); return }
    router.push(`/guru/kuis/${data.id}`)
  }

  async function toggleAktif(id: string, aktif: boolean) {
    await supabase.from('kuis').update({ aktif: !aktif }).eq('id', id)
    if (user) await loadKuis(user.id)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus kuis ini? Semua soal akan ikut terhapus.')) return
    await supabase.from('kuis').delete().eq('id', id)
    if (user) await loadKuis(user.id)
  }

  function getKelasNama(id: string) {
    return kelasList.find((k) => k.id === id)?.nama || '-'
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

  const aktifCount = kuisList.filter((k) => k.aktif).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/guru')}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-bold flex-shrink-0"
            >
              ←
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight">Kuis & Ulangan</h1>
              <p className="text-orange-100 text-xs">{kuisList.length} kuis · {aktifCount} aktif</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex-shrink-0 px-4 py-2 bg-white text-orange-700 rounded-xl text-sm font-bold hover:bg-orange-50 transition shadow-sm"
          >
            {showForm ? '✕ Tutup' : '+ Buat Kuis'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5">
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-5">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3">
              <h3 className="text-white font-bold">Buat Kuis Baru</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Judul <span className="text-red-500">*</span></label>
                  <input
                    type="text" value={judul} onChange={(e) => setJudul(e.target.value)} required
                    placeholder="Contoh: Ulangan Harian Bab 3"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mata Pelajaran</label>
                  <select value={mapel} onChange={(e) => setMapel(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400">
                    {MAPEL_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kelas <span className="text-red-500">*</span></label>
                  <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">Pilih kelas</option>
                    {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipe</label>
                  <select value={tipe} onChange={(e) => setTipe(e.target.value as any)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="latihan">📝 Latihan (tanpa nilai)</option>
                    <option value="ulangan">📊 Ulangan (masuk nilai)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Durasi (menit)</label>
                  <input type="number" value={durasi} onChange={(e) => setDurasi(e.target.value)} required min={1} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <button
                type="submit" disabled={submitting}
                className="mt-5 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-sm hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50 shadow-sm"
              >
                {submitting ? '⏳ Membuat...' : '🚀 Buat & Tambah Soal'}
              </button>
            </form>
          </div>
        )}

        {/* List */}
        {kuisList.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-semibold text-gray-600 mb-1">Belum ada kuis</p>
            <p className="text-sm text-gray-400">Klik "+ Buat Kuis" untuk mulai.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {kuisList.map((k) => (
              <div key={k.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
                <div className={`h-1 ${k.aktif ? 'bg-green-400' : 'bg-gray-200'}`} />
                <div className="p-4 flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${k.tipe === 'ulangan' ? 'bg-orange-50' : 'bg-sky-50'}`}>
                    {k.tipe === 'ulangan' ? '📊' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{k.mapel}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${k.tipe === 'ulangan' ? 'bg-orange-100 text-orange-700' : 'bg-sky-100 text-sky-700'}`}>
                        {k.tipe}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${k.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {k.aktif ? '● Aktif' : '○ Nonaktif'}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm">{k.judul}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Kelas {getKelasNama(k.kelas_id)} · {k.durasi_menit} menit</p>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0 text-right">
                    <button onClick={() => router.push(`/guru/kuis/${k.id}`)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                      Kelola Soal
                    </button>
                    <button onClick={() => toggleAktif(k.id, k.aktif)} className="text-xs text-gray-600 hover:text-gray-800 font-semibold bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
                      {k.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button onClick={() => handleDelete(k.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
