'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Kuis, Kelas } from '@/lib/supabase'

const MAPEL_LIST = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Fisika', 'Kimia',
  'Biologi', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi',
  'PPKn', 'Pendidikan Agama', 'Seni Budaya', 'Penjaskes', 'Informatika',
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
      if (!u || u.role !== 'guru') {
        router.replace('/login')
        return
      }
      setUser(u)
      await Promise.all([loadKuis(u.id), loadKelas()])
      setLoading(false)
    }
    init()
  }, [router])

  async function loadKuis(guruId: string) {
    const { data } = await supabase
      .from('kuis')
      .select('*')
      .eq('guru_id', guruId)
      .order('created_at', { ascending: false })
    setKuisList(data || [])
  }

  async function loadKelas() {
    const { data } = await supabase
      .from('kelas')
      .select('*')
      .order('tingkat', { ascending: true })
    setKelasList(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)

    const { data, error } = await supabase
      .from('kuis')
      .insert({
        judul,
        mapel,
        kelas_id: kelasId,
        guru_id: user.id,
        tipe,
        durasi_menit: parseInt(durasi),
        aktif: true,
      })
      .select()
      .single()

    setSubmitting(false)
    if (error || !data) {
      alert('Gagal membuat kuis: ' + (error?.message || ''))
      return
    }

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/guru')} className="text-gray-500 hover:text-gray-700">
              ← Kembali
            </button>
            <h1 className="text-xl font-bold text-gray-800">Kuis & Ulangan</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'Tutup' : '+ Buat Kuis'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Buat Kuis Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                <select
                  value={mapel}
                  onChange={(e) => setMapel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MAPEL_LIST.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <select
                  value={kelasId}
                  onChange={(e) => setKelasId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih kelas</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <select
                  value={tipe}
                  onChange={(e) => setTipe(e.target.value as 'latihan' | 'ulangan')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="latihan">Latihan (tanpa nilai)</option>
                  <option value="ulangan">Ulangan (masuk nilai)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
                <input
                  type="number"
                  value={durasi}
                  onChange={(e) => setDurasi(e.target.value)}
                  required
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {submitting ? 'Membuat...' : 'Buat & Tambah Soal'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {kuisList.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-500">Belum ada kuis. Klik "Buat Kuis" untuk mulai.</p>
            </div>
          ) : (
            kuisList.map((k) => (
              <div key={k.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {k.mapel}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        k.tipe === 'ulangan' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {k.tipe}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        k.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {k.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800">{k.judul}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Kelas {getKelasNama(k.kelas_id)} · {k.durasi_menit} menit
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => router.push(`/guru/kuis/${k.id}`)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Kelola Soal
                    </button>
                    <button
                      onClick={() => toggleAktif(k.id, k.aktif)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      {k.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => handleDelete(k.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}