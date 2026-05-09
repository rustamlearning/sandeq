'use client'

import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inbox, Loader2, Plus, Save, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { useToast } from '@/components/ui/Toast'

interface JadwalItem {
  id: string
  kelas_id: string
  guru_id: string
  mapel: string
  hari: number
  jam_mulai: string
  jam_selesai: string
  guru?: { nama: string }
  kelas?: { nama: string }
}

const HARI_LIST = [
  { num: 1, label: 'Senin',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { num: 2, label: 'Selasa', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { num: 3, label: 'Rabu',   color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { num: 4, label: 'Kamis',  color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { num: 5, label: 'Jumat',  color: 'bg-rose-50 text-rose-700 border-rose-200' },
]

const MAPEL_LIST = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Fisika', 'Kimia',
  'Biologi', 'Sejarah Indonesia', 'Geografi', 'Ekonomi', 'Sosiologi',
  'PPKn', 'PAI', 'Seni Budaya', 'Penjaskes', 'Informatika',
]

export default function AdminJadwalPage() {
  const router = useRouter()
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()
  const [loading, setLoading] = useState(true)
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([])
  const [kelasList, setKelasList] = useState<any[]>([])
  const [guruList, setGuruList] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    kelas_id: '',
    guru_id: '',
    mapel: MAPEL_LIST[0],
    hari: 1,
    jam_mulai: '07:00',
    jam_selesai: '08:00',
  })

  useEffect(() => { init() }, [])
  useEffect(() => { if (selectedKelas) loadJadwal(selectedKelas) }, [selectedKelas])

  async function init() {
    const u = await getCurrentUser()
    if (!u || u.role !== 'admin') { router.push('/login'); return }
    const [{ data: kelas }, { data: guru }] = await Promise.all([
      supabase.from('kelas').select('*').order('nama'),
      supabase.from('users').select('id, nama').eq('role', 'guru').order('nama'),
    ])
    setKelasList(kelas || [])
    setGuruList(guru || [])
    if (kelas && kelas.length > 0) {
      setSelectedKelas(kelas[0].id)
      setForm((f) => ({ ...f, kelas_id: kelas[0].id, guru_id: guru?.[0]?.id || '' }))
    }
    setLoading(false)
  }

  async function loadJadwal(kelasId: string) {
    const { data } = await supabase
      .from('jadwal')
      .select('*, guru:guru_id(nama), kelas:kelas_id(nama)')
      .eq('kelas_id', kelasId)
      .order('hari')
      .order('jam_mulai')
    setJadwalList(data || [])
  }

  async function handleAdd() {
    if (!form.kelas_id || !form.guru_id) return
    setSaving(true)
    const { error } = await supabase.from('jadwal').insert({
      kelas_id: form.kelas_id,
      guru_id: form.guru_id,
      mapel: form.mapel,
      hari: form.hari,
      jam_mulai: form.jam_mulai,
      jam_selesai: form.jam_selesai,
    })
    setSaving(false)
    if (error) { toastInfo('Gagal simpan: ' + error.message); return }
    setShowForm(false)
    loadJadwal(selectedKelas)
  }

  async function handleDelete(id: string, mapel: string) {
    if (!confirm(`Hapus jadwal ${mapel}?`)) return
    await supabase.from('jadwal').delete().eq('id', id)
    setJadwalList((prev) => prev.filter((j) => j.id !== id))
  }

  const selectedKelasNama = kelasList.find((k) => k.id === selectedKelas)?.nama || ''

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
            <Loader2 className="animate-spin" size={24} />
          </div>
          <p className="text-gray-500">Memuat jadwal...</p>
        </div>
      </div>
    )
  }

  const grouped = HARI_LIST.map((h) => ({
    ...h,
    items: jadwalList.filter((j) => j.hari === h.num),
  }))

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageHeader title="Kelola Jadwal" subtitle={selectedKelasNama ? `Kelas ${selectedKelasNama} · ${jadwalList.length} pelajaran` : 'Pilih kelas'} backHref="/admin"
        actions={<Button variant={showForm ? 'secondary' : 'primary'} size="sm" icon={showForm ? <X size={14}/> : <Plus size={14}/>} onClick={() => { setForm((f) => ({ ...f, kelas_id: selectedKelas, guru_id: guruList[0]?.id || '' })); setShowForm(!showForm) }}>{showForm ? 'Tutup' : 'Tambah'}</Button>}
      />

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {/* Form tambah jadwal */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-slate-600 px-5 py-3">
              <h2 className="text-white font-bold">Tambah Jadwal Baru</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Kelas</label>
                  <select
                    value={form.kelas_id}
                    onChange={(e) => setForm((f) => ({ ...f, kelas_id: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  >
                    {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Guru</label>
                  <select
                    value={form.guru_id}
                    onChange={(e) => setForm((f) => ({ ...f, guru_id: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  >
                    {guruList.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Mata Pelajaran</label>
                  <select
                    value={form.mapel}
                    onChange={(e) => setForm((f) => ({ ...f, mapel: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  >
                    {MAPEL_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Hari</label>
                  <select
                    value={form.hari}
                    onChange={(e) => setForm((f) => ({ ...f, hari: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  >
                    {HARI_LIST.map((h) => <option key={h.num} value={h.num}>{h.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Jam Mulai</label>
                  <input
                    type="time" value={form.jam_mulai}
                    onChange={(e) => setForm((f) => ({ ...f, jam_mulai: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Jam Selesai</label>
                  <input
                    type="time" value={form.jam_selesai}
                    onChange={(e) => setForm((f) => ({ ...f, jam_selesai: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAdd} disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-slate-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-slate-700 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Jadwal per hari */}
        {jadwalList.length === 0 && !showForm ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Inbox size={26} />
            </div>
            <p className="font-semibold text-gray-700">Belum ada jadwal untuk kelas ini</p>
            <p className="text-sm text-gray-400 mt-1">Tambah jadwal pelajaran untuk kelas {selectedKelasNama}</p>
            <button
              onClick={() => { setForm((f) => ({ ...f, kelas_id: selectedKelas, guru_id: guruList[0]?.id || '' })); setShowForm(true) }}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
            >
              <Plus size={15} />
              Tambah Jadwal Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((h) => (
              h.items.length > 0 && (
                <div key={h.num} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className={`px-4 py-2.5 border-b flex items-center justify-between ${h.color} border`}>
                    <h3 className="font-bold text-sm">{h.label}</h3>
                    <span className="text-xs opacity-70">{h.items.length} pelajaran</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {h.items.map((j) => (
                      <div key={j.id} className="px-4 py-3 flex items-center gap-3">
                        <div className="text-center min-w-[72px] shrink-0">
                          <p className="text-sm font-bold text-gray-800">{j.jam_mulai}</p>
                          <p className="text-xs text-gray-400">– {j.jam_selesai}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm">{j.mapel}</p>
                          <p className="text-xs text-gray-500">{j.guru?.nama || '–'}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(j.id, j.mapel)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition shrink-0"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
