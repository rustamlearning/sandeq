'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Soal {
  id: string; teks: string; pilihan?: string[]
  jawaban_benar?: string; poin: number; urutan: number; tipe: string
}
interface Session {
  id: string; kode: string; status: string
  soal_aktif_index: number; kuis_id: string
  kuis: { judul: string }; kelas: { nama: string }
}
interface Peserta { siswa_id: string; nama: string; total_poin: number; benar: number }

export default function LiveSessionGuruPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [soalList, setSoalList] = useState<Soal[]>([])
  const [peserta, setPeserta] = useState<Peserta[]>([])
  const [loading, setLoading] = useState(true)

  const loadPeserta = useCallback(async () => {
    const { data } = await supabase
      .from('live_answers')
      .select('siswa_id, poin, benar, users:siswa_id(nama)')
      .eq('session_id', id)
    if (!data) return
    const map: Record<string, Peserta> = {}
    for (const row of data as any[]) {
      if (!map[row.siswa_id]) map[row.siswa_id] = { siswa_id: row.siswa_id, nama: row.users?.nama || 'Siswa', total_poin: 0, benar: 0 }
      map[row.siswa_id].total_poin += row.poin || 0
      if (row.benar) map[row.siswa_id].benar++
    }
    setPeserta(Object.values(map).sort((a, b) => b.total_poin - a.total_poin))
  }, [id])

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase
        .from('live_sessions').select('*, kuis(judul), kelas(nama)').eq('id', id).single()
      if (!s) return router.push('/guru/live')
      setSession(s as any)
      const { data: soal } = await supabase.from('soal').select('*').eq('kuis_id', s.kuis_id).order('urutan')
      setSoalList(soal || [])
      await loadPeserta()
      setLoading(false)
    }
    load()

    const channel = supabase.channel(`live_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_answers', filter: `session_id=eq.${id}` }, () => loadPeserta())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_sessions', filter: `id=eq.${id}` },
        (payload) => setSession(prev => prev ? { ...prev, ...payload.new } : prev))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, router, loadPeserta])

  async function updateStatus(status: string) {
    await supabase.from('live_sessions').update({ status }).eq('id', id)
    setSession(prev => prev ? { ...prev, status } : prev)
  }

  async function nextSoal() {
    if (!session || !soalList.length) return
    const next = session.soal_aktif_index + 1
    if (next >= soalList.length) { await updateStatus('finished'); return }
    await supabase.from('live_sessions').update({ soal_aktif_index: next, status: 'active' }).eq('id', id)
    setSession(prev => prev ? { ...prev, soal_aktif_index: next, status: 'active' } : prev)
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!session) return null

  const soalAktif = soalList[session.soal_aktif_index]
  const isFinished = session.status === 'finished'

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/guru/live')} className="text-gray-500">←</button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">{session.kuis?.judul}</h1>
          <p className="text-xs text-gray-400">{session.kelas?.nama}</p>
        </div>
        <div className="ml-auto text-center">
          <p className="text-2xl font-mono font-black text-indigo-600">{session.kode}</p>
          <p className="text-xs text-gray-400">Kode Join</p>
        </div>
      </div>

      {session.status === 'waiting' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4 text-center">
          <p className="text-5xl mb-3">⏳</p>
          <p className="text-gray-600 mb-1">Menunggu siswa join...</p>
          <p className="text-sm text-gray-400 mb-4">{peserta.length} siswa sudah siap</p>
          <button onClick={() => updateStatus('active')} className="w-full bg-green-600 text-white rounded-xl py-3 font-semibold">
            🚀 Mulai Quiz
          </button>
        </div>
      )}

      {session.status === 'active' && soalAktif && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-gray-400">Soal {session.soal_aktif_index + 1} / {soalList.length}</span>
          </div>
          <p className="font-medium text-gray-800 mb-4">{soalAktif.teks}</p>
          {soalAktif.pilihan && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {soalAktif.pilihan.map((p, i) => (
                <div key={i} className={`p-3 rounded-xl text-sm text-center font-medium border-2 ${p === soalAktif.jawaban_benar ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                  {p}
                </div>
              ))}
            </div>
          )}
          <button onClick={nextSoal} className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold">
            {session.soal_aktif_index + 1 >= soalList.length ? '🏁 Selesaikan' : '⏭ Soal Berikutnya'}
          </button>
        </div>
      )}

      {isFinished && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4 text-center">
          <p className="text-3xl mb-2">🏆</p>
          <p className="font-bold text-green-800">Sesi Selesai!</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-3">Leaderboard ({peserta.length} siswa)</h2>
        {peserta.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Belum ada yang menjawab</p>
        ) : (
          <div className="space-y-2">
            {peserta.map((p, i) => (
              <div key={p.siswa_id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <span className="text-lg font-black text-gray-400 w-6">{i + 1}</span>
                <span className="flex-1 text-sm font-medium text-gray-800">{p.nama}</span>
                <span className="text-sm font-bold text-indigo-600">{p.total_poin} poin</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
