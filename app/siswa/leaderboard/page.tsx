'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Flame, Lightbulb, MapPin, Trophy, Waves } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getKelasLeaderboard, LeaderboardEntry, getLevelInfo } from '@/lib/gamification';
import { supabase } from '@/lib/supabase';

export default function SiswaLeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [kelas, setKelas] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || u.role !== 'siswa') { router.push('/login'); return; }
    setUser(u);
    if (u.kelas_id) {
      const { data: kelasData } = await supabase.from('kelas').select('*').eq('id', u.kelas_id).single();
      setKelas(kelasData);
      const lb = await getKelasLeaderboard(u.kelas_id);
      setLeaderboard(lb);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Memuat leaderboard...</p>
        </div>
      </div>
    );
  }

  const myEntry = leaderboard.find((e) => e.user_id === user?.id);
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#F39C12] to-[#E67E22] text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/siswa')}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-bold"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="inline-flex items-center gap-2 text-lg font-bold leading-tight"><Trophy size={18} /> Leaderboard</h1>
            <p className="text-yellow-100 text-xs">{kelas?.nama || 'Kelasmu'} · {leaderboard.length} siswa</p>
          </div>
        </div>

        {/* My rank */}
        {myEntry && (
          <div className="max-w-2xl mx-auto px-4 pb-4">
            <div className="bg-white/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-xs font-black">LV</div>
              <div className="flex-1">
                <p className="font-bold text-sm">Posisimu: #{myEntry.rank}</p>
                <p className="text-yellow-100 text-xs">{myEntry.xp.toLocaleString()} XP · Lv {myEntry.level}</p>
              </div>
              {myEntry.current_streak > 0 && (
                <span className="bg-orange-600/50 px-2 py-1 rounded-lg text-xs font-bold">
                  <span className="inline-flex items-center gap-1"><Flame size={13} /> {myEntry.current_streak}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {leaderboard.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Waves size={26} />
            </div>
            <p className="font-semibold text-gray-700">Belum ada ranking</p>
            <p className="text-sm text-gray-500 mt-1">Kerjakan materi untuk mendapat XP dan masuk ranking!</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <div className="mb-5">
                <div className="grid grid-cols-3 gap-2 items-end">
                  <PodiumCard entry={top3[1]} place={2} myId={user?.id} />
                  <PodiumCard entry={top3[0]} place={1} myId={user?.id} />
                  <PodiumCard entry={top3[2]} place={3} myId={user?.id} />
                </div>
              </div>
            )}

            {/* Top 3 kalau kurang dari 3 */}
            {top3.length < 3 && top3.map((entry) => (
              <div key={entry.user_id} className="bg-white rounded-xl p-4 shadow-sm mb-2">
                <LeaderboardRow entry={entry} isMe={entry.user_id === user?.id} />
              </div>
            ))}

            {/* My position (kalau bukan top 3) */}
            {myEntry && myEntry.rank > 3 && (
              <div className="mb-3 bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                <p className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-2"><MapPin size={13} /> Posisimu</p>
                <LeaderboardRow entry={myEntry} isMe={true} />
              </div>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {rest.map((entry, i) => (
                  <div
                    key={entry.user_id}
                    className={`px-4 py-3 ${i < rest.length - 1 ? 'border-b border-gray-100' : ''} ${
                      entry.user_id === user?.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <LeaderboardRow entry={entry} isMe={entry.user_id === user?.id} />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 bg-white rounded-xl p-3 text-center shadow-sm">
              <p className="text-xs text-gray-500">
                <span className="inline-flex items-center gap-1.5"><Lightbulb size={13} /> Kerjakan materi dan quiz tiap hari untuk naik ranking</span>
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function PodiumCard({ entry, place, myId }: { entry: LeaderboardEntry; place: 1 | 2 | 3; myId?: string }) {
  const isMe = entry.user_id === myId;
  const levelInfo = getLevelInfo(entry.xp);

  const styles = {
    1: { card: 'from-yellow-400 to-amber-500 text-yellow-900', height: 'h-44', medal: '1' },
    2: { card: 'from-slate-300 to-slate-400 text-slate-800', height: 'h-36', medal: '2' },
    3: { card: 'from-orange-300 to-amber-400 text-orange-900', height: 'h-32', medal: '3' },
  };

  const s = styles[place];

  return (
    <div className={`bg-gradient-to-b ${s.card} ${s.height} rounded-2xl p-2.5 shadow-md text-center flex flex-col justify-end ${isMe ? 'ring-4 ring-blue-400 ring-offset-1' : ''}`}>
      <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-white/25 text-sm font-black">#{s.medal}</div>
      <div className="text-xs font-semibold">{levelInfo.title}</div>
      <p className="font-bold text-xs truncate px-1 mt-0.5">{entry.nama}</p>
      <p className="text-[10px] opacity-80">Lv {entry.level}</p>
      <p className="font-bold text-xs mt-0.5">{entry.xp.toLocaleString()} XP</p>
      {isMe && <p className="text-[9px] font-bold mt-0.5 bg-blue-500 text-white rounded px-1">KAMU</p>}
    </div>
  );
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const levelInfo = getLevelInfo(entry.xp);
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
        entry.rank <= 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white' : 'bg-gray-100 text-gray-600'
      }`}>
        #{entry.rank}
      </div>
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-black text-blue-700">LV</div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${isMe ? 'text-blue-700' : 'text-gray-800'}`}>
          {entry.nama} {isMe && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">KAMU</span>}
        </p>
        <p className="text-xs text-gray-500">Lv {entry.level} · {levelInfo.title}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-sm text-gray-800">{entry.xp.toLocaleString()} XP</p>
        {entry.current_streak > 0 && <p className="inline-flex items-center justify-end gap-1 text-xs text-orange-500"><Flame size={12} /> {entry.current_streak}</p>}
      </div>
    </div>
  );
}
