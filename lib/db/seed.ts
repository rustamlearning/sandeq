// lib/db/seed.ts
import { db } from './schema';

// Simple password hashing (for demo - in production use bcrypt)
export function hashPassword(password: string): string {
  // Simple hash for demo purposes
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sandeq_${Math.abs(hash)}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function seedDatabase() {
  const userCount = await db.users.count();
  if (userCount > 0) return; // Already seeded

  // Seed Kelas
  const kelasData = [
    { id: 'kelas-1', nama: 'X IPA 1', tingkat: 10, tahunAjaran: '2024/2025' },
    { id: 'kelas-2', nama: 'XI IPA 1', tingkat: 11, tahunAjaran: '2024/2025' },
    { id: 'kelas-3', nama: 'XII IPA 1', tingkat: 12, tahunAjaran: '2024/2025' },
  ];
  await db.kelas.bulkAdd(kelasData);

  // Seed Users
  const passwordHash = hashPassword('sandeq123');
  const users = [
    {
      id: 'admin-1',
      nisNip: 'admin',
      nama: 'Administrator Sekolah',
      role: 'admin' as const,
      passwordHash,
      aktif: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'guru-1',
      nisNip: '198501012010011001',
      nama: 'Bapak Ahmad Wijaya, S.Pd',
      role: 'guru' as const,
      passwordHash,
      aktif: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'guru-2',
      nisNip: '198603152011012002',
      nama: 'Ibu Siti Nurhaliza, S.Pd',
      role: 'guru' as const,
      passwordHash,
      aktif: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'siswa-1',
      nisNip: '2024001',
      nama: 'Andi Pratama',
      role: 'siswa' as const,
      kelasId: 'kelas-3',
      passwordHash,
      aktif: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'siswa-2',
      nisNip: '2024002',
      nama: 'Bunga Kamila',
      role: 'siswa' as const,
      kelasId: 'kelas-3',
      passwordHash,
      aktif: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'siswa-3',
      nisNip: '2024003',
      nama: 'Citra Wulandari',
      role: 'siswa' as const,
      kelasId: 'kelas-3',
      passwordHash,
      aktif: true,
      createdAt: new Date().toISOString(),
    },
  ];
  await db.users.bulkAdd(users);

  // Seed Materi
  const materiData = [
    {
      id: 'mat-1',
      judul: 'Hukum Newton tentang Gerak',
      mapel: 'Fisika',
      kelasId: 'kelas-3',
      guruId: 'guru-1',
      bab: 'Bab 1 - Dinamika',
      konten: `# Hukum Newton tentang Gerak

## Hukum Newton I (Hukum Kelembaman)
Suatu benda akan tetap diam atau bergerak lurus beraturan jika resultan gaya yang bekerja pada benda tersebut sama dengan nol.

**Persamaan:** ΣF = 0

## Hukum Newton II
Percepatan yang dihasilkan oleh resultan gaya yang bekerja pada suatu benda berbanding lurus dengan resultan gaya dan berbanding terbalik dengan massa benda.

**Persamaan:** F = m × a

## Hukum Newton III (Aksi-Reaksi)
Jika suatu benda memberikan gaya pada benda kedua, maka benda kedua akan memberikan gaya yang besarnya sama namun berlawanan arah.

**Persamaan:** F_aksi = -F_reaksi

## Contoh Penerapan
1. Seorang siswa mendorong meja — meja juga memberikan gaya pada siswa
2. Roket meluncur karena hasil reaksi gas yang menyembur ke bawah
3. Kapal Sandeq melaju karena angin yang mendorong layar`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mat-2',
      judul: 'Persamaan Kuadrat',
      mapel: 'Matematika',
      kelasId: 'kelas-3',
      guruId: 'guru-2',
      bab: 'Bab 1 - Aljabar',
      konten: `# Persamaan Kuadrat

## Bentuk Umum
Persamaan kuadrat memiliki bentuk umum:

**ax² + bx + c = 0**

di mana a ≠ 0, dan a, b, c adalah konstanta.

## Rumus Kuadrat (Rumus ABC)
Akar-akar persamaan kuadrat dapat dicari dengan rumus:

**x = (-b ± √(b² - 4ac)) / 2a**

## Diskriminan
D = b² - 4ac

- Jika D > 0: dua akar real berbeda
- Jika D = 0: dua akar real sama (akar kembar)
- Jika D < 0: tidak ada akar real

## Contoh Soal
Tentukan akar-akar dari x² - 5x + 6 = 0

Penyelesaian:
- a = 1, b = -5, c = 6
- D = 25 - 24 = 1
- x = (5 ± 1) / 2
- x₁ = 3, x₂ = 2`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mat-3',
      judul: 'Sejarah Kemaritiman Nusantara',
      mapel: 'Sejarah',
      kelasId: 'kelas-3',
      guruId: 'guru-1',
      bab: 'Bab 2 - Maritim',
      konten: `# Sejarah Kemaritiman Nusantara

## Kerajaan Maritim di Nusantara
Nusantara dikenal sebagai bangsa maritim sejak zaman dahulu. Beberapa kerajaan maritim yang terkenal:

### 1. Sriwijaya (abad ke-7 hingga ke-13)
Kerajaan maritim terbesar di Asia Tenggara yang menguasai jalur perdagangan Selat Malaka.

### 2. Majapahit (abad ke-13 hingga ke-16)
Puncak kejayaan maritim Nusantara di bawah Gajah Mada dengan Sumpah Palapa.

### 3. Kerajaan Gowa-Tallo
Pusat perdagangan di Sulawesi Selatan yang terkenal dengan pelautnya.

## Perahu Tradisional Nusantara
- **Pinisi** dari Sulawesi Selatan
- **Sandeq** dari Mandar, Sulawesi Barat — perahu tercepat dengan layar
- **Jong** dari Jawa
- **Patorani** dari Makassar

## Makna Filosofis Sandeq
Perahu Sandeq melambangkan keberanian, kecepatan, dan keuletan masyarakat Mandar dalam mengarungi lautan luas.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  await db.materi.bulkAdd(materiData);

  // Seed Kuis
  const kuisData = [
    {
      id: 'kuis-1',
      judul: 'Kuis Hukum Newton',
      mapel: 'Fisika',
      kelasId: 'kelas-3',
      guruId: 'guru-1',
      tipe: 'latihan' as const,
      durasiMenit: 15,
      aktif: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'kuis-2',
      judul: 'Ulangan Harian Persamaan Kuadrat',
      mapel: 'Matematika',
      kelasId: 'kelas-3',
      guruId: 'guru-2',
      tipe: 'ulangan' as const,
      durasiMenit: 30,
      aktif: true,
      createdAt: new Date().toISOString(),
    },
  ];
  await db.kuis.bulkAdd(kuisData);

  // Seed Soal
  const soalData = [
    {
      id: 'soal-1',
      kuisId: 'kuis-1',
      teks: 'Hukum Newton I disebut juga sebagai hukum...',
      tipe: 'pilgan' as const,
      pilihan: {
        A: 'Kelembaman',
        B: 'Percepatan',
        C: 'Aksi-Reaksi',
        D: 'Gravitasi',
      },
      jawaban: 'A',
      pembahasan: 'Hukum Newton I dikenal sebagai hukum kelembaman atau inersia.',
    },
    {
      id: 'soal-2',
      kuisId: 'kuis-1',
      teks: 'Persamaan F = m × a adalah rumus dari Hukum Newton...',
      tipe: 'pilgan' as const,
      pilihan: {
        A: 'I',
        B: 'II',
        C: 'III',
        D: 'IV',
      },
      jawaban: 'B',
      pembahasan: 'F = m × a adalah rumus Hukum Newton II tentang hubungan gaya, massa, dan percepatan.',
    },
    {
      id: 'soal-3',
      kuisId: 'kuis-1',
      teks: 'Gaya aksi dan reaksi memiliki besar yang sama.',
      tipe: 'benar_salah' as const,
      jawaban: 'Benar',
      pembahasan: 'Benar. Menurut Hukum Newton III, gaya aksi dan reaksi besarnya sama namun berlawanan arah.',
    },
    {
      id: 'soal-4',
      kuisId: 'kuis-1',
      teks: 'Sebuah benda bermassa 5 kg didorong dengan gaya 20 N. Berapa percepatan benda tersebut? (dalam m/s²)',
      tipe: 'isian' as const,
      jawaban: '4',
      pembahasan: 'a = F/m = 20/5 = 4 m/s²',
    },
    {
      id: 'soal-5',
      kuisId: 'kuis-2',
      teks: 'Bentuk umum persamaan kuadrat adalah...',
      tipe: 'pilgan' as const,
      pilihan: {
        A: 'ax + b = 0',
        B: 'ax² + bx + c = 0',
        C: 'ax³ + bx² + cx + d = 0',
        D: 'a/x + b = 0',
      },
      jawaban: 'B',
      pembahasan: 'Bentuk umum persamaan kuadrat adalah ax² + bx + c = 0 dengan a ≠ 0.',
    },
    {
      id: 'soal-6',
      kuisId: 'kuis-2',
      teks: 'Diskriminan persamaan kuadrat dihitung dengan rumus D = b² - 4ac.',
      tipe: 'benar_salah' as const,
      jawaban: 'Benar',
      pembahasan: 'Benar. Diskriminan digunakan untuk menentukan jenis akar persamaan kuadrat.',
    },
    {
      id: 'soal-7',
      kuisId: 'kuis-2',
      teks: 'Tentukan jumlah akar dari persamaan x² - 7x + 10 = 0',
      tipe: 'isian' as const,
      jawaban: '7',
      pembahasan: 'Jumlah akar = -b/a = 7/1 = 7',
    },
  ];
  await db.soal.bulkAdd(soalData);

  // Seed Jadwal
  const jadwalData = [
    { id: 'jdw-1', kelasId: 'kelas-3', guruId: 'guru-1', mapel: 'Fisika', hari: 1, jamMulai: '07:30', jamSelesai: '09:00' },
    { id: 'jdw-2', kelasId: 'kelas-3', guruId: 'guru-2', mapel: 'Matematika', hari: 1, jamMulai: '09:15', jamSelesai: '10:45' },
    { id: 'jdw-3', kelasId: 'kelas-3', guruId: 'guru-1', mapel: 'Sejarah', hari: 2, jamMulai: '07:30', jamSelesai: '09:00' },
    { id: 'jdw-4', kelasId: 'kelas-3', guruId: 'guru-2', mapel: 'Matematika', hari: 3, jamMulai: '07:30', jamSelesai: '09:00' },
    { id: 'jdw-5', kelasId: 'kelas-3', guruId: 'guru-1', mapel: 'Fisika', hari: 4, jamMulai: '09:15', jamSelesai: '10:45' },
    { id: 'jdw-6', kelasId: 'kelas-3', guruId: 'guru-1', mapel: 'Sejarah', hari: 5, jamMulai: '07:30', jamSelesai: '09:00' },
  ];
  await db.jadwal.bulkAdd(jadwalData);

  // Seed Pengumuman
  const pengumumanData = [
    {
      id: 'peng-1',
      judul: 'Selamat Datang di Sandeq!',
      konten: 'Aplikasi belajar digital SMA Negeri 6 Pangkajene dan Kepulauan telah hadir. Layarkan ilmumu bersama kami! Seperti perahu Sandeq yang tak pernah gentar menghadapi ombak, mari terus melaju meraih ilmu.',
      kategori: 'umum' as const,
      target: 'semua',
      dipin: true,
      createdBy: 'admin-1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'peng-2',
      judul: 'Jadwal Ujian Tengah Semester',
      konten: 'Ujian Tengah Semester akan dilaksanakan mulai tanggal 15 Maret 2025. Silakan periksa jadwal masing-masing di menu Jadwal. Persiapkan diri dengan baik!',
      kategori: 'akademik' as const,
      target: 'siswa',
      dipin: false,
      createdBy: 'admin-1',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'peng-3',
      judul: 'Lomba Perahu Sandeq Tahunan',
      konten: 'Dalam rangka memperingati Hari Bahari Nusantara, sekolah akan mengadakan kegiatan budaya lomba perahu Sandeq mini. Siswa yang berminat dapat mendaftar di kantor TU.',
      kategori: 'kegiatan' as const,
      target: 'semua',
      dipin: false,
      createdBy: 'admin-1',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
  await db.pengumuman.bulkAdd(pengumumanData);

  // Seed Nilai contoh
  const nilaiData = [
    { id: 'n-1', siswaId: 'siswa-1', mapel: 'Fisika', komponen: 'Tugas', bobot: 20, nilai: 85, semester: 1, diinputOleh: 'guru-1', createdAt: new Date().toISOString() },
    { id: 'n-2', siswaId: 'siswa-1', mapel: 'Fisika', komponen: 'UH', bobot: 30, nilai: 78, semester: 1, diinputOleh: 'guru-1', createdAt: new Date().toISOString() },
    { id: 'n-3', siswaId: 'siswa-1', mapel: 'Matematika', komponen: 'Tugas', bobot: 20, nilai: 90, semester: 1, diinputOleh: 'guru-2', createdAt: new Date().toISOString() },
    { id: 'n-4', siswaId: 'siswa-1', mapel: 'Matematika', komponen: 'UH', bobot: 30, nilai: 82, semester: 1, diinputOleh: 'guru-2', createdAt: new Date().toISOString() },
    { id: 'n-5', siswaId: 'siswa-1', mapel: 'Sejarah', komponen: 'Tugas', bobot: 20, nilai: 88, semester: 1, diinputOleh: 'guru-1', createdAt: new Date().toISOString() },
  ];
  await db.nilai.bulkAdd(nilaiData);

  // Seed Forum
  const forumData = [
    {
      id: 'forum-1',
      mapel: 'Fisika',
      judul: 'Cara menghitung percepatan benda di bidang miring?',
      konten: 'Pak, saya masih bingung bagaimana cara menghitung percepatan benda yang meluncur di bidang miring. Mohon penjelasannya.',
      authorId: 'siswa-1',
      authorNama: 'Andi Pratama',
      likes: 2,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'forum-2',
      mapel: 'Fisika',
      judul: '',
      konten: 'Untuk benda di bidang miring dengan sudut θ, percepatan a = g × sin(θ) jika tanpa gesekan. Jika ada gesekan, kurangi dengan μ × g × cos(θ).',
      authorId: 'guru-1',
      authorNama: 'Bapak Ahmad Wijaya, S.Pd',
      parentId: 'forum-1',
      isJawabanTerbaik: true,
      likes: 5,
      createdAt: new Date(Date.now() - 43200000).toISOString(),
    },
  ];
  await db.forum.bulkAdd(forumData);

  console.log('✓ Database Sandeq berhasil di-seed');
}