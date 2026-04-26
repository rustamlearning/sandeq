import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Type definitions untuk database
export type UserRole = 'siswa' | 'guru' | 'admin'

export interface User {
  id: string
  nis_nip: string
  nama: string
  role: UserRole
  kelas_id: string | null
  aktif: boolean
  created_at: string
}

export interface Kelas {
  id: string
  nama: string
  tingkat: number
  tahun_ajaran: string
}

export interface Materi {
  id: string
  judul: string
  mapel: string
  kelas_id: string
  guru_id: string
  bab: string | null
  konten: string | null
  created_at: string
  updated_at: string
}

export interface Kuis {
  id: string
  judul: string
  mapel: string
  kelas_id: string
  guru_id: string
  tipe: 'latihan' | 'ulangan'
  durasi_menit: number | null
  aktif: boolean
  created_at: string
}

export interface Soal {
  id: string
  kuis_id: string
  teks: string
  tipe: 'pilgan' | 'benar_salah' | 'isian'
  pilihan: string[] | null
  jawaban: string
  pembahasan: string | null
}

export interface Absensi {
  id: string
  siswa_id: string
  jadwal_id: string
  tanggal: string
  status: 'hadir' | 'sakit' | 'izin' | 'alpha'
  dicatat_oleh: string
  catatan: string | null
  created_at: string
}

export interface Nilai {
  id: string
  siswa_id: string
  mapel: string
  komponen: string
  bobot: number
  nilai: number
  semester: number
  diinput_oleh: string
  catatan: string | null
  created_at: string
}

export interface Pengumuman {
  id: string
  judul: string
  konten: string
  kategori: 'akademik' | 'kegiatan' | 'darurat' | 'umum'
  target: string
  dipin: boolean
  created_by: string
  created_at: string
}