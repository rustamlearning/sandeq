'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3, CalendarDays, CheckCircle2, ClipboardCheck,
  Edit3, FileQuestion, Pause, Play, Plus, Search, Target, Timer, Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageLoader } from '@/components/ui';

interface KuisItem {
  id: string; judul: string; mapel: string; kelas_id: string;
  durasi_menit: number; jumlah_soal: number; total_poin: number; kkm: number;
  is_published: boolean; tipe?: string; created_at: string;
  kelas?: { nama: string }; _attempts_count?: number; _avg_score?: number;
}

function getMapelInitial(mapel: string) {
  return (mapel || 'Kuis').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function KuisListPage() {
  const router = useRouter();
  const { info: toastInfo } = useToast();
  const [user, setUser] = useState<any>(null);
  const [kuisList, setKuisList] = useState<KuisItem[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => { init(); }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || u.role !== 'guru') { router.push('/login'); return; }
    setUser(u);
    const [kuisRes, kelasRes] = await Promise.all([
      supabase.from('kuis').select('*, kelas:kelas_id(nama)').eq('guru_id', u.id).order('created_at', { ascending: false }),
      supabase.from('kelas').select('*').order('nama'),
    ]);
    const enriched = await Promise.all((kuisRes.data || []).map(async (k: any) => {
      const { data: attempts } = await supabase.from('kuis_attempts').select('nilai_persen').eq('kuis_id', k.id).eq('selesai', true);
      const completed = attempts || [];
      const avg = completed.length > 0 ? completed.reduce((s: number, a: any) => s + (a.nilai_persen || 0), 0) / completed.length : 0;
      return { ...k, _attempts_count: completed.length, _avg_score: Math.round(avg * 10) / 10 };
    }));
    setKuisList(enriched);
    setKelasList(kelasRes.data || []);
    setLoading(false);
  };

  const handleDelete = async (kuis: KuisItem) => {
    if (!confirm(`Hapus kuis "${kuis.judul}"?\nSemua soal dan jawaban siswa akan ikut terhapus.`)) return;
    const { error } = await supabase.from('kuis').delete().eq('id', kuis.id);
    if (error) { toastInfo('Gagal hapus: ' + error.message); return; }
    setKuisList(prev => prev.filter(k => k.id !== kuis.id));
  };

  const togglePublish = async (kuis: KuisItem) => {
    const newStatus = !kuis.is_published;
    const { error } = await supabase.from('kuis').update({ is_published: newStatus }).eq('id', kuis.id);
    if (error) { toastInfo('Gagal update: ' + error.message); return; }
    setKuisList(prev => prev.map(k => k.id === kuis.id ? { ...k, is_published: newStatus } : k));
  };

  const filtered = kuisList.filter(k => {
    if (search && !k.judul.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterKelas !== 'all' && k.kelas_id !== filterKelas) return false;
    if (filterStatus === 'published' && !k.is_published) return false;
    if (filterStatus === 'draft' && k.is_published) return false;
    return true;
  });

  if (loading) return <PageLoader />;

  const aktif = kuisList.filter(k => k.is_published).length;
  const draft = kuisList.filter(k => !k.is_published).length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PageHeader
        title="Kuis & Ulangan"
        subtitle={`${kuisList.length} kuis · ${aktif} aktif`}
        backHref="/guru"
        actions={
          <Button icon={<Plus size={15} />} onClick={() => router.push('/guru/kuis/builder/new')}>
            Buat Kuis
          </Button>
        }
      />

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-5">

        {/* Filter bar */}
        {kuisList.length > 0 && (
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari judul kuis..."
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                />
              </div>
              <select
                value={filterKelas} onChange={e => setFilterKelas(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              >
                <option value="all">Semua Kelas</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
            <div className="flex gap-2 flex-wrap">
              {([
                { val: 'all', label: `Semua (${kuisList.length})` },
                { val: 'published', label: `✅ Aktif (${aktif})` },
                { val: 'draft', label: `📝 Draft (${draft})` },
              ] as const).map(f => (
                <button key={f.val} onClick={() => setFilterStatus(f.val)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  style={{
                    background: filterStatus === f.val ? 'var(--primary)' : 'var(--bg)',
                    color: filterStatus === f.val ? '#fff' : 'var(--text-2)',
                    border: '1px solid var(--border)',
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        {kuisList.length === 0 ? (
          <EmptyState
            type="kuis"
            title="Belum ada kuis"
            description="Buat kuis pertama — bisa generate soal dengan AI atau manual."
            action={<Button icon={<Plus size={15} />} onClick={() => router.push('/guru/kuis/builder/new')}>Buat Kuis Pertama</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            type="generic"
            title="Tidak ditemukan"
            description="Tidak ada kuis yang cocok dengan filter."
            action={<Button variant="secondary" onClick={() => { setSearch(''); setFilterKelas('all'); setFilterStatus('all'); }}>Reset Filter</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(kuis => (
              <KuisCard key={kuis.id} kuis={kuis} onDelete={() => handleDelete(kuis)} onTogglePublish={() => togglePublish(kuis)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function KuisCard({ kuis, onDelete, onTogglePublish }: { kuis: KuisItem; onDelete: () => void; onTogglePublish: () => void }) {
  const router = useRouter();
  const tanggal = new Date(kuis.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>

      {/* Status bar */}
      <div className={`h-1 ${kuis.is_published ? 'bg-emerald-500' : 'bg-slate-300'}`} />

      <div className="p-4 space-y-3">
        {/* Title row */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600">
            {getMapelInitial(kuis.mapel)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-1)' }}>{kuis.judul}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{kuis.mapel} · {kuis.kelas?.nama || '-'}</p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${kuis.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {kuis.is_published ? 'Aktif' : 'Draft'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1 py-2.5 rounded-xl text-center" style={{ background: 'var(--bg)' }}>
          {[
            { val: kuis.jumlah_soal || 0, label: 'Soal', color: 'text-indigo-600' },
            { val: kuis._attempts_count || 0, label: 'Peserta', color: 'text-violet-600' },
            { val: (kuis._attempts_count || 0) > 0 ? (kuis._avg_score || 0).toFixed(0) : '—', label: 'Rata-rata', color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-base font-black ${s.color}`}>{s.val}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-[11px] flex-wrap gap-1" style={{ color: 'var(--text-3)' }}>
          <span className="flex items-center gap-1"><Timer size={11} /> {kuis.durasi_menit} menit</span>
          <span className="flex items-center gap-1"><Target size={11} /> KKM {kuis.kkm}</span>
          <span className="flex items-center gap-1"><CalendarDays size={11} /> {tanggal}</span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-1.5">
          <Button variant="secondary" size="sm" icon={<Edit3 size={13} />} onClick={() => router.push(`/guru/kuis/builder/${kuis.id}`)}>
            Kelola
          </Button>
          <Button variant="secondary" size="sm" icon={<BarChart3 size={13} />} onClick={() => router.push(`/guru/kuis/${kuis.id}/analytics`)}>
            Analytics
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Button variant="secondary" size="sm" icon={<ClipboardCheck size={12} />} onClick={() => router.push(`/guru/kuis/${kuis.id}/grading`)}>
            Nilai
          </Button>
          <button onClick={onTogglePublish}
            className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${kuis.is_published ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
            {kuis.is_published ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Publish</>}
          </button>
          <button onClick={onDelete}
            className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition active:scale-95">
            <Trash2 size={12} /> Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
