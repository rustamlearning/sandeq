'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Pengumuman } from '@/lib/supabase'

interface PengumumanWithAuthor extends Pengumuman {
  author?: { nama: string; role: string }
}

export default function PengumumanSiswaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<PengumumanWithAuthor[]>([])
  const [filterKategori, setFilterKategori] = useState('')

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'siswa') {
        router.replace('/login')
        return
      }
      await load()
      setLoading(false)
    }
    init()
  }, [router])

  async function load() {
    const { data } = await supabase
      .from('pengumuman')
      .select('*, author:created_by(nama, role)')
      .order('dipin', { ascending: false })
      .order('created_at', { ascending: false })
    setList((data as PengumumanWithAuthor[]) || [])
  }

  const kategoriUnik = Array.from(new Set(list.map((p) => p.kategori)))
  const filtered = filterKategori
    ? list.filter((p) => p.kategori === filterKategori)
    : list

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
          <h1 className="text-xl font-bold text-gray-800">Pengumuman</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {kategoriUnik.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterKategori('')}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition ${
                filterKategori === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Semua
            </button>
            {kategoriUnik.map((k) => (
              <button
                key={k}
                onClick={() => setFilterKategori(k)}
                className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap capitalize transition ${
                  filterKategori === k ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-500">Belum ada pengumuman.</p>
            </div>
          ) : (
            filtered.map((p) => <PengumumanCard key={p.id} item={p} />)
          )}
        </div>
      </main>
    </div>
  )
}

function PengumumanCard({ item }: { item: PengumumanWithAuthor }) {
  const colorMap: Record<string, string> = {
    akademik: 'bg-blue-100 text-blue-700',
    kegiatan: 'bg-green-100 text-green-700',
    darurat: 'bg-red-100 text-red-700',
    umum: 'bg-gray-100 text-gray-700',
  }
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 ${
      item.kategori === 'darurat' ? 'border-red-200' : 'border-gray-100'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {item.dipin && <span className="text-xs">📌</span>}
        <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${colorMap[item.kategori]}`}>
          {item.kategori}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(item.created_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
      </div>
      <h4 className="font-semibold text-gray-800 mb-2">{item.judul}</h4>
      <p className="text-sm text-gray-600 whitespace-pre-wrap mb-3">{item.konten}</p>
      <p className="text-xs text-gray-400">
        Oleh {item.author?.nama || 'Sekolah'}
        {item.author?.role && ` (${item.author.role})`}
      </p>
    </div>
  )
}