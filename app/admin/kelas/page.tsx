'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, Kelas } from '@/lib/supabase'

export default function KelolaKelasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [showForm, setShowForm] = useState(false)
  const [nama, setNama] = useState('')
  const [tingkat, setTingkat] = useState('10')
  const [tahunAjaran, setTahunAjaran] = useState('2025/2026')
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (!user || user.role !== 'admin') {
        router.replace('/login')
        return
      }
      await loadKelas()
      setLoading(false)
    }
    init()
  }, [router])

  async function loadKelas() {
    const { data } = await supabase
      .from('kelas')
      .select('*')
      .order('tingkat', { ascending: true })
      .order('nama', { ascending: true })
    setKelasList(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const { error } = await supabase.from('kelas').insert({
      nama,
      tingkat: parseInt(tingkat),
      tahun_ajaran: tahunAjaran,
    })

    if (error) {
      setError(error.message)
      return
    }

    setNama('')
    setShowForm(false)
    await loadKelas()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus kelas ini?')) return
    await supabase.from('kelas').delete().eq('id', id)
    await loadKelas()
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
            <button
              onClick={() => router.push('/admin')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Kembali
            </button>
            <h1 className="text-xl font-bold text-gray-800">Kelola Kelas</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'Tutup' : '+ Tambah Kelas'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100"
          >
            <h3 className="font-semibold text-gray-800 mb-4">Tambah Kelas Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  placeholder="Contoh: X-IPA-1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tingkat
                </label>
                <select
                  value={tingkat}
                  onChange={(e) => setTingkat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="10">Kelas 10</option>
                  <option value="11">Kelas 11</option>
                  <option value="12">Kelas 12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {error && (
              <p className="text-red-600 text-sm mt-3">{error}</p>
            )}
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Simpan
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {kelasList.length === 0 ? (
            <p className="p-8 text-center text-gray-500">
              Belum ada kelas. Klik "Tambah Kelas" untuk membuat.
            </p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Tingkat
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Tahun Ajaran
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kelasList.map((k) => (
                  <tr key={k.id}>
                    <td className="px-4 py-3 font-medium text-gray-800">{k.nama}</td>
                    <td className="px-4 py-3 text-gray-600">Kelas {k.tingkat}</td>
                    <td className="px-4 py-3 text-gray-600">{k.tahun_ajaran}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}