'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Kuis { id: string; judul: string }
interface Kelas { id: string; nama: string }
interface LiveSession {
  id: string; kode: string; status: string
  kuis: { judul: string }; kelas: { nama: string }
  created_at: string
}

export default function LivePage() {
  const router = useRouter()
  const [kuis, setKuis] = useState<Kuis[]>([])
  const [kelas, setKelas] = useState<Kelas[]>([])
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [selectedKuis, setSelectedKuis] = useState('')
  const [selectedKelas, setSelectedKelas] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [kuisRes, kelasRes, sessionRes] = await Promise.all([
      supabase.from('kuis').select('id, judul').eq('guru_id', user.id).order('created_at', { ascending: false }),
      supabase.from('kelas').select('id, nama'),
      supabase.from('live_sessions').select('id, kode, status, created_at, kuis(judul), kelas(nama)')
        .eq('guru_id', user.id).order('created_at', { ascending: false }).limit(10)
    ])

    setKuis(kuisRes.data || [])
    setKelas(kelasRes.data || [])
    setSessions((sessionRes.data as any) || [])
    setLoading(false)
  }

  async function buatSesi() {
    if (!selectedKuis || !selectedKelas) return
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const kode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data, error } = await supabase.from('live_sessions').insert({
      guru_id: user.id,
      kuis_id: selectedKuis,
      kelas_id: selectedKelas,
      kode,
      status: 'waiting'
    }).select().single()

    setCreating(false)
    if (!error && data) router.push(`/guru/live/${data.id}`)
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500">←</button>
        <h1 className="text-xl font-bold text-gray-800">Live Quiz</h1>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <h2 className="font-semibold text-gray-700 mb-4">Buat Sesi Baru</h2>
        <div className="space-y-3">
          <select
            value={selectedKuis}
            onChange={e => setSelectedKuis(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Pilih Quiz...</option>
            {kuis.map(k => <option key={k.id} value={k.id}>{k.judul}</option>)}
          </select>
          <select
            value={selectedKelas}
            onChange={e => setSelectedKelas(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Pilih Kelas...</option>
            {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
          <button
            onClick={buatSesi}
            disabled={!selectedKuis || !selectedKelas || creating}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
          >
            {creating ? 'Membuat...' : '🚀 Mulai Sesi Live'}
          </button>
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-3">Sesi Sebelumnya</h2>
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id}
                onClick={() => s.status !== 'finished' && router.push(`/guru/live/${s.id}`)}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.kuis?.judul}</p>
                  <p className="text-xs text-gray-400">{s.kelas?.nama} · Kode: <span className="font-mono font-bold">{s.kode}</span></p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  s.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                  s.status === 'active' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
