'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Kelas, Nilai } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'

const MAPEL_LIST = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Fisika', 'Kimia',
  'Biologi', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi',
  'PPKn', 'Pendidikan Agama', 'Seni Budaya', 'Penjaskes', 'Informatika',
]

const KOMPONEN_LIST = ['Tugas', 'PR', 'Ulangan Harian', 'PTS', 'PAS', 'PAT', 'Praktik', 'Proyek']

interface SiswaWithNilai {
  id: string
  nama: string
  nis_nip: string
  nilai: string
}

export default function InputNilaiPage() {
  const router = useRouter()
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [kelasList, setKelasList] = useState<Kelas[]>([])

  // Form
  const [selectedKelas, setSelectedKelas] = useState('')
  const [mapel, setMapel] = useState(MAPEL_LIST[0])
  const [komponen, setKomponen] = useState(KOMPONEN_LIST[0])
  const [komponenCustom, setKomponenCustom] = useState('')
  const [bobot, setBobot] = useState('1')
  const [semester, setSemester] = useState('1')
  const [siswaList, setSiswaList] = useState<SiswaWithNilai[]>([])
  const [loadingSiswa, setLoadingSiswa] = useState(false)
  const [saving, setSaving] = useState(false)
  const [riwayat, setRiwayat] = useState<Nilai[]>([])

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'guru') {
        router.replace('/login')
        return
      }
      setUser(u)
      const { data } = await supabase
        .from('kelas')
        .select('*')
        .order('tingkat', { ascending: true })
      setKelasList(data || [])
      await loadRiwayat(u.id)
      setLoading(false)
    }
    init()
  }, [router])

  async function loadRiwayat(guruId: string) {
    const { data } = await supabase
      .from('nilai')
      .select('*')
      .eq('diinput_oleh', guruId)
      .order('created_at', { ascending: false })
      .limit(20)
    setRiwayat(data || [])
  }

  useEffect(() => {
    if (selectedKelas) {
      loadSiswa()
    }
  }, [selectedKelas])

  async function loadSiswa() {
    setLoadingSiswa(true)
    const { data } = await supabase
      .from('users')
      .select('id, nama, nis_nip')
      .eq('role', 'siswa')
      .eq('kelas_id', selectedKelas)
      .order('nama', { ascending: true })

    setSiswaList((data || []).map((s) => ({
      id: s.id,
      nama: s.nama,
      nis_nip: s.nis_nip,
      nilai: '',
    })))
    setLoadingSiswa(false)
  }

  function setNilai(siswaId: string, nilai: string) {
    setSiswaList(siswaList.map((s) => (s.id === siswaId ? { ...s, nilai } : s)))
  }

  async function handleSave() {
    if (!user) return

    const komponenFinal = komponen === 'Custom' ? komponenCustom : komponen
    if (!komponenFinal.trim()) {
      toastWarning('Komponen tidak boleh kosong')
      return
    }

    const records = siswaList
      .filter((s) => s.nilai.trim() !== '')
      .map((s) => ({
        siswa_id: s.id,
        mapel,
        komponen: komponenFinal,
        bobot: parseInt(bobot),
        nilai: parseFloat(s.nilai),
        semester: parseInt(semester),
        diinput_oleh: user.id,
      }))

    if (records.length === 0) {
      toastWarning('Belum ada nilai yang diisi')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('nilai').insert(records)
    setSaving(false)

    if (error) {
      toastInfo('Gagal: ' + error.message)
      return
    }

    toastSuccess(`Berhasil input ${records.length} nilai!`)
    setSiswaList(siswaList.map((s) => ({ ...s, nilai: '' })))
    await loadRiwayat(user.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-gradient-to-r from-indigo-700 to-indigo-500 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/guru')} className="text-white/80 hover:text-white">
            <span className="inline-flex items-center gap-1.5"><ArrowLeft size={16} /> Kembali</span>
          </button>
          <h1 className="text-xl font-bold text-white flex-1">Input Nilai</h1>
          <button
            onClick={() => router.push('/guru/nilai/export')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <span className="inline-flex items-center gap-1.5"><FileText size={15} /> Export Rapor</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Form parameter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Detail Nilai</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Pilih kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
              <select
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {MAPEL_LIST.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Komponen</label>
              <select
                value={komponen}
                onChange={(e) => setKomponen(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {KOMPONEN_LIST.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
                <option value="Custom">Custom...</option>
              </select>
            </div>
            {komponen === 'Custom' && (
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Komponen Custom</label>
                <input
                  type="text"
                  value={komponenCustom}
                  onChange={(e) => setKomponenCustom(e.target.value)}
                  placeholder="Contoh: Tugas Bab 3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bobot</label>
              <input
                type="number"
                value={bobot}
                onChange={(e) => setBobot(e.target.value)}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
          </div>
        </div>

        {/* Daftar siswa */}
        {selectedKelas && (
          <>
            {loadingSiswa ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-500">Memuat siswa...</p>
              </div>
            ) : siswaList.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-500">Tidak ada siswa di kelas ini.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="p-4 border-b bg-gray-50">
                  <p className="font-medium text-gray-800">Daftar Siswa</p>
                  <p className="text-xs text-gray-500">Isi nilai 0-100. Kosongkan untuk skip.</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {siswaList.map((s, idx) => (
                    <div key={s.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-gray-400 text-sm w-6 shrink-0">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{s.nama}</p>
                          <p className="text-xs text-gray-500">NIS: {s.nis_nip}</p>
                        </div>
                      </div>
                      <input
                        type="number"
                        value={s.nilai}
                        onChange={(e) => setNilai(s.id, e.target.value)}
                        min={0}
                        max={100}
                        placeholder="0-100"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-center font-medium"
                      />
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t bg-gray-50">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Nilai'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Riwayat input nilai */}
        {riwayat.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <p className="font-medium text-gray-800">Riwayat Input Terakhir</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {riwayat.map((n) => (
                <div key={n.id} className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-800">{n.mapel} · {n.komponen}</p>
                    <p className="text-xs text-gray-500">
                      Sem {n.semester} ·{' '}
                      {new Date(n.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <p className="font-bold text-gray-800">{n.nilai}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
