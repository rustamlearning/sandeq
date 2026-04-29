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
  const [activeTab, setActiveTab] = useState<'stats' | 'badges' | 'history' | 'password'>('stats');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [hideFromLb, setHideFromLb] = useState(false);
  const [xpHistory, setXpHistory] = useState<any[]>([]);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || u.role !== 'siswa') { router.push('/login'); return; }
    setUser(u);
    setHideFromLb(u.hide_from_leaderboard || false);

    const userStats = await getUserStats(u.id);
    setStats(userStats);

    const { data: badges } = await supabase.from('badges').select('*').order('rarity', { ascending: true });
    setAllBadges(badges || []);

    const { data: history } = await supabase
      .from('xp_transactions').select('*').eq('user_id', u.id)
      .order('created_at', { ascending: false }).limit(30);
    setXpHistory(history || []);
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) { setPasswordMsg({ type: 'error', text: 'Password minimal 6 karakter.' }); return }
    if (newPassword !== confirmPassword) { setPasswordMsg({ type: 'error', text: 'Konfirmasi password tidak cocok.' }); return }
    setChangingPassword(true)
    setPasswordMsg(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)
    if (error) { setPasswordMsg({ type: 'error', text: error.message }); return }
    setPasswordMsg({ type: 'success', text: 'Password berhasil diubah!' })
    setNewPassword('')
    setConfirmPassword('')
  }

  const toggleLeaderboard = async () => {
    const newValue = !hideFromLb;
    setHideFromLb(newValue);
    await supabase.from('users').update({ hide_from_leaderboard: newValue }).eq('id', user.id);
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Memuat profil...</p>
        </div>
      </div>
    );
  }

  const rarityColors: Record<string, string> = {
    common: 'bg-gray-100 text-gray-700 border-gray-200',
    rare: 'bg-blue-100 text-blue-700 border-blue-200',
    epic: 'bg-purple-100 text-purple-700 border-purple-200',
    legendary: 'bg-gradient-to-br from-yellow-50 to-orange-50 text-orange-700 border-orange-200',
  };

  const userBadgeIds = new Set(stats.badges.map((b: any) => b.badge_id));

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#1A4A7A] to-[#2E86C1] text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/siswa')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-bold"
          >
            ←
          </button>
          <h1 className="text-lg font-bold">Profil Saya</h1>
        </div>

        {/* Hero card */}
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
              {stats.levelInfo.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black truncate">{user.nama}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-semibold">
                  Lv {stats.level} · {stats.levelInfo.title}
                </span>
                {stats.currentStreak > 0 && (
                  <span className="bg-orange-500/40 text-xs px-2 py-0.5 rounded-full font-semibold">
                    🔥 {stats.currentStreak} hari
                  </span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-black">{stats.xp.toLocaleString()}</p>
              <p className="text-blue-200 text-xs">XP</p>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-4">
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full transition-all duration-700"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
            {stats.nextLevel ? (
              <p className="text-xs text-blue-200 mt-1">
                {(stats.nextLevel.minXp - stats.xp).toLocaleString()} XP lagi → Lv {stats.nextLevel.level} {stats.nextLevel.title}
              </p>
            ) : (
              <p className="text-xs text-yellow-300 mt-1 font-semibold">🌟 MAX LEVEL — Legenda Sandeq!</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: '📚', label: 'Dibaca', value: stats.totalMateriRead },
            { icon: '✅', label: 'Selesai', value: stats.totalMateriCompleted },
            { icon: '🎯', label: 'Benar', value: stats.totalQuizCorrect },
            { icon: '🏆', label: 'Mastery', value: stats.totalMastered },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className="text-lg font-black text-gray-800">{s.value}</div>
              <div className="text-[10px] text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {(['stats', 'badges', 'history', 'password'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-3 py-3 text-xs font-semibold transition ${
                  activeTab === tab
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {tab === 'stats' ? '📊 Stats'
                  : tab === 'badges' ? `🏅 Badges (${stats.totalBadges})`
                  : tab === 'history' ? '📜 Riwayat'
                  : '🔐 Password'}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'stats' && (
              <div className="space-y-0">
                {[
                  { label: 'Streak Saat Ini', value: `🔥 ${stats.currentStreak} hari` },
                  { label: 'Streak Terpanjang', value: `💎 ${stats.longestStreak} hari` },
                  { label: 'Total XP', value: `⭐ ${stats.xp.toLocaleString()} XP` },
                  { label: 'Level', value: `${stats.levelInfo.emoji} Lv ${stats.level}` },
                  {
                    label: 'Akurasi Quiz',
                    value: stats.totalQuizAttempted > 0
                      ? `${Math.round((stats.totalQuizCorrect / stats.totalQuizAttempted) * 100)}%`
                      : '-'
                  },
                  { label: 'Total Badge', value: `🏅 ${stats.totalBadges}` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600">{row.label}</span>
                    <span className="font-bold text-sm text-gray-800">{row.value}</span>
                  </div>
                ))}

                <div className="pt-4 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition">
                    <div className={`relative w-10 h-6 rounded-full transition-colors ${hideFromLb ? 'bg-indigo-500' : 'bg-gray-300'}`} onClick={toggleLeaderboard}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${hideFromLb ? 'left-5' : 'left-1'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Sembunyikan dari leaderboard</p>
                      <p className="text-xs text-gray-500">Profilmu tidak tampil di ranking kelas</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'badges' && (
              <div>
                <p className="text-xs text-gray-500 mb-3">
                  {stats.totalBadges} dari {allBadges.length} badge tersedia
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {allBadges.map((badge) => {
                    const owned = userBadgeIds.has(badge.id);
                    return (
                      <div
                        key={badge.id}
                        title={`${badge.name} — ${badge.description}`}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          owned ? rarityColors[badge.rarity] : 'bg-gray-50 border-gray-100 opacity-50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{owned ? badge.icon : '🔒'}</div>
                        <div className="text-[10px] font-bold truncate leading-tight">{badge.name}</div>
                        <div className="text-[9px] text-gray-500 mt-0.5 capitalize">{badge.rarity}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                <p className="text-xs text-gray-500">Ganti password akun SANDEQ kamu.</p>
                {passwordMsg && (
                  <div className={`text-sm px-3 py-2.5 rounded-xl font-medium ${
                    passwordMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {passwordMsg.type === 'success' ? '✅ ' : '⚠️ '}{passwordMsg.text}
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Password Baru</label>
                  <input
                    type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    required minLength={6} placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Konfirmasi Password Baru</label>
                  <input
                    type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    required minLength={6} placeholder="Ulangi password baru"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
                <button
                  type="submit" disabled={changingPassword}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 transition disabled:opacity-50"
                >
                  {changingPassword ? '⏳ Menyimpan...' : '🔐 Simpan Password Baru'}
                </button>
              </form>
            )}

            {activeTab === 'history' && (
              <div className="space-y-2">
                {xpHistory.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">Belum ada aktivitas</p>
                ) : (
                  xpHistory.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                        tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tx.amount > 0 ? '⬆' : '⬇'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{tx.reason}</p>
                        <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString('id-ID')}</p>
                      </div>
                      <span className={`font-black text-sm flex-shrink-0 ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} XP
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* All levels */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-sm text-gray-800 mb-3">🎖️ Semua Level</h3>
          <div className="space-y-1.5">
            {LEVELS.map((lvl) => {
              const reached = stats.level >= lvl.level;
              return (
                <div
                  key={lvl.level}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${
                    reached ? 'bg-indigo-50' : 'bg-gray-50 opacity-50'
                  }`}
                >
                  <span className="text-xl">{lvl.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Lv {lvl.level} · {lvl.title}</p>
                    <p className="text-xs text-gray-500">{lvl.minXp.toLocaleString()} XP{lvl.maxXp < 999999 ? ` – ${lvl.maxXp.toLocaleString()} XP` : '+'}</p>
                  </div>
                  {reached && <span className="text-green-500 text-sm font-bold">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
