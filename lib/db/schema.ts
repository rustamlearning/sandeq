// lib/db/schema.ts
import Dexie, { Table } from 'dexie';

export type UserRole = 'siswa' | 'guru' | 'admin';

export interface User {
  id: string;
  nisNip: string;
  nama: string;
  role: UserRole;
  kelasId?: string;
  passwordHash: string;
  aktif: boolean;
  createdAt: string;
}

export interface Kelas {
  id: string;
  nama: string;
  tingkat: number;
  tahunAjaran: string;
}

export interface Materi {
  id: string;
  judul: string;
  mapel: string;
  kelasId: string;
  guruId: string;
  bab: string;
  konten: string; // rich text / markdown
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Kuis {
  id: string;
  judul: string;
  mapel: string;
  kelasId: string;
  guruId: string;
  tipe: 'latihan' | 'ulangan';
  durasiMenit?: number;
  aktif: boolean;
  createdAt: string;
}

export interface Soal {
  id: string;
  kuisId: string;
  teks: string;
  tipe: 'pilgan' | 'benar_salah' | 'isian';
  pilihan?: Record<string, string>;
  jawaban: string;
  pembahasan?: string;
}

export interface Pengerjaan {
  id: string;
  siswaId: string;
  kuisId: string;
  jawabanSiswa: Record<string, string>;
  skor?: number;
  dikerjakanAt: string;
  syncedAt?: string;
}

export interface Jadwal {
  id: string;
  kelasId: string;
  guruId: string;
  mapel: string;
  hari: number; // 1=Senin ... 5=Jumat
  jamMulai: string;
  jamSelesai: string;
}

export interface Absensi {
  id: string;
  siswaId: string;
  jadwalId: string;
  tanggal: string;
  status: 'hadir' | 'sakit' | 'izin' | 'alpha';
  dicatatOleh: string;
  catatan?: string;
  syncedAt?: string;
  createdAt: string;
}

export interface Nilai {
  id: string;
  siswaId: string;
  mapel: string;
  komponen: string; // "Tugas", "UH", "UTS", "UAS"
  bobot: number;
  nilai: number;
  semester: number;
  diinputOleh: string;
  catatan?: string;
  syncedAt?: string;
  createdAt: string;
}

export interface Pengumuman {
  id: string;
  judul: string;
  konten: string;
  kategori: 'akademik' | 'kegiatan' | 'darurat' | 'umum';
  target: 'semua' | 'siswa' | 'guru' | string; // atau kelasId
  dipin: boolean;
  createdBy: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  mapel: string;
  judul: string;
  konten: string;
  authorId: string;
  authorNama: string;
  parentId?: string; // untuk reply
  isJawabanTerbaik?: boolean;
  likes: number;
  syncedAt?: string;
  createdAt: string;
}

export interface SyncQueue {
  id?: number;
  type: 'absensi' | 'pengerjaan' | 'nilai' | 'forum';
  action: 'create' | 'update' | 'delete';
  data: any;
  createdAt: string;
}

export class SandeqDB extends Dexie {
  users!: Table<User, string>;
  kelas!: Table<Kelas, string>;
  materi!: Table<Materi, string>;
  kuis!: Table<Kuis, string>;
  soal!: Table<Soal, string>;
  pengerjaan!: Table<Pengerjaan, string>;
  jadwal!: Table<Jadwal, string>;
  absensi!: Table<Absensi, string>;
  nilai!: Table<Nilai, string>;
  pengumuman!: Table<Pengumuman, string>;
  forum!: Table<ForumPost, string>;
  syncQueue!: Table<SyncQueue, number>;

  constructor() {
    super('SandeqDB');
    this.version(1).stores({
      users: 'id, nisNip, role, kelasId',
      kelas: 'id, tingkat, tahunAjaran',
      materi: 'id, mapel, kelasId, guruId',
      kuis: 'id, mapel, kelasId, guruId, aktif',
      soal: 'id, kuisId',
      pengerjaan: 'id, siswaId, kuisId, syncedAt',
      jadwal: 'id, kelasId, guruId, hari',
      absensi: 'id, siswaId, jadwalId, tanggal, syncedAt',
      nilai: 'id, siswaId, mapel, semester, syncedAt',
      pengumuman: 'id, kategori, createdAt',
      forum: 'id, mapel, authorId, parentId, createdAt',
      syncQueue: '++id, type, createdAt',
    });
  }
}

export const db = new SandeqDB();