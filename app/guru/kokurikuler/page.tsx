'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/ui'

interface KokurikulerLog {
  id: string; judul: string; deskripsi: string
  mapel: string[]; dimensi: string[]; status: string; created_at: string
}

const DIMENSI_LABEL: Record<string, string> = {
  '1': 'Keimanan', '2': 'Kewargaan', '3': 'Penalaran Kritis',
  '4': 'Kreativitas', '5': 'Kolaborasi', '6': 'Kemandirian',
  '7': 'Kesehatan', '8': 'Komunikasi',
}

export default function GuruKokurikulerPage() {
  const router = useRouter()
  const [items, setItems] = useState<KokurikulerLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('kokurikuler_logs')
        .select('*').eq('guru_id', user!.id).order('created_at', { ascending: false })
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function selesaikan(id: string) {
    await supabase.from('kokurikuler_logs').update({ status: 'selesai' }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'selesai' } : i))
  }

  if (loading) return <PageLoader />

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageHeader title="Kokurikuler" subtitle="Kegiatan lintas mapel & PBL" backHref="/guru"
        actions={<Button onClick={() => router.push('/guru/kokurikuler/buat')}>+ Buat</Button>}
      />
      <div className="max-w-2xl mx-auto px-4 py-5">

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-semibold text-gray-700 mb-1">Belum ada kegiatan</p>
          <p className="text-sm text-gray-400">Buat kegiatan kokurikuler pertama</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800 flex-1 pr-2">{item.judul}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                  item.status === 'selesai' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-indigo-700'
                }`}>
                  {item.status === 'selesai' ? '✅ Selesai' : '🔄 Aktif'}
                </span>
              </div>
              {item.deskripsi && <p className="text-sm text-gray-500 mb-3">{item.deskripsi}</p>}
              <div className="flex flex-wrap gap-1 mb-3">
                {(item.mapel || []).map(m => (
                  <span key={m} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{m}</span>
                ))}
                {(item.dimensi || []).map(d => (
                  <span key={d} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {DIMENSI_LABEL[d] || `D${d}`}
                  </span>
                ))}
              </div>
              {item.status === 'aktif' && (
                <button
                  onClick={() => selesaikan(item.id)}
                  className="w-full py-2 bg-green-50 text-green-700 rounded-xl text-sm font-medium"
                >
                  Tandai Selesai
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}
