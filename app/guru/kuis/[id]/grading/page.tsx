'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface JawabanItem {
  id: string;
  attempt_id: string;
  soal_id: string;
  jawaban: string;
  poin_didapat: number;
  poin_max: number;
  feedback: string | null;
  benar: boolean | null;
  graded_by_ai: boolean;
  ai_confidence: number | null;
  soal: { teks: string; poin: number; jawaban_benar: string; tipe: string };
  attempt: {
    id: string;
    user_id: string;
    nilai_total: number;
    needs_grading: boolean;
    siswa: { nama: string; nis_nip: string };
  };
}

export default function EssayGradingPage() {
  const router = useRouter();
  const params = useParams();
  const kuisId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [kuis, setKuis] = useState<any>(null);
  const [jawabanList, setJawabanList] = useState<JawabanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<string, { poin: number; feedback: string }>>({});
  const [filter, setFilter] = useState<'semua' | 'belum' | 'sudah'>('belum');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => { init(); }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || u.role !== 'guru') { router.push('/login'); return; }
    setUser(u);

    const { data: kuisData } = await supabase.from('kuis').select('*').eq('id', kuisId).single();
    setKuis(kuisData);

    await loadJawaban();
    setLoading(false);
  };

  const loadJawaban = async () => {
    // Fetch attempts untuk kuis ini
    const { data: attempts } = await supabase
      .from('kuis_attempts')
      .select('id, user_id, nilai_total, needs_grading')
      .eq('kuis_id', kuisId)
      .eq('selesai', true);

    if (!attempts || attempts.length === 0) { setJawabanList([]); return; }

    const attemptIds = attempts.map((a) => a.id);
    const userIds = [...new Set(attempts.map((a) => a.user_id))];

    // Fetch jawaban essay
    const { data: jawabans } = await supabase
      .from('jawaban_attempts')
      .select('*, soal:soal_id(teks, poin, jawaban_benar, tipe)')
      .in('attempt_id', attemptIds)
      .eq('soal.tipe', 'essay');

    // Fetch siswa
    const { data: siswaList } = await supabase
      .from('users')
      .select('id, nama, nis_nip')
      .in('id', userIds);

    const siswaMap = new Map((siswaList || []).map((s) => [s.id, s]));
    const attemptMap = new Map(attempts.map((a) => [a.id, a]));

    const essayJawabans = (jawabans || [])
      .filter((j) => j.soal?.tipe === 'essay')
      .map((j) => {
        const attempt = attemptMap.get(j.attempt_id);
        return {
          ...j,
          attempt: {
            ...attempt,
            siswa: siswaMap.get(attempt?.user_id) || { nama: 'Unknown', nis_nip: '-' },
          },
        };
      });

    setJawabanList(essayJawabans as any);

    // Init grades state
    const initGrades: Record<string, { poin: number; feedback: string }> = {};
    essayJawabans.forEach((j) => {
      initGrades[j.id] = {
        poin: j.poin_didapat ?? 0,
        feedback: j.feedback || '',
      };
    });
    setGrades(initGrades);
  };

  const saveGrade = async (jawabanId: string) => {
    setSaving(jawabanId);
    const g = grades[jawabanId];
    const jawaban = jawabanList.find((j) => j.id === jawabanId);
    if (!jawaban || !user) { setSaving(null); return; }

    const benar = g.poin >= jawaban.poin_max * 0.5;

    const { error } = await supabase
      .from('jawaban_attempts')
      .update({
        poin_didapat: g.poin,
        feedback: g.feedback,
        benar,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jawabanId);

    if (!error) {
      // Recalc nilai total attempt
      const { data: allJawabans } = await supabase
        .from('jawaban_attempts')
        .select('poin_didapat, benar')
        .eq('attempt_id', jawaban.attempt_id);

      const totalPoin = (allJawabans || []).reduce((s, j) => s + (j.poin_didapat || 0), 0);
      const stillNeedsGrading = (allJawabans || []).some((j) => j.benar === null);

      await supabase.from('kuis_attempts').update({
        nilai_total: totalPoin,
        needs_grading: stillNeedsGrading,
        graded_by: user.id,
        graded_at: new Date().toISOString(),
      }).eq('id', jawaban.attempt_id);

      setSavedIds((prev) => new Set([...prev, jawabanId]));
      setTimeout(() => setSavedIds((prev) => { const n = new Set(prev); n.delete(jawabanId); return n; }), 2000);
    }

    setSaving(null);
  };

  const filteredJawaban = jawabanList.filter((j) => {
    if (filter === 'belum') return j.benar === null;
    if (filter === 'sudah') return j.benar !== null;
    return true;
  });

  const totalEssay = jawabanList.length;
  const sudahGraded = jawabanList.filter((j) => j.benar !== null).length;
  const belumGraded = totalEssay - sudahGraded;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">←</button>
            <div>
              <h1 className="text-lg font-bold text-slate-800">✍️ Essay Grading</h1>
              <p className="text-xs text-slate-500">{kuis?.judul}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">{belumGraded} belum dinilai</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">{sudahGraded} selesai</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        {/* Progress bar */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 font-medium">Progress Grading</span>
            <span className="text-slate-800 font-bold">{totalEssay > 0 ? Math.round((sudahGraded / totalEssay) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
              style={{ width: `${totalEssay > 0 ? (sudahGraded / totalEssay) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{sudahGraded} dari {totalEssay} jawaban dinilai</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['semua', 'belum', 'sudah'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {f === 'semua' ? `Semua (${totalEssay})` : f === 'belum' ? `Belum Dinilai (${belumGraded})` : `Sudah Dinilai (${sudahGraded})`}
            </button>
          ))}
        </div>

        {/* Jawaban List */}
        {filteredJawaban.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <p className="text-4xl mb-3">{filter === 'belum' ? '🎉' : '📭'}</p>
            <p className="text-slate-600 font-medium">
              {filter === 'belum' ? 'Semua essay sudah dinilai!' : 'Belum ada jawaban essay'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJawaban.map((j) => {
              const g = grades[j.id] || { poin: 0, feedback: '' };
              const isSaved = savedIds.has(j.id);
              const isSaving = saving === j.id;
              const sudahDinilai = j.benar !== null;
              const pctPoin = j.poin_max > 0 ? (g.poin / j.poin_max) * 100 : 0;

              return (
                <div key={j.id} className={`bg-white rounded-xl border transition-all ${sudahDinilai ? 'border-green-200' : 'border-slate-200'}`}>
                  {/* Siswa info */}
                  <div className={`px-5 py-3 border-b flex items-center justify-between rounded-t-xl ${sudahDinilai ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                        {j.attempt?.siswa?.nama?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{j.attempt?.siswa?.nama}</p>
                        <p className="text-xs text-slate-500">NIS: {j.attempt?.siswa?.nis_nip}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {j.graded_by_ai && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">🤖 AI Scored</span>
                      )}
                      {sudahDinilai && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">✓ Dinilai</span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Soal */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Soal</p>
                      <p className="text-slate-800 text-sm leading-relaxed">{j.soal?.teks}</p>
                    </div>

                    {/* Jawaban siswa */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Jawaban Siswa</p>
                      <div className="bg-slate-50 rounded-lg p-3 text-slate-700 text-sm leading-relaxed min-h-[60px]">
                        {j.jawaban || <span className="text-slate-400 italic">Tidak ada jawaban</span>}
                      </div>
                    </div>

                    {/* Kunci jawaban */}
                    {j.soal?.jawaban_benar && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Contoh Jawaban Ideal</p>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-green-800 text-sm leading-relaxed">
                          {j.soal.jawaban_benar}
                        </div>
                      </div>
                    )}

                    {/* Poin slider */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Poin</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-violet-600">{g.poin}</span>
                          <span className="text-slate-400 text-sm">/ {j.poin_max}</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={j.poin_max}
                        step={0.5}
                        value={g.poin}
                        onChange={(e) => setGrades((prev) => ({ ...prev, [j.id]: { ...prev[j.id], poin: parseFloat(e.target.value) } }))}
                        className="w-full accent-violet-600"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>0</span>
                        <div className="flex gap-3">
                          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                            <button
                              key={pct}
                              onClick={() => setGrades((prev) => ({ ...prev, [j.id]: { ...prev[j.id], poin: Math.round(j.poin_max * pct * 2) / 2 } }))}
                              className="text-violet-500 hover:text-violet-700 font-medium"
                            >
                              {pct * 100}%
                            </button>
                          ))}
                        </div>
                        <span>{j.poin_max}</span>
                      </div>
                      {/* Poin bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full transition-all ${pctPoin >= 75 ? 'bg-green-500' : pctPoin >= 50 ? 'bg-blue-500' : pctPoin >= 25 ? 'bg-amber-500' : 'bg-red-400'}`}
                          style={{ width: `${pctPoin}%` }}
                        />
                      </div>
                    </div>

                    {/* Feedback */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Feedback (opsional)</p>
                      <textarea
                        rows={2}
                        value={g.feedback}
                        onChange={(e) => setGrades((prev) => ({ ...prev, [j.id]: { ...prev[j.id], feedback: e.target.value } }))}
                        placeholder="Tulis feedback untuk siswa..."
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none text-slate-700"
                      />
                    </div>

                    {/* Save button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => saveGrade(j.id)}
                        disabled={isSaving}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                          isSaved
                            ? 'bg-green-500 text-white'
                            : 'bg-violet-600 hover:bg-violet-700 text-white'
                        } disabled:opacity-60`}
                      >
                        {isSaving ? '⏳ Menyimpan...' : isSaved ? '✓ Tersimpan!' : 'Simpan Nilai'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
