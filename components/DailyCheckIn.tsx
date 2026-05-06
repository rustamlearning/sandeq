'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  userId: string
  onSelesai?: (mood: number, niat: string) => void
  onSkip?: () => void
}

const MOODS = [
  { nilai: 1, emoji: '😴', label: 'Ngantuk' },
  { nilai: 2, emoji: '😕', label: 'Kurang semangat' },
  { nilai: 3, emoji: '😐', label: 'Biasa aja' },
  { nilai: 4, emoji: '😊', label: 'Semangat' },
  { nilai: 5, emoji: '🔥', label: 'Super semangat!' },
]

const NIAT_SUGGESTIONS = [
  'Hari ini saya ingin memahami materi baru',
  'Saya akan fokus mengerjakan kuis',
  'Saya ingin meningkatkan nilai saya',
  'Hari ini saya akan belajar tanpa distraksi',
  'Saya ingin bertanya kalau ada yang tidak mengerti',
]

export default function DailyCheckIn({ userId, onSelesai, onSkip }: Props) {
  const [mood, setMood] = useState<number | null>(null)
  const [niat, setNiat] = useState('')
  const [step, setStep] = useState<'mood' | 'niat' | 'selesai'>('mood')
  const [saving, setSaving] = useState(false)
  const [sudahCheckin, setSudahCheckin] = useState<boolean | null>(null)

  useEffect(() => {
    cekCheckinHariIni()
  }, [userId])

  async function cekCheckinHariIni() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('daily_checkin')
      .select('id, mood, niat')
      .eq('user_id', userId)
      .eq('tanggal', today)
      .maybeSingle()

    if (data) {
      setSudahCheckin(true)
      onSelesai?.(data.mood, data.niat ?? '')
    } else {
      setSudahCheckin(false)
    }
  }

  async function simpan() {
    if (!mood) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('daily_checkin').upsert({
      user_id: userId,
      tanggal: today,
      mood,
      niat: niat.trim() || null,
    }, { onConflict: 'user_id,tanggal' })
    setSaving(false)
    setStep('selesai')
    setTimeout(() => onSelesai?.(mood, niat), 1200)
  }

  // Belum load
  if (sudahCheckin === null) return null
  // Sudah checkin hari ini
  if (sudahCheckin === true) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">

        {/* Step: Mood */}
        {step === 'mood' && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">👋</div>
              <h2 className="text-lg font-bold text-slate-800">Selamat pagi!</h2>
              <p className="text-sm text-slate-500 mt-1">Bagaimana perasaanmu hari ini?</p>
            </div>

            <div className="flex justify-between gap-2 mb-6">
              {MOODS.map(m => (
                <button
                  key={m.nilai}
                  onClick={() => setMood(m.nilai)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${
                    mood === m.nilai
                      ? 'border-blue-500 bg-blue-50 scale-105'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px] text-gray-500 leading-tight text-center">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onSkip}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm"
              >
                Lewati
              </button>
              <button
                onClick={() => mood && setStep('niat')}
                disabled={!mood}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-40"
              >
                Lanjut →
              </button>
            </div>
          </div>
        )}

        {/* Step: Niat */}
        {step === 'niat' && (
          <div className="p-6">
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">{MOODS.find(m => m.nilai === mood)?.emoji}</div>
              <h2 className="text-lg font-bold text-slate-800">Apa niatmu hari ini?</h2>
              <p className="text-sm text-slate-500 mt-1">Belajar lebih bermakna dengan niat yang jelas</p>
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 mb-4">
              {NIAT_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setNiat(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    niat === s
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <textarea
              value={niat}
              onChange={e => setNiat(e.target.value)}
              placeholder="Atau tulis sendiri..."
              rows={2}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setStep('mood')}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm"
              >
                ← Kembali
              </button>
              <button
                onClick={simpan}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-40"
              >
                {saving ? 'Menyimpan...' : 'Mulai Belajar 🚀'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Selesai */}
        {step === 'selesai' && (
          <div className="p-8 text-center">
            <div className="text-5xl mb-3">✨</div>
            <h2 className="text-lg font-bold text-slate-800">Semangat belajar!</h2>
            <p className="text-sm text-slate-500 mt-1">{niat || 'Hari ini pasti produktif!'}</p>
          </div>
        )}
      </div>
    </div>
  )
}