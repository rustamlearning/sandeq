'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  userId: string
  materiId: string
  judulMateri: string
  onSelesai: () => void
}

const PEMAHAMAN = [
  { nilai: 1, emoji: '😵', label: 'Belum paham' },
  { nilai: 2, emoji: '😕', label: 'Agak bingung' },
  { nilai: 3, emoji: '🤔', label: 'Lumayan' },
  { nilai: 4, emoji: '😊', label: 'Paham' },
  { nilai: 5, emoji: '🤩', label: 'Sangat paham' },
]

export default function RefleksiMateri({ userId, materiId, judulMateri, onSelesai }: Props) {
  const [pemahaman, setPemahaman] = useState<number | null>(null)
  const [catatan, setCatatan] = useState('')
  const [pertanyaan, setPertanyaan] = useState('')
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'refleksi' | 'selesai'>('refleksi')

  async function simpan() {
    if (!pemahaman) return
    setSaving(true)
    await supabase.from('daily_checkin').upsert({
      user_id: userId,
      tanggal: new Date().toISOString().split('T')[0],
      mood: pemahaman,
      catatan: [
        catatan ? `[${judulMateri}] ${catatan}` : null,
        pertanyaan ? `Pertanyaan: ${pertanyaan}` : null,
      ].filter(Boolean).join('\n') || null,
    }, { onConflict: 'user_id,tanggal' })
    setSaving(false)
    setStep('selesai')
    setTimeout(onSelesai, 1500)
  }

  if (step === 'selesai') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
          <div className="text-5xl mb-3">🌟</div>
          <h2 className="text-lg font-bold text-slate-800">Refleksi tersimpan!</h2>
          <p className="text-sm text-slate-500 mt-1">Bagus! Kamu sudah belajar hari ini.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="text-3xl mb-2">📝</div>
            <h2 className="text-lg font-bold text-slate-800">Refleksi Belajar</h2>
            <p className="text-sm text-slate-500 mt-1 truncate">"{judulMateri}"</p>
          </div>

          {/* Pemahaman */}
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Seberapa paham kamu?
          </p>
          <div className="flex justify-between gap-2 mb-5">
            {PEMAHAMAN.map(p => (
              <button
                key={p.nilai}
                onClick={() => setPemahaman(p.nilai)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${
                  pemahaman === p.nilai
                    ? 'border-blue-500 bg-blue-50 scale-105'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className="text-xl">{p.emoji}</span>
                <span className="text-[9px] text-gray-500 leading-tight text-center">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Catatan */}
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Apa yang kamu pelajari? (opsional)
          </p>
          <textarea
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            placeholder="Tulis poin penting yang kamu ingat..."
            rows={2}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none mb-4"
          />

          {/* Pertanyaan */}
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Ada yang masih bingung? (opsional)
          </p>
          <input
            type="text"
            value={pertanyaan}
            onChange={e => setPertanyaan(e.target.value)}
            placeholder="Tulis pertanyaanmu..."
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 mb-5"
          />

          <div className="flex gap-2">
            <button
              onClick={onSelesai}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm"
            >
              Lewati
            </button>
            <button
              onClick={simpan}
              disabled={!pemahaman || saving}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-40"
            >
              {saving ? 'Menyimpan...' : 'Simpan Refleksi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}