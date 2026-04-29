'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Absensi } from '@/lib/supabase'

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  hadir: { label: 'Hadir', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  sakit: { label: 'Sakit', bg: 'bg-yellow-100',  text: 'text-yellow-700',  dot: 'bg-yellow-500' },
  izin:  { label: 'Izin',  bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'   },
  alpha: { label: 'Alpha', bg: 'bg-red-100',      text: 'text-red-700',     dot: 'bg-red-500'    },
}

export default function AbsensiSiswaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<Absensi[]>([])
  const [stats, setStats] = useState({ hadir: 0, sakit: 0, izin: 0, alpha: 0 })

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'siswa') { router.replace('/login'); return }
      await load(u)
      setLoading(false)
    }
    init()
  }, [router])

  async function load(u: User) {
    const { data } = await supabase
      .from('absensi').select('*').eq('siswa_id', u.id).order('tanggal', { ascending: false })
    const records = data || []
    setList(records)
    setStats({
      hadir: records.filter((r) => r.status === 'hadir').length,
      sakit: records.filter((r) => r.status === 'sakit').length,
      izin:  records.filter((r) => r.status === 'izin').length,
      alpha: records.filter((r) => r.status === 'alpha').length,
    })
  }

  const total = list.length
  const persenHadir = total > 0 ? Math.round((stats.hadir / total) * 100) : 0
  const statusBarWidth = Math.min(persenHadir, 100)
  const barColor = persenHadir >= 90 ? 'bg-emerald-400' : persenHadir >= 75 ? 'bg-yellow-400' : 'bg-red-400'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">📋</div>
          <p className="text-gray-500">Memuat absensi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <button
            onClick={() => router.push('/siswa')}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Absensi Saya</h1>
            <p className="text-white/80 text-sm">{total} hari tercatat</p>
          </div>
        </div>

        {/* Kehadiran summary */}
        <div className="max-w-2xl mx-auto px-4 pb-5">
          <div className="bg-white/15 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/80 text-sm">Persentase Kehadiran</p>
              <p className="text-white font-bold text-2xl">{persenHadir}%</p>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-700`}
                style={{ width: `${statusBarWidth}%` }}
              />
            </div>
            <p className="text-white/60 text-xs mt-1.5">
              {stats.hadir} hadir · {stats.sakit} sakit · {stats.izin} izin · {stats.alpha} alpha
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className={`${cfg.bg} rounded-xl p-3 text-center`}>
              <p className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</p>
              <p className={`text-2xl font-bold ${cfg.text}`}>{stats[key as keyof typeof stats]}</p>
            </div>
          ))}
        </div>

        {/* Riwayat */}
        {list.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-semibold text-gray-700">Belum ada catatan kehadiran</p>
            <p className="text-sm text-gray-400 mt-1">Data absensi akan muncul setelah guru mengisi</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Riwayat Kehadiran</p>
            </div>
            <div className="divide-y divide-gray-50">
              {list.map((a) => {
                const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.hadir
                return (
                  <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(a.tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                      {a.catatan && <p className="text-xs text-gray-400 italic mt-0.5">{a.catatan}</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
