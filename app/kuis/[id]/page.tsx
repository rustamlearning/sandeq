// app/kuis/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuthStore } from '@/lib/store/auth';
import { db, Kuis, Soal, Pengerjaan } from '@/lib/db/schema';
import {
  ArrowLeft, Clock, ChevronLeft, ChevronRight, CheckCircle2,
  XCircle, Award, AlertCircle, Send
} from 'lucide-react';

export default function KuisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [kuis, setKuis] = useState<Kuis | null>(null);
  const [soal, setSoal] = useState<Soal[]>([]);
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<Pengerjaan | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      if (!id || !user) return;
      const k = await db.kuis.get(id as string);
      if (!k) return;
      setKuis(k);
      const sList = await db.soal.where('kuisId').equals(id as string).toArray();
      // Acak urutan soal (simple shuffle)
      const shuffled = [...sList].sort(() => Math.random() - 0.5);
      setSoal(shuffled);

      // Cek apakah sudah pernah mengerjakan
      if (user.role === 'siswa') {
        const existing = await db.pengerjaan
          .where('siswaId').equals(user.id)
          .and((p) => p.kuisId === id)
          .first();
        if (existing) {
          setResult(existing);
          setAnswers(existing.jawabanSiswa);
          setSubmitted(true);
        }
      }
    }
    load();
  }, [id, user]);

  const startQuiz = () => {
    setStarted(true);
    if (kuis?.durasiMenit) {
      setTimeLeft(kuis.durasiMenit * 60);
    }
  };

  useEffect(() => {
    if (!started || submitted || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft((t) => (t ?? 0) - 1), 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, started, submitted]);

  const handleSubmit = async () => {
    if (!kuis || !user) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    // Hitung skor
    let correct = 0;
    soal.forEach((s) => {
      const ans = (answers[s.id] || '').trim();
      const correctAns = s.jawaban.trim();
      if (s.tipe === 'isian') {
        if (ans.toLowerCase() === correctAns.toLowerCase()) correct++;
      } else {
        if (ans === correctAns) correct++;
      }
    });
    const skor = soal.length > 0 ? (correct / soal.length) * 100 : 0;

    const pengerjaan: Pengerjaan = {
      id: `p-${user.id}-${kuis.id}`,
      siswaId: user.id,
      kuisId: kuis.id,
      jawabanSiswa: answers,
      skor,
      dikerjakanAt: new Date().toISOString(),
      syncedAt: navigator.onLine ? new Date().toISOString() : undefined,
    };
    await db.pengerjaan.put(pengerjaan);

    // Tambahkan ke sync queue jika offline
    if (!navigator.onLine) {
      await db.syncQueue.add({
        type: 'pengerjaan',
        action: 'create',
        data: pengerjaan,
        createdAt: new Date().toISOString(),
      });
    }

    setResult(pengerjaan);
    setSubmitted(true);
    setStarted(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (!kuis) {
    return (
      <AppShell>
        <div className="p-6 text-center text-gray-500">Memuat kuis...</div>
      </AppShell>
    );
  }

  // View hasil
  if (submitted && result) {
    const correctCount = soal.filter((s) => {
      const ans = (result.jawabanSiswa[s.id] || '').trim();
      return s.tipe === 'isian'
        ? ans.toLowerCase() === s.jawaban.trim().toLowerCase()
        : ans === s.jawaban.trim();
    }).length;

    return (
      <AppShell>
        <div className="p-4 md:p-6 max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/kuis')}
            className="flex items-center gap-1 text-sm text-gray-600 mb-4 hover:text-[#1A4A7A]"
          >
            <ArrowLeft size={16} /> Kembali ke daftar kuis
          </button>

          {/* Hasil */}
          <div className="bg-gradient-to-br from-[#1A4A7A] to-[#2E86C1] rounded-2xl p-6 text-white mb-5 text-center">
            <Award className="mx-auto mb-2" size={48} />
            <p className="text-sm opacity-90 mb-1">Kuis Selesai!</p>
            <h2 className="text-4xl font-bold mb-1">{result.skor?.toFixed(0)}</h2>
            <p className="text-xs opacity-80">
              {correctCount} benar dari {soal.length} soal
            </p>
            {!result.syncedAt && (
              <p className="text-xs mt-3 bg-white/20 px-3 py-1 rounded-full inline-block">
                📡 Akan tersinkronisasi saat online
              </p>
            )}
          </div>

          {/* Pembahasan */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1A4A7A] mb-2">Pembahasan</h3>
            {soal.map((s, idx) => {
              const userAns = result.jawabanSiswa[s.id] || '';
              const correct = s.tipe === 'isian'
                ? userAns.toLowerCase().trim() === s.jawaban.toLowerCase().trim()
                : userAns === s.jawaban;
              return (
                <div key={s.id} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-start gap-2 mb-2">
                    {correct ? (
                      <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="font-semibold text-sm flex-1">
                      <span className="text-gray-400">{idx + 1}.</span> {s.teks}
                    </p>
                  </div>
                  <div className="ml-7 space-y-1 text-xs">
                    <p>
                      <span className="text-gray-500">Jawabanmu:</span>{' '}
                      <span className={correct ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                        {userAns ? (s.tipe === 'pilgan' && s.pilihan ? `${userAns}. ${s.pilihan[userAns]}` : userAns) : '(kosong)'}
                      </span>
                    </p>
                    {!correct && (
                      <p>
                        <span className="text-gray-500">Jawaban benar:</span>{' '}
                        <span className="text-green-700 font-semibold">
                          {s.tipe === 'pilgan' && s.pilihan ? `${s.jawaban}. ${s.pilihan[s.jawaban]}` : s.jawaban}
                        </span>
                      </p>
                    )}
                    {s.pembahasan && (
                      <div className="mt-2 p-2 bg-[#F4F9FF] rounded text-gray-700">
                        💡 {s.pembahasan}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AppShell>
    );
  }

  // View pra-start
  if (!started) {
    return (
      <AppShell>
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-600 mb-4 hover:text-[#1A4A7A]"
          >
            <ArrowLeft size={16} /> Kembali
          </button>

          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#F4F9FF] flex items-center justify-center">
              <Award size={40} className="text-[#1A4A7A]" />
            </div>
            <span className="text-xs uppercase font-semibold text-[#E67E22]">{kuis.tipe}</span>
            <h1 className="text-2xl font-bold text-[#1A4A7A] mt-1 mb-1">{kuis.judul}</h1>
            <p className="text-sm text-gray-500 mb-6">{kuis.mapel}</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-[#F4F9FF] rounded-lg">
                <p className="text-xs text-gray-500">Jumlah Soal</p>
                <p className="text-xl font-bold text-[#1A4A7A]">{soal.length}</p>
              </div>
              <div className="p-3 bg-[#F4F9FF] rounded-lg">
                <p className="text-xs text-gray-500">Durasi</p>
                <p className="text-xl font-bold text-[#1A4A7A]">
                  {kuis.durasiMenit ? `${kuis.durasiMenit} mnt` : 'Bebas'}
                </p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6 text-left">
              <div className="flex gap-2">
                <AlertCircle size={18} className="text-[#E67E22] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-700">
                  <p className="font-semibold mb-1">Sebelum mulai:</p>
                  <ul className="list-disc ml-4 space-y-0.5">
                    <li>Kuis dapat dikerjakan offline sepenuhnya</li>
                    <li>Jawaban tersimpan otomatis di perangkatmu</li>
                    <li>Hasil akan tersinkronisasi saat online</li>
                    {kuis.durasiMenit && <li>Waktu akan otomatis berjalan setelah mulai</li>}
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={startQuiz}
              disabled={soal.length === 0}
              className="w-full bg-[#1A4A7A] hover:bg-[#153c61] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {soal.length === 0 ? 'Belum ada soal' : 'Mulai Kuis'}
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // View mengerjakan
  const current = soal[currentIdx];
  const answeredCount = Object.values(answers).filter((a) => a).length;

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        {/* Header dengan timer */}
        <div className="sticky top-[60px] md:top-0 z-10 bg-[#F4F9FF] pb-3 mb-3">
          <div className="flex items-center justify-between gap-3 bg-white rounded-xl p-3 border border-gray-100">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Soal {currentIdx + 1} dari {soal.length}</p>
              <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-[#2E86C1] h-1.5 rounded-full transition-all"
                  style={{ width: `${((currentIdx + 1) / soal.length) * 100}%` }}
                ></div>
              </div>
            </div>
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${
                  timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-[#F4F9FF] text-[#1A4A7A]'
                }`}
              >
                <Clock size={14} />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
        </div>

        {/* Soal */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 mb-4">
          <p className="text-xs text-[#E67E22] font-semibold uppercase mb-2">
            {current.tipe === 'pilgan' ? 'Pilihan Ganda' : current.tipe === 'benar_salah' ? 'Benar/Salah' : 'Isian Singkat'}
          </p>
          <p className="text-base md:text-lg font-semibold text-gray-800 mb-5 leading-relaxed">
            {current.teks}
          </p>

          {/* Pilihan jawaban */}
          {current.tipe === 'pilgan' && current.pilihan && (
            <div className="space-y-2">
              {Object.entries(current.pilihan).map(([key, val]) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${
                    answers[current.id] === key
                      ? 'border-[#2E86C1] bg-[#F4F9FF]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={current.id}
                    value={key}
                    checked={answers[current.id] === key}
                    onChange={() => setAnswers({ ...answers, [current.id]: key })}
                    className="sr-only"
                  />
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      answers[current.id] === key
                        ? 'bg-[#2E86C1] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {key}
                  </span>
                  <span className="text-sm text-gray-700">{val}</span>
                </label>
              ))}
            </div>
          )}

          {current.tipe === 'benar_salah' && (
            <div className="grid grid-cols-2 gap-3">
              {['Benar', 'Salah'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [current.id]: opt })}
                  className={`p-4 border-2 rounded-lg font-semibold transition ${
                    answers[current.id] === opt
                      ? opt === 'Benar'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {current.tipe === 'isian' && (
            <input
              type="text"
              value={answers[current.id] || ''}
              onChange={(e) => setAnswers({ ...answers, [current.id]: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#2E86C1] outline-none"
              placeholder="Ketik jawabanmu di sini..."
            />
          )}
        </div>

        {/* Navigasi */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Sebelumnya
          </button>
          {currentIdx < soal.length - 1 ? (
            <button
              onClick={() => setCurrentIdx(currentIdx + 1)}
              className="flex items-center gap-1 px-4 py-2 bg-[#1A4A7A] text-white rounded-lg text-sm font-medium"
            >
              Selanjutnya <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1 px-4 py-2 bg-[#E67E22] text-white rounded-lg text-sm font-medium hover:bg-[#d56e18]"
            >
              <Send size={14} /> Kumpulkan
            </button>
          )}
        </div>

        {/* Nomor soal */}
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-gray-500 mb-2">
            Status: {answeredCount}/{soal.length} soal terjawab
          </p>
          <div className="grid grid-cols-8 md:grid-cols-10 gap-1.5">
            {soal.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentIdx(idx)}
                className={`aspect-square rounded text-xs font-semibold transition ${
                  idx === currentIdx
                    ? 'bg-[#1A4A7A] text-white ring-2 ring-offset-1 ring-[#1A4A7A]'
                    : answers[s.id]
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}export const runtime = 'edge';
