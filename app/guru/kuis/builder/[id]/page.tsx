'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import {
  Kuis,
  Soal,
  SoalTipe,
  createEmptySoal,
  saveSoal,
  deleteSoal,
  validateKuis,
  validateSoal,
  publishKuis,
  getKuisWithSoal,
  SOAL_TIPE_ICONS,
  SOAL_TIPE_LABELS,
} from '@/lib/kuis';
import SoalEditor from '@/components/SoalEditor';

export default function KuisBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const kuisId = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [kuis, setKuis] = useState<Partial<Kuis>>({
    judul: '',
    mapel: '',
    kelas_id: '',
    durasi_menit: 60,
    kkm: 75,
    max_attempt: 1,
    shuffle_soal: false,
    shuffle_pilihan: false,
    tampilkan_jawaban: true,
    is_published: false,
    deskripsi: '',
  });
  const [soalList, setSoalList] = useState<Partial<Soal>[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const MAPEL_LIST = [
    'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris',
    'Fisika', 'Kimia', 'Biologi',
    'Sejarah Indonesia', 'Geografi', 'Ekonomi', 'Sosiologi',
    'PPKn', 'PAI', 'Seni Budaya', 'Penjaskes', 'Informatika',
  ];

  useEffect(() => {
    init();
  }, [kuisId]);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || u.role !== 'guru') {
      router.push('/login');
      return;
    }
    setUser(u);

    // Load kelas
    const { data: kelas } = await supabase.from('kelas').select('*').order('nama');
    setKelasList(kelas || []);

    // Load existing kuis
    if (kuisId && kuisId !== 'new') {
      const result = await getKuisWithSoal(kuisId);
      if (result) {
        setKuis(result.kuis);
        setSoalList(result.soal);
      }
    } else {
      setKuis(prev => ({ ...prev, guru_id: u.id }));
    }

    setLoading(false);
  };

  // ============================================
  // KUIS ACTIONS
  // ============================================
  const saveKuis = async (publish = false) => {
    setSaving(true);
    setErrors([]);

    // Validasi
    const v = validateKuis(kuis);
    if (!v.valid) {
      setErrors(v.errors);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return null;
    }

    if (publish) {
      // Validasi semua soal
      const allSoalValid = soalList.every(s => validateSoal(s).valid);
      if (!allSoalValid || soalList.length === 0) {
        setErrors([soalList.length === 0 ? 'Tambahkan minimal 1 soal sebelum publish' : 'Ada soal yang belum lengkap']);
        setSaving(false);
        return null;
      }
    }

    let savedKuisId = kuis.id;
    const totalPoin = soalList.reduce((sum, s) => sum + (s.poin || 0), 0);
    const dataToSave = {
      ...kuis,
      guru_id: user.id,
      jumlah_soal: soalList.length,
      total_poin: totalPoin,
      is_published: publish || kuis.is_published,
    };

    if (savedKuisId) {
      // Update
      const { error } = await supabase.from('kuis').update(dataToSave).eq('id', savedKuisId);
      if (error) {
        setErrors([`Gagal update: ${error.message}`]);
        setSaving(false);
        return null;
      }
    } else {
      // Create
      const { data, error } = await supabase.from('kuis').insert(dataToSave).select().single();
      if (error || !data) {
        setErrors([`Gagal save: ${error?.message}`]);
        setSaving(false);
        return null;
      }
      savedKuisId = data.id;
      setKuis(data);
    }

    // Save semua soal
    for (let i = 0; i < soalList.length; i++) {
      const s = soalList[i];
      const soalData = { ...s, kuis_id: savedKuisId, urutan: i };
      
      if (s.id) {
        await supabase.from('soal').update(soalData).eq('id', s.id);
      } else {
        const { data } = await supabase.from('soal').insert(soalData).select().single();
        if (data) {
          // Update local state dengan ID baru
          setSoalList(prev => prev.map((item, idx) => idx === i ? { ...item, id: data.id } : item));
        }
      }
    }

    setSaving(false);
    
    if (publish) {
      alert('🎉 Kuis berhasil di-publish! Siswa sekarang bisa mengerjakan.');
      router.push('/guru/kuis');
    } else {
      // Update URL ke ID kalau baru create
      if (kuisId === 'new' && savedKuisId) {
        router.replace(`/guru/kuis/builder/${savedKuisId}`);
      }
    }

    return savedKuisId;
  };

  // ============================================
  // SOAL ACTIONS
  // ============================================
  const addSoal = (tipe: SoalTipe) => {
    const newSoal = createEmptySoal(tipe, kuis.id || '', soalList.length);
    setSoalList([...soalList, newSoal]);
    setShowAddMenu(false);
    
    // Scroll to new soal
    setTimeout(() => {
      const elements = document.querySelectorAll('[data-soal-card]');
      const last = elements[elements.length - 1];
      last?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const updateSoal = (index: number, updated: Partial<Soal>) => {
    const newList = [...soalList];
    newList[index] = updated;
    setSoalList(newList);
  };

  const removeSoal = async (index: number) => {
    if (!confirm('Yakin hapus soal ini?')) return;
    const soal = soalList[index];
    if (soal.id) {
      await deleteSoal(soal.id);
    }
    setSoalList(soalList.filter((_, i) => i !== index));
  };

  const duplicateSoal = (index: number) => {
    const soal = soalList[index];
    const dupe = { ...soal, id: undefined };
    const newList = [...soalList];
    newList.splice(index + 1, 0, dupe);
    setSoalList(newList);
  };

  const moveSoal = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= soalList.length) return;
    const newList = [...soalList];
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    setSoalList(newList);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const totalPoin = soalList.reduce((sum, s) => sum + (s.poin || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/guru/kuis')}
            className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-sm"
          >
            ← Kembali
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">
              {kuisId === 'new' ? '✨ Buat Kuis Baru' : '✏️ Edit Kuis'}
            </h1>
            <p className="text-xs text-gray-500">
              {soalList.length} soal • {totalPoin} poin
              {kuis.is_published && ' • 🟢 Published'}
            </p>
          </div>

          <button
            onClick={() => saveKuis(false)}
            disabled={saving}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? 'Menyimpan...' : '💾 Simpan Draft'}
          </button>
          <button
            onClick={() => saveKuis(true)}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? 'Mempublish...' : '🚀 Publish'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="font-semibold text-red-700 mb-1">⚠️ Ada yang harus diperbaiki:</p>
            <ul className="text-sm text-red-600 list-disc list-inside">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {/* Kuis Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            📋 Informasi Kuis
          </h2>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Judul Kuis <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={kuis.judul || ''}
              onChange={(e) => setKuis({ ...kuis, judul: e.target.value })}
              placeholder="Contoh: Ulangan Harian - Conjunctions"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Deskripsi (opsional)</label>
            <textarea
              value={kuis.deskripsi || ''}
              onChange={(e) => setKuis({ ...kuis, deskripsi: e.target.value })}
              placeholder="Penjelasan kuis untuk siswa..."
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Mapel <span className="text-red-500">*</span>
              </label>
              <select
                value={kuis.mapel || ''}
                onChange={(e) => setKuis({ ...kuis, mapel: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Pilih mapel</option>
                {MAPEL_LIST.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Kelas <span className="text-red-500">*</span>
              </label>
              <select
                value={kuis.kelas_id || ''}
                onChange={(e) => setKuis({ ...kuis, kelas_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Pilih kelas</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Durasi (menit)</label>
              <input
                type="number"
                value={kuis.durasi_menit || 60}
                onChange={(e) => setKuis({ ...kuis, durasi_menit: parseInt(e.target.value) || 60 })}
                min="1"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">KKM (Nilai minimal)</label>
              <input
                type="number"
                value={kuis.kkm || 75}
                onChange={(e) => setKuis({ ...kuis, kkm: parseFloat(e.target.value) || 75 })}
                min="0"
                max="100"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Max Attempt</label>
              <input
                type="number"
                value={kuis.max_attempt || 1}
                onChange={(e) => setKuis({ ...kuis, max_attempt: parseInt(e.target.value) || 1 })}
                min="1"
                max="10"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Berapa kali siswa boleh mengerjakan</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">Pengaturan Lanjutan</label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={kuis.shuffle_soal || false}
                  onChange={(e) => setKuis({ ...kuis, shuffle_soal: e.target.checked })}
                />
                Acak urutan soal
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={kuis.shuffle_pilihan || false}
                  onChange={(e) => setKuis({ ...kuis, shuffle_pilihan: e.target.checked })}
                />
                Acak urutan pilihan jawaban
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={kuis.tampilkan_jawaban !== false}
                  onChange={(e) => setKuis({ ...kuis, tampilkan_jawaban: e.target.checked })}
                />
                Tampilkan jawaban benar setelah selesai
              </label>
            </div>
          </div>
        </div>

        {/* Soal List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">📝 Soal-Soal ({soalList.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/guru/kuis/builder/${kuis.id || 'new'}/preview`)}
                disabled={!kuis.id || soalList.length === 0}
                className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                title={!kuis.id ? 'Save dulu' : ''}
              >
                👁️ Preview
              </button>
            </div>
          </div>

          {soalList.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-5xl mb-3">📝</div>
              <p className="text-gray-500 mb-4">Belum ada soal. Klik tombol "+ Tambah Soal" di bawah!</p>
            </div>
          ) : (
            soalList.map((soal, i) => (
              <div key={i} data-soal-card className="relative">
                <SoalEditor
                  soal={soal}
                  index={i}
                  onChange={(updated) => updateSoal(i, updated)}
                  onDelete={() => removeSoal(i)}
                  onDuplicate={() => duplicateSoal(i)}
                />
                {/* Move buttons */}
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 hover:opacity-100 transition">
                  <button
                    onClick={() => moveSoal(i, 'up')}
                    disabled={i === 0}
                    className="p-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-30 text-xs"
                    title="Pindah ke atas"
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={() => moveSoal(i, 'down')}
                    disabled={i === soalList.length - 1}
                    className="p-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-30 text-xs"
                    title="Pindah ke bawah"
                  >
                    ⬇️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {showAddMenu && (
          <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-2xl border p-2 min-w-[240px] mb-2">
            <p className="text-xs font-semibold text-gray-500 px-3 py-2">Pilih Tipe Soal:</p>
            {(['pg', 'true_false', 'isian', 'matching', 'essay'] as SoalTipe[]).map(tipe => (
              <button
                key={tipe}
                onClick={() => addSoal(tipe)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg text-left transition"
              >
                <span className="text-2xl">{SOAL_TIPE_ICONS[tipe]}</span>
                <span className="font-medium text-sm">{SOAL_TIPE_LABELS[tipe]}</span>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 font-medium"
        >
          {showAddMenu ? '✕ Tutup' : '+ Tambah Soal'}
        </button>
      </div>
    </div>
  );
}
