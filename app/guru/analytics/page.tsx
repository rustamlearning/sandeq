'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Crown,
  LineChart,
  Users,
  Star,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

export default function GuruAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [loading, setLoading] = useState(true);

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
    if (!u || (u.role !== 'guru' && u.role !== 'admin')) { router.push('/login'); return; }
    setUser(u);
    let query = supabase.from('kelas').select('*').order('tingkat');
    const { data: kelas } = await query;
    setKelasList(kelas || []);
    if (kelas && kelas.length > 0) setSelectedKelas(kelas[0].id);
    setLoading(false);
  };

  const loadData = async (kelasId: string) => {
    await Promise.all([loadSiswa(kelasId), loadMateri(kelasId), loadDailyActivity(kelasId)]);
  };

  const loadSiswa = async (kelasId: string) => {
    const { data } = await supabase.from('v_siswa_summary').select('*').eq('kelas_id', kelasId);
    setSiswaList(data || []);
    const list = data || [];
    const totalSiswa = list.length;
    const aktif7hari = list.filter((s: any) => {
      if (!s.last_active_at) return false;
      return (Date.now() - new Date(s.last_active_at).getTime()) / 86400000 <= 7;
    }).length;
    const rataXP = totalSiswa > 0 ? Math.round(list.reduce((s: number, r: any) => s + (r.xp || 0), 0) / totalSiswa) : 0;
    const rataMateri = totalSiswa > 0 ? Math.round(list.reduce((s: number, r: any) => s + (r.total_materi_selesai || 0), 0) / totalSiswa * 10) / 10 : 0;
    const totalAttempt = list.reduce((s: number, r: any) => s + (r.total_quiz_attempt || 0), 0);
    const totalBenar = list.reduce((s: number, r: any) => s + (r.total_quiz_benar || 0), 0);
    const rataAccuracy = totalAttempt > 0 ? Math.round(totalBenar / totalAttempt * 100) : 0;
    const perluPerhatian = list.filter((s: any) => {
      if (!s.last_active_at) return true;
      return (Date.now() - new Date(s.last_active_at).getTime()) / 86400000 > 7;
    }).length;
    setOverview({ totalSiswa, aktif7hari, rataXP, rataMateri, rataAccuracy, perluPerhatian });
  };

  const loadMateri = async (kelasId: string) => {
    const { data } = await supabase.from('v_materi_analytics').select('*').eq('kelas_id', kelasId);
    setMateriList(data || []);
  };

  const loadDailyActivity = async (kelasId: string) => {
    const { data } = await supabase.from('v_daily_activity').select('*').eq('kelas_id', kelasId);
    const map = new Map<string, number>();
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    (data || []).forEach((row: any) => map.set(row.activity_date, Math.max(map.get(row.activity_date) || 0, row.active_users)));
    setDailyActivity(last7.map(date => ({
      date: new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
      aktif: map.get(date) || 0,
    })));
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
    if (!s.last_active_at) return { label: 'Belum aktif', color: 'bg-slate-100 text-slate-500' };
    const diff = (Date.now() - new Date(s.last_active_at).getTime()) / 86400000;
    if (diff <= 1) return { label: 'Aktif hari ini', color: 'bg-emerald-100 text-emerald-700' };
    if (diff <= 3) return { label: '1-3 hari lalu', color: 'bg-blue-100 text-blue-700' };
    if (diff <= 7) return { label: '4-7 hari lalu', color: 'bg-amber-100 text-amber-700' };
    return { label: `${Math.floor(diff)} hari lalu`, color: 'bg-red-100 text-red-600' };
  };

  const materiChartData = materiList.map(m => ({
    name: m.judul.length > 18 ? m.judul.substring(0, 18) + '…' : m.judul,
    dibaca: m.total_dibaca || 0,
    selesai: m.total_selesai || 0,
    dikuasai: m.total_dikuasai || 0,
  })).slice(0, 8);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Memuat analytics...</p>
      </div>
    </div>
  );

  const statCards = overview ? [
    { icon: Users, label: 'Total Siswa', value: overview.totalSiswa, sub: 'terdaftar', accent: 'border-blue-400 bg-blue-50', val: 'text-blue-700' },
    { icon: CheckCircle2, label: 'Aktif 7 Hari', value: overview.aktif7hari, sub: 'siswa', accent: 'border-emerald-400 bg-emerald-50', val: 'text-emerald-700' },
    { icon: AlertTriangle, label: 'Perlu Perhatian', value: overview.perluPerhatian, sub: 'siswa', accent: 'border-red-400 bg-red-50', val: 'text-red-600' },
    { icon: Star, label: 'Rata-rata XP', value: overview.rataXP, sub: 'XP/siswa', accent: 'border-violet-400 bg-violet-50', val: 'text-violet-700' },
    { icon: BookOpen, label: 'Rata Materi', value: overview.rataMateri, sub: 'selesai/siswa', accent: 'border-indigo-400 bg-indigo-50', val: 'text-indigo-700' },
    { icon: Target, label: 'Akurasi Quiz', value: `${overview.rataAccuracy}%`, sub: 'rata-rata', accent: 'border-amber-400 bg-amber-50', val: 'text-amber-700' },
  ] satisfies Array<{ icon: LucideIcon; label: string; value: any; sub: string; accent: string; val: string }> : [];

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white sticky top-0 z-20 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/guru')}
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm transition"
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>
            <span className="text-white/30">|</span>
            <h1 className="inline-flex items-center gap-2 text-lg font-bold"><BarChart3 size={18} /> Analytics Kelas</h1>
          </div>
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="bg-white/15 border border-white/25 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            {kelasList.map(k => <option key={k.id} value={k.id} className="text-slate-800">{k.nama}</option>)}
          </select>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stat Cards */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {statCards.map((s) => (
              <div key={s.label} className={`${s.accent} rounded-xl p-4 text-center`}>
                <s.icon className={`mx-auto mb-1 ${s.val}`} size={22} />
                <p className={`text-2xl font-bold ${s.val}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
                <p className="text-xs text-slate-400">{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5">
          <h3 className="inline-flex items-center gap-2 font-semibold text-slate-800 mb-1"><LineChart size={17} /> Siswa Aktif 7 Hari Terakhir</h3>
          <p className="text-xs text-slate-400 mb-4">Jumlah siswa yang aktif belajar per hari</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyActivity} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }}
                formatter={(val) => [`${val} siswa`, 'Aktif']}
              />
              <Bar dataKey="aktif" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm w-fit">
          {[
            { id: 'overview', label: 'Ringkasan' },
            { id: 'siswa', label: 'Per Siswa' },
            { id: 'materi', label: 'Per Materi' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Ringkasan */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Crown size={17} /> <span>Top Siswa Kelas</span>
              </h3>
              {sortedSiswa.slice(0, 5).map((s, i) => (
                <div key={s.siswa_id} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-slate-100 text-slate-500' :
                    i === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-50 text-blue-500'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{s.nama}</p>
                    <p className="text-xs text-slate-400">{s.total_materi_selesai || 0} materi · {s.current_streak || 0} hari streak</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600 text-sm">{(s.xp || 0).toLocaleString()} XP</p>
                    <p className="text-xs text-slate-400">Lvl {s.level || 1}</p>
                  </div>
                </div>
              ))}
              {siswaList.length === 0 && <p className="text-slate-400 text-sm text-center py-6">Belum ada data siswa</p>}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={17} /> <span>Siswa yang Perlu Perhatian</span>
              </h3>
              {sortedSiswa.filter(s => {
                if (!s.last_active_at) return true;
                return (Date.now() - new Date(s.last_active_at).getTime()) / 86400000 > 7;
              }).slice(0, 5).map(s => {
                const status = getSiswaStatus(s);
                return (
                  <div key={s.siswa_id} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
                    <span className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0"><AlertTriangle size={15} /></span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{s.nama}</p>
                      <p className="text-xs text-slate-400">NIS: {s.nis_nip}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
                  </div>
                );
              })}
              {sortedSiswa.filter(s => {
                if (!s.last_active_at) return true;
                return (Date.now() - new Date(s.last_active_at).getTime()) / 86400000 > 7;
              }).length === 0 && (
                <p className="text-emerald-600 text-sm text-center py-6">Semua siswa aktif minggu ini</p>
              )}
            </div>
          </div>
        )}

        {/* Tab: Per Siswa */}
        {activeTab === 'siswa' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 flex-wrap bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Urutkan:</span>
              {[
                { id: 'xp', label: 'XP' },
                { id: 'materi', label: 'Materi' },
                { id: 'quiz', label: 'Akurasi Quiz' },
                { id: 'streak', label: 'Streak' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSortSiswa(s.id as any)}
                  className={`px-3 py-1.5 text-xs rounded-xl font-medium transition ${
                    sortSiswa === s.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {siswaList.length === 0 ? (
              <p className="text-slate-400 text-center py-12 text-sm">Belum ada data siswa di kelas ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['#', 'Siswa', 'XP', 'Level', 'Materi', 'Quiz', 'Streak', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSiswa.map((s, i) => {
                      const accuracy = s.total_quiz_attempt > 0 ? Math.round(s.total_quiz_benar / s.total_quiz_attempt * 100) : null;
                      const status = getSiswaStatus(s);
                      const inactive = !s.last_active_at || (Date.now() - new Date(s.last_active_at).getTime()) / 86400000 > 7;
                      return (
                        <tr key={s.siswa_id} className={`border-b border-slate-50 last:border-0 transition ${inactive ? 'bg-red-50/30' : 'hover:bg-slate-50'}`}>
                          <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">{s.nama}</p>
                            <p className="text-xs text-slate-400">{s.nis_nip}</p>
                          </td>
                          <td className="px-4 py-3 font-bold text-blue-600">{(s.xp || 0).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">Lvl {s.level || 1}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-700">{s.total_materi_selesai || 0}</span>
                            <span className="text-slate-300 text-xs"> / {s.total_materi_dibaca || 0}</span>
                          </td>
                          <td className="px-4 py-3">
                            {accuracy !== null ? (
                              <span className={`font-semibold ${accuracy >= 80 ? 'text-emerald-600' : accuracy >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                                {accuracy}%
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{s.current_streak || 0}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
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
            {materiChartData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h3 className="inline-flex items-center gap-2 font-semibold text-slate-800 mb-4"><BookOpen size={17} /> Engagement per Materi</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={materiChartData} layout="vertical" barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={130} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="dibaca" name="Dibaca" fill="#93c5fd" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="selesai" name="Selesai" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="dikuasai" name="Dikuasai" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {materiList.length === 0 ? (
                <p className="text-slate-400 text-center py-12 text-sm">Belum ada materi di kelas ini.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Materi', 'Dibaca', 'Selesai', 'Dikuasai', 'Akurasi Quiz', 'Completion'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {materiList.map(m => {
                      const accuracy = m.total_quiz_attempt > 0 ? Math.round(m.total_quiz_benar / m.total_quiz_attempt * 100) : null;
                      const completionPct = Math.round((m.total_selesai || 0) / Math.max(overview?.totalSiswa || 1, 1) * 100);
                      return (
                        <tr key={m.materi_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">{m.judul}</p>
                            <p className="text-xs text-slate-400">{m.mapel}{m.estimasi_menit ? ` · ${m.estimasi_menit} mnt` : ''}</p>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-600">{m.total_dibaca || 0}</td>
                          <td className="px-4 py-3 font-semibold text-blue-600">{m.total_selesai || 0}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-600">{m.total_dikuasai || 0}</td>
                          <td className="px-4 py-3">
                            {accuracy !== null ? (
                              <span className={`font-semibold ${accuracy >= 80 ? 'text-emerald-600' : accuracy >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                                {accuracy}%
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-2">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full h-2 transition-all" style={{ width: `${Math.min(completionPct, 100)}%` }} />
                              </div>
                              <span className="text-xs text-slate-500 w-8 text-right">{completionPct}%</span>
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
