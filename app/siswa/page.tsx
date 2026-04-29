'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getLevelInfo } from '@/lib/gamification';
import { PageLoader } from '@/components/ui/Skeleton';

const menuItems: { icon: string; title: string; description: string; path: string; color: string; highlight?: boolean }[] = [
  { icon: '📚', title: 'Materi', description: 'Pelajari materi pelajaran', path: '/siswa/materi', color: 'text-blue-600 bg-blue-50' },
  { icon: '✏️', title: 'Kuis', description: 'Kerjakan latihan & ulangan', path: '/siswa/kuis', color: 'text-violet-600 bg-violet-50' },
  { icon: '📊', title: 'Nilai', description: 'Lihat nilai & rapor', path: '/siswa/nilai', color: 'text-emerald-600 bg-emerald-50' },
  { icon: '🗓️', title: 'Jadwal', description: 'Jadwal pelajaran harian', path: '/jadwal', color: 'text-indigo-600 bg-indigo-50' },
  { icon: '📅', title: 'Absensi', description: 'Riwayat kehadiran', path: '/siswa/absensi', color: 'text-amber-600 bg-amber-50' },
  { icon: '📢', title: 'Pengumuman', description: 'Info dari sekolah', path: '/siswa/pengumuman', color: 'text-rose-600 bg-rose-50' },
  { icon: '🔔', title: 'Notifikasi', description: 'Pengumuman & deadline kuis', path: '/siswa/notifikasi', color: 'text-amber-600 bg-amber-50' },
  { icon: '🤖', title: 'AI Tutor', description: 'Tanya AI, belajar 24/7', path: '/siswa/ai-tutor', color: 'text-purple-600 bg-purple-50' },
  { icon: '💬', title: 'Forum', description: 'Diskusi dengan teman & guru', path: '/forum', color: 'text-sky-600 bg-sky-50' },
  { icon: '⭐', title: 'Profil & Stats', description: 'XP, level, badges', path: '/profil', color: 'text-yellow-600 bg-yellow-50', highlight: true },
  { icon: '🏆', title: 'Leaderboard', description: 'Ranking kelas', path: '/siswa/leaderboard', color: 'text-orange-600 bg-orange-50', highlight: true },
]

export default function SiswaDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ materiCount: 0, kuisCount: 0, pengumumanCount: 0 });
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || u.role !== 'siswa') { router.push('/login'); return; }
    setUser(u);
    if (u.kelas_id) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString();
      const [materiRes, kuisRes, pengumumanRes, recentPengumuman, deadlineKuis] = await Promise.all([
        supabase.from('materi').select('id', { count: 'exact', head: true }).eq('kelas_id', u.kelas_id),
        supabase.from('kuis').select('id', { count: 'exact', head: true }).eq('kelas_id', u.kelas_id),
        supabase.from('pengumuman').select('id', { count: 'exact', head: true }),
        supabase.from('pengumuman').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('kuis').select('id', { count: 'exact', head: true }).eq('kelas_id', u.kelas_id).eq('aktif', true).lte('tanggal_selesai', threeDaysLater).gte('tanggal_selesai', new Date().toISOString()),
      ]);
      setStats({ materiCount: materiRes.count || 0, kuisCount: kuisRes.count || 0, pengumumanCount: pengumumanRes.count || 0 });
      setNotifCount((recentPengumuman.count || 0) + (deadlineKuis.count || 0));
    }
  };

  const handleLogout = async () => { await logout(); router.push('/login'); };

  if (!user) return <PageLoader />;

  const xp = user.xp || 0;
  const levelInfo = getLevelInfo(xp);
  const xpToNext = levelInfo.maxXp - xp;
  const xpProgress = Math.min(100, Math.round(((xp - levelInfo.minXp) / (levelInfo.maxXp - levelInfo.minXp)) * 100)) || 0;

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg font-bold">S</div>
            <div>
              <h1 className="font-bold text-lg leading-tight">SANDEQ</h1>
              <p className="text-blue-200 text-xs">Portal Siswa</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/siswa/notifikasi')}
              aria-label="Notifikasi" className="relative w-9 h-9 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center transition border border-white/20"
            >
              🔔
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
            <button onClick={handleLogout} aria-label="Keluar dari aplikasi" className="px-3 py-1.5 text-sm bg-white/15 hover:bg-white/25 rounded-lg transition border border-white/20">
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Gamification Hero Card */}
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-500 to-indigo-600 text-white rounded-3xl p-6 mb-5 shadow-xl overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -right-2 w-24 h-24 bg-white/5 rounded-full" />

          <div className="relative flex items-start gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
              {levelInfo.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs mb-0.5">Selamat belajar, {user.nama?.split(' ')[0]}!</p>
              <p className="font-bold text-xl leading-tight">{levelInfo.title}</p>
              <p className="text-white/80 text-sm">Level {levelInfo.level} · {xp.toLocaleString()} XP</p>

              {/* XP Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>Progress ke Level {levelInfo.level + 1}</span>
                  <span>{xpToNext > 0 ? `${xpToNext} XP lagi` : 'Max!'}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>
            </div>
            {user.current_streak > 0 && (
              <div className="bg-orange-500/30 border border-orange-400/30 px-3 py-2 rounded-xl text-center flex-shrink-0">
                <div className="text-2xl">🔥</div>
                <div className="text-xs font-bold">{user.current_streak}</div>
                <div className="text-xs text-white/60">hari</div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Materi', value: stats.materiCount, icon: '📚', color: 'text-[#1A4A7A]' },
            { label: 'Kuis', value: stats.kuisCount, icon: '✏️', color: 'text-[#2E86C1]' },
            { label: 'Pengumuman', value: stats.pengumumanCount, icon: '📢', color: 'text-[#E74C3C]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
              <span className="text-xl">{s.icon}</span>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Menu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              aria-label={item.title}
              className={`group flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                item.highlight
                  ? 'bg-gradient-to-r from-[#fef3e2] to-[#fef9ee] border-2 border-[#F39C12]/30 shadow-sm'
                  : 'bg-white border border-slate-100 shadow-sm hover:border-[#2E86C1]/30'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${item.color}`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{item.description}</p>
              </div>
              <span className="ml-auto text-slate-300 group-hover:text-[#2E86C1] transition text-lg">›</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
