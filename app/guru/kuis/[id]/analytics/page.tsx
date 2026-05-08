'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  Edit3,
  FileQuestion,
  Lightbulb,
  LineChart,
  Target,
  Timer,
  Users,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { Kuis, getKuisAnalytics, formatDuration, getNilaiColor } from '@/lib/kuis';

export default function KuisAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const kuisId = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [kuis, setKuis] = useState<Kuis | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [soalStats, setSoalStats] = useState<any[]>([]);
  const [pendingGrading, setPendingGrading] = useState(0);
  const [loading, setLoading] = useState(true);

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

    // Load kuis
    const { data: k } = await supabase.from('kuis').select('*').eq('id', kuisId).single();
    setKuis(k);

    // Load analytics
    const a = await getKuisAnalytics(kuisId);
    setAnalytics(a);

    // Load attempts dengan user info
    const { data: att } = await supabase
      .from('kuis_attempts')
      .select('*, users:user_id(nama, nis_nip)')
      .eq('kuis_id', kuisId)
      .eq('selesai', true)
      .order('nilai_total', { ascending: false });
    setAttempts(att || []);

    // Count yang butuh grading
    const needGrading = (att || []).filter((a) => a.needs_grading).length;
    setPendingGrading(needGrading);

    // Calculate soal stats (% yang menjawab benar per soal)
    const { data: soal } = await supabase
      .from('soal')
      .select('*')
      .eq('kuis_id', kuisId)
      .order('urutan');

    if (soal && soal.length > 0) {
      const stats = await Promise.all(
        soal.map(async (s: any) => {
          const { data: jawaban } = await supabase
            .from('jawaban_attempts')
            .select('benar, attempt_id, kuis_attempts!inner(kuis_id)')
            .eq('soal_id', s.id)
            .eq('kuis_attempts.kuis_id', kuisId);

          const total = jawaban?.length || 0;
          const benar = jawaban?.filter((j: any) => j.benar === true).length || 0;
          const salah = jawaban?.filter((j: any) => j.benar === false).length || 0;
          const ungraded = jawaban?.filter((j: any) => j.benar === null).length || 0;

          return {
            ...s,
            total,
            benar,
            salah,
            ungraded,
            akurasi: total > 0 ? (benar / (total - ungraded)) * 100 : 0,
          };
        })
      );
      setSoalStats(stats);
    }

    setLoading(false);
  };

  if (loading || !kuis) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Distribusi nilai (untuk histogram)
  const buckets = [
    { range: '0-20', min: 0, max: 20, count: 0 },
    { range: '21-40', min: 21, max: 40, count: 0 },
    { range: '41-60', min: 41, max: 60, count: 0 },
    { range: '61-75', min: 61, max: 75, count: 0 },
    { range: '76-90', min: 76, max: 90, count: 0 },
    { range: '91-100', min: 91, max: 100, count: 0 },
  ];
  attempts.forEach((a) => {
    const persen = a.nilai_persen || 0;
    const bucket = buckets.find((b) => persen >= b.min && persen <= b.max);
    if (bucket) bucket.count++;
  });
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3 flex-wrap">
          <button onClick={() => router.push('/guru/analytics')} className="text-indigo-600 text-sm">
            <span className="inline-flex items-center gap-1.5"><ArrowLeft size={16} /> Analytics</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="inline-flex items-center gap-2 text-lg font-bold truncate"><BarChart3 size={18} /> {kuis.judul}</h1>
            <p className="text-xs text-gray-500">{kuis.mapel} • KKM {kuis.kkm}</p>
          </div>

          {pendingGrading > 0 && (
            <button
              onClick={() => router.push(`/guru/kuis/${kuisId}/grading`)}
              className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 flex items-center gap-1"
            >
              <Clock3 size={15} /> Grading ({pendingGrading})
            </button>
          )}
          <button
            onClick={() => router.push(`/guru/kuis/builder/${kuisId}`)}
            className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            <span className="inline-flex items-center gap-1.5"><Edit3 size={14} /> Edit</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {!analytics || (analytics.total_selesai === 0) ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <BarChart3 size={26} />
            </div>
            <p className="text-gray-600 font-medium">Belum ada siswa yang mengerjakan</p>
            <p className="text-sm text-gray-500 mt-1">
              Statistik akan muncul setelah ada siswa submit kuis
            </p>
          </div>
        ) : (
          <>
            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <BigStatCard
                label="Peserta"
                value={`${analytics.total_selesai}/${analytics.total_peserta}`}
                sub={`${Math.round((analytics.total_selesai / Math.max(analytics.total_peserta, 1)) * 100)}% selesai`}
                color="blue"
                icon={Users}
              />
              <BigStatCard
                label="Rata-rata"
                value={analytics.rata_rata.toFixed(1)}
                sub={`Median: ${analytics.median.toFixed(0)}`}
                color="green"
                icon={BarChart3}
              />
              <BigStatCard
                label="Lulus KKM"
                value={`${analytics.passing_rate.toFixed(0)}%`}
                sub={`KKM: ${kuis.kkm}`}
                color="purple"
                icon={Target}
              />
              <BigStatCard
                label="Durasi Rata"
                value={formatDuration(analytics.rata_durasi_detik || 0)}
                sub={`Limit: ${kuis.durasi_menit}m`}
                color="orange"
                icon={Timer}
              />
            </div>

            {/* Range nilai */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 uppercase mb-1">Nilai Tertinggi</p>
                <p className="text-3xl font-bold text-green-600">{analytics.nilai_tertinggi.toFixed(1)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 uppercase mb-1">Nilai Terendah</p>
                <p className="text-3xl font-bold text-red-600">{analytics.nilai_terendah.toFixed(1)}</p>
              </div>
            </div>

            {/* Distribusi Nilai - Histogram */}
            <section className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="inline-flex items-center gap-2 text-lg font-bold mb-4"><LineChart size={18} /> Distribusi Nilai</h2>
              <div className="space-y-2">
                {buckets.map((b) => (
                  <div key={b.range} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-600 w-16">{b.range}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all flex items-center justify-end px-2 ${
                          b.min >= (kuis.kkm || 75) ? 'bg-green-500' : 'bg-red-400'
                        }`}
                        style={{ width: `${(b.count / maxCount) * 100}%` }}
                      >
                        {b.count > 0 && <span className="text-xs font-bold text-white">{b.count}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                <span className="inline-flex items-center gap-1.5"><Lightbulb size={13} /> Hijau: lulus KKM ({kuis.kkm}+) • Merah: belum lulus</span>
              </p>
            </section>

            {/* Per-Soal Performance */}
            {soalStats.length > 0 && (
              <section className="bg-white rounded-xl p-5 shadow-sm">
                <h2 className="inline-flex items-center gap-2 text-lg font-bold mb-4"><FileQuestion size={18} /> Performa per Soal</h2>
                <div className="space-y-3">
                  {soalStats.map((s, i) => (
                    <div key={s.id} className="border-l-4 pl-3 py-2" style={{
                      borderColor: s.akurasi >= 70 ? '#4f46e5' : s.akurasi >= 50 ? '#f59e0b' : '#ef4444'
                    }}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Soal #{i + 1} • {s.tipe}</p>
                          <p className="font-medium text-sm line-clamp-2">{s.teks}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-2xl font-bold ${
                            s.akurasi >= 70 ? 'text-green-600' : s.akurasi >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {s.akurasi.toFixed(0)}%
                          </p>
                          <p className="text-xs text-gray-500">akurasi</p>
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 size={12} /> {s.benar} benar</span>
                        <span className="inline-flex items-center gap-1 text-red-600"><XCircle size={12} /> {s.salah} salah</span>
                        {s.ungraded > 0 && <span className="inline-flex items-center gap-1 text-yellow-600"><Clock3 size={12} /> {s.ungraded} pending</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  <span className="inline-flex items-center gap-1.5"><Lightbulb size={13} /> Soal dengan akurasi {'<'}50% (merah) mungkin perlu di-review/perjelas</span>
                </p>
              </section>
            )}

            {/* Daftar Attempts */}
            <section className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="inline-flex items-center gap-2 text-lg font-bold mb-4"><Target size={18} /> Hasil Siswa</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Siswa</th>
                      <th className="px-3 py-2 text-center">Nilai</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2 text-center">Durasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a, i) => {
                      const persen = a.nilai_persen || 0;
                      const lulus = persen >= (kuis.kkm || 75);
                      return (
                        <tr key={a.id} className="border-t hover:bg-gray-50">
                          <td className="px-3 py-3">{i + 1}</td>
                          <td className="px-3 py-3">
                            <p className="font-medium">{a.users?.nama}</p>
                            <p className="text-xs text-gray-500">NIS: {a.users?.nis_nip}</p>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`font-bold text-lg ${getNilaiColor(persen, kuis.kkm)}`}>
                              {persen.toFixed(0)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {a.needs_grading ? (
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                                <span className="inline-flex items-center gap-1"><Clock3 size={12} /> Pending</span>
                              </span>
                            ) : lulus ? (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} /> Lulus</span>
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                <span className="inline-flex items-center gap-1"><XCircle size={12} /> Belum Lulus</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center text-gray-600">
                            {formatDuration(a.durasi_aktual_detik || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function BigStatCard({ label, value, sub, color, icon: Icon }: { label: string; value: string; sub: string; color: string; icon: LucideIcon }) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
    orange: 'from-orange-500 to-red-500',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} text-white rounded-xl p-4 shadow-md`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={22} />
        <span className="text-xs uppercase tracking-wider opacity-90">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs opacity-90 mt-1">{sub}</p>
    </div>
  );
}
