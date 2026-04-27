'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getLevelInfo } from '@/lib/gamification';

export default function SiswaDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    materiCount: 0,
    kuisCount: 0,
    pengumumanCount: 0,
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || u.role !== 'siswa') {
      router.push('/login');
      return;
    }
    setUser(u);

    if (u.kelas_id) {
      const [materiRes, kuisRes, pengumumanRes] = await Promise.all([
        supabase.from('materi').select('id', { count: 'exact', head: true }).eq('kelas_id', u.kelas_id),
        supabase.from('kuis').select('id', { count: 'exact', head: true }).eq('kelas_id', u.kelas_id),
        supabase.from('pengumuman').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        materiCount: materiRes.count || 0,
        kuisCount: kuisRes.count || 0,
        pengumumanCount: pengumumanRes.count || 0,
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) return <div className="p-8">Loading...</div>;

  const xp = user.xp || 0;
  const levelInfo = getLevelInfo(xp);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SANDEQ Siswa</h1>
            <p className="text-sm text-gray-500">Selamat belajar, {user.nama}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Gamification Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-4xl">
              {levelInfo.emoji}
            </div>
            <div className="flex-1">
              <p className="text-xs text-white/80">Level {levelInfo.level}</p>
              <p className="font-bold text-lg">{levelInfo.title}</p>
              <p className="text-sm text-white/90">⭐ {xp.toLocaleString()} XP</p>
            </div>
            {user.current_streak > 0 && (
              <div className="bg-orange-500/40 px-3 py-2 rounded-lg text-center">
                <div className="text-2xl">🔥</div>
                <div className="text-xs font-semibold">{user.current_streak} hari</div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-700">Materi</p>
            <p className="text-2xl font-bold text-blue-900">{stats.materiCount}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700">Kuis</p>
            <p className="text-2xl font-bold text-green-900">{stats.kuisCount}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-700">Pengumuman</p>
            <p className="text-2xl font-bold text-purple-900">{stats.pengumumanCount}</p>
          </div>
        </div>

        {/* Menu */}
        <h2 className="text-lg font-semibold mb-3">Menu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MenuCard
            icon="📚"
            title="Materi"
            description="Pelajari materi pelajaran"
            onClick={() => router.push('/siswa/materi')}
          />
          <MenuCard
            icon="✏️"
            title="Kuis"
            description="Kerjakan latihan & ulangan"
            onClick={() => router.push('/siswa/kuis')}
          />
          <MenuCard
            icon="📊"
            title="Nilai"
            description="Lihat nilai & rapor"
            onClick={() => router.push('/siswa/nilai')}
          />
          <MenuCard
            icon="📅"
            title="Absensi"
            description="Riwayat kehadiran"
            onClick={() => router.push('/siswa/absensi')}
          />
          <MenuCard
            icon="📢"
            title="Pengumuman"
            description="Info dari sekolah"
            onClick={() => router.push('/siswa/pengumuman')}
          />
          <MenuCard
            icon="💬"
            title="Forum"
            description="Diskusi dengan teman & guru"
            onClick={() => router.push('/forum')}
          />
          <MenuCard
            icon="⭐"
            title="Profil & Stats"
            description="XP, level, badges"
            onClick={() => router.push('/profil')}
            highlight
          />
          <MenuCard
            icon="🏆"
            title="Leaderboard"
            description="Ranking kelas"
            onClick={() => router.push('/siswa/leaderboard')}
            highlight
          />
        </div>
      </main>
    </div>
  );
}

function MenuCard({
  icon,
  title,
  description,
  onClick,
  highlight = false,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg shadow-sm hover:shadow-md transition text-left ${
        highlight
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-200'
          : 'bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}
