'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button, PageLoader } from '@/components/ui'

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
      guru_id: user.id, kuis_id: selectedKuis, kelas_id: selectedKelas, kode, status: 'waiting'
    }).select().single()
    setCreating(false)
    if (!error && data) router.push(`/guru/live/${data.id}`)
  }

  if (loading) return <PageLoader />

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageHeader title="Live Quiz" subtitle="Kuis real-time interaktif" backHref="/guru" />
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Buat Sesi Baru</h2>
          <div className="space-y-3">
            <select value={selectedKuis} onChange={e => setSelectedKuis(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
              <option value="">Pilih Quiz...</option>
              {kuis.map(k => <option key={k.id} value={k.id}>{k.judul}</option>)}
            </select>
            <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
              <option value="">Pilih Kelas...</option>
              {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
            <Button fullWidth loading={creating} disabled={!selectedKuis || !selectedKelas} onClick={buatSesi}>
              🚀 Mulai Sesi Live
            </Button>
          </div>
        </div>

        {sessions.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>Sesi Sebelumnya</h2>
            </div>
            {sessions.map(s => (
              <div key={s.id} onClick={() => router.push(`/guru/live/${s.id}`)}
                className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:opacity-80 transition border-b last:border-0"
                style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{s.kuis?.judul}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{s.kelas?.nama} · Kode: <span className="font-mono font-bold">{s.kode}</span></p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${s.status === 'finished' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
