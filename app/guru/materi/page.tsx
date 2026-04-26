'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Materi, Kelas } from '@/lib/supabase'

const MAPEL_LIST = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Fisika', 'Kimia',
  'Biologi', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi',
  'PPKn', 'Pendidikan Agama', 'Seni Budaya', 'Penjaskes', 'Informatika',
]

export default function MateriGuruPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [materiList, setMateriList] = useState<Materi[]>([])
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [showForm, setShowForm] = useState(false)

  // Form
  const [judul, setJudul] = useState('')
  const [mapel, setMapel] = useState(MAPEL_LIST[0])
  const [kelasId, setKelasId] = useState('')
  const [bab, setBab] = useState('')
  const [konten, setKonten] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser()
      if (!currentUser || currentUser.role !== 'guru') {
        router.replace('/login')
        return
      }
      setUser(currentUser)
      await Promise.all([loadMateri(currentUser.id), loadKelas()])
      setLoading(false)
    }
    init()
  }, [router])

  async function loadMateri(guruId: string) {
    const { data } = await supabase
      .from('materi')
      .select('*')
      .eq('guru_id', guruId)
      .order('created_at', { ascending: false })
    setMateriList(data || [])
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
    setError('')
    setSubmitting(true)

    const { error } = await supabase.from('materi').insert({
      judul,
      mapel,
      kelas_id: kelasId,
      guru_id: user.id,
      bab,
      konten,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    setJudul('')
    setBab('')
    setKonten('')
    setKelasId('')
    setShowForm(false)
    setSubmitting(false)
    await loadMateri(user.id)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus materi ini?')) return
    await supabase.from('materi').delete().eq('id', id)
    if (user) await loadMateri(user.id)
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
            <h1 className="text-xl font-bold text-gray-800">Materi Saya</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'Tutup' : '+ Buat Materi'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Buat Materi Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Materi</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Bab / Topik</label>
                <input
                  type="text"
                  value={bab}
                  onChange={(e) => setBab(e.target.value)}
                  placeholder="Contoh: Bab 1 - Pengenalan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Isi Materi</label>
                <textarea
                  value={konten}
                  onChange={(e) => setKonten(e.target.value)}
                  required
                  rows={8}
                  placeholder="Tulis materi pelajaran di sini..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Materi'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {materiList.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-500">Belum ada materi. Klik "Buat Materi" untuk mulai.</p>
            </div>
          ) : (
            materiList.map((m) => (
              <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {m.mapel}
                      </span>
                      <span className="text-xs text-gray-500">Kelas: {getKelasNama(m.kelas_id)}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800">{m.judul}</h4>
                    {m.bab && <p className="text-sm text-gray-600 mt-1">{m.bab}</p>}
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{m.konten}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}