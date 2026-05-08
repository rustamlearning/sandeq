'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Nilai } from '@/lib/supabase'
import { ArrowLeft, BarChart3, ChevronDown, Loader2 } from 'lucide-react'

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
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'siswa') { router.replace('/login'); return }
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
    const map = new Map<string, Nilai[]>()
    list.forEach((n) => { const arr = map.get(n.mapel) || []; arr.push(n); map.set(n.mapel, arr) })

    const groupedArr: NilaiGrouped[] = Array.from(map.entries()).map(([mapel, items]) => {
      const rata = items.reduce((sum, i) => sum + Number(i.nilai), 0) / items.length
      return { mapel, list: items, rata: Math.round(rata * 10) / 10 }
    })
    groupedArr.sort((a, b) => b.rata - a.rata)
    setGrouped(groupedArr)

    const total = list.reduce((sum, n) => sum + Number(n.nilai), 0)
    setRataKeseluruhan(list.length > 0 ? Math.round((total / list.length) * 10) / 10 : 0)
    if (groupedArr.length > 0) setExpanded(groupedArr[0].mapel)
  }

  function getGrade(nilai: number) {
    if (nilai >= 85) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-400' }
    if (nilai >= 75) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-400' }
    if (nilai >= 65) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50', bar: 'bg-yellow-400' }
    if (nilai >= 50) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-400' }
    return { grade: 'E', color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-400' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#1A4A7A]" />
          <p className="text-gray-500 text-sm">Memuat nilai...</p>
        </div>
      </div>
    )
  }

  const { grade, color, bar } = getGrade(rataKeseluruhan)

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 to-emerald-500 text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/siswa')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-bold"
            aria-label="Kembali ke dashboard siswa"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold leading-tight">Nilai Saya</h1>
            <p className="text-blue-200 text-xs">{grouped.length} mata pelajaran</p>
          </div>
        </div>

        {/* Summary card */}
        <div className="max-w-2xl mx-auto px-4 pb-5">
          <div className="bg-white/15 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className={`text-3xl font-black text-white`}>{grade}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-blue-200 mb-1">Rata-rata Keseluruhan</p>
              <p className="text-4xl font-black">{rataKeseluruhan}</p>
              <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                <div className={`h-full ${bar} rounded-full transition-all duration-700`} style={{ width: `${rataKeseluruhan}%` }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {grouped.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <BarChart3 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-gray-700">Belum ada nilai</p>
            <p className="text-sm text-gray-500 mt-1">Selesaikan ulangan untuk mendapat nilai.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {grouped.map((g) => {
              const g_info = getGrade(g.rata)
              const isOpen = expanded === g.mapel

              return (
                <div key={g.mapel} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Mapel header — clickable */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : g.mapel)}
                    className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition"
                  >
                    <div className={`w-11 h-11 rounded-xl ${g_info.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-lg font-black ${g_info.color}`}>{g_info.grade}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-800 text-sm">{g.mapel}</p>
                      <p className="text-xs text-gray-500">{g.list.length} nilai</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black ${g_info.color}`}>{g.rata}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Progress bar */}
                  <div className="h-1 bg-gray-100">
                    <div className={`h-full ${g_info.bar} transition-all duration-500`} style={{ width: `${g.rata}%` }} />
                  </div>

                  {/* Detail rows */}
                  {isOpen && (
                    <div className="divide-y divide-gray-100">
                      {g.list.map((n) => {
                        const n_info = getGrade(Number(n.nilai))
                        return (
                          <div key={n.id} className="px-4 py-3 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg ${n_info.bg} flex items-center justify-center flex-shrink-0`}>
                              <span className={`text-sm font-bold ${n_info.color}`}>{n_info.grade}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{n.komponen}</p>
                              <p className="text-xs text-gray-500">
                                Sem {n.semester} · {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                              {n.catatan && <p className="text-xs text-gray-400 italic">{n.catatan}</p>}
                            </div>
                            <p className={`text-xl font-black ${n_info.color} flex-shrink-0`}>{n.nilai}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
