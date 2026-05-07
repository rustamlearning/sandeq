'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Modul {
  id: string; judul: string; deskripsi: string
  level: string; urutan: number; topik: string
}

const TOPIK_INFO: Record<string, { emoji: string; warna: string }> = {
  pengenalan: { emoji: '👋', warna: 'bg-blue-100 text-blue-700' },
  variabel: { emoji: '📦', warna: 'bg-purple-100 text-purple-700' },
  kondisi: { emoji: '🔀', warna: 'bg-orange-100 text-orange-700' },
  perulangan: { emoji: '🔄', warna: 'bg-green-100 text-green-700' },
  fungsi: { emoji: '⚙️', warna: 'bg-red-100 text-red-700' },
  data: { emoji: '📊', warna: 'bg-teal-100 text-teal-700' },
}

const MODUL_DEFAULT: Modul[] = [
  { id: '1', judul: 'Apa itu Program?', deskripsi: 'Kenalan sama dunia coding!', level: 'pemula', urutan: 1, topik: 'pengenalan' },
  { id: '2', judul: 'Variabel & Tipe Data', deskripsi: 'Cara simpan informasi di program', level: 'pemula', urutan: 2, topik: 'variabel' },
  { id: '3', judul: 'If & Else — Buat Keputusan', deskripsi: 'Program yang bisa milih jalan sendiri', level: 'pemula', urutan: 3, topik: 'kondisi' },
  { id: '4', judul: 'For & While — Pengulangan', deskripsi: 'Suruh program kerja berkali-kali', level: 'menengah', urutan: 4, topik: 'perulangan' },
  { id: '5', judul: 'Fungsi — Buat Alat Sendiri', deskripsi: 'Kelompokin kode supaya rapi', level: 'menengah', urutan: 5, topik: 'fungsi' },
  { id: '6', judul: 'List & Dictionary', deskripsi: 'Simpan banyak data sekaligus', level: 'menengah', urutan: 6, topik: 'data' },
]

export default function KodingPage() {
  const router = useRouter()
  const [progress, setProgress] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('progress_materi')
        .select('materi_id').eq('user_id', user.id).eq('selesai', true)
      const map: Record<string, boolean> = {}
      for (const p of data || []) map[p.materi_id] = true
      setProgress(map)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.back()} className="text-gray-500">←</button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Mapel Koding</h1>
          <p className="text-xs text-gray-400">Python untuk Kelas 10</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 mb-5 text-white">
        <p className="text-3xl mb-2">💻</p>
        <h2 className="font-bold text-lg mb-1">Belajar Python dari Nol</h2>
        <p className="text-sm opacity-80">Coding itu skill masa depan — dan kamu bisa mulai sekarang!</p>
        <div className="mt-3 bg-white/20 rounded-xl px-3 py-1 inline-block text-sm">
          {Object.values(progress).filter(Boolean).length} / {MODUL_DEFAULT.length} modul selesai
        </div>
      </div>

      <div className="space-y-3">
        {MODUL_DEFAULT.map((modul, idx) => {
          const info = TOPIK_INFO[modul.topik] || { emoji: '📚', warna: 'bg-gray-100 text-gray-700' }
          const selesai = progress[modul.id]
          const locked = idx > 0 && !progress[MODUL_DEFAULT[idx - 1].id]
          return (
            <div key={modul.id}
              onClick={() => !locked && router.push(`/siswa/koding/${modul.id}`)}
              className={`bg-white rounded-2xl p-4 border transition ${locked ? 'opacity-50 cursor-not-allowed border-gray-100' : 'border-gray-100 cursor-pointer active:scale-98 hover:border-blue-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${info.warna}`}>
                  {selesai ? '✅' : locked ? '🔒' : info.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{modul.judul}</p>
                  <p className="text-xs text-gray-400">{modul.deskripsi}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${modul.level === 'pemula' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {modul.level}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
