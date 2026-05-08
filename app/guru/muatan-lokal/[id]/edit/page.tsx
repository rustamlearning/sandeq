'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type KontenBlok = 
  | { tipe: 'teks'; isi: string }
  | { tipe: 'judul'; isi: string }
  | { tipe: 'fakta'; isi: string }
  | { tipe: 'gambar'; url: string; caption: string }

export default function EditMuatanLokalPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [judul, setJudul] = useState('')
  const [kategori, setKategori] = useState('budaya')
  const [konten, setKonten] = useState<KontenBlok[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('muatan_lokal').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          setJudul(data.judul)
          setKategori(data.kategori)
          setKonten(data.konten || [])
        }
        setLoading(false)
      })
  }, [id])

  function tambahBlok(tipe: KontenBlok['tipe']) {
    if (tipe === 'gambar') setKonten([...konten, { tipe: 'gambar', url: '', caption: '' }])
    else setKonten([...konten, { tipe, isi: '' }])
  }

  function updateBlok(index: number, updated: Partial<KontenBlok>) {
    setKonten(konten.map((b, i) => i === index ? { ...b, ...updated } as KontenBlok : b))
  }

  function hapusBlok(index: number) {
    setKonten(konten.filter((_, i) => i !== index))
  }

  async function simpan() {
    if (!judul.trim()) { alert('Judul wajib diisi'); return }
    setSaving(true)
    const { error } = await supabase.from('muatan_lokal').update({ judul, kategori, konten }).eq('id', id)
    setSaving(false)
    if (!error) router.push('/guru/muatan-lokal')
    else alert('Gagal: ' + error.message)
  }

  const BLOK_LABEL: Record<string, string> = {
    judul: '📌 Judul Seksi', teks: '📝 Paragraf', fakta: '💡 Fakta Menarik', gambar: '🖼️ Gambar',
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto pb-32">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-800">Edit Konten</h1>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Judul</label>
          <input value={judul} onChange={e => setJudul(e.target.value)}
            className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Kategori</label>
          <select value={kategori} onChange={e => setKategori(e.target.value)}
            className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none">
            <option value="budaya">🎭 Budaya</option>
            <option value="bahasa">📜 Bahasa Daerah</option>
            <option value="potensi_lokal">🌊 Potensi Lokal</option>
            <option value="sejarah">🏛️ Sejarah</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {konten.map((blok, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-600">{BLOK_LABEL[blok.tipe]}</span>
              <button onClick={() => hapusBlok(i)} className="text-red-400 text-xs">Hapus</button>
            </div>
            {blok.tipe === 'gambar' ? (
              <div className="space-y-2">
                <input value={blok.url} onChange={e => updateBlok(i, { url: e.target.value })}
                  placeholder="URL gambar" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
                <input value={blok.caption} onChange={e => updateBlok(i, { caption: e.target.value })}
                  placeholder="Keterangan" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
              </div>
            ) : (
              <textarea value={blok.isi} onChange={e => updateBlok(i, { isi: e.target.value })}
                rows={blok.tipe === 'teks' ? 4 : 2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none" />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <p className="text-xs font-semibold text-gray-500 mb-3">+ TAMBAH BLOK</p>
        <div className="grid grid-cols-2 gap-2">
          {(['judul', 'teks', 'fakta', 'gambar'] as const).map(tipe => (
            <button key={tipe} onClick={() => tambahBlok(tipe)}
              className="py-3 bg-gray-50 rounded-xl text-sm text-gray-700 font-medium border border-gray-200">
              {BLOK_LABEL[tipe]}
            </button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-lg mx-auto">
        <button onClick={simpan} disabled={saving}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm">
          {saving ? 'Menyimpan...' : '✅ Simpan Perubahan'}
        </button>
      </div>
    </div>
  )
}
