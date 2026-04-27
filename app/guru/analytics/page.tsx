'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';

export default function GuruAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [loading, setLoading] = useState(true);

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [materiList, setMateriList] = useState<any[]>([]);
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'siswa' | 'materi'>('overview');
  const [sortSiswa, setSortSiswa] = useState<'xp' | 'materi' | 'quiz' | 'streak'>('xp');

  useEffect(() => { init(); }, []);
  useEffect(() => { if (selectedKelas) loadData(selectedKelas); }, [selectedKelas]);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || (u.role !== 'guru' && u.role !== 'admin')) {
      router.push('/login');
      return;
    }
    setUser(u);

    // Load kelas
    let query = supabase.from('kelas').select('*').order('tingkat');
    const { data: kelas } = await query;
    setKelasList(kelas || []);

    // Default: pilih kelas pertama
    if (kelas && kelas.length > 0) {
      setSelectedKelas(kelas[0].id);
    }
    setLoading(false);
  };

  const loadData = async (kelasId: string) => {
    await Promise.all([
      loadSiswa(kelasId),
      loadMateri(kelasId),
      loadDailyActivity(kelasId),
    ]);
  };

  const loadSiswa = async (kelasId: string) => {
    const { data } = await supabase
      .from('v_siswa_summary')
      .select('*')
      .eq('kelas_id', kelasId);
    setSiswaList(data || []);

    // Hitung overview
    const list = data || [];
    const totalSiswa = list.length;
    const aktif7hari = list.filter((s: any) => {
      if (!s.last_active_at) return false;
      const diff = (Date.now() - new Date(s.last_active_at).getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }).length;
    const rataXP = totalSiswa > 0 ? Math.round(list.reduce((sum: number, s: any) => sum + (s.xp || 0), 0) / totalSiswa) : 0;
    const rataMateri = totalSiswa > 0 ? Math.round(list.reduce((sum: number, s: any) => sum + (s.total_materi_selesai || 0), 0) / totalSiswa * 10) / 10 : 0;
    const rataAccuracy = (() => {
      const totalAttempt = list.reduce((sum: number, s: any) => sum + (s.total_quiz_attempt || 0), 0);
      const totalBenar = list.reduce((sum: number, s: any) => sum + (s.total_quiz_benar || 0), 0);
      return totalAttempt > 0 ? Math.round(totalBenar / totalAttempt * 100) : 0;
    })();
    const perluPerhatian = list.filter((s: any) => {
      if (!s.last_active_at) return true;
      const diff = (Date.now() - new Date(s.last_active_at).getTime()) / (1000 * 60 * 60 * 24);
      return diff > 7;
    }).length;

    setOverview({ totalSiswa, aktif7hari, rataXP, rataMateri, rataAccuracy, perluPerhatian });
  };

  const loadMateri = async (kelasId: string) => {
    const { data } = await supabase
      .from('v_materi_analytics')
      .select('*')
      .eq('kelas_id', kelasId);
    setMateriList(data || []);
  };

  const loadDailyActivity = async (kelasId: string) => {
    const { data } = await supabase
      .from('v_daily_activity')
      .select('*')
      .eq('kelas_id', kelasId);

    // Group by date, sum active_users
    const map = new Map<string, number>();
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    (data || []).forEach((row: any) => {
      const date = row.activity_date;
      map.set(date, Math.max(map.get(date) || 0, row.active_users));
    });

    const chartData = last7.map(date => ({
      date: new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
      aktif: map.get(date) || 0,
    }));

    setDailyActivity(chartData);
  };

  const sortedSiswa = [...siswaList].sort((a, b) => {
    if (sortSiswa === 'xp') return (b.xp || 0) - (a.xp || 0);
    if (sortSiswa === 'materi') return (b.total_materi_selesai || 0) - (a.total_materi_selesai || 0);
    if (sortSiswa === 'quiz') {
      const accA = a.total_quiz_attempt > 0 ? a.total_quiz_benar / a.total_quiz_attempt : 0;
      const accB = b.total_quiz_attempt > 0 ? b.total_quiz_benar / b.total_quiz_attempt : 0;
      return accB - accA;
    }
    if (sortSiswa === 'streak') return (b.current_streak || 0) - (a.current_streak || 0);
    return 0;
  });

  const getSiswaStatus = (s: any) => {
    if (!s.last_active_at) return { label: 'Belum aktif', color: 'bg-gray-100 text-gray-600' };
    const diff = (Date.now() - new Date(s.last_active_at).getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 1) return { label: 'Aktif hari ini', color: 'bg-green-100 text-green-700' };
    if (diff <= 3) return { label: '1-3 hari lalu', color: 'bg-blue-100 text-blue-700' };
    if (diff <= 7) return { label: '4-7 hari lalu', color: 'bg-yellow-100 text-yellow-700' };
    return { label: `${Math.floor(diff)} hari lalu`, color: 'bg-red-100 text-red-700' };
  };

  const materiChartData = materiList
    .map(m => ({
      name: m.judul.length > 20 ? m.judul.substring(0, 20) + '...' : m.judul,
      dibaca: m.total_dibaca || 0,
      selesai: m.total_selesai || 0,
      dikuasai: m.total_dikuasai || 0,
    }))
    .slice(0, 8);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Memuat analytics...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/guru')} className="text-blue-600 text-sm">← Dashboard</button>
            <h1 className="text-xl font-bold">📊 Analytics Kelas</h1>
          </div>
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {kelasList.map(k => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard icon="👥" label="Total Siswa" value={overview.totalSiswa} color="blue" />
            <StatCard icon="✅" label="Aktif 7 Hari" value={overview.aktif7hari} color="green" />
            <StatCard icon="⚠️" label="Perlu Perhatian" value={overview.perluPerhatian} color="red" />
            <StatCard icon="⭐" label="Rata-rata XP" value={overview.rataXP} color="purple" />
            <StatCard icon="📚" label="Rata Materi Selesai" value={overview.rataMateri} color="indigo" />
            <StatCard icon="🎯" label="Akurasi Quiz" value={`${overview.rataAccuracy}%`} color="orange" />
          </div>
        )}

        {/* Grafik Aktivitas Harian */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">📈 Siswa Aktif 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip formatter={(val) => [`${val} siswa`, 'Aktif']} />
              <Bar dataKey="aktif" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'overview', label: '📊 Ringkasan' },
            { id: 'siswa', label: '👥 Per Siswa' },
            { id: 'materi', label: '📚 Per Materi' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Ringkasan */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Top 3 siswa */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">🏆 Top Siswa Kelas</h3>
              {sortedSiswa.slice(0, 5).map((s, i) => (
                <div key={s.siswa_id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{s.nama}</p>
                    <p className="text-xs text-gray-500">
                      {s.total_materi_selesai || 0} materi selesai · {s.current_streak || 0} hari streak
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{s.xp || 0} XP</p>
                    <p className="text-xs text-gray-500">Lvl {s.level || 1}</p>
                  </div>
                </div>
              ))}
              {siswaList.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Belum ada data siswa</p>}
            </div>

            {/* Siswa perlu perhatian */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">⚠️ Siswa yang Perlu Perhatian</h3>
              {sortedSiswa
                .filter(s => {
                  if (!s.last_active_at) return true;
                  const diff = (Date.now() - new Date(s.last_active_at).getTime()) / (1000 * 60 * 60 * 24);
                  return diff > 7;
                })
                .slice(0, 5)
                .map(s => {
                  const status = getSiswaStatus(s);
                  return (
                    <div key={s.siswa_id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <span className="text-2xl">😴</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{s.nama}</p>
                        <p className="text-xs text-gray-500">NIS: {s.nis_nip}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                  );
                })}
              {sortedSiswa.filter(s => {
                if (!s.last_active_at) return true;
                const diff = (Date.now() - new Date(s.last_active_at).getTime()) / (1000 * 60 * 60 * 24);
                return diff > 7;
              }).length === 0 && (
                <p className="text-green-600 text-sm text-center py-4">🎉 Semua siswa aktif minggu ini!</p>
              )}
            </div>
          </div>
        )}

        {/* Tab: Per Siswa */}
        {activeTab === 'siswa' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Sort bar */}
            <div className="p-4 border-b bg-gray-50 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Urutkan:</span>
              {[
                { id: 'xp', label: 'XP' },
                { id: 'materi', label: 'Materi Selesai' },
                { id: 'quiz', label: 'Akurasi Quiz' },
                { id: 'streak', label: 'Streak' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSortSiswa(s.id as any)}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    sortSiswa === s.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {siswaList.length === 0 ? (
              <p className="text-gray-500 text-center py-12">Belum ada data siswa di kelas ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Siswa</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">XP</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Level</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Materi Selesai</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Akurasi Quiz</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Streak 🔥</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedSiswa.map((s, i) => {
                      const accuracy = s.total_quiz_attempt > 0
                        ? Math.round(s.total_quiz_benar / s.total_quiz_attempt * 100)
                        : null;
                      const status = getSiswaStatus(s);
                      return (
                        <tr key={s.siswa_id} className={`hover:bg-gray-50 ${
                          !s.last_active_at || (Date.now() - new Date(s.last_active_at).getTime()) / (1000 * 60 * 60 * 24) > 7
                            ? 'bg-red-50/30'
                            : ''
                        }`}>
                          <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{s.nama}</p>
                            <p className="text-xs text-gray-500">{s.nis_nip}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-blue-600">{s.xp || 0}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Lvl {s.level || 1}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">{s.total_materi_selesai || 0}</span>
                              <span className="text-gray-400 text-xs">/ {s.total_materi_dibaca || 0}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {accuracy !== null ? (
                              <span className={`font-medium ${accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {accuracy}%
                              </span>
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-3 text-center font-medium">{s.current_streak || 0}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Per Materi */}
        {activeTab === 'materi' && (
          <div className="space-y-4">
            {/* Bar chart materi */}
            {materiChartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-4">📚 Engagement per Materi</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={materiChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="dibaca" name="Dibaca" fill="#93c5fd" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="selesai" name="Selesai" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="dikuasai" name="Dikuasai" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tabel materi */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {materiList.length === 0 ? (
                <p className="text-gray-500 text-center py-12">Belum ada materi di kelas ini.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Materi</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Dibaca</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Selesai</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Dikuasai</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Akurasi Quiz</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Completion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {materiList.map(m => {
                      const accuracy = m.total_quiz_attempt > 0
                        ? Math.round(m.total_quiz_benar / m.total_quiz_attempt * 100)
                        : null;
                      const totalSiswa = overview?.totalSiswa || 1;
                      const completionPct = Math.round((m.total_selesai || 0) / totalSiswa * 100);
                      return (
                        <tr key={m.materi_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{m.judul}</p>
                            <p className="text-xs text-gray-500">{m.mapel}{m.estimasi_menit ? ` · ${m.estimasi_menit} menit` : ''}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-medium">{m.total_dibaca || 0}</td>
                          <td className="px-4 py-3 text-center font-medium text-blue-600">{m.total_selesai || 0}</td>
                          <td className="px-4 py-3 text-center font-medium text-green-600">{m.total_dikuasai || 0}</td>
                          <td className="px-4 py-3 text-center">
                            {accuracy !== null ? (
                              <span className={`font-medium ${accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {accuracy}%
                              </span>
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-2">
                                <div
                                  className="bg-blue-500 rounded-full h-2 transition-all"
                                  style={{ width: `${Math.min(completionPct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8">{completionPct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    orange: 'bg-orange-50 text-orange-700',
  };
  return (
    <div className={`${colors[color]} rounded-xl p-4 text-center`}>
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80 mt-1">{label}</p>
    </div>
  );
}
