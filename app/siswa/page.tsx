'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getLevelInfo } from '@/lib/gamification';
import { PageLoader } from '@/components/ui/Skeleton';
import DailyCheckIn from '@/components/DailyCheckIn';
import React from 'react';
import {
  BookOpen, ClipboardList, BarChart3, CalendarDays, CalendarCheck,
  Megaphone, Bell, Bot, MessageSquare, UserRound, Trophy, Zap, ChevronRight
} from 'lucide-react';

const menuGroups = [
  {
    label: 'Belajar',
    color: 'indigo',
    items: [
      { icon: BookOpen, title: 'Materi', description: 'Lanjutkan bahan belajar', path: '/siswa/materi', bg: 'bg-indigo-500' },
      { icon: ClipboardList, title: 'Kuis', description: 'Latihan & ulangan', path: '/siswa/kuis', bg: 'bg-violet-500' },
      { icon: BarChart3, title: 'Nilai', description: 'Pantau nilai & rapor', path: '/siswa/nilai', bg: 'bg-blue-500' },
      { icon: Bot, title: 'AI Tutor', description: 'Tanya saat buntu', path: '/siswa/ai-tutor', bg: 'bg-purple-500' },
    ]
  },
  {
    label: 'Kompetisi',
    color: 'amber',
    items: [
      { icon: Trophy, title: 'Leaderboard', description: 'Peringkat belajar kelas', path: '/siswa/leaderboard', bg: 'bg-amber-500' },
      { icon: Zap, title: 'Olimpiade', description: 'Mode kompetisi & lomba', path: '/siswa/olimpiade', bg: 'bg-orange-500' },
      { icon: Bot, title: 'KKA', description: 'Kecerdasan Artifisial', path: '/siswa/kka', bg: 'bg-pink-500' },
      { icon: MessageSquare, title: 'Koding', description: 'Belajar Python dari nol', path: '/siswa/koding', bg: 'bg-cyan-500' },
    ]
  },
  {
    label: 'Sekolah',
    color: 'slate',
    items: [
      { icon: CalendarDays, title: 'Jadwal', description: 'Pelajaran hari ini', path: '/jadwal', bg: 'bg-teal-500' },
      { icon: CalendarCheck, title: 'Absensi', description: 'Riwayat kehadiran', path: '/siswa/absensi', bg: 'bg-green-500' },
      { icon: Megaphone, title: 'Pengumuman', description: 'Info penting sekolah', path: '/siswa/pengumuman', bg: 'bg-rose-500' },
      { icon: BookOpen, title: 'Muatan Lokal', description: 'Budaya & potensi Sulsel', path: '/siswa/muatan-lokal', bg: 'bg-emerald-500' },
    ]
  },
  {
    label: 'Sosial',
    color: 'sky',
    items: [
      { icon: MessageSquare, title: 'Forum', description: 'Diskusi dengan kelas', path: '/forum', bg: 'bg-sky-500' },
      { icon: Bell, title: 'Notifikasi', description: 'Deadline & kabar terbaru', path: '/siswa/notifikasi', bg: 'bg-red-500' },
      { icon: UserRound, title: 'Profil & Stats', description: 'XP, level, dan badge', path: '/profil', bg: 'bg-indigo-400' },
    ]
  },
];

export default function SiswaDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ materiCount: 0, kuisCount: 0, pengumumanCount: 0 });
  const [notifCount, setNotifCount] = useState(0);
  const [showCheckIn, setShowCheckIn] = useState(true);

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
  const firstName = user.nama?.split(' ')[0] || 'Siswa';

  return (
    <>
      {showCheckIn && (
        <DailyCheckIn
          userId={user.id}
          onSelesai={() => setShowCheckIn(false)}
          onSkip={() => setShowCheckIn(false)}
        />
      )}

      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

        {/* ── HERO SECTION ── */}
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #6366f1 100%)' }}>
          {/* decorative blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', transform: 'translate(-30%, 30%)' }} />

          {/* Navbar */}
          <div className="relative max-w-2xl mx-auto px-4 pt-5 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center font-black text-white text-sm">S</div>
              <div>
                <p className="font-black text-white text-base leading-none">SANDEQ</p>
                <p className="text-indigo-300 text-[10px] leading-none mt-0.5">Portal Siswa</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/siswa/notifikasi')} className="relative w-9 h-9 bg-white/15 hover:bg-white/25 rounded-xl flex items-center justify-center transition-all text-base border border-white/20">
                🔔
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>
              <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-xl transition border border-white/20 text-white">
                Keluar
              </button>
            </div>
          </div>

          {/* Hero Card */}
          <div className="relative max-w-2xl mx-auto px-4 pt-4 pb-8">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center text-3xl shadow-lg">
                  {levelInfo.emoji}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow">
                  Lv{levelInfo.level}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-indigo-300 text-xs mb-0.5">Selamat belajar 👋</p>
                <h1 className="text-white font-black text-xl leading-tight truncate">{firstName}</h1>
                <p className="text-indigo-200 text-xs mt-0.5">{levelInfo.title} · {xp.toLocaleString()} XP</p>

                {/* XP Bar */}
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-indigo-300 mb-1">
                    <span>Level {levelInfo.level + 1}</span>
                    <span>{xpToNext > 0 ? `${xpToNext} XP lagi` : '🎉 Max!'}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${xpProgress}%`, background: 'linear-gradient(90deg, #fbbf24, #f97316)' }} />
                  </div>
                </div>
              </div>

              {/* Streak */}
              {(user.current_streak || 0) > 0 && (
                <div className="flex-shrink-0 bg-white/15 border border-white/20 rounded-2xl px-3 py-2.5 text-center backdrop-blur">
                  <div className="text-2xl">🔥</div>
                  <div className="text-white font-black text-sm leading-none">{user.current_streak}</div>
                  <div className="text-indigo-300 text-[10px] mt-0.5">hari</div>
                </div>
              )}
            </div>

            {/* Stat Pills */}
            <div className="flex gap-2 mt-5">
              {[
                { label: 'Materi', value: stats.materiCount, emoji: '📚' },
                { label: 'Kuis', value: stats.kuisCount, emoji: '✏️' },
                { label: 'Pengumuman', value: stats.pengumumanCount, emoji: '📢' },
              ].map(s => (
                <div key={s.label} className="flex-1 bg-white/10 backdrop-blur border border-white/15 rounded-2xl py-2.5 text-center">
                  <div className="text-base">{s.emoji}</div>
                  <div className="text-white font-black text-lg leading-none mt-0.5">{s.value}</div>
                  <div className="text-indigo-300 text-[10px] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Wave */}
          <svg viewBox="0 0 1440 32" className="w-full block" style={{ marginBottom: -1 }} preserveAspectRatio="none">
            <path d="M0,20 C360,40 1080,0 1440,20 L1440,32 L0,32 Z" fill="var(--bg)" />
          </svg>
        </div>

        {/* ── MENU GROUPS ── */}
        <main className="max-w-2xl mx-auto px-4 py-5 space-y-6">
          {menuGroups.map(group => (
            <section key={group.label}>
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-3)' }}>
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {group.items.map(item => (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className="group relative flex flex-col gap-3 p-4 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                      <item.icon size={18} strokeWidth={2.5} />
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm leading-tight" style={{ color: 'var(--text-1)' }}>{item.title}</h3>
                      <p className="text-xs mt-0.5 leading-tight truncate" style={{ color: 'var(--text-3)' }}>{item.description}</p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight size={14} className="absolute top-4 right-4 opacity-30 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--primary)' }} />
                  </button>
                ))}
              </div>
            </section>
          ))}

          <p className="text-center text-xs pb-4" style={{ color: 'var(--text-3)' }}>
            SANDEQ · SMAN 6 Pangkep
          </p>
        </main>
      </div>
    </>
  );
}
