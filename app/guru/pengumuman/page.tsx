'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Pengumuman } from '@/lib/supabase'

const KATEGORI = ['akademik', 'kegiatan', 'darurat', 'umum'] as const
type Kategori = (typeof KATEGORI)[number]

export default function PengumumanGuruPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<Pengumuman[]>([])
  const [showForm, setShowForm] = useState(false)

  const [judul, setJudul] = useState('')
  const [konten, setKonten] = useState('')
  const [kategori, setKategori] = useState<Kategori>('umum')
  const [dipin, setDipin] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'guru') {
        router.replace('/login')
        return
      }
      setUser(u)
      await load(u.id)
      setLoading(false)
    }
    init()
  }, [router])

  async function load(guruId: string) {
    const { data } = await supabase
      .from('pengumuman')
      .select('*')
      .eq('created_by', guruId)
      .order('dipin', { ascending: false })
      .order('created_at', { ascending: false })
    setList(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    await supabase.from('pengumuman').insert({
      judul,
      konten,
      kategori,
      target: 'semua',
      dipin,
      created_by: user.id,
    })
    setJudul('')
    setKonten('')
    setKategori('umum')
    setDipin(false)
    setShowForm(false)
    setSubmitting(false)
    await load(user.id)
  }

  async function handleDelete(id: string) {
    if (!user) return
    if (!confirm('Hapus pengumuman ini?')) return
    await supabase.from('pengumuman').delete().eq('id', id)
    await load(user.id)
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
            <h1 className="text-xl font-bold text-gray-800">Pengumuman Saya</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'Tutup' : '+ Buat Pengumuman'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Buat Pengumuman</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as Kategori)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {KATEGORI.map((k) => (
                      <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={dipin}
                      onChange={(e) => setDipin(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Pin di atas
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pengumuman</label>
                <textarea
                  value={konten}
                  onChange={(e) => setKonten(e.target.value)}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {submitting ? 'Menyimpan...' : 'Publikasikan'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {list.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-500">Belum ada pengumuman yang kamu buat.</p>
            </div>
          ) : (
            list.map((p) => (
              <PengumumanCard key={p.id} item={p} onDelete={handleDelete} />
            ))
          )}
        </div>
      </main>
    </div>
  )
}

function PengumumanCard({ item, onDelete }: { item: Pengumuman; onDelete: (id: string) => void }) {
  const colorMap: Record<string, string> = {
    akademik: 'bg-blue-100 text-blue-700',
    kegiatan: 'bg-green-100 text-green-700',
    darurat: 'bg-red-100 text-red-700',
    umum: 'bg-gray-100 text-gray-700',
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {item.dipin && <span className="text-xs">📌</span>}
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${colorMap[item.kategori]}`}>
              {item.kategori}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(item.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
          <h4 className="font-semibold text-gray-800 mb-1">{item.judul}</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.konten}</p>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="text-red-600 hover:text-red-800 text-sm shrink-0"
        >
          Hapus
        </button>
      </div>
    </div>
  )
}