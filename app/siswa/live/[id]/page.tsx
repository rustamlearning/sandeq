'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Soal {
  id: string; teks: string; pilihan?: string[]
  jawaban_benar?: string; poin: number; tipe: string
}
interface Session {
  id: string; kode: string; status: string
  soal_aktif_index: number; kuis_id: string
  kuis: { judul: string }
}
interface Leaderboard { nama: string; total_poin: number }

export default function LiveSiswaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [soalList, setSoalList] = useState<Soal[]>([])
  const [user, setUser] = useState<any>(null)
  const [jawaban, setJawaban] = useState<string | null>(null)
  const [hasilJawaban, setHasilJawaban] = useState<boolean | null>(null)
  const [totalPoin, setTotalPoin] = useState(0)
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([])
  const [loading, setLoading] = useState(true)
  const [sudahJawab, setSudahJawab] = useState(false)

  const loadLeaderboard = useCallback(async () => {
    const { data } = await supabase
      .from('live_answers')
      .select('siswa_id, poin, users:siswa_id(nama)')
      .eq('session_id', id)
    if (!data) return
    const map: Record<string, Leaderboard> = {}
    for (const row of data as any[]) {
      if (!map[row.siswa_id]) map[row.siswa_id] = { nama: row.users?.nama || 'Siswa', total_poin: 0 }
      map[row.siswa_id].total_poin += row.poin || 0
    }
    setLeaderboard(Object.values(map).sort((a, b) => b.total_poin - a.total_poin).slice(0, 5))
  }, [id])

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return router.push('/login')
      setUser(u)

      const { data: s } = await supabase
        .from('live_sessions')
        .select('*, kuis(judul)')
        .eq('id', id).single()
      if (!s) return router.push('/siswa/live')
      setSession(s as any)

      const { data: soal } = await supabase
        .from('soal').select('*').eq('kuis_id', s.kuis_id).order('urutan')
      setSoalList(soal || [])

      const { data: myPoin } = await supabase
        .from('live_answers').select('poin').eq('session_id', id).eq('siswa_id', u.id)
      setTotalPoin((myPoin || []).reduce((s: number, r: any) => s + (r.poin || 0), 0))

      await loadLeaderboard()
      setLoading(false)
    }
    load()

    const channel = supabase.channel(`live_siswa_${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_sessions', filter: `id=eq.${id}` },
        (payload) => {
          setSession(prev => prev ? { ...prev, ...payload.new } : prev)
          setSudahJawab(false)
          setJawaban(null)
          setHasilJawaban(null)
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_answers', filter: `session_id=eq.${id}` },
        () => loadLeaderboard())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, router, loadLeaderboard])

  async function kirimJawaban(pilihan: string) {
    if (sudahJawab || !session || !user) return
    const soal = soalList[session.soal_aktif_index]
    if (!soal) return

    setSudahJawab(true)
    setJawaban(pilihan)

    const benar = pilihan === soal.jawaban_benar
    const poin = benar ? soal.poin : 0
    setHasilJawaban(benar)
    setTotalPoin(p => p + poin)

    await supabase.from('live_answers').upsert({
      session_id: id,
      siswa_id: user.id,
      soal_id: soal.id,
      jawaban: pilihan,
      benar,
      poin,
      waktu_jawab_ms: 0,
    }, { onConflict: 'session_id,siswa_id,soal_id' })
  }

  if (loading) return <div className="min-h-screen bg-blue-600 flex items-center justify-center text-white text-xl">Loading...</div>
  if (!session) return null

  const soalAktif = soalList[session.soal_aktif_index]

  if (session.status === 'waiting') return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <p className="text-6xl mb-4">⏳</p>
        <h1 className="text-2xl font-black mb-2">{session.kuis?.judul}</h1>
        <p className="opacity-75">Menunggu guru memulai...</p>
        <div className="mt-4 text-4xl font-mono font-black bg-white/20 rounded-2xl px-6 py-3">{session.kode}</div>
      </div>
    </div>
  )

  if (session.status === 'finished') return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <p className="text-6xl mb-4">🏆</p>
        <h1 className="text-2xl font-black mb-2">Selesai!</h1>
        <p className="text-4xl font-black mb-6">{totalPoin} poin</p>
        <div className="bg-white/20 rounded-2xl p-4 mb-4 text-left min-w-64">
          {leaderboard.map((l, i) => (
            <div key={i} className="flex justify-between py-1">
              <span>{i + 1}. {l.nama}</span>
              <span className="font-bold">{l.total_poin}</span>
            </div>
          ))}
        </div>
        <button onClick={() => router.push('/siswa')} className="bg-white text-green-700 font-bold px-8 py-3 rounded-2xl">
          Kembali
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">Soal {session.soal_aktif_index + 1}/{soalList.length}</span>
        <span className="font-bold text-blue-600">{totalPoin} poin</span>
      </div>

      {soalAktif && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <p className="font-semibold text-gray-800 mb-5 text-lg leading-relaxed">{soalAktif.teks}</p>
          {soalAktif.pilihan && (
            <div className="grid grid-cols-2 gap-3">
              {soalAktif.pilihan.map((p, i) => (
                <button key={i} onClick={() => kirimJawaban(p)} disabled={sudahJawab}
                  className={`p-4 rounded-2xl font-semibold text-sm transition-all ${
                    sudahJawab
                      ? p === soalAktif.jawaban_benar ? 'bg-green-500 text-white'
                        : p === jawaban ? 'bg-red-400 text-white'
                        : 'bg-gray-100 text-gray-400'
                      : 'bg-blue-50 text-emerald-800 active:scale-95'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          )}
          {sudahJawab && (
            <div className={`mt-4 p-3 rounded-xl text-center font-bold ${hasilJawaban ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {hasilJawaban ? '✅ Benar! +' + soalAktif.poin + ' poin' : '❌ Salah'}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-xs text-gray-400 mb-2">Top 5</p>
        {leaderboard.map((l, i) => (
          <div key={i} className="flex justify-between text-sm py-1">
            <span className="text-gray-700">{i + 1}. {l.nama}</span>
            <span className="font-bold text-blue-600">{l.total_poin}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
