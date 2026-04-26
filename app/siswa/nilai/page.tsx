'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Nilai } from '@/lib/supabase'

interface NilaiGrouped {
  mapel: string
  list: Nilai[]
  rata: number
}

export default function NilaiSiswaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [grouped, setGrouped] = useState<NilaiGrouped[]>([])
  const [rataKeseluruhan, setRataKeseluruhan] = useState(0)

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'siswa') {
        router.replace('/login')
        return
      }
      await load(u)
      setLoading(false)
    }
    init()
  }, [router])

  async function load(currentUser: User) {
    const { data } = await supabase
      .from('nilai')
      .select('*')
      .eq('siswa_id', currentUser.id)
      .order('created_at', { ascending: false })

    const list = data || []

    // Group by mapel
    const map = new Map<string, Nilai[]>()
    list.forEach((n) => {
      const arr = map.get(n.mapel) || []
      arr.push(n)
      map.set(n.mapel, arr)
    })

    const groupedArr: NilaiGrouped[] = Array.from(map.entries()).map(([mapel, items]) => {
      const rata = items.reduce((sum, i) => sum + Number(i.nilai), 0) / items.length
      return { mapel, list: items, rata: Math.round(rata * 10) / 10 }
    })

    groupedArr.sort((a, b) => a.mapel.localeCompare(b.mapel))
    setGrouped(groupedArr)

    const total = list.reduce((sum, n) => sum + Number(n.nilai), 0)
    setRataKeseluruhan(list.length > 0 ? Math.round((total / list.length) * 10) / 10 : 0)
  }

  function getNilaiColor(nilai: number) {
    if (nilai >= 85) return 'text-green-700'
    if (nilai >= 70) return 'text-blue-700'
    if (nilai >= 60) return 'text-orange-700'
    return 'text-red-700'
  }

  function getGrade(nilai: number) {
    if (nilai >= 85) return 'A'
    if (nilai >= 75) return 'B'
    if (nilai >= 65) return 'C'
    if (nilai >= 50) return 'D'
    return 'E'
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/siswa')} className="text-gray-500 hover:text-gray-700">
            ← Kembali
          </button>
          <h1 className="text-xl font-bold text-gray-800">Nilai Saya</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Rata-rata keseluruhan */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <p className="text-sm opacity-90">Rata-rata Keseluruhan</p>
          <p className="text-5xl font-bold mt-1">{rataKeseluruhan}</p>
          <p className="text-sm opacity-90 mt-2">
            Grade: <span className="font-bold">{getGrade(rataKeseluruhan)}</span>
          </p>
        </div>

        {grouped.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">Belum ada nilai. Selesaikan ulangan untuk mendapat nilai.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((g) => (
              <div key={g.mapel} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{g.mapel}</h3>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Rata-rata</p>
                    <p className={`text-xl font-bold ${getNilaiColor(g.rata)}`}>{g.rata}</p>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {g.list.map((n) => (
                    <div key={n.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{n.komponen}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Semester {n.semester} ·{' '}
                          {new Date(n.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                        {n.catatan && (
                          <p className="text-xs text-gray-400 italic mt-1">{n.catatan}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getNilaiColor(Number(n.nilai))}`}>
                          {n.nilai}
                        </p>
                        <p className="text-xs text-gray-500">{getGrade(Number(n.nilai))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}