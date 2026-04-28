// lib/kuis.ts
// ============================================================
// SANDEQ Kuis System - Central Logic
// ============================================================

import { supabase } from './supabase';

// ============================================================
// TYPES
// ============================================================

export type SoalTipe = 'pg' | 'true_false' | 'isian' | 'matching' | 'essay';

export interface Soal {
  id: string;
  kuis_id: string;
  teks: string;
  tipe: SoalTipe;
  pilihan?: any; // jsonb - untuk PG: array string. untuk matching: {kolom_a, kolom_b}
  jawaban_benar?: string;
  kunci_jawaban_alt?: string[]; // untuk isian (alternative jawaban)
  matching_pairs?: any; // {pairs: [...], correct: {...}}
  poin: number;
  penjelasan?: string;
  urutan: number;
}

export interface Kuis {
  id: string;
  judul: string;
  mapel: string;
  kelas_id: string;
  guru_id: string;
  tipe?: string;
  deskripsi?: string;
  durasi_menit: number;
  jumlah_soal?: number;
  shuffle_soal: boolean;
  shuffle_pilihan: boolean;
  tampilkan_jawaban: boolean;
  kkm: number;
  max_attempt: number;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  is_published: boolean;
  total_poin: number;
  created_at: string;
}

export interface KuisAttempt {
  id: string;
  user_id: string;
  kuis_id: string;
  attempt_number: number;
  started_at: string;
  submitted_at?: string;
  selesai: boolean;
  durasi_aktual_detik: number;
  nilai_pg: number;
  nilai_essay: number;
  nilai_total: number;
  nilai_persen: number;
  needs_grading: boolean;
  graded_by?: string;
  graded_at?: string;
  feedback_guru?: string;
}

export interface JawabanAttempt {
  id: string;
  attempt_id: string;
  soal_id: string;
  jawaban?: string;
  jawaban_jsonb?: any;
  benar?: boolean | null;
  poin_didapat: number;
  poin_max: number;
  feedback?: string;
  graded_by_ai: boolean;
  ai_confidence?: number;
  waktu_jawab: number;
}

export interface KuisAnalytics {
  kuis_id: string;
  total_peserta: number;
  total_selesai: number;
  rata_rata: number;
  median: number;
  nilai_tertinggi: number;
  nilai_terendah: number;
  passing_rate: number;
  rata_durasi_detik: number;
  last_calculated: string;
}

// ============================================================
// SOAL HELPERS
// ============================================================

export const SOAL_TIPE_LABELS: Record<SoalTipe, string> = {
  pg: 'Pilihan Ganda',
  true_false: 'Benar / Salah',
  isian: 'Isian Singkat',
  matching: 'Mencocokkan',
  essay: 'Essay',
};

export const SOAL_TIPE_ICONS: Record<SoalTipe, string> = {
  pg: '📝',
  true_false: '✓✗',
  isian: '✏️',
  matching: '🔗',
  essay: '📄',
};

export const SOAL_TIPE_DESCRIPTIONS: Record<SoalTipe, string> = {
  pg: 'Siswa pilih 1 dari beberapa opsi (A, B, C, D)',
  true_false: 'Siswa pilih Benar atau Salah',
  isian: 'Siswa ketik jawaban singkat (auto-grade fuzzy match)',
  matching: 'Siswa cocokkan item kolom A dengan kolom B',
  essay: 'Siswa tulis jawaban panjang (manual / AI grading)',
};

// Buat soal kosong sesuai tipe
export function createEmptySoal(tipe: SoalTipe, kuisId: string, urutan: number): Partial<Soal> {
  const base = {
    kuis_id: kuisId,
    teks: '',
    tipe,
    poin: 1,
    urutan,
    penjelasan: '',
  };

  switch (tipe) {
    case 'pg':
      return {
        ...base,
        pilihan: ['', '', '', ''],
        jawaban_benar: '',
      };
    case 'true_false':
      return {
        ...base,
        pilihan: ['Benar', 'Salah'],
        jawaban_benar: '',
      };
    case 'isian':
      return {
        ...base,
        jawaban_benar: '',
        kunci_jawaban_alt: [],
      };
    case 'matching':
      return {
        ...base,
        matching_pairs: {
          pairs: [
            { id: 'A', kiri: '', kanan: '1' },
            { id: 'B', kiri: '', kanan: '2' },
          ],
          correct: { A: '1', B: '2' },
        },
      };
    case 'essay':
      return {
        ...base,
        jawaban_benar: '', // contoh jawaban ideal untuk grading
        poin: 10,
      };
  }
}

// ============================================================
// KUIS CRUD (untuk guru)
// ============================================================

export async function createKuis(data: Partial<Kuis>): Promise<Kuis | null> {
  const { data: kuis, error } = await supabase
    .from('kuis')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating kuis:', error);
    return null;
  }
  return kuis;
}

export async function updateKuis(id: string, data: Partial<Kuis>): Promise<boolean> {
  const { error } = await supabase.from('kuis').update(data).eq('id', id);
  return !error;
}

export async function publishKuis(id: string): Promise<boolean> {
  return await updateKuis(id, { is_published: true });
}

export async function getKuisWithSoal(kuisId: string): Promise<{ kuis: Kuis; soal: Soal[] } | null> {
  const { data: kuis } = await supabase.from('kuis').select('*').eq('id', kuisId).single();
  if (!kuis) return null;

  const { data: soal } = await supabase
    .from('soal')
    .select('*')
    .eq('kuis_id', kuisId)
    .order('urutan', { ascending: true });

  return { kuis, soal: soal || [] };
}

// ============================================================
// SOAL CRUD
// ============================================================

export async function saveSoal(soal: Partial<Soal>): Promise<Soal | null> {
  if (soal.id) {
    const { data, error } = await supabase
      .from('soal')
      .update(soal)
      .eq('id', soal.id)
      .select()
      .single();
    return error ? null : data;
  } else {
    const { data, error } = await supabase.from('soal').insert(soal).select().single();
    return error ? null : data;
  }
}

export async function deleteSoal(soalId: string): Promise<boolean> {
  const { error } = await supabase.from('soal').delete().eq('id', soalId);
  return !error;
}

export async function reorderSoal(soalIds: string[]): Promise<void> {
  // Update urutan sesuai array index
  for (let i = 0; i < soalIds.length; i++) {
    await supabase.from('soal').update({ urutan: i }).eq('id', soalIds[i]);
  }
}

// ============================================================
// ATTEMPT FLOW (siswa)
// ============================================================

export async function startAttempt(userId: string, kuisId: string): Promise<KuisAttempt | null> {
  // Cek attempt yang masih on-going
  const { data: ongoing } = await supabase
    .from('kuis_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('kuis_id', kuisId)
    .eq('selesai', false)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ongoing) {
    return ongoing;
  }

  // Cek max_attempt
  const { count: prevAttempts } = await supabase
    .from('kuis_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('kuis_id', kuisId);

  const { data: kuis } = await supabase
    .from('kuis')
    .select('max_attempt')
    .eq('id', kuisId)
    .single();

  const maxAttempt = kuis?.max_attempt || 1;
  const currentNum = (prevAttempts || 0) + 1;

  if (currentNum > maxAttempt) {
    console.error('Max attempt reached');
    return null;
  }

  // Buat attempt baru
  const { data, error } = await supabase
    .from('kuis_attempts')
    .insert({
      user_id: userId,
      kuis_id: kuisId,
      attempt_number: currentNum,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error starting attempt:', error);
    return null;
  }
  return data;
}

export async function saveJawaban(
  attemptId: string,
  soalId: string,
  jawaban: string | null,
  jawabanJsonb?: any
): Promise<boolean> {
  const { error } = await supabase
    .from('jawaban_attempts')
    .upsert(
      {
        attempt_id: attemptId,
        soal_id: soalId,
        jawaban: jawaban,
        jawaban_jsonb: jawabanJsonb || null,
      },
      { onConflict: 'attempt_id,soal_id' }
    );

  return !error;
}

export async function submitAttempt(attemptId: string): Promise<any> {
  // Update durasi aktual
  const { data: attempt } = await supabase
    .from('kuis_attempts')
    .select('started_at')
    .eq('id', attemptId)
    .single();

  if (attempt) {
    const durasi = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
    await supabase
      .from('kuis_attempts')
      .update({ durasi_aktual_detik: durasi, submitted_at: new Date().toISOString() })
      .eq('id', attemptId);
  }

  // Trigger auto-grade via RPC
  const { data, error } = await supabase.rpc('auto_grade_attempt', {
    p_attempt_id: attemptId,
  });

  if (error) {
    console.error('Auto-grade error:', error);
    return null;
  }
  return data;
}

export async function getAttemptResult(attemptId: string): Promise<{
  attempt: KuisAttempt;
  jawaban: (JawabanAttempt & { soal: Soal })[];
} | null> {
  const { data: attempt } = await supabase
    .from('kuis_attempts')
    .select('*')
    .eq('id', attemptId)
    .single();

  if (!attempt) return null;

  const { data: jawaban } = await supabase
    .from('jawaban_attempts')
    .select('*, soal:soal_id(*)')
    .eq('attempt_id', attemptId);

  return { attempt, jawaban: (jawaban || []) as any };
}

// ============================================================
// GURU: GRADING
// ============================================================

export async function gradeJawaban(
  jawabanId: string,
  poin: number,
  feedback: string,
  graderId: string
): Promise<boolean> {
  const { data: jawaban } = await supabase
    .from('jawaban_attempts')
    .select('attempt_id, poin_max')
    .eq('id', jawabanId)
    .single();

  if (!jawaban) return false;

  const benar = poin >= jawaban.poin_max * 0.5;

  const { error } = await supabase
    .from('jawaban_attempts')
    .update({
      poin_didapat: poin,
      benar,
      feedback,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jawabanId);

  if (error) return false;

  // Recalc total essay score di attempt
  await recalcAttemptEssayScore(jawaban.attempt_id, graderId);

  return true;
}

async function recalcAttemptEssayScore(attemptId: string, graderId: string): Promise<void> {
  // Hitung total nilai essay
  const { data: jawabans } = await supabase
    .from('jawaban_attempts')
    .select('poin_didapat, soal:soal_id(tipe)')
    .eq('attempt_id', attemptId);

  if (!jawabans) return;

  const nilaiEssay = jawabans
    .filter((j: any) => j.soal?.tipe === 'essay')
    .reduce((sum: number, j: any) => sum + (j.poin_didapat || 0), 0);

  // Cek apakah masih ada yang perlu grading
  const { count: ungraded } = await supabase
    .from('jawaban_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('attempt_id', attemptId)
    .is('benar', null);

  // Get nilai_pg
  const { data: attempt } = await supabase
    .from('kuis_attempts')
    .select('nilai_pg')
    .eq('id', attemptId)
    .single();

  const totalNilai = (attempt?.nilai_pg || 0) + nilaiEssay;

  await supabase
    .from('kuis_attempts')
    .update({
      nilai_essay: nilaiEssay,
      nilai_total: totalNilai,
      needs_grading: (ungraded || 0) > 0,
      graded_by: graderId,
      graded_at: new Date().toISOString(),
    })
    .eq('id', attemptId);
}

// ============================================================
// GURU: ANALYTICS
// ============================================================

export async function getKuisAnalytics(kuisId: string): Promise<KuisAnalytics | null> {
  const { data } = await supabase
    .from('kuis_analytics')
    .select('*')
    .eq('kuis_id', kuisId)
    .maybeSingle();

  return data;
}

export async function getAtRiskStudents(kelasId?: string): Promise<any[]> {
  let query = supabase.from('at_risk_students').select('*');
  if (kelasId) {
    query = query.eq('kelas_id', kelasId);
  }

  const { data } = await query
    .order('hari_tidak_aktif', { ascending: false })
    .limit(20);

  return data || [];
}

export async function getKelasOverview(kelasId: string): Promise<any> {
  // Total siswa
  const { count: totalSiswa } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'siswa')
    .eq('kelas_id', kelasId);

  // Total materi
  const { count: totalMateri } = await supabase
    .from('materi')
    .select('id', { count: 'exact', head: true })
    .eq('kelas_id', kelasId);

  // Total kuis
  const { count: totalKuis } = await supabase
    .from('kuis')
    .select('id', { count: 'exact', head: true })
    .eq('kelas_id', kelasId);

  // Avg XP & level
  const { data: users } = await supabase
    .from('users')
    .select('xp, level, current_streak')
    .eq('role', 'siswa')
    .eq('kelas_id', kelasId);

  const avgXp = users?.length ? users.reduce((s, u) => s + (u.xp || 0), 0) / users.length : 0;
  const avgLevel = users?.length ? users.reduce((s, u) => s + (u.level || 1), 0) / users.length : 0;
  const activeStreak = users?.filter((u) => (u.current_streak || 0) > 0).length || 0;

  return {
    total_siswa: totalSiswa || 0,
    total_materi: totalMateri || 0,
    total_kuis: totalKuis || 0,
    avg_xp: Math.round(avgXp),
    avg_level: avgLevel.toFixed(1),
    active_streak: activeStreak,
  };
}

export async function getKuisListWithAnalytics(kelasId?: string): Promise<any[]> {
  let query = supabase
    .from('kuis')
    .select('*, analytics:kuis_analytics(*)')
    .order('created_at', { ascending: false });

  if (kelasId) {
    query = query.eq('kelas_id', kelasId);
  }

  const { data } = await query;
  return data || [];
}

// ============================================================
// VALIDASI
// ============================================================

export function validateKuis(kuis: Partial<Kuis>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!kuis.judul || kuis.judul.trim().length < 3) {
    errors.push('Judul minimal 3 karakter');
  }
  if (!kuis.mapel) errors.push('Mapel harus diisi');
  if (!kuis.kelas_id) errors.push('Kelas harus dipilih');
  if (!kuis.durasi_menit || kuis.durasi_menit < 1) {
    errors.push('Durasi minimal 1 menit');
  }
  if (kuis.kkm !== undefined && (kuis.kkm < 0 || kuis.kkm > 100)) {
    errors.push('KKM harus antara 0-100');
  }

  return { valid: errors.length === 0, errors };
}

export function validateSoal(soal: Partial<Soal>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!soal.teks || soal.teks.trim().length < 5) {
    errors.push('Teks soal minimal 5 karakter');
  }

  if (soal.tipe === 'pg' || soal.tipe === 'true_false') {
    if (!soal.pilihan || !Array.isArray(soal.pilihan) || soal.pilihan.length < 2) {
      errors.push('Minimal 2 pilihan jawaban');
    }
    if (soal.pilihan?.some((p: string) => !p || p.trim() === '')) {
      errors.push('Semua pilihan harus diisi');
    }
    if (!soal.jawaban_benar) errors.push('Pilih jawaban yang benar');
  }

  if (soal.tipe === 'isian' && !soal.jawaban_benar) {
    errors.push('Jawaban benar harus diisi');
  }

  if (soal.tipe === 'matching') {
    const pairs = soal.matching_pairs?.pairs || [];
    if (pairs.length < 2) {
      errors.push('Minimal 2 pasangan matching');
    }
    if (pairs.some((p: any) => !p.kiri || !p.kanan)) {
      errors.push('Semua pasangan harus diisi');
    }
  }

  if (!soal.poin || soal.poin < 1) {
    errors.push('Poin minimal 1');
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// HELPER UTILITIES
// ============================================================

export function formatDuration(detik: number): string {
  if (detik < 60) return `${detik} detik`;
  const menit = Math.floor(detik / 60);
  const sisaDetik = detik % 60;
  if (menit < 60) return `${menit}m ${sisaDetik}s`;
  const jam = Math.floor(menit / 60);
  const sisaMenit = menit % 60;
  return `${jam}j ${sisaMenit}m`;
}

export function getNilaiColor(nilai: number, kkm: number = 75): string {
  if (nilai >= kkm + 15) return 'text-green-600';
  if (nilai >= kkm) return 'text-blue-600';
  if (nilai >= kkm - 15) return 'text-yellow-600';
  return 'text-red-600';
}

export function getNilaiLabel(nilai: number, kkm: number = 75): string {
  if (nilai >= 90) return 'Sangat Baik';
  if (nilai >= kkm) return 'Tuntas';
  if (nilai >= kkm - 15) return 'Hampir Tuntas';
  return 'Belum Tuntas';
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
