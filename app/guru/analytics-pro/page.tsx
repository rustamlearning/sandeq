'use client'

import { PageHeader } from '@/components/ui/PageHeader'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

interface AtRisk {
  id: string; alasan: string; level: string; created_at: string
  siswa: { nama: string }; kelas: { nama: string }
}
interface SoalHeatmap {
  soal_id: string; teks: string; total: number; salah: number; pct_salah: number
}
interface EngagementSiswa {
  siswa_id: string; nama: string; last_active: string; total_menit: number; depth_avg: number
}

export default function AnalyticsProPage() {
  const router = useRouter()
  const [atRisk, setAtRisk] = useState<AtRisk[]>([])
  const [heatmap, setHeatmap] = useState<SoalHeatmap[]>([])
  const [engagement, setEngagement] = useState<EngagementSiswa[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'atrisk' | 'heatmap' | 'engagement'>('atrisk')
  const [kelasId, setKelasId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser()
      if (!user) return router.push('/login')
      const kelas = user.kelas_id || null
      setKelasId(kelas)
      await Promise.all([
        loadAtRisk(kelas),
        loadHeatmap(user.id),
        loadEngagement(kelas),
      ])
      setLoading(false)
    }
    load()
  }, [router])

  async function loadAtRisk(kelas: string | null) {
    const q = supabase.from('at_risk_alerts')
      .select('*, siswa:siswa_id(nama), kelas:kelas_id(nama)')
      .is('resolved_at', null)
      .order('created_at', { ascending: false })
      .limit(20)
    if (kelas) q.eq('kelas_id', kelas)
    const { data } = await q
    setAtRisk((data as any) || [])
  }

  async function loadHeatmap(guruId: string) {
    const { data: kuisData } = await supabase.from('kuis').select('id').eq('guru_id', guruId)
    if (!kuisData?.length) return
    const ids = kuisData.map(k => k.id)

    const { data: soalData } = await supabase.from('soal').select('id, teks').in('kuis_id', ids).limit(20)
    if (!soalData?.length) return

    const soalIds = soalData.map(s => s.id)
    const { data: jawabanData } = await supabase
      .from('jawaban_attempts').select('soal_id, benar').in('soal_id', soalIds)

    const map: Record<string, { total: number; salah: number }> = {}
    for (const j of jawabanData || []) {
      if (!map[j.soal_id]) map[j.soal_id] = { total: 0, salah: 0 }
      map[j.soal_id].total++
      if (!j.benar) map[j.soal_id].salah++
    }

    const result: SoalHeatmap[] = soalData
      .filter(s => map[s.id]?.total > 0)
      .map(s => ({
        soal_id: s.id,
        teks: s.teks,
        total: map[s.id].total,
        salah: map[s.id].salah,
        pct_salah: Math.round((map[s.id].salah / map[s.id].total) * 100),
      }))
      .sort((a, b) => b.pct_salah - a.pct_salah)

    setHeatmap(result)
  }

  async function loadEngagement(kelas: string | null) {
    let siswaIds: string[] = []
    if (kelas) {
      const { data } = await supabase.from('users').select('id, nama').eq('kelas_id', kelas).eq('role', 'siswa')
      siswaIds = (data || []).map(s => s.id)
      if (!siswaIds.length) return

      const tigaHariLalu = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]
      const { data: logs } = await supabase
        .from('engagement_logs').select('siswa_id, tanggal, durasi_menit, depth_score')
        .in('siswa_id', siswaIds).order('tanggal', { ascending: false })

      const map: Record<string, { nama: string; last_active: string; total_menit: number; depth_scores: number[] }> = {}
      for (const s of data || []) map[s.id] = { nama: s.nama, last_active: '-', total_menit: 0, depth_scores: [] }
      for (const log of logs || []) {
        if (!map[log.siswa_id]) continue
        if (map[log.siswa_id].last_active === '-') map[log.siswa_id].last_active = log.tanggal
        map[log.siswa_id].total_menit += log.durasi_menit || 0
        map[log.siswa_id].depth_scores.push(log.depth_score || 0)
      }

      const result: EngagementSiswa[] = Object.entries(map).map(([id, v]) => ({
        siswa_id: id,
        nama: v.nama,
        last_active: v.last_active,
        total_menit: v.total_menit,
        depth_avg: v.depth_scores.length ? Math.round(v.depth_scores.reduce((a, b) => a + b, 0) / v.depth_scores.length) : 0,
      })).sort((a, b) => a.last_active.localeCompare(b.last_active))

      setEngagement(result)

      // Auto-generate at-risk alerts
      const berisiko = result.filter(s => s.last_active < tigaHariLalu || s.last_active === '-')
      for (const s of berisiko) {
        await supabase.from('at_risk_alerts').upsert({
          siswa_id: s.siswa_id,
          kelas_id: kelas,
          alasan: s.last_active === '-' ? 'Belum pernah aktif' : `Tidak aktif sejak ${s.last_active}`,
          level: s.last_active === '-' ? 'tinggi' : 'sedang',
        }, { onConflict: 'siswa_id' })
      }
    }
  }

  async function resolveAlert(id: string) {
    await supabase.from('at_risk_alerts').update({ resolved_at: new Date().toISOString() }).eq('id', id)
    setAtRisk(prev => prev.filter(a => a.id !== id))
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageHeader title="Analytics Pro" backHref="/guru" />
      <div className="max-w-2xl mx-auto px-4 py-5">

      <div className="flex gap-2 mb-6">
        {(['atrisk', 'heatmap', 'engagement'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {t === 'atrisk' ? '🚨 At-Risk' : t === 'heatmap' ? '🔥 Heatmap Soal' : '📊 Engagement'}
          </button>
        ))}
      </div>

      {tab === 'atrisk' && (
        <div className="space-y-3">
          {atRisk.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400">✅ Tidak ada siswa berisiko</div>
          ) : atRisk.map(a => (
            <div key={a.id} className={`bg-white rounded-2xl p-4 border-l-4 ${a.level === 'tinggi' ? 'border-red-500' : 'border-orange-400'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{a.siswa?.nama}</p>
                  <p className="text-xs text-gray-400">{a.kelas?.nama}</p>
                  <p className="text-sm text-gray-600 mt-1">{a.alasan}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.level === 'tinggi' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {a.level}
                  </span>
                  <button onClick={() => resolveAlert(a.id)} className="text-xs text-green-600 underline">Tandai Selesai</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'heatmap' && (
        <div className="space-y-3">
          {heatmap.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Belum ada data jawaban</div>
          ) : heatmap.map(s => (
            <div key={s.soal_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-800 mb-2 line-clamp-2">{s.teks}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div className="h-3 rounded-full transition-all"
                    style={{ width: `${s.pct_salah}%`, backgroundColor: s.pct_salah > 70 ? '#ef4444' : s.pct_salah > 40 ? '#f97316' : '#22c55e' }} />
                </div>
                <span className="text-sm font-bold" style={{ color: s.pct_salah > 70 ? '#ef4444' : s.pct_salah > 40 ? '#f97316' : '#22c55e' }}>
                  {s.pct_salah}% salah
                </span>
                <span className="text-xs text-gray-400">{s.total}x</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'engagement' && (
        <div className="space-y-2">
          {engagement.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Belum ada data engagement</div>
          ) : engagement.map(s => {
            const tigaHariLalu = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]
            const berisiko = s.last_active < tigaHariLalu || s.last_active === '-'
            return (
              <div key={s.siswa_id} className={`bg-white rounded-2xl p-4 border ${berisiko ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{s.nama}</p>
                    <p className="text-xs text-gray-400">Terakhir aktif: {s.last_active === '-' ? 'Belum pernah' : s.last_active}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-indigo-600">{s.total_menit} menit</p>
                    <p className="text-xs text-gray-400">depth: {s.depth_avg}</p>
                  </div>
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
