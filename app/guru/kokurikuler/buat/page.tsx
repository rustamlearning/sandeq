'use client'

import { PageHeader } from '@/components/ui/PageHeader'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SEMUA_DIMENSI = [
  { id: '1', label: 'Keimanan & Ketakwaan' },
  { id: '2', label: 'Kewargaan' },
  { id: '3', label: 'Penalaran Kritis' },
  { id: '4', label: 'Kreativitas' },
  { id: '5', label: 'Kolaborasi' },
  { id: '6', label: 'Kemandirian' },
  { id: '7', label: 'Kesehatan' },
  { id: '8', label: 'Komunikasi' },
]

const TEMPLATE_PBL = [
  { label: '🔬 STEM / Sains Terapan', mapel: ['Fisika', 'Kimia', 'Matematika'], dimensi: ['3', '4', '5'] },
  { label: '🗣️ Debat Bahasa', mapel: ['Bahasa Indonesia', 'Bahasa Inggris'], dimensi: ['3', '8', '5'] },
  { label: '🎨 Seni-Budaya Lokal', mapel: ['Seni Budaya', 'Muatan Lokal'], dimensi: ['4', '2', '8'] },
  { label: '🌱 Lingkungan Hidup', mapel: ['Geografi', 'Biologi', 'Kimia'], dimensi: ['2', '3', '6'] },
  { label: '💻 Teknologi Digital', mapel: ['Informatika', 'Matematika'], dimensi: ['3', '4', '6'] },
]

export default function BuatKokurikulerPage() {
  const router = useRouter()
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [mapelInput, setMapelInput] = useState('')
  const [mapel, setMapel] = useState<string[]>([])
  const [dimensi, setDimensi] = useState<string[]>([])
  const [kelas, setKelas] = useState<{ id: string; nama: string }[]>([])
  const [kelasId, setKelasId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadKelas() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('kelas').select('id, nama').order('nama')
      setKelas(data || [])
      if (data && data.length > 0) setKelasId(data[0].id)
    }
    loadKelas()
  }, [])

  function pakaiTemplate(t: typeof TEMPLATE_PBL[0]) {
    setMapel(t.mapel)
    setDimensi(t.dimensi)
  }

  function tambahMapel() {
    const val = mapelInput.trim()
    if (val && !mapel.includes(val)) setMapel([...mapel, val])
    setMapelInput('')
  }

  function toggleDimensi(id: string) {
    setDimensi(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
  }

  async function simpan() {
    if (!judul.trim() || !kelasId) { alert('Judul dan kelas wajib dipilih'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('kokurikuler_logs').insert({
      judul, deskripsi, mapel, dimensi, kelas_id: kelasId, guru_id: user!.id, status: 'aktif'
    })
    setSaving(false)
    if (!error) router.push('/guru/kokurikuler')
    else alert('Gagal: ' + error.message)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageHeader title="Buat Kegiatan Kokurikuler" backHref="/guru/kokurikuler" />
      <div className="max-w-2xl mx-auto px-4 py-5 pb-32">

      {/* Template PBL */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <p className="text-xs font-semibold text-gray-500 mb-3">⚡ TEMPLATE CEPAT</p>
        <div className="space-y-2">
          {TEMPLATE_PBL.map(t => (
            <button key={t.label} onClick={() => pakaiTemplate(t)}
              className="w-full text-left px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700 border border-gray-200 active:bg-gray-100">
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Judul Kegiatan</label>
          <input value={judul} onChange={e => setJudul(e.target.value)}
            placeholder="Contoh: Proyek Ekosistem Pesisir Pangkep"
            className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Deskripsi (opsional)</label>
          <textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} rows={3}
            placeholder="Apa tujuan kegiatan ini?"
            className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Kelas</label>
          <select value={kelasId} onChange={e => setKelasId(e.target.value)}
            className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none">
            {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Mata Pelajaran</label>
          <div className="flex gap-2 mt-1">
            <input value={mapelInput} onChange={e => setMapelInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && tambahMapel()}
              placeholder="Tambah mapel + Enter"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
            <button onClick={tambahMapel} className="px-4 bg-blue-600 text-white rounded-xl text-sm">+</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {mapel.map(m => (
              <span key={m} className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                {m}
                <button onClick={() => setMapel(mapel.filter(x => x !== m))} className="ml-1">×</button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Dimensi Profil Lulusan</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {SEMUA_DIMENSI.map(d => (
              <button key={d.id} onClick={() => toggleDimensi(d.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition ${
                  dimensi.includes(d.id) ? 'bg-amber-500 text-white' : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>
                D{d.id} · {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-lg mx-auto">
        <button onClick={simpan} disabled={saving}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm">
          {saving ? 'Menyimpan...' : '✅ Simpan Kegiatan'}
        </button>
      </div>
    </div>
    </div>
  )
}
