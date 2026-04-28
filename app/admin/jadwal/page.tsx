'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface JadwalItem {
  id: string;
  kelas_id: string;
  guru_id: string;
  mapel: string;
  hari: number;
  jam_mulai: string;
  jam_selesai: string;
  guru?: { nama: string };
  kelas?: { nama: string };
}

const HARI_LIST = [
  { num: 1, label: 'Senin' },
  { num: 2, label: 'Selasa' },
  { num: 3, label: 'Rabu' },
  { num: 4, label: 'Kamis' },
  { num: 5, label: 'Jumat' },
];

const MAPEL_LIST = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Fisika', 'Kimia',
  'Biologi', 'Sejarah Indonesia', 'Geografi', 'Ekonomi', 'Sosiologi',
  'PPKn', 'PAI', 'Seni Budaya', 'Penjaskes', 'Informatika',
];

export default function AdminJadwalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [guruList, setGuruList] = useState<any[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    kelas_id: '',
    guru_id: '',
    mapel: MAPEL_LIST[0],
    hari: 1,
    jam_mulai: '07:00',
    jam_selesai: '08:00',
  });

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (selectedKelas) loadJadwal(selectedKelas);
  }, [selectedKelas]);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || u.role !== 'admin') { router.push('/login'); return; }

    const [{ data: kelas }, { data: guru }] = await Promise.all([
      supabase.from('kelas').select('*').order('nama'),
      supabase.from('users').select('id, nama').eq('role', 'guru').order('nama'),
    ]);

    setKelasList(kelas || []);
    setGuruList(guru || []);
    if (kelas && kelas.length > 0) {
      setSelectedKelas(kelas[0].id);
      setForm((f) => ({ ...f, kelas_id: kelas[0].id, guru_id: guru?.[0]?.id || '' }));
    }
    setLoading(false);
  };

  const loadJadwal = async (kelasId: string) => {
    const { data } = await supabase
      .from('jadwal')
      .select('*, guru:guru_id(nama), kelas:kelas_id(nama)')
      .eq('kelas_id', kelasId)
      .order('hari')
      .order('jam_mulai');
    setJadwalList(data || []);
  };

  const handleAdd = async () => {
    if (!form.kelas_id || !form.guru_id) return;
    setSaving(true);
    const { error } = await supabase.from('jadwal').insert({
      kelas_id: form.kelas_id,
      guru_id: form.guru_id,
      mapel: form.mapel,
      hari: form.hari,
      jam_mulai: form.jam_mulai,
      jam_selesai: form.jam_selesai,
    });
    setSaving(false);
    if (error) { alert('Gagal simpan: ' + error.message); return; }
    setShowForm(false);
    loadJadwal(selectedKelas);
  };

  const handleDelete = async (id: string, mapel: string) => {
    if (!confirm(`Hapus jadwal ${mapel}?`)) return;
    await supabase.from('jadwal').delete().eq('id', id);
    setJadwalList((prev) => prev.filter((j) => j.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    );
  }

  const grouped = HARI_LIST.map((h) => ({
    ...h,
    items: jadwalList.filter((j) => j.hari === h.num),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3 flex-wrap">
          <button onClick={() => router.push('/admin')} className="text-blue-600 text-sm hover:underline">
            ← Admin
          </button>
          <h1 className="text-xl font-bold flex-1">📅 Kelola Jadwal</h1>
          <div className="flex items-center gap-2">
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setForm((f) => ({ ...f, kelas_id: selectedKelas, guru_id: guruList[0]?.id || '' }));
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Tambah
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Form tambah jadwal */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Tambah Jadwal Baru</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Kelas</label>
                <select
                  value={form.kelas_id}
                  onChange={(e) => setForm((f) => ({ ...f, kelas_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Guru</label>
                <select
                  value={form.guru_id}
                  onChange={(e) => setForm((f) => ({ ...f, guru_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {guruList.map((g) => (
                    <option key={g.id} value={g.id}>{g.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Mata Pelajaran</label>
                <select
                  value={form.mapel}
                  onChange={(e) => setForm((f) => ({ ...f, mapel: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {MAPEL_LIST.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Hari</label>
                <select
                  value={form.hari}
                  onChange={(e) => setForm((f) => ({ ...f, hari: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {HARI_LIST.map((h) => (
                    <option key={h.num} value={h.num}>{h.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Jam Mulai</label>
                <input
                  type="time"
                  value={form.jam_mulai}
                  onChange={(e) => setForm((f) => ({ ...f, jam_mulai: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Jam Selesai</label>
                <input
                  type="time"
                  value={form.jam_selesai}
                  onChange={(e) => setForm((f) => ({ ...f, jam_selesai: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Jadwal per hari */}
        {jadwalList.length === 0 && !showForm ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-semibold text-gray-700">Belum ada jadwal untuk kelas ini</p>
            <button
              onClick={() => {
                setForm((f) => ({ ...f, kelas_id: selectedKelas, guru_id: guruList[0]?.id || '' }));
                setShowForm(true);
              }}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              + Tambah Jadwal Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((h) => (
              <div key={h.num} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700">{h.label}</h3>
                  <span className="text-xs text-gray-400">{h.items.length} pelajaran</span>
                </div>
                {h.items.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400 italic">Tidak ada jadwal</p>
                ) : (
                  <div className="divide-y">
                    {h.items.map((j) => (
                      <div key={j.id} className="px-4 py-3 flex items-center gap-3">
                        <div className="text-center min-w-[80px]">
                          <p className="text-sm font-bold text-gray-800">{j.jam_mulai}</p>
                          <p className="text-xs text-gray-400">s/d {j.jam_selesai}</p>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{j.mapel}</p>
                          <p className="text-xs text-gray-500">{j.guru?.nama || '-'}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(j.id, j.mapel)}
                          className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 transition"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
