'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Code2,
  Edit3,
  Eye,
  EyeOff,
  FileCode2,
  FileText,
  Inbox,
  Loader2,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import BlockEditor from '@/components/BlockEditor';
import { Block } from '@/lib/blocks';
import { useToast } from '@/components/ui/Toast'

const MAPEL_LIST = [
  'Matematika','Bahasa Indonesia','Bahasa Inggris','Fisika','Kimia',
  'Biologi','Sejarah Indonesia','Geografi','Ekonomi','Sosiologi',
  'PPKn','Pendidikan Agama Islam','Seni Budaya','Penjaskes','Informatika',
];

const KESULITAN_CONFIG = {
  mudah: { label: 'Mudah', color: 'bg-green-100 text-green-700' },
  sedang: { label: 'Sedang', color: 'bg-yellow-100 text-yellow-700' },
  sulit: { label: 'Sulit', color: 'bg-red-100 text-red-700' },
};

type KontenMode = 'blocks' | 'html';

export default function GuruMateriPage() {
  const router = useRouter()
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [user, setUser] = useState<any>(null);
  const [materiList, setMateriList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form fields
  const [judul, setJudul] = useState('');
  const [mapel, setMapel] = useState('Matematika');
  const [kelasId, setKelasId] = useState('');
  const [bab, setBab] = useState('');
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState('');
  const [ringkasan, setRingkasan] = useState('');
  const [estimasiMenit, setEstimasiMenit] = useState(15);
  const [tingkatKesulitan, setTingkatKesulitan] = useState<'mudah' | 'sedang' | 'sulit'>('sedang');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);

  // HTML upload
  const [kontenMode, setKontenMode] = useState<KontenMode>('blocks');
  const [htmlKonten, setHtmlKonten] = useState('');
  const [htmlFileName, setHtmlFileName] = useState('');
  const [htmlPreview, setHtmlPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || (u.role !== 'guru' && u.role !== 'admin')) { router.push('/login'); return; }
    setUser(u);
    await loadMateri(u.id);
    await loadKelas();
  };

  const loadMateri = async (userId: string) => {
    const { data } = await supabase.from('materi').select('*, kelas(nama)').eq('guru_id', userId).order('created_at', { ascending: false });
    setMateriList(data || []);
  };

  const loadKelas = async () => {
    const { data } = await supabase.from('kelas').select('*').order('tingkat');
    setKelasList(data || []);
    if (data && data.length > 0 && !kelasId) setKelasId(data[0].id);
  };

  const resetForm = () => {
    setJudul(''); setMapel('Matematika'); setBab(''); setTujuanPembelajaran('');
    setRingkasan(''); setEstimasiMenit(15); setTingkatKesulitan('sedang');
    setBlocks([]); setEditingId(null); setShowForm(false);
    setKontenMode('blocks'); setHtmlKonten(''); setHtmlFileName(''); setHtmlPreview(false);
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
    // detect mode
    if (m.konten && m.konten.trim().startsWith('<')) {
      setKontenMode('html');
      setHtmlKonten(m.konten);
      setHtmlFileName('(file sebelumnya)');
    } else {
      setKontenMode('blocks');
      setHtmlKonten('');
      setHtmlFileName('');
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHtmlFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      toastWarning('File harus berformat .html atau .htm');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastWarning('Ukuran file maksimal 5 MB');
      return;
    }
    setHtmlFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setHtmlKonten(text);
      // auto-fill judul from <title> tag if empty
      if (!judul.trim()) {
        const match = text.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (match) setJudul(match[1].trim());
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!judul.trim()) { toastWarning('Judul wajib diisi'); return; }
    if (!kelasId) { toastWarning('Pilih kelas'); return; }
    if (kontenMode === 'html' && !htmlKonten.trim()) {
      toastWarning('Upload file HTML terlebih dahulu'); return;
    }
    setLoading(true);
    try {
      const payload: any = {
        judul, mapel, kelas_id: kelasId, bab,
        tujuan_pembelajaran: tujuanPembelajaran,
        ringkasan, estimasi_menit: estimasiMenit,
        tingkat_kesulitan: tingkatKesulitan,
        guru_id: user.id,
      };
      if (kontenMode === 'html') {
        payload.konten = htmlKonten;
        payload.konten_blocks = [];
      } else {
        payload.konten = null;
        payload.konten_blocks = blocks;
      }

      if (editingId) {
        const { error } = await supabase.from('materi').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('materi').insert(payload);
        if (error) throw error;
      }
      toastSuccess('Materi berhasil disimpan!');
      resetForm();
      await loadMateri(user.id);
    } catch (e: any) {
      toastError('Gagal: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus materi ini?')) return;
    const { error } = await supabase.from('materi').delete().eq('id', id);
    if (error) { toastError('Gagal hapus: ' + error.message); return; }
    await loadMateri(user.id);
  };

  const handleAiGenerate = async () => {
    if (!judul.trim()) { toastWarning('Isi judul materi terlebih dahulu'); return }
    setAiGenerating(true)
    try {
      const kelasTerpilih = kelasList.find((k) => k.id === kelasId)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session login tidak ditemukan')
      const res = await fetch('/api/generate-materi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ judul, mapel, tujuan: tujuanPembelajaran, kelas: kelasTerpilih?.nama }),
      })
      const data = await res.json()
      if (!res.ok) { toastError('AI gagal: ' + data.error); return }
      setBlocks((prev) => [...prev, ...data.blocks])
    } catch {
      toastError('Gagal menghubungi AI')
    } finally {
      setAiGenerating(false)
    }
  }

  const filteredMateri = materiList.filter((m) =>
    !searchQuery || m.judul?.toLowerCase().includes(searchQuery.toLowerCase()) || m.mapel?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/guru')}
              aria-label="Kembali"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-bold flex-shrink-0"
            >
              <ArrowLeft size={17} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight truncate">Kelola Materi</h1>
              <p className="text-blue-200 text-xs">{materiList.length} materi</p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex flex-shrink-0 items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 transition shadow-sm"
            >
              <Plus size={16} />
              Buat Materi
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {showForm ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-5">
            {/* Form header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-white font-bold">
                {editingId ? <Edit3 size={17} /> : <Plus size={17} />}
                {editingId ? 'Edit Materi' : 'Buat Materi Baru'}
              </h2>
              <button onClick={resetForm} aria-label="Tutup form" className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg text-white transition">
                <X size={17} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Judul */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Judul Materi <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Chapter 7 – Explanation Text"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Mapel + Kelas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mata Pelajaran</label>
                  <select value={mapel} onChange={(e) => setMapel(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    {MAPEL_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kelas <span className="text-red-500">*</span></label>
                  <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Pilih Kelas --</option>
                    {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                </div>
              </div>

              {/* Bab + Estimasi + Kesulitan */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bab/Pertemuan</label>
                  <input type="text" value={bab} onChange={(e) => setBab(e.target.value)} placeholder="Bab 3" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estimasi (menit)</label>
                  <input type="number" value={estimasiMenit} onChange={(e) => setEstimasiMenit(parseInt(e.target.value) || 15)} min={1} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kesulitan</label>
                  <select value={tingkatKesulitan} onChange={(e) => setTingkatKesulitan(e.target.value as any)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sulit">Sulit</option>
                  </select>
                </div>
              </div>

              {/* Tujuan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tujuan Pembelajaran
                  <span className="text-xs text-gray-400 font-normal ml-1">(Setelah materi ini, siswa dapat...)</span>
                </label>
                <textarea
                  value={tujuanPembelajaran} onChange={(e) => setTujuanPembelajaran(e.target.value)}
                  placeholder="1. Memahami konsep&#10;2. Menerapkan dalam kehidupan"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Ringkasan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ringkasan Singkat</label>
                <textarea
                  value={ringkasan} onChange={(e) => setRingkasan(e.target.value)}
                  placeholder="Ringkasan 1-2 kalimat untuk preview di daftar materi"
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* ===== MODE TOGGLE ===== */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipe Konten</label>
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setKontenMode('blocks')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      kontenMode === 'blocks'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Code2 size={16} /> Block Editor
                    {kontenMode === 'blocks' && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setKontenMode('html')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      kontenMode === 'html'
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <FileCode2 size={16} /> Upload HTML
                    {kontenMode === 'html' && <span className="w-2 h-2 bg-violet-500 rounded-full" />}
                  </button>
                </div>

                {/* BLOCK EDITOR */}
                {kontenMode === 'blocks' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{blocks.length} block</span>
                      <button
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={aiGenerating}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-semibold rounded-lg hover:from-violet-600 hover:to-indigo-600 transition disabled:opacity-60"
                      >
                        {aiGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                        {aiGenerating ? 'Generating...' : 'Generate dengan AI'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      {aiGenerating ? 'AI sedang membuat konten, harap tunggu...' : 'Susun materi pakai blocks, atau klik "Generate dengan AI" untuk otomatis.'}
                    </p>
                    <div className="ml-8">
                      <BlockEditor initialBlocks={blocks} onChange={setBlocks} />
                    </div>
                  </div>
                )}

                {/* HTML UPLOAD */}
                {kontenMode === 'html' && (
                  <div className="space-y-4">
                    {/* Info box */}
                    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-violet-800 mb-1"><FileCode2 size={16} /> Upload File HTML Interaktif</p>
                      <p className="text-xs text-violet-600 leading-relaxed">
                        Upload file <strong>.html</strong> yang sudah kamu buat. Semua fitur akan berjalan sempurna: quiz, animasi, tabs, dan interaksi lainnya. Maksimal <strong>5 MB</strong>.
                      </p>
                    </div>

                    {/* Drop zone / file picker */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        htmlFileName
                          ? 'border-violet-400 bg-violet-50'
                          : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50'
                      }`}
                    >
                      {htmlFileName ? (
                        <>
                          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                            <CheckCircle2 size={24} />
                          </div>
                          <p className="font-semibold text-violet-700 text-sm">{htmlFileName}</p>
                          <p className="text-xs text-gray-400 mt-1">{Math.round(htmlKonten.length / 1024)} KB · Klik untuk ganti file</p>
                        </>
                      ) : (
                        <>
                          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                            <UploadCloud size={24} />
                          </div>
                          <p className="font-semibold text-gray-600 text-sm">Klik untuk pilih file HTML</p>
                          <p className="text-xs text-gray-400 mt-1">Format: .html atau .htm · Maks 5 MB</p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".html,.htm"
                        onChange={handleHtmlFileChange}
                        className="hidden"
                        aria-label="Upload file HTML"
                      />
                    </div>

                    {/* Preview toggle */}
                    {htmlKonten && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setHtmlPreview(!htmlPreview)}
                          className="flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900 transition"
                        >
                          {htmlPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                          {htmlPreview ? 'Sembunyikan Preview' : 'Lihat Preview HTML'}
                        </button>
                        {htmlPreview && (
                          <div className="mt-3 rounded-2xl overflow-hidden border-2 border-violet-200 shadow-lg">
                            <div className="bg-violet-100 px-4 py-2 flex items-center gap-2 border-b border-violet-200">
                              <div className="flex gap-1.5">
                                <div className="w-3 h-3 bg-red-400 rounded-full" />
                                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                                <div className="w-3 h-3 bg-green-400 rounded-full" />
                              </div>
                              <p className="text-xs text-violet-600 font-medium ml-2">Preview: {htmlFileName}</p>
                            </div>
                            <iframe
                              srcDoc={htmlKonten}
                              sandbox="allow-scripts"
                              className="w-full bg-white"
                              style={{ height: '600px', border: 'none' }}
                              title="Preview materi HTML"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
              <button
                onClick={handleSave} disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50 shadow-sm"
              >
                {loading ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                {loading ? 'Menyimpan...' : 'Simpan Materi'}
              </button>
              <button onClick={resetForm} disabled={loading} className="px-6 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                Batal
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Search */}
            {materiList.length > 0 && (
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari materi..."
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
            )}

            {/* List */}
            {filteredMateri.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Inbox size={26} />
                </div>
                <p className="font-semibold text-gray-600 mb-1">
                  {materiList.length === 0 ? 'Belum ada materi' : 'Tidak ditemukan'}
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  {materiList.length === 0 ? 'Buat materi pertamamu sekarang.' : `Tidak ada materi untuk "${searchQuery}"`}
                </p>
                {materiList.length === 0 && (
                  <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                    <Plus size={15} />
                    Buat Materi Pertama
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMateri.map((m) => {
                  const k_config = KESULITAN_CONFIG[m.tingkat_kesulitan as keyof typeof KESULITAN_CONFIG] || KESULITAN_CONFIG.sedang;
                  const isHtml = m.konten && m.konten.trim().startsWith('<');
                  return (
                    <div key={m.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
                      <div className="flex items-start gap-4 p-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isHtml ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'}`}>
                          {isHtml ? <FileCode2 size={20} /> : <BookOpen size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{m.mapel}</span>
                            {m.kelas && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{m.kelas.nama}</span>}
                            {m.tingkat_kesulitan && <span className={`text-xs px-2 py-0.5 rounded-full ${k_config.color}`}>{k_config.label}</span>}
                            {isHtml && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-semibold"><FileCode2 size={11} /> HTML</span>}
                            {m.estimasi_menit && <span className="text-xs text-gray-500">{m.estimasi_menit} mnt</span>}
                          </div>
                          <h3 className="font-bold text-gray-800 text-sm">{m.judul}</h3>
                          {m.bab && <p className="text-xs text-gray-500 mt-0.5">{m.bab}</p>}
                          {m.ringkasan && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{m.ringkasan}</p>}
                          <p className="text-[10px] text-gray-400 mt-1.5">
                            {isHtml ? `HTML · ${Math.round((m.konten?.length || 0) / 1024)} KB` : `${(m.konten_blocks?.length || 0)} block`} · {new Date(m.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button onClick={() => handleEdit(m)} className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-semibold transition">
                            <span className="inline-flex items-center gap-1"><Edit3 size={12} /> Edit</span>
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold transition">
                            <span className="inline-flex items-center gap-1"><Trash2 size={12} /> Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
