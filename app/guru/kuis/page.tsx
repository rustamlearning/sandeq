'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  FileQuestion,
  Inbox,
  Loader2,
  Pause,
  Play,
  Plus,
  Search,
  Target,
  Timer,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast'

interface KuisItem {
  id: string;
  judul: string;
  mapel: string;
  kelas_id: string;
  durasi_menit: number;
  jumlah_soal: number;
  total_poin: number;
  kkm: number;
  is_published: boolean;
  tipe?: string;
  deskripsi?: string;
  created_at: string;
  kelas?: { nama: string };
  _attempts_count?: number;
  _avg_score?: number;
}

function getMapelInitial(mapel: string) {
  return (mapel || 'Kuis')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export default function KuisListPage() {
  const router = useRouter()
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast();
  const [user, setUser] = useState<any>(null);
  const [kuisList, setKuisList] = useState<KuisItem[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || u.role !== 'guru') {
      router.push('/login');
      return;
    }
    setUser(u);

    const [kuisRes, kelasRes] = await Promise.all([
      supabase
        .from('kuis')
        .select('*, kelas:kelas_id(nama)')
        .eq('guru_id', u.id)
        .order('created_at', { ascending: false }),
      supabase.from('kelas').select('*').order('nama'),
    ]);

    const kuisData = kuisRes.data || [];

    const enriched = await Promise.all(
      kuisData.map(async (k: any) => {
        const { data: attempts } = await supabase
          .from('kuis_attempts')
          .select('nilai_persen')
          .eq('kuis_id', k.id)
          .eq('selesai', true);

        const completed = attempts || [];
        const avgScore = completed.length > 0
          ? completed.reduce((s: number, a: any) => s + (a.nilai_persen || 0), 0) / completed.length
          : 0;

        return {
          ...k,
          _attempts_count: completed.length,
          _avg_score: Math.round(avgScore * 10) / 10,
        };
      })
    );

    setKuisList(enriched);
    setKelasList(kelasRes.data || []);
    setLoading(false);
  };

  const handleDelete = async (kuis: KuisItem) => {
    if (!confirm(`Hapus kuis "${kuis.judul}"?\n\nSemua soal dan jawaban siswa akan ikut terhapus.`)) {
      return;
    }
    const { error } = await supabase.from('kuis').delete().eq('id', kuis.id);
    if (error) {
      toastInfo('Gagal hapus: ' + error.message);
      return;
    }
    setKuisList((prev) => prev.filter((k) => k.id !== kuis.id));
  };

  const togglePublish = async (kuis: KuisItem) => {
    const newStatus = !kuis.is_published;
    const { error } = await supabase
      .from('kuis')
      .update({ is_published: newStatus })
      .eq('id', kuis.id);
    if (error) {
      toastInfo('Gagal update: ' + error.message);
      return;
    }
    setKuisList((prev) =>
      prev.map((k) => (k.id === kuis.id ? { ...k, is_published: newStatus } : k))
    );
  };

  const filtered = kuisList.filter((k) => {
    if (search && !k.judul.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterKelas !== 'all' && k.kelas_id !== filterKelas) return false;
    if (filterStatus === 'published' && !k.is_published) return false;
    if (filterStatus === 'draft' && k.is_published) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Loader2 className="animate-spin" size={24} />
          </div>
          <p className="text-gray-600">Memuat kuis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => router.push('/guru')}
            aria-label="Kembali"
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">Kuis & Ulangan</h1>
            <p className="text-white/90 text-sm">
              {kuisList.length} kuis • {kuisList.filter((k) => k.is_published).length} aktif
            </p>
          </div>
          <Link
            href="/guru/kuis/builder/new"
            className="bg-white text-orange-600 hover:bg-orange-50 px-5 py-2.5 rounded-xl font-semibold shadow-md transition flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Buat Kuis Baru</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {kuisList.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">Cari</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari berdasarkan judul..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Kelas</label>
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3 flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semua ({kuisList.length})
              </button>
              <button
                onClick={() => setFilterStatus('published')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'published' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} /> Aktif ({kuisList.filter((k) => k.is_published).length})</span>
              </button>
              <button
                onClick={() => setFilterStatus('draft')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterStatus === 'draft' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="inline-flex items-center gap-1.5"><FileQuestion size={13} /> Draft ({kuisList.filter((k) => !k.is_published).length})</span>
              </button>
            </div>
          </div>
        )}

        {kuisList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <FileQuestion size={30} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Belum ada kuis</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Mulai dengan membuat kuis pertama. Kamu bisa generate soal otomatis dengan AI atau buat manual.
            </p>
            <Link
              href="/guru/kuis/builder/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition"
            >
              <Plus size={18} />
              <span>Buat Kuis Pertama</span>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Search size={26} />
            </div>
            <p className="text-gray-600">Tidak ada kuis yang cocok dengan filter</p>
            <button
              onClick={() => {
                setSearch('');
                setFilterKelas('all');
                setFilterStatus('all');
              }}
              className="mt-3 text-blue-600 hover:underline text-sm"
            >
              Reset filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((kuis) => (
              <KuisCard
                key={kuis.id}
                kuis={kuis}
                onDelete={() => handleDelete(kuis)}
                onTogglePublish={() => togglePublish(kuis)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function KuisCard({
  kuis,
  onDelete,
  onTogglePublish,
}: {
  kuis: KuisItem;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const mapelInitial = getMapelInitial(kuis.mapel);
  const tanggalDibuat = new Date(kuis.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100">
      <div className={`h-1.5 ${kuis.is_published ? 'bg-green-500' : 'bg-gray-300'}`} />

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">
            {mapelInitial}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{kuis.judul}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {kuis.mapel} • {kuis.kelas?.nama || '-'}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
              kuis.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {kuis.is_published ? '● Aktif' : '◌ Draft'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 my-3 py-3 border-y border-gray-100">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{kuis.jumlah_soal || 0}</div>
            <div className="text-xs text-gray-500">Soal</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{kuis._attempts_count || 0}</div>
            <div className="text-xs text-gray-500">Peserta</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {(kuis._attempts_count || 0) > 0 ? (kuis._avg_score || 0).toFixed(0) : '-'}
            </div>
            <div className="text-xs text-gray-500">Rata-rata</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3 flex-wrap gap-1">
          <span className="inline-flex items-center gap-1"><Timer size={12} /> {kuis.durasi_menit} menit</span>
          <span className="inline-flex items-center gap-1"><Target size={12} /> KKM {kuis.kkm}</span>
          <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {tanggalDibuat}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <Link
            href={`/guru/kuis/builder/${kuis.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition"
          >
            <Edit3 size={14} />
            Kelola
          </Link>
          <Link
            href={`/guru/kuis/${kuis.id}/analytics`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition"
          >
            <BarChart3 size={14} />
            Analytics
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Link
            href={`/guru/kuis/${kuis.id}/grading`}
            className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium transition"
          >
            <ClipboardCheck size={13} />
            Grading
          </Link>
          <button
            onClick={onTogglePublish}
            className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition ${
              kuis.is_published
                ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
                : 'bg-green-50 hover:bg-green-100 text-green-700'
            }`}
          >
            {kuis.is_published ? <Pause size={13} /> : <Play size={13} />}
            {kuis.is_published ? 'Pause' : 'Publish'}
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition"
          >
            <Trash2 size={13} />
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
