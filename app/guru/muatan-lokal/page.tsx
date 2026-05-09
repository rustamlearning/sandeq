'use client'

import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface MuatanLokal {
  id: string
  judul: string
  kategori: string
  is_published: boolean
  created_at: string
}

const KATEGORI_INFO: Record<string, { emoji: string; label: string }> = {
  budaya: { emoji: '🎭', label: 'Budaya' },
  bahasa: { emoji: '📜', label: 'Bahasa Daerah' },
  potensi_lokal: { emoji: '🌊', label: 'Potensi Lokal' },
  sejarah: { emoji: '🏛️', label: 'Sejarah' },
}

export default function GuruMuatanLokalPage() {
  const router = useRouter()
  const [items, setItems] = useState<MuatanLokal[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('muatan_lokal')
      .select('id, judul, kategori, is_published, created_at')
      .eq('guru_id', user!.id)
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function togglePublish(id: string, current: boolean) {
    await supabase.from('muatan_lokal').update({ is_published: !current }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_published: !current } : i))
  }

  async function hapus(id: string) {
    if (!confirm('Hapus konten ini?')) return
    await supabase.from('muatan_lokal').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageHeader title="Muatan Lokal" subtitle="Kelola konten Sulawesi Selatan" backHref="/guru"
        actions={<Button onClick={() => router.push('/guru/muatan-lokal/buat')}>+ Buat</Button>}
      />
      <div className="max-w-2xl mx-auto px-4 py-5">

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🌊</p>
          <p className="font-semibold text-gray-700 mb-1">Belum ada konten</p>
          <p className="text-sm text-gray-400">Mulai buat konten muatan lokal pertama</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const info = KATEGORI_INFO[item.kategori] || { emoji: '📚', label: item.kategori }
            return (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{info.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{item.judul}</h3>
                    <p className="text-xs text-gray-400">{info.label}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    item.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.is_published ? 'Publik' : 'Draft'}
                  </span>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => router.push(`/guru/muatan-lokal/${item.id}/edit`)}
                    className="flex-1 text-xs py-2 bg-gray-100 text-gray-600 rounded-xl font-medium"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => togglePublish(item.id, item.is_published)}
                    className={`flex-1 text-xs py-2 rounded-xl font-medium ${
                      item.is_published
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {item.is_published ? '🔒 Sembunyikan' : '🌐 Publikasi'}
                  </button>
                  <button
                    onClick={() => hapus(item.id)}
                    className="px-3 text-xs py-2 bg-red-50 text-red-500 rounded-xl font-medium"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
    </div>
  )
}
