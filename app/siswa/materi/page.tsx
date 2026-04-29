'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import BlockRenderer from '@/components/BlockRenderer';
import TutorChat from '@/components/TutorChat';
import XPNotification, { useXPNotifications } from '@/components/XPNotification';
import { recordActivity } from '@/lib/gamification';

const masteryConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  belum_mulai: { label: 'Belum mulai', color: 'text-slate-500', bg: 'bg-slate-100', dot: 'bg-slate-400' },
  familiar:    { label: 'Familiar',    color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-400' },
  mahir:       { label: 'Mahir',       color: 'text-blue-700',  bg: 'bg-blue-100',  dot: 'bg-blue-500'  },
  dikuasai:    { label: 'Dikuasai',    color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  mudah:  { label: 'Mudah',  color: 'text-emerald-600 bg-emerald-50' },
  sedang: { label: 'Sedang', color: 'text-amber-600 bg-amber-50'     },
  sulit:  { label: 'Sulit',  color: 'text-red-600 bg-red-50'         },
};

export default function SiswaMateriPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [materiList, setMateriList] = useState<any[]>([]);
  const [selectedMateri, setSelectedMateri] = useState<any>(null);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [mastery, setMastery] = useState<Record<string, any>>({});
  const [tutorOpen, setTutorOpen] = useState(false);
  const { notifications, dismiss, showActivityResult } = useXPNotifications();

  useEffect(() => { init(); }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || u.role !== 'siswa') { router.push('/login'); return; }
    setUser(u);
    await loadMateri(u);
    await loadProgress(u.id);
    await loadMastery(u.id);
  };

  const loadMateri = async (u: any) => {
    if (!u.kelas_id) { setMateriList([]); return; }
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
    const isFirstRead = !progress[materi.id];
    await supabase.from('progress_materi').upsert(
      { user_id: user.id, materi_id: materi.id, terakhir_dibaca: new Date().toISOString() },
      { onConflict: 'user_id,materi_id' }
    );
    if (isFirstRead) {
      const result = await recordActivity(user.id, 'read_material', { materiId: materi.id });
      showActivityResult(result);
      await loadProgress(user.id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const markComplete = async () => {
    const wasAlreadyComplete = progress[selectedMateri.id]?.selesai;
    await supabase.from('progress_materi').upsert(
      { user_id: user.id, materi_id: selectedMateri.id, selesai: true, persen_dibaca: 100, terakhir_dibaca: new Date().toISOString() },
      { onConflict: 'user_id,materi_id' }
    );
    if (!wasAlreadyComplete) {
      const result = await recordActivity(user.id, 'complete_material', { materiId: selectedMateri.id });
      showActivityResult(result);
    } else {
      alert('✅ Materi sudah ditandai selesai!');
    }
    await loadProgress(user.id);
    setSelectedMateri(null);
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ===== DETAIL VIEW =====
  if (selectedMateri) {
    const m = selectedMateri;
    const masteryLevel = mastery[m.id]?.level || 'belum_mulai';
    const mconf = masteryConfig[masteryLevel];
    const diff = m.tingkat_kesulitan ? difficultyConfig[m.tingkat_kesulitan] : null;
    const isSelesai = progress[m.id]?.selesai;

    return (
      <div className="min-h-screen bg-[#F4F9FF]">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#1A4A7A] to-[#2E86C1] text-white sticky top-0 z-20 shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setSelectedMateri(null)}
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm transition"
            >
              ← Kembali
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${mconf.bg} ${mconf.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${mconf.dot}`} />
              {mconf.label}
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6">
          {/* Meta card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-5">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">{m.mapel}</span>
              {m.bab && <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">{m.bab}</span>}
              {diff && <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${diff.color}`}>{diff.label}</span>}
              {m.estimasi_menit && <span className="text-xs text-slate-400">⏱ {m.estimasi_menit} menit</span>}
              {isSelesai && <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">✅ Selesai</span>}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">{m.judul}</h1>
            {m.users?.nama && <p className="text-sm text-slate-400 mb-4">Oleh {m.users.nama}</p>}

            {m.tujuan_pembelajaran && (
              <div className="p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400 mt-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-1.5">🎯 Tujuan Pembelajaran</h3>
                <p className="text-sm text-blue-700 whitespace-pre-line leading-relaxed">{m.tujuan_pembelajaran}</p>
              </div>
            )}
            {m.ringkasan && (
              <p className="mt-4 text-slate-500 italic text-sm leading-relaxed border-t border-slate-100 pt-4">{m.ringkasan}</p>
            )}
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            {m.konten_blocks && m.konten_blocks.length > 0 ? (
              <BlockRenderer blocks={m.konten_blocks} materiId={m.id} userId={user.id} />
            ) : (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-slate-400">Belum ada konten untuk materi ini.</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={markComplete}
              className={`flex-1 py-3.5 rounded-2xl font-semibold text-sm transition-all ${
                isSelesai
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {isSelesai ? '✅ Sudah Selesai' : '✅ Tandai Selesai'}
            </button>
            <button
              onClick={() => setSelectedMateri(null)}
              className="px-5 py-3.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
            >
              Kembali
            </button>
          </div>

          <div className="h-24" />
        </main>

        {/* Floating AI Tutor */}
        <button
          onClick={() => setTutorOpen(true)}
          className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-[#1A4A7A] to-[#2E86C1] text-white px-5 py-3.5 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-2 font-medium"
        >
          <span className="text-xl">🤖</span>
          <span>Tanya Tutor</span>
        </button>

        <TutorChat materi={selectedMateri} blocks={selectedMateri.konten_blocks || []} user={user} isOpen={tutorOpen} onClose={() => setTutorOpen(false)} />
        <XPNotification notifications={notifications} onDismiss={dismiss} />
      </div>
    );
  }

  // ===== LIST VIEW =====
  const selesaiCount = materiList.filter(m => progress[m.id]?.selesai).length;

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1A4A7A] to-[#2E86C1] text-white">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/siswa')} className="text-blue-200 hover:text-white text-sm transition">
              ← Dashboard
            </button>
            <span className="text-white/30">|</span>
            <h1 className="font-bold text-lg">📚 Materi Pelajaran</h1>
          </div>
          {materiList.length > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold">{selesaiCount}<span className="text-blue-300 text-base font-normal">/{materiList.length}</span></p>
              <p className="text-blue-200 text-xs">selesai</p>
            </div>
          )}
        </div>
        {/* Progress bar */}
        {materiList.length > 0 && (
          <div className="h-1 bg-white/20">
            <div
              className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400 transition-all"
              style={{ width: `${Math.round(selesaiCount / materiList.length * 100)}%` }}
            />
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {materiList.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-sm">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-500">Belum ada materi tersedia untuk kelasmu.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {materiList.map((m) => {
              const p = progress[m.id];
              const mast = mastery[m.id];
              const mastConf = masteryConfig[mast?.level || 'belum_mulai'];
              const diff = m.tingkat_kesulitan ? difficultyConfig[m.tingkat_kesulitan] : null;
              const isSelesai = p?.selesai;

              return (
                <button
                  key={m.id}
                  onClick={() => openMateri(m)}
                  className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="flex items-start gap-4">
                    {/* Left indicator */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelesai ? 'bg-emerald-100' : 'bg-blue-50'}`}>
                      <span className="text-lg">{isSelesai ? '✅' : '📖'}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{m.mapel}</span>
                        {m.bab && <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{m.bab}</span>}
                        {diff && <span className={`text-xs px-2 py-0.5 rounded-full ${diff.color}`}>{diff.label}</span>}
                        {m.estimasi_menit && <span className="text-xs text-slate-400">⏱ {m.estimasi_menit} mnt</span>}
                      </div>

                      <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition">{m.judul}</h3>
                      {m.ringkasan && <p className="text-sm text-slate-400 mt-1 line-clamp-2 leading-relaxed">{m.ringkasan}</p>}

                      <div className="flex items-center justify-between mt-3">
                        {m.users?.nama && <p className="text-xs text-slate-400">Oleh {m.users.nama}</p>}
                        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${mastConf.bg} ${mastConf.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${mastConf.dot}`} />
                          {mastConf.label}
                        </div>
                      </div>
                    </div>

                    <span className="text-slate-300 group-hover:text-blue-400 transition text-xl mt-1">›</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
