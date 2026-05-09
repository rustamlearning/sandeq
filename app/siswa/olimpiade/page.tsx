'use client'
import { PageHeader } from '@/components/ui/PageHeader'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Sesi {
  id: string; judul: string; mapel: string
  durasi_menit: number; status: string; kuis_id: string
  peserta_count?: number
}

export default function OlimpiadePage() {
  const router = useRouter()
  const [sesi, setSesi] = useState<Sesi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('kuis')
        .select('id, judul, mapel, durasi_menit, is_published')
        .eq('is_published', true)
        .eq('mode', 'olimpiade')
        .order('created_at', { ascending: false })
      setSesi((data as any) || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageHeader title="Mode Olimpiade" subtitle="Kompetisi & Persiapan Lomba" backHref="/siswa" />

      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-5 mb-5 text-white">
        <p className="text-3xl mb-2">🏆</p>
        <h2 className="font-bold text-lg mb-1">Siap Bertanding?</h2>
        <p className="text-sm opacity-80">Timer ketat, ranking real-time, sertifikat digital. Buktikan kemampuanmu!</p>
      </div>

      {sesi.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-gray-500 font-medium">Belum ada sesi olimpiade</p>
          <p className="text-sm text-gray-400 mt-1">Guru belum membuat sesi kompetisi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sesi.map(s => (
            <div key={s.id} onClick={() => router.push(`/siswa/olimpiade/${s.id}`)}
              className="bg-white rounded-2xl p-4 border-2 border-yellow-200 cursor-pointer hover:border-yellow-400 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-800">{s.judul}</p>
                  <p className="text-sm text-gray-400">{s.mapel}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-orange-500">⏱ {s.durasi_menit}m</p>
                </div>
              </div>
              <button className="mt-3 w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl py-2 font-bold text-sm">
                Mulai Kompetisi →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
