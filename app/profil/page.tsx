'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getUserStats, UserStats, LEVELS } from '@/lib/gamification';
import { supabase } from '@/lib/supabase';

export default function SiswaProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'badges' | 'history'>('stats');
  const [hideFromLb, setHideFromLb] = useState(false);
  const [xpHistory, setXpHistory] = useState<any[]>([]);

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
    setHideFromLb(u.hide_from_leaderboard || false);

    const userStats = await getUserStats(u.id);
    setStats(userStats);

    const { data: badges } = await supabase
      .from('badges')
      .select('*')
      .order('rarity', { ascending: true });
    setAllBadges(badges || []);

    const { data: history } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', u.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setXpHistory(history || []);

    setLoading(false);
  };

  const toggleLeaderboard = async () => {
    const newValue = !hideFromLb;
    setHideFromLb(newValue);
    await supabase
      .from('users')
      .update({ hide_from_leaderboard: newValue })
      .eq('id', user.id);
  };

  if (loading || !stats) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const rarityColors: Record<string, string> = {
    common: 'bg-gray-100 text-gray-700 border-gray-300',
    rare: 'bg-blue-100 text-blue-700 border-blue-300',
    epic: 'bg-purple-100 text-purple-700 border-purple-300',
    legendary: 'bg-gradient-to-br from-yellow-100 to-orange-100 text-orange-800 border-orange-300',
  };

  const rarityIcon: Record<string, string> = {
    common: '🥉',
    rare: '🥈',
    epic: '🥇',
    legendary: '💎',
  };

  const userBadgeIds = new Set(stats.badges.map((b: any) => b.badge_id));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/siswa')} className="text-blue-600 text-sm">
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold">Profil Saya</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl">
              {stats.levelInfo.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold truncate">{user.nama}</h2>
              <p className="text-white/80 text-sm">NIS: {user.nis_nip}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                  Lvl {stats.level} • {stats.levelInfo.title}
                </span>
                {stats.currentStreak > 0 && (
                  <span className="bg-orange-500/40 px-3 py-1 rounded-full text-sm font-semibold">
                    🔥 {stats.currentStreak} hari
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1">
              <span>{stats.xp.toLocaleString()} XP</span>
              {stats.nextLevel && (
                <span>Next: {stats.nextLevel.title} ({stats.nextLevel.minXp.toLocaleString()} XP)</span>
              )}
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 transition-all duration-500"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
            {stats.nextLevel ? (
              <p className="text-xs text-white/80 mt-1">
                {stats.nextLevel.minXp - stats.xp} XP lagi untuk level {stats.nextLevel.level}!
              </p>
            ) : (
              <p className="text-xs text-yellow-300 mt-1 font-semibold">
                🌟 MAX LEVEL REACHED — Legenda Sandeq!
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon="📚" label="Materi Dibaca" value={stats.totalMateriRead} />
          <StatCard icon="✅" label="Materi Selesai" value={stats.totalMateriCompleted} />
          <StatCard icon="🎯" label="Quiz Benar" value={stats.totalQuizCorrect} />
          <StatCard icon="🏆" label="Mastery" value={stats.totalMastered} />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b">
            <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="📊 Stats" />
            <TabButton
              active={activeTab === 'badges'}
              onClick={() => setActiveTab('badges')}
              label={`🏅 Badges (${stats.totalBadges})`}
            />
            <TabButton
              active={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              label="📜 Riwayat"
            />
          </div>

          <div className="p-4">
            {activeTab === 'stats' && (
              <div className="space-y-4">
                <StatRow label="Streak Saat Ini" value={`🔥 ${stats.currentStreak} hari`} />
                <StatRow label="Streak Terpanjang" value={`💎 ${stats.longestStreak} hari`} />
                <StatRow label="Total XP" value={`⭐ ${stats.xp.toLocaleString()} XP`} />
                <StatRow label="Level" value={`${stats.levelInfo.emoji} Level ${stats.level}`} />
                <StatRow
                  label="Akurasi Quiz"
                  value={
                    stats.totalQuizAttempted > 0
                      ? `${Math.round((stats.totalQuizCorrect / stats.totalQuizAttempted) * 100)}%`
                      : '-'
                  }
                />
                <StatRow label="Total Badge" value={`🏅 ${stats.totalBadges}`} />

                <div className="pt-4 border-t">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideFromLb}
                      onChange={toggleLeaderboard}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-sm">Sembunyikan dari leaderboard kelas</div>
                      <div className="text-xs text-gray-500">
                        Profilmu tidak akan muncul di ranking kelas
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'badges' && (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  {stats.totalBadges} dari {allBadges.length} badge tersedia
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {allBadges.map((badge) => {
                    const owned = userBadgeIds.has(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`relative p-3 rounded-lg border-2 text-center transition ${
                          owned
                            ? rarityColors[badge.rarity]
                            : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60'
                        }`}
                        title={`${badge.name} - ${badge.description}`}
                      >
                        <div className={`text-3xl mb-1 ${!owned ? 'grayscale' : ''}`}>
                          {owned ? badge.icon : '🔒'}
                        </div>
                        <div className="text-xs font-semibold truncate">{badge.name}</div>
                        <div className="text-[10px] mt-1 capitalize">
                          {rarityIcon[badge.rarity]} {badge.rarity}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-2">
                {xpHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Belum ada aktivitas</p>
                ) : (
                  xpHistory.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.reason}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div
                        className={`font-bold text-sm flex-shrink-0 ml-2 ${
                          tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount} XP
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* All Levels preview */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold mb-3">🎖️ Semua Level</h3>
          <div className="space-y-2">
            {LEVELS.map((lvl) => {
              const reached = stats.level >= lvl.level;
              return (
                <div
                  key={lvl.level}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    reached ? 'bg-blue-50' : 'bg-gray-50 opacity-50'
                  }`}
                >
                  <div className="text-2xl">{lvl.emoji}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      Lvl {lvl.level} • {lvl.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {lvl.minXp.toLocaleString()} XP
                      {lvl.maxXp < 999999 && ` - ${lvl.maxXp.toLocaleString()} XP`}
                    </div>
                  </div>
                  {reached && <span className="text-green-600 text-sm">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-semibold text-sm">{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium transition ${
        active ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}
