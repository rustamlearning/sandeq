'use client';
import React from 'react';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import BlockRenderer from '@/components/BlockRenderer';
import TutorChat from '@/components/TutorChat';
import XPNotification, { useXPNotifications } from '@/components/XPNotification';
import { recordActivity } from '@/lib/gamification';
import { useToast } from '@/components/ui/Toast'
import { PageLoader } from '@/components/ui/Skeleton';

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

function isHtmlKonten(konten: string | null | undefined): boolean {
  return !!(konten && konten.trim().startsWith('<'));
}

// Auto-resize iframe to match its content height
function HtmlViewer({ html, title }: { html: string; title: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(600);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc) {
        const h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
        if (h > 200) setIframeHeight(h);
      }
    } catch {
      // cross-origin fallback — just use a tall fixed height
      setIframeHeight(Math.max(window.innerHeight * 1.5, 800));
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
      {!loaded && (
        <div className="absolute inset-0 bg-white flex items-center justify-center z-10 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Memuat materi...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onLoad={handleLoad}
        title={title}
        className="w-full block bg-white"
        style={{ height: iframeHeight, border: 'none' }}
        aria-label={`Konten materi: ${title}`}
      />
    </div>
  );
}

export default function SiswaMateriPage() {
  const router = useRouter()
  const { success: toastSuccess } = useToast();
  const [user, setUser] = useState<any>(null);
  const [materiList, setMateriList] = useState<any[]>([]);
  const [selectedMateri, setSelectedMateri] = useState<any>(null);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [mastery, setMastery] = useState<Record<string, any>>({});
  const [tutorOpen, setTutorOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [openMapel, setOpenMapel] = useState<string | null>(null);
  const { notifications, dismiss, showActivityResult } = useXPNotifications();

  useEffect(() => { init(); }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || u.role !== 'siswa') { router.push('/login'); return; }
    setUser(u);
    await Promise.all([loadMateri(u), loadProgress(u.id), loadMastery(u.id)]);
    setPageLoading(false);
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
      toastSuccess('Materi sudah ditandai selesai!');
    }
    await loadProgress(user.id);
    setSelectedMateri(null);
  };

  if (pageLoading) return <PageLoader />;

  // ===== DETAIL VIEW =====
  if (selectedMateri) {
    const m = selectedMateri;
    const masteryLevel = mastery[m.id]?.level || 'belum_mulai';
    const mconf = masteryConfig[masteryLevel];
    const diff = m.tingkat_kesulitan ? difficultyConfig[m.tingkat_kesulitan] : null;
    const isSelesai = progress[m.id]?.selesai;
    const htmlMode = isHtmlKonten(m.konten);

    return (
      <div className="min-h-screen bg-[#F4F9FF]">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white sticky top-0 z-20 shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setSelectedMateri(null)}
              aria-label="Kembali ke daftar materi"
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm transition"
            >
              ← Kembali
            </button>
            <div className="flex items-center gap-2">
              {htmlMode && (
                <span className="px-2.5 py-1 bg-white/15 rounded-full text-xs font-semibold">🌐 HTML</span>
              )}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${mconf.bg} ${mconf.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${mconf.dot}`} />
                {mconf.label}
              </div>
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

          {/* Content area */}
          {htmlMode ? (
            // ===== HTML VIEWER =====
            <div className="mb-5">
              <HtmlViewer html={m.konten} title={m.judul} />
            </div>
          ) : (
            // ===== BLOCK RENDERER =====
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-5">
              {m.konten_blocks && m.konten_blocks.length > 0 ? (
                <BlockRenderer blocks={m.konten_blocks} materiId={m.id} userId={user.id} />
              ) : (
                <div className="py-16 text-center">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-slate-400">Belum ada konten untuk materi ini.</p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
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

        {/* Floating AI Tutor — hanya muncul untuk materi block */}
        {!htmlMode && (
          <>
            <button
              onClick={() => setTutorOpen(true)}
              className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-blue-700 to-blue-500 text-white px-5 py-3.5 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-2 font-medium"
            >
              <span className="text-xl">🤖</span>
              <span>Tanya Tutor</span>
            </button>
            <TutorChat materi={selectedMateri} blocks={selectedMateri.konten_blocks || []} user={user} isOpen={tutorOpen} onClose={() => setTutorOpen(false)} />
          </>
        )}

        <XPNotification notifications={notifications} onDismiss={dismiss} />
      </div>
    );
  }


  // Ikon per mata pelajaran
  const MAPEL_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
    'Matematika':              { icon: '🧮', bg: 'bg-blue-50',    color: 'text-blue-600'   },
    'Bahasa Indonesia':        { icon: '📝', bg: 'bg-red-50',     color: 'text-red-600'    },
    'Bahasa Inggris':          { icon: '🌍', bg: 'bg-sky-50',     color: 'text-sky-600'    },
    'Fisika':                  { icon: '⚡', bg: 'bg-yellow-50',  color: 'text-yellow-600' },
    'Kimia':                   { icon: '🧪', bg: 'bg-green-50',   color: 'text-green-600'  },
    'Biologi':                 { icon: '🌿', bg: 'bg-emerald-50', color: 'text-emerald-600'},
    'Sejarah Indonesia':       { icon: '🏛️', bg: 'bg-amber-50',   color: 'text-amber-600'  },
    'Geografi':                { icon: '🗺️', bg: 'bg-teal-50',    color: 'text-teal-600'   },
    'Ekonomi':                 { icon: '📈', bg: 'bg-lime-50',    color: 'text-lime-600'   },
    'Sosiologi':               { icon: '👥', bg: 'bg-pink-50',    color: 'text-pink-600'   },
    'PPKn':                    { icon: '🏅', bg: 'bg-rose-50',    color: 'text-rose-600'   },
    'Pendidikan Agama Islam':  { icon: '☪️', bg: 'bg-green-50',   color: 'text-green-700'  },
    'Seni Budaya':             { icon: '🎨', bg: 'bg-purple-50',  color: 'text-purple-600' },
    'Penjaskes':               { icon: '⚽', bg: 'bg-orange-50',  color: 'text-orange-600' },
    'Informatika':             { icon: '💻', bg: 'bg-indigo-50',  color: 'text-indigo-600' },
    'Lainnya':                 { icon: '📚', bg: 'bg-slate-50',   color: 'text-slate-600'  },
  };
  const getMapelStyle = (mapel: string) => MAPEL_ICONS[mapel] || { icon: '📚', bg: 'bg-slate-50', color: 'text-slate-600' };
  // ===== LIST VIEW — grouped by mapel =====
  const selesaiCount = materiList.filter(m => progress[m.id]?.selesai).length;

  // Group materi by mapel
  const grouped: Record<string, any[]> = {};
  materiList.forEach(m => {
    const key = m.mapel || 'Lainnya';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });
  const mapelList = Object.keys(grouped).sort();

  if (openMapel) {
    const items = grouped[openMapel] || [];
    return (
      <div className="min-h-screen bg-[#F4F9FF]">
        <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white sticky top-0 z-20 shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => setOpenMapel(null)}
              aria-label="Kembali ke daftar mapel"
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm transition"
            >
              ← Kembali
            </button>
            <span className="text-white/30">|</span>
            <h1 className="font-bold text-lg truncate">📚 {openMapel}</h1>
            <div className="ml-auto text-right flex-shrink-0">
              <p className="text-sm font-bold">
                {items.filter(m => progress[m.id]?.selesai).length}
                <span className="text-blue-300 font-normal">/{items.length}</span>
              </p>
              <p className="text-blue-200 text-xs">selesai</p>
            </div>
          </div>
          <div className="h-1 bg-white/20">
            <div
              className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400 transition-all"
              style={{ width: `${items.length > 0 ? Math.round(items.filter(m => progress[m.id]?.selesai).length / items.length * 100) : 0}%` }}
            />
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-6">
          <div className="space-y-3">
            {items.map((m) => {
              const p = progress[m.id];
              const mast = mastery[m.id];
              const mastConf = masteryConfig[mast?.level || 'belum_mulai'];
              const diff = m.tingkat_kesulitan ? difficultyConfig[m.tingkat_kesulitan] : null;
              const isSelesai = p?.selesai;
              const htmlMode = isHtmlKonten(m.konten);
              return (
                <button
                  key={m.id}
                  onClick={() => openMateri(m)}
                  aria-label={`Buka materi: ${m.judul}`}
                  className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelesai ? 'bg-emerald-100' : htmlMode ? 'bg-violet-100' : 'bg-blue-50'
                    }`}>
                      <span className="text-lg">{isSelesai ? '✅' : htmlMode ? '🌐' : '📖'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        {m.bab && <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{m.bab}</span>}
                        {diff && <span className={`text-xs px-2 py-0.5 rounded-full ${diff.color}`}>{diff.label}</span>}
                        {htmlMode && <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-semibold">🌐 Interaktif</span>}
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
        </main>
      </div>
    );
  }

  // ===== MAPEL FOLDER VIEW =====
  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white">
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
            {mapelList.map((mapel) => {
              const items = grouped[mapel];
              const selesai = items.filter(m => progress[m.id]?.selesai).length;
              const pct = Math.round(selesai / items.length * 100);
              const hasHtml = items.some(m => isHtmlKonten(m.konten));
              return (
                <button
                  key={mapel}
                  onClick={() => setOpenMapel(mapel)}
                  aria-label={`Buka folder ${mapel}`}
                  className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl ${getMapelStyle(mapel).bg}`}>
                      {getMapelStyle(mapel).icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-800 group-hover:text-blue-700 transition truncate">{mapel}</h3>
                        {hasHtml && <span className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded-full">🌐</span>}
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{items.length} materi · {selesai} selesai</p>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-lg font-black text-blue-600">{pct}%</p>
                      <span className="text-slate-300 group-hover:text-blue-400 transition text-xl">›</span>
                    </div>
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
