'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import BlockRenderer from '@/components/BlockRenderer';
import TutorChat from '@/components/TutorChat';
import XPNotification, { useXPNotifications } from '@/components/XPNotification';
import { recordActivity } from '@/lib/gamification';

export default function SiswaMateriPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [materiList, setMateriList] = useState<any[]>([]);
  const [selectedMateri, setSelectedMateri] = useState<any>(null);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [mastery, setMastery] = useState<Record<string, any>>({});
  const [tutorOpen, setTutorOpen] = useState(false);
  const { notifications, dismiss, showActivityResult } = useXPNotifications();

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
    await loadMateri(u);
    await loadProgress(u.id);
    await loadMastery(u.id);
  };

  const loadMateri = async (u: any) => {
    if (!u.kelas_id) {
      setMateriList([]);
      return;
    }
    const { data } = await supabase
      .from('materi')
      .select('*, users:guru_id(nama)')
      .eq('kelas_id', u.kelas_id)
      .order('created_at', { ascending: false });
    setMateriList(data || []);
  };

  const loadProgress = async (userId: string) => {
    const { data } = await supabase.from('progress_materi').select('*').eq('user_id', userId);
    const map: Record<string, any> = {};
    (data || []).forEach((p) => (map[p.materi_id] = p));
    setProgress(map);
  };

  const loadMastery = async (userId: string) => {
    const { data } = await supabase.from('mastery_progress').select('*').eq('user_id', userId);
    const map: Record<string, any> = {};
    (data || []).forEach((m) => (map[m.materi_id] = m));
    setMastery(map);
  };

  const openMateri = async (materi: any) => {
    setSelectedMateri(materi);

    // Cek apakah ini pertama kali baca
    const isFirstRead = !progress[materi.id];

    await supabase
      .from('progress_materi')
      .upsert(
        {
          user_id: user.id,
          materi_id: materi.id,
          terakhir_dibaca: new Date().toISOString(),
        },
        { onConflict: 'user_id,materi_id' }
      );

    // Award XP kalau pertama kali baca
    if (isFirstRead) {
      const result = await recordActivity(user.id, 'read_material', { materiId: materi.id });
      showActivityResult(result);
      await loadProgress(user.id);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const markComplete = async () => {
    const wasAlreadyComplete = progress[selectedMateri.id]?.selesai;

    await supabase
      .from('progress_materi')
      .upsert(
        {
          user_id: user.id,
          materi_id: selectedMateri.id,
          selesai: true,
          persen_dibaca: 100,
          terakhir_dibaca: new Date().toISOString(),
        },
        { onConflict: 'user_id,materi_id' }
      );

    // Award XP kalau pertama kali mark complete
    if (!wasAlreadyComplete) {
      const result = await recordActivity(user.id, 'complete_material', {
        materiId: selectedMateri.id,
      });
      showActivityResult(result);
    } else {
      alert('✅ Materi ditandai selesai!');
    }

    await loadProgress(user.id);
    setSelectedMateri(null);
  };

  if (!user) return <div className="p-8">Loading...</div>;

  // ===== DETAIL VIEW =====
  if (selectedMateri) {
    const m = selectedMateri;
    const masteryLevel = mastery[m.id]?.level || 'belum_mulai';
    const masteryColors: Record<string, string> = {
      belum_mulai: 'bg-gray-100 text-gray-600',
      familiar: 'bg-yellow-100 text-yellow-700',
      mahir: 'bg-blue-100 text-blue-700',
      dikuasai: 'bg-green-100 text-green-700',
    };
    const masteryLabels: Record<string, string> = {
      belum_mulai: '⚪ Belum mulai',
      familiar: '🟡 Familiar',
      mahir: '🔵 Mahir',
      dikuasai: '🟢 Dikuasai',
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSelectedMateri(null)}
              className="text-blue-600 text-sm"
            >
              ← Kembali
            </button>
            <span
              className={`text-xs px-2 py-1 rounded-full ${masteryColors[masteryLevel]} ml-auto`}
            >
              {masteryLabels[masteryLevel]}
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {m.mapel}
              </span>
              {m.bab && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  {m.bab}
                </span>
              )}
              {m.estimasi_menit && (
                <span className="text-xs text-gray-500">⏱ {m.estimasi_menit} menit</span>
              )}
              {m.tingkat_kesulitan && (
                <span className="text-xs">
                  {m.tingkat_kesulitan === 'mudah' && '🟢 Mudah'}
                  {m.tingkat_kesulitan === 'sedang' && '🟡 Sedang'}
                  {m.tingkat_kesulitan === 'sulit' && '🔴 Sulit'}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{m.judul}</h1>
            {m.users?.nama && (
              <p className="text-sm text-gray-500 mb-4">Oleh: {m.users.nama}</p>
            )}

            {m.tujuan_pembelajaran && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  🎯 Tujuan Pembelajaran
                </h3>
                <p className="text-sm text-blue-800 whitespace-pre-line">
                  {m.tujuan_pembelajaran}
                </p>
              </div>
            )}

            {m.ringkasan && <p className="mt-4 text-gray-600 italic">{m.ringkasan}</p>}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            {m.konten_blocks && m.konten_blocks.length > 0 ? (
              <BlockRenderer
                blocks={m.konten_blocks}
                materiId={m.id}
                userId={user.id}
              />
            ) : (
              <p className="text-gray-500 text-center py-8">Belum ada konten</p>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={markComplete}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              ✅ Tandai Selesai
            </button>
            <button
              onClick={() => setSelectedMateri(null)}
              className="px-6 py-3 border rounded-lg hover:bg-gray-50"
            >
              Kembali ke List
            </button>
          </div>

          {/* Floating AI Tutor Button */}
          <button
            onClick={() => setTutorOpen(true)}
            className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <span className="text-2xl">🤖</span>
            <span className="font-medium">Tanya Tutor</span>
          </button>

          <TutorChat
            materi={selectedMateri}
            blocks={selectedMateri.konten_blocks || []}
            user={user}
            isOpen={tutorOpen}
            onClose={() => setTutorOpen(false)}
          />

          <XPNotification notifications={notifications} onDismiss={dismiss} />
        </main>
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/siswa')} className="text-blue-600 text-sm">
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold">📚 Materi Pelajaran</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {materiList.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-500">Belum ada materi tersedia untuk kelasmu.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {materiList.map((m) => {
              const p = progress[m.id];
              const mast = mastery[m.id];
              return (
                <button
                  key={m.id}
                  onClick={() => openMateri(m)}
                  className="w-full text-left bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {m.mapel}
                    </span>
                    {m.bab && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {m.bab}
                      </span>
                    )}
                    {m.estimasi_menit && (
                      <span className="text-xs text-gray-500">⏱ {m.estimasi_menit} mnt</span>
                    )}
                    {p?.selesai && <span className="text-xs text-green-600">✅ Selesai</span>}
                    {mast?.level === 'dikuasai' && (
                      <span className="text-xs text-green-700 font-semibold">🏆 Dikuasai</span>
                    )}
                    {mast?.level === 'mahir' && (
                      <span className="text-xs text-blue-700">🔵 Mahir</span>
                    )}
                    {mast?.level === 'familiar' && (
                      <span className="text-xs text-yellow-700">🟡 Familiar</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{m.judul}</h3>
                  {m.ringkasan && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{m.ringkasan}</p>
                  )}
                  {m.users?.nama && (
                    <p className="text-xs text-gray-400 mt-2">Oleh: {m.users.nama}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
