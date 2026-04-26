'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import BlockEditor from '@/components/BlockEditor';
import { Block } from '@/lib/blocks';

const MAPEL_LIST = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Fisika',
  'Kimia',
  'Biologi',
  'Sejarah Indonesia',
  'Geografi',
  'Ekonomi',
  'Sosiologi',
  'PPKn',
  'Pendidikan Agama Islam',
  'Seni Budaya',
  'Penjaskes',
  'Informatika',
];

export default function GuruMateriPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [materiList, setMateriList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [judul, setJudul] = useState('');
  const [mapel, setMapel] = useState('Matematika');
  const [kelasId, setKelasId] = useState('');
  const [bab, setBab] = useState('');
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState('');
  const [ringkasan, setRingkasan] = useState('');
  const [estimasiMenit, setEstimasiMenit] = useState(15);
  const [tingkatKesulitan, setTingkatKesulitan] = useState<'mudah' | 'sedang' | 'sulit'>('sedang');
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || (u.role !== 'guru' && u.role !== 'admin')) {
      router.push('/login');
      return;
    }
    setUser(u);
    await loadMateri(u.id);
    await loadKelas();
  };

  const loadMateri = async (userId: string) => {
    const { data } = await supabase
      .from('materi')
      .select('*, kelas(nama)')
      .eq('guru_id', userId)
      .order('created_at', { ascending: false });
    setMateriList(data || []);
  };

  const loadKelas = async () => {
    const { data } = await supabase.from('kelas').select('*').order('tingkat');
    setKelasList(data || []);
    if (data && data.length > 0 && !kelasId) setKelasId(data[0].id);
  };

  const resetForm = () => {
    setJudul('');
    setMapel('Matematika');
    setBab('');
    setTujuanPembelajaran('');
    setRingkasan('');
    setEstimasiMenit(15);
    setTingkatKesulitan('sedang');
    setBlocks([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setJudul(m.judul || '');
    setMapel(m.mapel || 'Matematika');
    setKelasId(m.kelas_id || '');
    setBab(m.bab || '');
    setTujuanPembelajaran(m.tujuan_pembelajaran || '');
    setRingkasan(m.ringkasan || '');
    setEstimasiMenit(m.estimasi_menit || 15);
    setTingkatKesulitan(m.tingkat_kesulitan || 'sedang');
    setBlocks(m.konten_blocks || []);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!judul.trim()) {
      alert('Judul wajib diisi');
      return;
    }
    if (!kelasId) {
      alert('Pilih kelas');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        judul,
        mapel,
        kelas_id: kelasId,
        bab,
        tujuan_pembelajaran: tujuanPembelajaran,
        ringkasan,
        estimasi_menit: estimasiMenit,
        tingkat_kesulitan: tingkatKesulitan,
        konten_blocks: blocks,
        guru_id: user.id,
      };

      if (editingId) {
        const { error } = await supabase.from('materi').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('materi').insert(payload);
        if (error) throw error;
      }

      alert('✅ Materi berhasil disimpan!');
      resetForm();
      await loadMateri(user.id);
    } catch (e: any) {
      alert('Gagal: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus materi ini? Aksi ini tidak bisa dibatalkan.')) return;
    const { error } = await supabase.from('materi').delete().eq('id', id);
    if (error) {
      alert('Gagal hapus: ' + error.message);
      return;
    }
    await loadMateri(user.id);
  };

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <button onClick={() => router.push('/guru')} className="text-blue-600 text-sm mb-1">
              ← Dashboard
            </button>
            <h1 className="text-xl font-bold">Kelola Materi</h1>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Buat Materi Baru
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {showForm ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">
                {editingId ? '✏️ Edit Materi' : '➕ Buat Materi Baru'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                ✕ Tutup
              </button>
            </div>

            {/* Metadata Materi */}
            <div className="space-y-4 mb-6 pb-6 border-b">
              <div>
                <label className="block text-sm font-medium mb-1">Judul Materi *</label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Persamaan Kuadrat"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mata Pelajaran *</label>
                  <select
                    value={mapel}
                    onChange={(e) => setMapel(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {MAPEL_LIST.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Kelas *</label>
                  <select
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bab/Pertemuan</label>
                  <input
                    type="text"
                    value={bab}
                    onChange={(e) => setBab(e.target.value)}
                    placeholder="Bab 3"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Estimasi Waktu (menit)</label>
                  <input
                    type="number"
                    value={estimasiMenit}
                    onChange={(e) => setEstimasiMenit(parseInt(e.target.value) || 15)}
                    min={1}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tingkat Kesulitan</label>
                  <select
                    value={tingkatKesulitan}
                    onChange={(e) => setTingkatKesulitan(e.target.value as any)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="mudah">🟢 Mudah</option>
                    <option value="sedang">🟡 Sedang</option>
                    <option value="sulit">🔴 Sulit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tujuan Pembelajaran 
                  <span className="text-xs text-gray-500 font-normal ml-1">
                    (Setelah materi ini, siswa dapat...)
                  </span>
                </label>
                <textarea
                  value={tujuanPembelajaran}
                  onChange={(e) => setTujuanPembelajaran(e.target.value)}
                  placeholder="1. Memahami konsep persamaan kuadrat&#10;2. Menyelesaikan persamaan kuadrat dengan rumus ABC&#10;3. Menerapkan dalam soal cerita"
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ringkasan Singkat</label>
                <textarea
                  value={ringkasan}
                  onChange={(e) => setRingkasan(e.target.value)}
                  placeholder="Ringkasan 1-2 kalimat tentang materi ini (untuk preview di list)"
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Block Editor */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">📚 Konten Materi</h3>
              <p className="text-sm text-gray-500 mb-4">
                Susun materi pakai blocks. Klik "+ Tambah Block" untuk mulai.
                Hover block untuk pindah/hapus.
              </p>
              <div className="ml-12">
                <BlockEditor initialBlocks={blocks} onChange={setBlocks} />
              </div>
            </div>

            {/* Save */}
            <div className="flex gap-3 sticky bottom-0 bg-white py-4 border-t">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium"
              >
                {loading ? '⏳ Menyimpan...' : '💾 Simpan Materi'}
              </button>
              <button
                onClick={resetForm}
                disabled={loading}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          /* List Materi */
          <div className="space-y-3">
            {materiList.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center border-2 border-dashed">
                <p className="text-gray-500 mb-4">Belum ada materi yang dibuat.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  + Buat Materi Pertama
                </button>
              </div>
            ) : (
              materiList.map((m) => (
                <div key={m.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          {m.mapel}
                        </span>
                        {m.kelas && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {m.kelas.nama}
                          </span>
                        )}
                        {m.tingkat_kesulitan && (
                          <span className="text-xs">
                            {m.tingkat_kesulitan === 'mudah' && '🟢'}
                            {m.tingkat_kesulitan === 'sedang' && '🟡'}
                            {m.tingkat_kesulitan === 'sulit' && '🔴'}
                            {' '}{m.tingkat_kesulitan}
                          </span>
                        )}
                        {m.estimasi_menit && (
                          <span className="text-xs text-gray-500">⏱ {m.estimasi_menit} menit</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{m.judul}</h3>
                      {m.bab && <p className="text-sm text-gray-500">{m.bab}</p>}
                      {m.ringkasan && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{m.ringkasan}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {(m.konten_blocks?.length || 0)} block(s) • Diupdate {new Date(m.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEdit(m)}
                        className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}