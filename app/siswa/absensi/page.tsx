'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Absensi } from '@/lib/supabase'

export default function AbsensiSiswaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<Absensi[]>([])
  const [stats, setStats] = useState({ hadir: 0, sakit: 0, izin: 0, alpha: 0 })

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
      .from('absensi')
      .select('*')
      .eq('siswa_id', currentUser.id)
      .order('tanggal', { ascending: false })

    const records = data || []
    setList(records)

    setStats({
      hadir: records.filter((r) => r.status === 'hadir').length,
      sakit: records.filter((r) => r.status === 'sakit').length,
      izin: records.filter((r) => r.status === 'izin').length,
      alpha: records.filter((r) => r.status === 'alpha').length,
    })
  }

  const total = list.length
  const persenHadir = total > 0 ? Math.round((stats.hadir / total) * 100) : 0

  function statusLabel(s: string) {
    const map: Record<string, string> = {
      hadir: 'Hadir',
      sakit: 'Sakit',
      izin: 'Izin',
      alpha: 'Alpha',
    }
    return map[s] || s
  }

  function statusColor(s: string) {
    const map: Record<string, string> = {
      hadir: 'bg-green-100 text-green-700',
      sakit: 'bg-yellow-100 text-yellow-700',
      izin: 'bg-blue-100 text-blue-700',
      alpha: 'bg-red-100 text-red-700',
    }
    return map[s] || 'bg-gray-100 text-gray-700'
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
          <h1 className="text-xl font-bold text-gray-800">Absensi Saya</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Persentase kehadiran */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <p className="text-sm opacity-90">Persentase Kehadiran</p>
          <p className="text-5xl font-bold mt-1">{persenHadir}%</p>
          <p className="text-sm opacity-90 mt-2">
            {stats.hadir} hadir dari {total} hari tercatat
          </p>
        </div>

        {/* Stats per kategori */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-600">Hadir</p>
            <p className="text-2xl font-bold text-green-700">{stats.hadir}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-xs text-yellow-600">Sakit</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.sakit}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-600">Izin</p>
            <p className="text-2xl font-bold text-blue-700">{stats.izin}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-xs text-red-600">Alpha</p>
            <p className="text-2xl font-bold text-red-700">{stats.alpha}</p>
          </div>
        </div>

        {/* Riwayat */}
        <h3 className="font-semibold text-gray-800 mb-3">Riwayat Kehadiran</h3>
        {list.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">Belum ada catatan kehadiran.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {list.map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      {new Date(a.tanggal).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    {a.catatan && (
                      <p className="text-xs text-gray-500 mt-1 italic">{a.catatan}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(a.status)}`}>
                    {statusLabel(a.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}