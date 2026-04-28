'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { Kuis, getAttemptResult, formatDuration, getNilaiColor, getNilaiLabel } from '@/lib/kuis';

export default function KuisResultPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const kuisId = params?.id as string;
  const attemptId = searchParams.get('attempt');

  const [user, setUser] = useState<any>(null);
  const [kuis, setKuis] = useState<Kuis | null>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [jawaban, setJawaban] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    init();
  }, [attemptId]);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setUser(u);

    if (!attemptId) {
      router.push('/siswa/kuis');
      return;
    }

    const { data: k } = await supabase.from('kuis').select('*').eq('id', kuisId).single();
    setKuis(k);

    const result = await getAttemptResult(attemptId);
    if (result) {
      setAttempt(result.attempt);
      setJawaban(result.jawaban || []);
    }

    setLoading(false);
  };

  if (loading || !attempt || !kuis) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // PAKAI nilai_persen LANGSUNG dari DB (sudah di-scale 0-100 oleh trigger)
  const persen = attempt.nilai_persen || 0;
  const totalPoin = jawaban.reduce((s, j) => s + (j.poin_max || 0), 0);
  const lulus = persen >= (kuis.kkm || 75);
  const isPerfect = persen >= 100 && !attempt.needs_grading;

  const correctCount = jawaban.filter((j) => j.benar === true).length;
  const wrongCount = jawaban.filter((j) => j.benar === false).length;
  const ungradedCount = jawaban.filter((j) => j.benar === null).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/siswa/kuis')} className="text-blue-600 text-sm">
            ← Daftar Kuis
          </button>
          <h1 className="text-lg font-bold truncate">Hasil: {kuis.judul}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div
          className={`rounded-2xl shadow-xl p-6 mb-6 text-white ${
            isPerfect
              ? 'bg-gradient-to-br from-yellow-500 via-orange-500 to-pink-600'
              : lulus
              ? 'bg-gradient-to-br from-green-600 to-emerald-700'
              : 'bg-gradient-to-br from-orange-500 to-red-600'
          }`}
        >
          <div className="text-center">
            <div className="text-6xl mb-3">
              {isPerfect ? '🏆' : lulus ? '🎉' : '💪'}
            </div>
            <p className="text-sm uppercase tracking-wider opacity-90">
              {isPerfect && 'PERFECT SCORE!'}
              {!isPerfect && lulus && 'Lulus KKM!'}
              {!lulus && 'Belum Lulus KKM'}
            </p>
            <h2 className="text-5xl font-bold mt-2">
              {persen.toFixed(0)}
            </h2>
            <p className="text-sm mt-1 opacity-90">
              {attempt.nilai_total?.toFixed(1)} dari {totalPoin} poin
            </p>
            <div className="mt-4 inline-block bg-white/20 px-4 py-2 rounded-full">
              <span className="text-sm font-medium">
                {getNilaiLabel(persen, kuis.kkm)}
              </span>
            </div>
            {attempt.needs_grading && (
              <p className="mt-3 text-xs bg-white/20 px-3 py-2 rounded-lg inline-block">
                ⏳ Ada soal essay menunggu dinilai guru. Skor final akan update setelah dinilai.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon="✅" label="Benar" value={correctCount} color="text-green-600" />
          <StatCard icon="❌" label="Salah" value={wrongCount} color="text-red-600" />
          {ungradedCount > 0 && (
            <StatCard icon="⏳" label="Belum dinilai" value={ungradedCount} color="text-yellow-600" />
          )}
          <StatCard icon="⏱️" label="Durasi" value={formatDuration(attempt.durasi_aktual_detik || 0)} color="text-blue-600" />
          <StatCard icon="🎯" label="KKM" value={kuis.kkm || 75} color="text-gray-600" />
        </div>

        {kuis.tampilkan_jawaban !== false && (
          <button
            onClick={() => setShowReview(!showReview)}
            className="w-full bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center justify-between hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <span className="font-medium">
                {showReview ? 'Sembunyikan Review' : 'Lihat Review Jawaban'}
              </span>
            </div>
            <span className="text-blue-600">{showReview ? '▲' : '▼'}</span>
          </button>
        )}

        {showReview && (
          <div className="space-y-3">
            {jawaban.map((j, i) => (
              <ReviewCard key={j.id} jawaban={j} index={i} />
            ))}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push('/siswa/kuis')}
            className="flex-1 px-5 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 font-medium"
          >
            Kembali ke Daftar
          </button>
          <button
            onClick={() => router.push('/siswa')}
            className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
          >
            Ke Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: any; color: string }) {
  return (
    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function ReviewCard({ jawaban, index }: { jawaban: any; index: number }) {
  const soal = jawaban.soal;
  if (!soal) return null;

  const isUngraded = jawaban.benar === null;
  const isCorrect = jawaban.benar === true;

  let bgColor = 'bg-gray-50 border-gray-200';
  let icon = '📝';
  let label = 'Belum dijawab';

  if (isUngraded && jawaban.jawaban) {
    bgColor = 'bg-yellow-50 border-yellow-300';
    icon = '⏳';
    label = 'Menunggu nilai';
  } else if (isCorrect) {
    bgColor = 'bg-green-50 border-green-300';
    icon = '✅';
    label = 'Benar';
  } else if (jawaban.benar === false) {
    bgColor = 'bg-red-50 border-red-300';
    icon = '❌';
    label = 'Salah';
  }

  return (
    <div className={`rounded-xl border-2 p-4 ${bgColor}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-white px-2 py-1 rounded font-bold text-sm">
            #{index + 1}
          </span>
          <span className="text-2xl">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="text-right text-sm">
          <span className="font-bold">{jawaban.poin_didapat || 0}</span>
          <span className="text-gray-500"> / {jawaban.poin_max || 0} poin</span>
        </div>
      </div>

      <p className="font-semibold mb-3">{soal.teks}</p>

      <div className="bg-white/60 rounded-lg p-3 mb-2">
        <p className="text-xs text-gray-500 mb-1">Jawaban kamu:</p>
        <p className="text-sm font-medium">
          {jawaban.jawaban || <span className="italic text-gray-400">Tidak dijawab</span>}
        </p>
      </div>

      {!isCorrect && !isUngraded && soal.jawaban_benar && soal.tipe !== 'essay' && (
        <div className="bg-green-100 rounded-lg p-3 mb-2">
          <p className="text-xs text-green-700 mb-1">Jawaban benar:</p>
          <p className="text-sm font-medium text-green-900">{soal.jawaban_benar}</p>
        </div>
      )}

      {soal.penjelasan && (
        <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
          <p className="text-xs text-blue-700 font-medium mb-1">💡 Penjelasan:</p>
          <p className="text-sm text-blue-900">{soal.penjelasan}</p>
        </div>
      )}

      {jawaban.feedback && (
        <div className="mt-2 p-3 bg-purple-50 border-l-4 border-purple-400 rounded">
          <p className="text-xs text-purple-700 font-medium mb-1">👨‍🏫 Feedback Guru:</p>
          <p className="text-sm text-purple-900">{jawaban.feedback}</p>
        </div>
      )}
    </div>
  );
}
