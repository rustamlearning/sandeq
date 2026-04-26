'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Materi } from '@/lib/supabase'

interface MateriWithGuru extends Materi {
  guru?: { nama: string }
}

export default function MateriSiswaPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [materiList, setMateriList] = useState<MateriWithGuru[]>([])
  const [selected, setSelected] = useState<MateriWithGuru | null>(null)
  const [filterMapel, setFilterMapel] = useState('')

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser()
      if (!currentUser || currentUser.role !== 'siswa') {
        router.replace('/login')
        return
      }
      setUser(currentUser)
      await loadMateri(currentUser)
      setLoading(false)
    }
    init()
  }, [router])

  async function loadMateri(currentUser: User) {
    const { data } = await supabase
      .from('materi')
      .select('*, guru:guru_id(nama)')
      .eq('kelas_id', currentUser.kelas_id)
      .order('created_at', { ascending: false })
    setMateriList((data as MateriWithGuru[]) || [])
  }

  const mapelUnik = Array.from(new Set(materiList.map((m) => m.mapel)))
  const filteredMateri = filterMapel
    ? materiList.filter((m) => m.mapel === filterMapel)
    : materiList

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  // Detail view
  if (selected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-700">
              ← Kembali ke daftar
            </button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                {selected.mapel}
              </span>
              {selected.bab && (
                <span className="text-xs text-gray-500">{selected.bab}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{selected.judul}</h1>
            <p className="text-sm text-gray-500 mb-6">
              Oleh {selected.guru?.nama || 'Guru'} ·{' '}
              {new Date(selected.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.konten}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // List view
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/siswa')} className="text-gray-500 hover:text-gray-700">
            ← Kembali
          </button>
          <h1 className="text-xl font-bold text-gray-800">Materi Pelajaran</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter mapel */}
        {mapelUnik.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterMapel('')}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition ${
                filterMapel === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Semua
            </button>
            {mapelUnik.map((m) => (
              <button
                key={m}
                onClick={() => setFilterMapel(m)}
                className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition ${
                  filterMapel === m ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {filteredMateri.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">Belum ada materi untuk kelas kamu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMateri.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                    {m.mapel}
                  </span>
                  {m.bab && <span className="text-xs text-gray-500">{m.bab}</span>}
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">{m.judul}</h4>
                <p className="text-sm text-gray-500 line-clamp-2">{m.konten}</p>
                <p className="text-xs text-gray-400 mt-3">
                  Oleh {m.guru?.nama || 'Guru'}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}