'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getLevelInfo } from '@/lib/gamification';
import { PageLoader } from '@/components/ui/Skeleton';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Flame,
  LogOut,
  Megaphone,
  MessageSquare,
  Sparkles,
  Trophy,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const menuItems: { icon: LucideIcon; title: string; description: string; path: string; color: string; highlight?: boolean }[] = [
  { icon: BookOpen, title: 'Materi', description: 'Lanjutkan bahan belajar kelas', path: '/siswa/materi', color: 'text-blue-700 bg-blue-50 ring-blue-100' },
  { icon: ClipboardList, title: 'Kuis', description: 'Kerjakan latihan dan ulangan', path: '/siswa/kuis', color: 'text-violet-700 bg-violet-50 ring-violet-100' },
  { icon: BarChart3, title: 'Nilai', description: 'Pantau nilai dan rapor', path: '/siswa/nilai', color: 'text-emerald-700 bg-emerald-50 ring-emerald-100' },
  { icon: CalendarDays, title: 'Jadwal', description: 'Lihat pelajaran hari ini', path: '/jadwal', color: 'text-indigo-700 bg-indigo-50 ring-indigo-100' },
  { icon: CalendarCheck, title: 'Absensi', description: 'Riwayat kehadiran', path: '/siswa/absensi', color: 'text-amber-700 bg-amber-50 ring-amber-100' },
  { icon: Megaphone, title: 'Pengumuman', description: 'Info penting sekolah', path: '/siswa/pengumuman', color: 'text-rose-700 bg-rose-50 ring-rose-100' },
  { icon: Bell, title: 'Notifikasi', description: 'Deadline dan kabar terbaru', path: '/siswa/notifikasi', color: 'text-orange-700 bg-orange-50 ring-orange-100' },
  { icon: Bot, title: 'AI Tutor', description: 'Tanya materi saat buntu', path: '/siswa/ai-tutor', color: 'text-purple-700 bg-purple-50 ring-purple-100' },
  { icon: MessageSquare, title: 'Forum', description: 'Diskusi dengan kelas', path: '/forum', color: 'text-sky-700 bg-sky-50 ring-sky-100' },
  { icon: UserRound, title: 'Profil & Stats', description: 'XP, level, dan badge', path: '/profil', color: 'text-yellow-700 bg-yellow-50 ring-yellow-100', highlight: true },
  { icon: Trophy, title: 'Leaderboard', description: 'Peringkat belajar kelas', path: '/siswa/leaderboard', color: 'text-orange-700 bg-orange-50 ring-orange-100', highlight: true },
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
        supabase.from('kuis').select('id', { count: 'exact', head: true }).eq('kelas_id', u.kelas_id).eq('is_published', true).lte('tanggal_selesai', threeDaysLater).gte('tanggal_selesai', new Date().toISOString()),
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
    <div className="app-canvas">
      <header className="border-b border-white/70 bg-white/78 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A4A7A] rounded-lg flex items-center justify-center text-sm font-semibold text-white shadow-sm">S</div>
            <div>
              <h1 className="font-semibold text-lg leading-tight text-slate-950">SANDEQ</h1>
              <p className="text-slate-500 text-xs">Portal Siswa</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/siswa/notifikasi')}
              aria-label="Notifikasi" className="relative w-9 h-9 bg-white hover:bg-slate-50 rounded-md flex items-center justify-center transition border border-slate-200 text-slate-700 shadow-sm"
            >
              <Bell size={17} />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
            <button onClick={handleLogout} aria-label="Keluar dari aplikasi" className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white hover:bg-slate-50 rounded-md transition border border-slate-200 text-slate-700 shadow-sm">
              <LogOut size={15} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 lg:py-8">
        <section className="mb-5">
          <p className="text-sm font-medium text-slate-500">Selamat belajar, {user.nama?.split(' ')[0]}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-[-0.01em] text-slate-950">Ruang belajar hari ini</h2>
        </section>

        <section className="surface-card relative overflow-hidden rounded-lg p-6 mb-5">
          <div className="absolute inset-x-0 bottom-0 h-px bg-[#f0b45b]/70" />
          <div className="relative grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[#1A4A7A] rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <Sparkles size={25} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-500">Level {levelInfo.level} · {xp.toLocaleString()} XP</p>
                <p className="font-semibold text-2xl leading-tight text-slate-950">{levelInfo.title}</p>

                <div className="mt-4 max-w-xl">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Progress ke Level {levelInfo.level + 1}</span>
                    <span>{xpToNext > 0 ? `${xpToNext} XP lagi` : 'Level maksimum'}</span>
                  </div>
                  <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1A4A7A] rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>
            {user.current_streak > 0 && (
              <div className="hairline-card rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-700 ring-1 ring-orange-100">
                    <Flame size={19} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-950">{user.current_streak}</p>
                    <p className="text-xs text-slate-500">hari belajar beruntun</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Materi', value: stats.materiCount, icon: BookOpen, color: 'text-[#1A4A7A]' },
            { label: 'Kuis', value: stats.kuisCount, icon: ClipboardList, color: 'text-[#2E86C1]' },
            { label: 'Pengumuman', value: stats.pengumumanCount, icon: Megaphone, color: 'text-[#E67E22]' },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="hairline-card rounded-lg p-4 text-center">
                <Icon className={`mx-auto h-5 w-5 ${s.color}`} />
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            )
          })}
        </section>

        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Aktivitas belajar</h2>
            <p className="text-sm text-slate-500">Pilih alur yang ingin dikerjakan.</p>
          </div>
        </div>
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                aria-label={item.title}
                className={`group flex items-center gap-4 rounded-lg p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] ${
                  item.highlight
                    ? 'bg-[#fff8ec] border border-[#f0b45b]/35 shadow-sm'
                    : 'bg-white/90 border border-white/80 shadow-sm hover:border-[#2E86C1]/30'
                }`}
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ${item.color}`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:text-[#2E86C1]" />
              </button>
            )
          })}
        </section>
      </main>
    </div>
  );
}
