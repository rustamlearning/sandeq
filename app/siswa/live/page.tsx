'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LiveJoinPage() {
  const router = useRouter()
  const [kode, setKode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function joinSesi() {
    if (kode.length < 6) return
    setLoading(true)
    setError('')

    const { data } = await supabase
      .from('live_sessions')
      .select('id, status')
      .eq('kode', kode.toUpperCase())
      .neq('status', 'finished')
      .single()

    setLoading(false)
    if (!data) { setError('Kode tidak ditemukan atau sesi sudah selesai.'); return }
    router.push(`/siswa/live/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
        <p className="text-5xl mb-4">🎮</p>
        <h1 className="text-2xl font-black text-gray-800 mb-1">Live Quiz</h1>
        <p className="text-gray-400 text-sm mb-6">Masukkan kode dari gurumu</p>

        <input
          value={kode}
          onChange={e => setKode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="XXXXXX"
          className="w-full text-center text-3xl font-mono font-black tracking-widest border-2 border-gray-200 rounded-2xl px-4 py-4 mb-4 focus:outline-none focus:border-emerald-500 uppercase"
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={joinSesi}
          disabled={kode.length < 6 || loading}
          className="w-full bg-emerald-600 text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-50"
        >
          {loading ? 'Mencari...' : 'Join Sekarang!'}
        </button>
      </div>
    </div>
  )
}
