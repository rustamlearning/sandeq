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
import { Badge, Button, EmptyState, LoadingState } from '@/components/ui'

const MAPEL_LIST = [
  'Matematika','Bahasa Indonesia','Bahasa Inggris','Fisika','Kimia',
  'Biologi','Sejarah Indonesia','Geografi','Ekonomi','Sosiologi',
  'PPKn','Pendidikan Agama Islam','Seni Budaya','Penjaskes','Informatika',
];

const KESULITAN_CONFIG = {
  mudah: { label: 'Mudah', color: 'green' as const },
  sedang: { label: 'Sedang', color: 'orange' as const },
  sulit: { label: 'Sulit', color: 'red' as const },
};

type KontenMode = 'blocks' | 'html';

const fieldClass = 'w-full border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-800 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#2e86c1]/70 focus:ring-4 focus:ring-[#2e86c1]/14'
const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-700'

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
      toastSuccess('Materi berhasil disimpan');
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

  if (!user) return <LoadingState title="Membuka kelola materi" description="Menyiapkan daftar kelas dan materi guru." />;

  return (
    <div className="app-canvas min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/78 text-slate-950 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/guru')}
              aria-label="Kembali"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white/72 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            >
              <ArrowLeft size={17} />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Guru</p>
              <h1 className="truncate text-xl font-semibold leading-tight text-slate-950">Kelola materi</h1>
            </div>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              size="sm"
              className="flex-shrink-0"
            >
              <Plus size={16} />
              Buat Materi
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {showForm ? (
          <section className="surface-card mb-6 overflow-hidden rounded-xl">
            {/* Form header */}
            <div className="flex items-center justify-between gap-4 border-b border-white/70 bg-white/55 px-5 py-4 md:px-6">
              <div>
                <p className="text-xs font-medium text-slate-500">{editingId ? 'Perbarui konten' : 'Materi baru'}</p>
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-950">
                  {editingId ? <Edit3 size={18} /> : <Plus size={18} />}
                  {editingId ? 'Edit materi' : 'Buat materi'}
                </h2>
              </div>
              <button onClick={resetForm} aria-label="Tutup form" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-500 transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-900">
                <X size={17} />
              </button>
            </div>

            <div className="space-y-6 p-5 md:p-6">
              {/* Judul */}
              <div>
                <label className={labelClass}>Judul materi <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Chapter 7 – Explanation Text"
                  className={fieldClass}
                />
              </div>

              {/* Mapel + Kelas */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Mata pelajaran</label>
                  <select value={mapel} onChange={(e) => setMapel(e.target.value)} className={fieldClass}>
                    {MAPEL_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Kelas <span className="text-red-500">*</span></label>
                  <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} className={fieldClass}>
                    <option value="">-- Pilih Kelas --</option>
                    {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                </div>
              </div>

              {/* Bab + Estimasi + Kesulitan */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>Bab/pertemuan</label>
                  <input type="text" value={bab} onChange={(e) => setBab(e.target.value)} placeholder="Bab 3" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Estimasi (menit)</label>
                  <input type="number" value={estimasiMenit} onChange={(e) => setEstimasiMenit(parseInt(e.target.value) || 15)} min={1} className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Kesulitan</label>
                  <select value={tingkatKesulitan} onChange={(e) => setTingkatKesulitan(e.target.value as any)} className={fieldClass}>
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sulit">Sulit</option>
                  </select>
                </div>
              </div>

              {/* Tujuan */}
              <div>
                <label className={labelClass}>
                  Tujuan pembelajaran
                  <span className="ml-1 text-xs font-normal text-slate-400">(Setelah materi ini, siswa dapat...)</span>
                </label>
                <textarea
                  value={tujuanPembelajaran} onChange={(e) => setTujuanPembelajaran(e.target.value)}
                  placeholder="1. Memahami konsep&#10;2. Menerapkan dalam kehidupan"
                  rows={3}
                  className={`${fieldClass} resize-none`}
                />
              </div>

              {/* Ringkasan */}
              <div>
                <label className={labelClass}>Ringkasan singkat</label>
                <textarea
                  value={ringkasan} onChange={(e) => setRingkasan(e.target.value)}
                  placeholder="Ringkasan 1-2 kalimat untuk preview di daftar materi"
                  rows={2}
                  className={`${fieldClass} resize-none`}
                />
              </div>

              {/* ===== MODE TOGGLE ===== */}
              <div>
                <label className={labelClass}>Tipe konten</label>
                <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setKontenMode('blocks')}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                      kontenMode === 'blocks'
                        ? 'border-[#2e86c1]/40 bg-white text-[#1A4A7A] shadow-[0_12px_30px_rgba(18,61,100,0.08)]'
                        : 'border-slate-200/80 bg-white/55 text-slate-500 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2"><Code2 size={16} /> Block editor</span>
                    {kontenMode === 'blocks' && <span className="h-2 w-2 rounded-full bg-[#2e86c1]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setKontenMode('html')}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                      kontenMode === 'html'
                        ? 'border-violet-300 bg-white text-violet-700 shadow-[0_12px_30px_rgba(109,40,217,0.08)]'
                        : 'border-slate-200/80 bg-white/55 text-slate-500 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2"><FileCode2 size={16} /> Upload HTML</span>
                    {kontenMode === 'html' && <span className="h-2 w-2 rounded-full bg-violet-500" />}
                  </button>
                </div>

                {/* BLOCK EDITOR */}
                {kontenMode === 'blocks' && (
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge color="slate">{blocks.length} block</Badge>
                      <button
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={aiGenerating}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white/85 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white disabled:translate-y-0 disabled:opacity-60"
                      >
                        <Sparkles className={aiGenerating ? 'animate-pulse' : ''} size={14} />
                        {aiGenerating ? 'Membuat konten...' : 'Generate dengan AI'}
                      </button>
                    </div>
                    <p className="mb-4 text-xs leading-relaxed text-slate-500">
                      {aiGenerating ? 'AI sedang membuat konten, harap tunggu...' : 'Susun materi pakai blocks, atau klik "Generate dengan AI" untuk otomatis.'}
                    </p>
                    <div className="rounded-xl border border-slate-200/75 bg-white/58 p-3 md:p-4">
                      <BlockEditor initialBlocks={blocks} onChange={setBlocks} />
                    </div>
                  </div>
                )}

                {/* HTML UPLOAD */}
                {kontenMode === 'html' && (
                  <div className="space-y-4">
                    {/* Info box */}
                    <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-4">
                      <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-violet-800"><FileCode2 size={16} /> Upload file HTML interaktif</p>
                      <p className="text-xs leading-relaxed text-violet-700/80">
                        Upload file <strong>.html</strong> yang sudah kamu buat. Semua fitur akan berjalan sempurna: quiz, animasi, tabs, dan interaksi lainnya. Maksimal <strong>5 MB</strong>.
                      </p>
                    </div>

                    {/* Drop zone / file picker */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-xl border border-dashed p-8 text-center transition-all ${
                        htmlFileName
                          ? 'border-violet-300 bg-violet-50/70'
                          : 'border-slate-200 bg-white/62 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white'
                      }`}
                    >
                      {htmlFileName ? (
                        <>
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
                            <CheckCircle2 size={24} />
                          </div>
                          <p className="text-sm font-semibold text-violet-800">{htmlFileName}</p>
                          <p className="mt-1 text-xs text-slate-500">{Math.round(htmlKonten.length / 1024)} KB · Klik untuk ganti file</p>
                        </>
                      ) : (
                        <>
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                            <UploadCloud size={24} />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">Klik untuk pilih file HTML</p>
                          <p className="mt-1 text-xs text-slate-500">Format: .html atau .htm · Maks 5 MB</p>
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
                          className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 transition hover:text-violet-950"
                        >
                          {htmlPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                          {htmlPreview ? 'Sembunyikan preview' : 'Lihat preview HTML'}
                        </button>
                        {htmlPreview && (
                          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_18px_44px_rgba(18,61,100,0.08)]">
                            <div className="flex items-center gap-2 border-b border-slate-200/80 bg-slate-50/90 px-4 py-2">
                              <div className="flex gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                                <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                                <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                              </div>
                              <p className="ml-2 text-xs font-medium text-slate-500">Preview: {htmlFileName}</p>
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
            <div className="sticky bottom-0 flex gap-3 border-t border-white/70 bg-white/78 px-5 py-4 backdrop-blur-xl md:px-6">
              <Button
                onClick={handleSave} disabled={loading}
                loading={loading}
                fullWidth
              >
                {!loading && <Save size={17} />}
                {loading ? 'Menyimpan' : 'Simpan materi'}
              </Button>
              <Button onClick={resetForm} disabled={loading} variant="secondary" className="px-6">
                Batal
              </Button>
            </div>
          </section>
        ) : (
          <div className="space-y-5">
            <section className="surface-card rounded-xl p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Perpustakaan kelas</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Materi pembelajaran</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                    Kelola bahan ajar, file HTML interaktif, dan block materi untuk setiap kelas dari satu tempat.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <div className="rounded-lg bg-white/70 px-4 py-3 ring-1 ring-white/80">
                    <p className="text-xs text-slate-500">Total materi</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{materiList.length}</p>
                  </div>
                  <div className="rounded-lg bg-white/70 px-4 py-3 ring-1 ring-white/80">
                    <p className="text-xs text-slate-500">Kelas</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{kelasList.length}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Search */}
            {materiList.length > 0 && (
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari materi..."
                  className="w-full border border-slate-200/80 bg-white/88 py-3 pl-11 pr-4 text-sm text-slate-800 shadow-[0_12px_30px_rgba(18,61,100,0.06)] outline-none transition placeholder:text-slate-400 focus:border-[#2e86c1]/60 focus:ring-4 focus:ring-[#2e86c1]/14"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            )}

            {/* List */}
            {filteredMateri.length === 0 ? (
              <div className="surface-card rounded-xl">
                <EmptyState
                  type="materi"
                  title={materiList.length === 0 ? 'Belum ada materi' : 'Materi tidak ditemukan'}
                  description={materiList.length === 0 ? 'Buat materi pertama agar siswa punya titik mulai yang jelas.' : `Tidak ada materi untuk "${searchQuery}".`}
                  action={materiList.length === 0 ? (
                    <Button onClick={() => setShowForm(true)} size="sm">
                    <Plus size={15} />
                      Buat materi pertama
                    </Button>
                  ) : undefined}
                />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMateri.map((m) => {
                  const k_config = KESULITAN_CONFIG[m.tingkat_kesulitan as keyof typeof KESULITAN_CONFIG] || KESULITAN_CONFIG.sedang;
                  const isHtml = m.konten && m.konten.trim().startsWith('<');
                  return (
                    <article key={m.id} className="surface-card overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lifted)]">
                      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${isHtml ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {isHtml ? <FileCode2 size={20} /> : <BookOpen size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            <Badge>{m.mapel}</Badge>
                            {m.kelas && <Badge color="slate">{m.kelas.nama}</Badge>}
                            {m.tingkat_kesulitan && <Badge color={k_config.color}>{k_config.label}</Badge>}
                            {isHtml && <Badge color="violet" className="gap-1"><FileCode2 size={11} /> HTML</Badge>}
                            {m.estimasi_menit && <span className="text-xs font-medium text-slate-500">{m.estimasi_menit} mnt</span>}
                          </div>
                          <h3 className="text-base font-semibold text-slate-950">{m.judul}</h3>
                          {m.bab && <p className="mt-0.5 text-xs font-medium text-slate-500">{m.bab}</p>}
                          {m.ringkasan && <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-slate-500">{m.ringkasan}</p>}
                          <p className="mt-2 text-xs text-slate-400">
                            {isHtml ? `HTML · ${Math.round((m.konten?.length || 0) / 1024)} KB` : `${(m.konten_blocks?.length || 0)} block`} · {new Date(m.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 gap-2 sm:flex-col">
                          <button onClick={() => handleEdit(m)} className="inline-flex items-center justify-center rounded-lg border border-blue-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-blue-100">
                            <span className="inline-flex items-center gap-1"><Edit3 size={12} /> Edit</span>
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100">
                            <span className="inline-flex items-center gap-1"><Trash2 size={12} /> Hapus</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
