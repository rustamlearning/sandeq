// lib/dimensi.ts
// 8 Dimensi Profil Lulusan — Permendikdasmen No.10/2025

import { supabase } from './supabase'

export const DIMENSI = {
  olah_pikir: {
    label: 'Olah Pikir',
    emoji: '🧠',
    warna: 'bg-blue-100 text-blue-700',
    deskripsi: 'Penalaran kritis, kreativitas, pemecahan masalah',
  },
  olah_hati: {
    label: 'Olah Hati',
    emoji: '❤️',
    warna: 'bg-rose-100 text-rose-700',
    deskripsi: 'Keimanan, ketakwaan, akhlak mulia, integritas',
  },
  olah_rasa: {
    label: 'Olah Rasa',
    emoji: '🎨',
    warna: 'bg-purple-100 text-purple-700',
    deskripsi: 'Kepekaan estetika, seni, kreativitas ekspresif',
  },
  olah_raga: {
    label: 'Olah Raga',
    emoji: '💪',
    warna: 'bg-green-100 text-green-700',
    deskripsi: 'Kesehatan fisik, kebugaran, sportivitas',
  },
} as const

export type DimensiKey = keyof typeof DIMENSI

// Auto-tag dimensi berdasarkan mapel
export function getDimensiFromMapel(mapel: string): DimensiKey[] {
  const m = mapel.toLowerCase()
  if (['matematika', 'fisika', 'kimia', 'biologi', 'informatika', 'ekonomi'].some(x => m.includes(x))) {
    return ['olah_pikir']
  }
  if (['agama', 'pkn', 'ppkn', 'pancasila'].some(x => m.includes(x))) {
    return ['olah_hati', 'olah_pikir']
  }
  if (['seni', 'prakarya', 'budaya'].some(x => m.includes(x))) {
    return ['olah_rasa', 'olah_pikir']
  }
  if (['pjok', 'olahraga', 'penjas'].some(x => m.includes(x))) {
    return ['olah_raga', 'olah_hati']
  }
  if (['bahasa', 'sastra', 'sejarah', 'sosiologi', 'geografi'].some(x => m.includes(x))) {
    return ['olah_pikir', 'olah_rasa']
  }
  return ['olah_pikir']
}

// Catat aktivitas dengan dimensi
export async function catatDimensiAktivitas(
  userId: string,
  tipeAktivitas: 'materi' | 'kuis' | 'forum' | 'checkin' | 'tutor',
  sourceId: string | null,
  dimensi: DimensiKey[],
  deskripsi?: string
) {
  if (!dimensi.length) return
  await supabase.from('dimensi_aktivitas').insert({
    user_id: userId,
    tipe_aktivitas: tipeAktivitas,
    source_id: sourceId,
    dimensi,
    deskripsi,
  })
}

// Ambil summary dimensi per siswa
export async function getDimensiSummary(userId: string): Promise<Record<DimensiKey, number>> {
  const { data } = await supabase
    .from('dimensi_aktivitas')
    .select('dimensi')
    .eq('user_id', userId)

  const counts: Record<DimensiKey, number> = {
    olah_pikir: 0,
    olah_hati: 0,
    olah_rasa: 0,
    olah_raga: 0,
  }

  for (const row of data || []) {
    for (const d of row.dimensi || []) {
      if (d in counts) counts[d as DimensiKey]++
    }
  }

  return counts
}

// Ambil summary dimensi seluruh kelas (untuk guru)
export async function getDimensiKelas(kelasId: string): Promise<Record<DimensiKey, number>> {
  const { data: siswa } = await supabase
    .from('users')
    .select('id')
    .eq('kelas_id', kelasId)
    .eq('role', 'siswa')

  if (!siswa?.length) return { olah_pikir: 0, olah_hati: 0, olah_rasa: 0, olah_raga: 0 }

  const ids = siswa.map(s => s.id)
  const { data } = await supabase
    .from('dimensi_aktivitas')
    .select('dimensi')
    .in('user_id', ids)

  const counts: Record<DimensiKey, number> = {
    olah_pikir: 0, olah_hati: 0, olah_rasa: 0, olah_raga: 0,
  }

  for (const row of data || []) {
    for (const d of row.dimensi || []) {
      if (d in counts) counts[d as DimensiKey]++
    }
  }

  return counts
}