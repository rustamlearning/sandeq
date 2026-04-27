'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getKelasLeaderboard, LeaderboardEntry, getLevelInfo } from '@/lib/gamification';
import { supabase } from '@/lib/supabase';

export default function SiswaLeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [kelas, setKelas] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Get kelas info
      const { data: kelasData } = await supabase
        .from('kelas')
        .select('*')
        .eq('id', u.kelas_id)
        .single();
      setKelas(kelasData);

      // Get leaderboard
      const lb = await getKelasLeaderboard(u.kelas_id);
      setLeaderboard(lb);
    }

    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const myEntry = leaderboard.find((e) => e.user_id === user?.id);
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/siswa')} className="text-blue-600 text-sm">
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold">🏆 Leaderboard</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Ranking Kelas</h2>
          <p className="text-gray-600">{kelas?.nama || 'Kelasmu'}</p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">🌊</div>
            <p className="text-gray-600 font-medium">Belum ada ranking</p>
            <p className="text-sm text-gray-500 mt-2">
              Semua siswa kelasmu menyembunyikan profil dari leaderboard, atau belum ada XP.
            </p>
          </div>
        ) : (
          <>
            {/* Podium - Top 3 */}
            {top3.length >= 3 && (
              <div className="grid grid-cols-3 gap-2 mb-6 items-end">
                {/* 2nd Place */}
                <PodiumCard entry={top3[1]} place={2} myId={user?.id} />
                {/* 1st Place */}
                <PodiumCard entry={top3[0]} place={1} myId={user?.id} />
                {/* 3rd Place */}
                <PodiumCard entry={top3[2]} place={3} myId={user?.id} />
              </div>
            )}

            {/* My Rank Card (kalau bukan di top 3) */}
            {myEntry && myEntry.rank > 3 && (
              <div className="mb-4 bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                <p className="text-xs text-blue-700 mb-2 font-semibold">📍 Posisimu</p>
                <LeaderboardRow entry={myEntry} isMe={true} />
              </div>
            )}

            {/* Top 3 (kalau kurang dari 3 user) */}
            {top3.length < 3 &&
              top3.map((entry) => (
                <div key={entry.user_id} className="bg-white rounded-xl p-4 shadow-sm mb-2">
                  <LeaderboardRow entry={entry} isMe={entry.user_id === user?.id} />
                </div>
              ))}

            {/* Rest of the list */}
            {rest.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {rest.map((entry, i) => (
                  <div
                    key={entry.user_id}
                    className={`p-4 ${i < rest.length - 1 ? 'border-b' : ''} ${
                      entry.user_id === user?.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <LeaderboardRow entry={entry} isMe={entry.user_id === user?.id} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Info */}
        <div className="mt-6 bg-white/60 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-600">
            💡 Tip: Kerjakan materi & quiz tiap hari untuk naik ranking!
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Mau menyembunyikan profil? Buka <strong>Profil</strong> → toggle "Sembunyikan dari leaderboard"
          </p>
        </div>
      </main>
    </div>
  );
}

function PodiumCard({
  entry,
  place,
  myId,
}: {
  entry: LeaderboardEntry;
  place: 1 | 2 | 3;
  myId?: string;
}) {
  const isMe = entry.user_id === myId;
  const levelInfo = getLevelInfo(entry.xp);

  const styles = {
    1: 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 h-48',
    2: 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800 h-40',
    3: 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900 h-36',
  };

  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div
      className={`rounded-2xl ${styles[place]} p-3 shadow-lg text-center flex flex-col justify-end ${
        isMe ? 'ring-4 ring-blue-400' : ''
      }`}
    >
      <div className="text-3xl mb-1">{medals[place]}</div>
      <div className="text-2xl mb-1">{levelInfo.emoji}</div>
      <p className="font-bold text-xs truncate">{entry.nama}</p>
      <p className="text-xs opacity-80">Lv {entry.level}</p>
      <p className="font-bold text-sm mt-1">{entry.xp.toLocaleString()} XP</p>
      {isMe && <p className="text-[10px] mt-1 font-semibold">⭐ KAMU</p>}
    </div>
  );
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const levelInfo = getLevelInfo(entry.xp);

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
          entry.rank <= 3
            ? 'bg-gradient-to-br from-yellow-300 to-orange-400 text-white'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        #{entry.rank}
      </div>
      <div className="text-2xl flex-shrink-0">{levelInfo.emoji}</div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${isMe ? 'text-blue-700' : ''}`}>
          {entry.nama} {isMe && <span className="text-xs">⭐ KAMU</span>}
        </p>
        <p className="text-xs text-gray-500">
          Lv {entry.level} • {levelInfo.title}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-sm">{entry.xp.toLocaleString()} XP</p>
        {entry.current_streak > 0 && (
          <p className="text-xs text-orange-600">🔥 {entry.current_streak}</p>
        )}
      </div>
    </div>
  );
}
