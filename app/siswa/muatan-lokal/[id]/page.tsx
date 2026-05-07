'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface MuatanLokal {
  id: string; judul: string; kategori: string; konten: any[]
}

export default function MuatanLokalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<MuatanLokal | null>(null)

  useEffect(() => {
    supabase.from('muatan_lokal').select('*').eq('id', id).single()
      .then(({ data }) => setItem(data as any))
  }, [id])

  if (!item) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500">←</button>
        <h1 className="text-xl font-bold text-gray-800">{item.judul}</h1>
      </div>
      <div className="space-y-4">
        {(item.konten || []).map((blok: any, i: number) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            {blok.tipe === 'teks' && <p className="text-gray-700 leading-relaxed">{blok.isi}</p>}
            {blok.tipe === 'judul' && <h2 className="text-lg font-bold text-gray-800">{blok.isi}</h2>}
            {blok.tipe === 'gambar' && <img src={blok.url} alt={blok.caption || ''} className="w-full rounded-xl" />}
            {blok.tipe === 'fakta' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-600 mb-1">💡 TAHUKAH KAMU?</p>
                <p className="text-gray-700 text-sm">{blok.isi}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
