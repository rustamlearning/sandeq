'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface MuatanLokal {
  id: string; judul: string; kategori: string
  thumbnail_url?: string; created_at: string
}

const KATEGORI_INFO: Record<string, { emoji: string; label: string; warna: string }> = {
  budaya: { emoji: '🎭', label: 'Budaya', warna: 'bg-orange-100 text-orange-700' },
  bahasa: { emoji: '📜', label: 'Bahasa Daerah', warna: 'bg-blue-100 text-blue-700' },
  potensi_lokal: { emoji: '🌊', label: 'Potensi Lokal', warna: 'bg-teal-100 text-teal-700' },
  sejarah: { emoji: '🏛️', label: 'Sejarah', warna: 'bg-amber-100 text-amber-700' },
}

export default function MuatanLokalPage() {
  const router = useRouter()
  const [items, setItems] = useState<MuatanLokal[]>([])
  const [filter, setFilter] = useState<string>('semua')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('muatan_lokal')
        .select('id, judul, kategori, thumbnail_url, created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'semua' ? items : items.filter(i => i.kategori === filter)

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500">←</button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Muatan Lokal</h1>
          <p className="text-xs text-gray-400">Budaya & Potensi Sulawesi Selatan</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['semua', 'budaya', 'bahasa', 'potensi_lokal', 'sejarah'].map(k => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${filter === k ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {k === 'semua' ? '🗺️ Semua' : `${KATEGORI_INFO[k].emoji} ${KATEGORI_INFO[k].label}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">🌊</p>
          <p className="text-gray-400">Konten belum tersedia</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const info = KATEGORI_INFO[item.kategori] || { emoji: '📚', label: item.kategori, warna: 'bg-gray-100 text-gray-700' }
            return (
              <div key={item.id} onClick={() => router.push(`/siswa/muatan-lokal/${item.id}`)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer active:scale-98 transition">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{info.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.judul}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${info.warna}`}>
                      {info.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
