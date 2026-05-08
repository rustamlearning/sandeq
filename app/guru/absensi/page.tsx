'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Inbox,
  Loader2,
  Save,
  TriangleAlert,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Kelas } from '@/lib/supabase'

type Status = 'hadir' | 'sakit' | 'izin' | 'alpha'

interface SiswaWithStatus {
  id: string
  nama: string
  nis_nip: string
  status: Status | null
}

const STATUS_CONFIG: Record<Status, { label: string; short: string; active: string; bg: string; text: string }> = {
  hadir: { label: 'Hadir',  short: 'H', active: 'bg-emerald-500 text-white', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  sakit: { label: 'Sakit',  short: 'S', active: 'bg-yellow-500 text-white',  bg: 'bg-yellow-50',  text: 'text-yellow-700' },
  izin:  { label: 'Izin',   short: 'I', active: 'bg-emerald-500 text-white',    bg: 'bg-emerald-50',    text: 'text-emerald-700'   },
  alpha: { label: 'Alpha',  short: 'A', active: 'bg-red-500 text-white',     bg: 'bg-red-50',     text: 'text-red-700'    },
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
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'guru') { router.replace('/login'); return }
      setUser(u)
      const { data: kelas } = await supabase.from('kelas').select('*').order('tingkat', { ascending: true })
      setKelasList(kelas || [])
      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    if (selectedKelas && tanggal) loadSiswa()
  }, [selectedKelas, tanggal])

  async function loadSiswa() {
    setLoadingSiswa(true)
    setSaved(false)
    const [{ data: siswa }, { data: absensi }] = await Promise.all([
      supabase.from('users').select('id, nama, nis_nip').eq('role', 'siswa').eq('kelas_id', selectedKelas).order('nama'),
      supabase.from('absensi').select('siswa_id, status').eq('kelas_id', selectedKelas).eq('tanggal', tanggal),
    ])
    const absensiMap = new Map<string, Status>()
    ;(absensi || []).forEach((a) => absensiMap.set(a.siswa_id, a.status as Status))
    setSiswaList((siswa || []).map((s) => ({ ...s, status: absensiMap.get(s.id) || null })))
    setLoadingSiswa(false)
  }

  function setStatusAll(status: Status) {
    setSiswaList((prev) => prev.map((s) => ({ ...s, status })))
  }

  function setStatus(siswaId: string, status: Status) {
    setSiswaList((prev) => prev.map((s) => (s.id === siswaId ? { ...s, status } : s)))
  }

  async function handleSave() {
    if (!user || !selectedKelas) return
    const belum = siswaList.filter((s) => !s.status).length
    if (belum > 0 && !confirm(`${belum} siswa belum diisi, akan dianggap "hadir". Lanjutkan?`)) return

    setSaving(true)
    await supabase.from('absensi').delete().eq('kelas_id', selectedKelas).eq('tanggal', tanggal)
    await supabase.from('absensi').insert(
      siswaList.map((s) => ({ siswa_id: s.id, kelas_id: selectedKelas, tanggal, status: s.status || 'hadir', dicatat_oleh: user.id }))
    )
    setSaving(false)
    setSaved(true)
    await loadSiswa()
  }

  const stats = {
    hadir: siswaList.filter((s) => s.status === 'hadir').length,
    sakit: siswaList.filter((s) => s.status === 'sakit').length,
    izin:  siswaList.filter((s) => s.status === 'izin').length,
    alpha: siswaList.filter((s) => s.status === 'alpha').length,
    belum: siswaList.filter((s) => !s.status).length,
  }

  const tanggalDisplay = new Date(tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Loader2 className="animate-spin" size={24} />
          </div>
          <p className="text-gray-500">Memuat absensi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-gradient-to-r from-emerald-700 to-emerald-500 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => router.push('/guru')}
            aria-label="Kembali"
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Absensi Siswa</h1>
            <p className="text-white/80 text-sm">{tanggalDisplay}</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="max-w-3xl mx-auto px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/70 block mb-1">Kelas</label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 text-white rounded-lg text-sm focus:outline-none focus:bg-white/30 placeholder-white/50"
              >
                <option value="" className="text-gray-800">-- Pilih kelas --</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id} className="text-gray-800">{k.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/70 block mb-1">Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 text-white rounded-lg text-sm focus:outline-none focus:bg-white/30"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {!selectedKelas ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <GraduationCap size={27} />
            </div>
            <p className="font-semibold text-gray-700">Pilih kelas di atas</p>
            <p className="text-sm text-gray-400 mt-1">untuk mulai mengisi absensi</p>
          </div>
        ) : loadingSiswa ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Loader2 className="animate-spin" size={24} />
            </div>
            <p className="text-gray-500">Memuat daftar siswa...</p>
          </div>
        ) : siswaList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Inbox size={26} />
            </div>
            <p className="text-gray-600">Tidak ada siswa di kelas ini</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => (
                <div key={key} className={`${cfg.bg} rounded-xl p-3 text-center`}>
                  <p className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</p>
                  <p className={`text-2xl font-bold ${cfg.text}`}>{stats[key]}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 mr-1">Tandai semua:</span>
              {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setStatusAll(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${cfg.bg} ${cfg.text} hover:opacity-80`}
                >
                  {cfg.label}
                </button>
              ))}
              {stats.belum > 0 && (
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-orange-500 font-medium">
                  <TriangleAlert size={13} />
                  {stats.belum} belum diisi
                </span>
              )}
            </div>

            {/* Daftar siswa */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {siswaList.map((s, idx) => (
                  <div key={s.id} className={`px-4 py-3 flex items-center gap-3 ${!s.status ? 'bg-orange-50/50' : ''}`}>
                    <span className="text-gray-400 text-xs w-6 shrink-0 text-right">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate text-sm">{s.nama}</p>
                      <p className="text-xs text-gray-400">{s.nis_nip}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() => setStatus(s.id, key)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                            s.status === key ? cfg.active : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {cfg.short}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t bg-gray-50">
                {saved && (
                  <p className="flex items-center justify-center gap-1.5 text-center text-sm text-emerald-600 font-medium mb-3">
                    <CheckCircle2 size={15} />
                    Absensi berhasil disimpan
                  </p>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-700 to-emerald-500 text-white rounded-xl font-semibold hover:from-emerald-800 hover:to-teal-700 transition disabled:opacity-50 shadow-sm"
                >
                  {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                  {saving ? 'Menyimpan...' : 'Simpan Absensi'}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
