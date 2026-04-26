'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Kelas } from '@/lib/supabase'

type Status = 'hadir' | 'sakit' | 'izin' | 'alpha'

interface SiswaWithStatus {
  id: string
  nama: string
  nis_nip: string
  status: Status | null
}

export default function AbsensiGuruPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [selectedKelas, setSelectedKelas] = useState('')
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0])
  const [siswaList, setSiswaList] = useState<SiswaWithStatus[]>([])
  const [loadingSiswa, setLoadingSiswa] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'guru') {
        router.replace('/login')
        return
      }
      setUser(u)

      const { data: kelas } = await supabase
        .from('kelas')
        .select('*')
        .order('tingkat', { ascending: true })
      setKelasList(kelas || [])
      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    if (selectedKelas && tanggal) {
      loadSiswa()
    }
  }, [selectedKelas, tanggal])

  async function loadSiswa() {
    setLoadingSiswa(true)

    // Ambil siswa di kelas
    const { data: siswa } = await supabase
      .from('users')
      .select('id, nama, nis_nip')
      .eq('role', 'siswa')
      .eq('kelas_id', selectedKelas)
      .order('nama', { ascending: true })

    // Ambil absensi yang sudah ada untuk tanggal ini
    const { data: absensi } = await supabase
      .from('absensi')
      .select('siswa_id, status')
      .eq('kelas_id', selectedKelas)
      .eq('tanggal', tanggal)

    const absensiMap = new Map<string, Status>()
    ;(absensi || []).forEach((a) => absensiMap.set(a.siswa_id, a.status as Status))

    const enriched: SiswaWithStatus[] = (siswa || []).map((s) => ({
      id: s.id,
      nama: s.nama,
      nis_nip: s.nis_nip,
      status: absensiMap.get(s.id) || null,
    }))

    setSiswaList(enriched)
    setLoadingSiswa(false)
  }

  function setStatusAll(status: Status) {
    setSiswaList(siswaList.map((s) => ({ ...s, status })))
  }

  function setStatus(siswaId: string, status: Status) {
    setSiswaList(siswaList.map((s) => (s.id === siswaId ? { ...s, status } : s)))
  }

  async function handleSave() {
    if (!user || !selectedKelas) return
    const belumDiisi = siswaList.filter((s) => !s.status)
    if (belumDiisi.length > 0) {
      if (!confirm(`Ada ${belumDiisi.length} siswa yang belum diisi. Mereka akan dianggap "hadir". Lanjutkan?`)) return
    }

    setSaving(true)

    // Hapus dulu absensi yang sudah ada untuk tanggal & kelas ini
    await supabase
      .from('absensi')
      .delete()
      .eq('kelas_id', selectedKelas)
      .eq('tanggal', tanggal)

    // Insert baru
    const records = siswaList.map((s) => ({
      siswa_id: s.id,
      kelas_id: selectedKelas,
      tanggal,
      status: s.status || 'hadir',
      dicatat_oleh: user.id,
    }))

    const { error } = await supabase.from('absensi').insert(records)
    setSaving(false)

    if (error) {
      alert('Gagal menyimpan: ' + error.message)
      return
    }

    alert('Absensi berhasil disimpan!')
    await loadSiswa()
  }

  const stats = {
    hadir: siswaList.filter((s) => s.status === 'hadir').length,
    sakit: siswaList.filter((s) => s.status === 'sakit').length,
    izin: siswaList.filter((s) => s.status === 'izin').length,
    alpha: siswaList.filter((s) => s.status === 'alpha').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/guru')} className="text-gray-500 hover:text-gray-700">
            ← Kembali
          </button>
          <h1 className="text-xl font-bold text-gray-800">Absensi Siswa</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Pilihan kelas & tanggal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama} ({k.tahun_ajaran})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {selectedKelas && (
          <>
            {/* Quick action */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Aksi Cepat:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusAll('hadir')}
                  className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                >
                  Tandai Semua Hadir
                </button>
                <button
                  onClick={() => setStatusAll('alpha')}
                  className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                >
                  Tandai Semua Alpha
                </button>
              </div>
            </div>

            {/* Stats */}
            {siswaList.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600">Hadir</p>
                  <p className="text-2xl font-bold text-green-700">{stats.hadir}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-yellow-600">Sakit</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.sakit}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600">Izin</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.izin}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-600">Alpha</p>
                  <p className="text-2xl font-bold text-red-700">{stats.alpha}</p>
                </div>
              </div>
            )}

            {/* Daftar siswa */}
            {loadingSiswa ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-500">Memuat siswa...</p>
              </div>
            ) : siswaList.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-500">Tidak ada siswa di kelas ini.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                      <div className="flex gap-1 shrink-0">
                        {(['hadir', 'sakit', 'izin', 'alpha'] as Status[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => setStatus(s.id, st)}
                            className={`px-2 py-1 text-xs rounded font-medium transition ${
                              s.status === st
                                ? statusColor(st, true)
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {st === 'hadir' ? 'H' : st === 'sakit' ? 'S' : st === 'izin' ? 'I' : 'A'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t bg-gray-50">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 font-medium"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Absensi'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function statusColor(status: Status, active: boolean) {
  if (!active) return 'bg-gray-100 text-gray-500'
  const map: Record<Status, string> = {
    hadir: 'bg-green-600 text-white',
    sakit: 'bg-yellow-500 text-white',
    izin: 'bg-blue-500 text-white',
    alpha: 'bg-red-600 text-white',
  }
  return map[status]
}