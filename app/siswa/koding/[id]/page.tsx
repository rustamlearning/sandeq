'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const KONTEN: Record<string, {
  judul: string; teori: string; contoh: string
  latihan: string; hint: string; solusi: string; output_expected: string
}> = {
  '1': {
    judul: 'Apa itu Program?',
    teori: `Program adalah instruksi yang kita kasih ke komputer. Kayak resep masak — komputer ikutin langkah-langkah yang kita tulis.

Python adalah bahasa pemrograman yang paling gampang dipelajari. Banyak dipakai di AI, data science, dan web.

Perintah paling dasar di Python adalah print() — untuk nampilin teks ke layar.`,
    contoh: `print("Halo, SMAN 6 Pangkep!")
print("Saya belajar Python!")`,
    latihan: `# Tulis kode Python untuk menampilkan namamu!
# Contoh: print("Nama saya ...")

`,
    hint: 'Pakai print() dan taruh teksmu di dalam tanda kutip ""',
    solusi: 'print("Nama saya Budi")',
    output_expected: 'print',
  },
  '2': {
    judul: 'Variabel & Tipe Data',
    teori: `Variabel itu kayak kotak penyimpanan. Kita bisa simpan angka, teks, atau data lain di dalamnya.

Tipe data di Python:
- str — teks: "Pangkep"
- int — bilangan bulat: 17
- float — bilangan desimal: 3.14
- bool — True atau False`,
    contoh: `nama = "Andi"
umur = 17
nilai = 85.5
lulus = True

print("Nama:", nama)
print("Umur:", umur)`,
    latihan: `# Buat variabel untuk menyimpan:
# 1. nama sekolahmu
# 2. jumlah siswa di kelasmu
# 3. Tampilkan keduanya dengan print()

`,
    hint: 'nama_sekolah = "..." dan jumlah_siswa = ...',
    solusi: 'nama_sekolah = "SMAN 6 Pangkep"\njumlah_siswa = 36\nprint(nama_sekolah, jumlah_siswa)',
    output_expected: 'print',
  },
  '3': {
    judul: 'If & Else',
    teori: `If-else dipakai kalau program perlu buat keputusan. Kayak: "Kalau nilai >= 75, lulus. Kalau tidak, remidi."`,
    contoh: `nilai = 80
if nilai >= 75:
    print("Lulus!")
else:
    print("Remidi")`,
    latihan: `# Program cek apakah suatu angka positif atau negatif
# Jika angka > 0, print "Positif"
# Jika tidak, print "Negatif atau Nol"

angka = -5
`,
    hint: 'if angka > 0: ... else: ...',
    solusi: 'angka = -5\nif angka > 0:\n    print("Positif")\nelse:\n    print("Negatif atau Nol")',
    output_expected: 'if',
  },
  '4': {
    judul: 'For & While',
    teori: `Perulangan dipakai kalau mau jalankan kode berkali-kali.

for — kalau tahu berapa kali mau ulang
while — selama kondisi masih True`,
    contoh: `# For loop
for i in range(5):
    print("Langkah", i+1)`,
    latihan: `# Tampilkan angka 1 sampai 10 menggunakan for loop

`,
    hint: 'for i in range(1, 11): print(i)',
    solusi: 'for i in range(1, 11):\n    print(i)',
    output_expected: 'for',
  },
  '5': {
    judul: 'Fungsi',
    teori: `Fungsi adalah kumpulan kode yang bisa dipanggil berkali-kali. Buat pakai def.`,
    contoh: `def sapa(nama):
    print("Halo,", nama + "!")

sapa("Andi")
sapa("Budi")`,
    latihan: `# Buat fungsi hitung_luas yang menerima panjang dan lebar
# dan menampilkan luas persegi panjang

`,
    hint: 'def hitung_luas(panjang, lebar): print(panjang * lebar)',
    solusi: 'def hitung_luas(panjang, lebar):\n    print("Luas:", panjang * lebar)\nhitung_luas(5, 3)',
    output_expected: 'def',
  },
  '6': {
    judul: 'List & Dictionary',
    teori: `List — simpan banyak data dalam satu variabel
Dictionary — simpan data dengan pasangan kunci: nilai`,
    contoh: `# List
mapel = ["Matematika", "Fisika", "Python"]
print(mapel[0])

# Dictionary  
siswa = {"nama": "Andi", "kelas": "10A"}
print(siswa["nama"])`,
    latihan: `# Buat list berisi 3 makanan khas Sulawesi Selatan
# Tampilkan semua isinya dengan for loop

`,
    hint: 'makanan = ["Coto", "Konro", "Pallu Basa"]\nfor m in makanan: print(m)',
    solusi: 'makanan = ["Coto Makassar", "Konro", "Pallu Basa"]\nfor m in makanan:\n    print(m)',
    output_expected: 'for',
  },
}

export default function KodingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<'teori' | 'latihan'>('teori')
  const [kode, setKode] = useState('')
  const [output, setOutput] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [showSolusi, setShowSolusi] = useState(false)
  const [selesai, setSelesai] = useState(false)

  const konten = KONTEN[id as string]

  useEffect(() => {
    if (konten) setKode(konten.latihan)
  }, [id, konten])

  function jalankan() {
    if (!konten) return
    const lines = kode.split('\n').filter(l => l.trim())
    if (lines.length === 0) { setOutput('❌ Kode kosong!'); return }
    if (!kode.includes(konten.output_expected)) {
      setOutput(`⚠️ Hint: coba pakai kata kunci "${konten.output_expected}"`)
      return
    }
    setOutput('✅ Kode berhasil dijalankan!\n\n(Output simulasi — kode Python asli berjalan di server)')
    setSelesai(true)
  }

  async function tandaiSelesai() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('progress_materi').upsert({
      user_id: user.id, materi_id: id, selesai: true,
    }, { onConflict: 'user_id,materi_id' })
    router.push('/siswa/koding')
  }

  if (!konten) return <div className="p-8 text-center">Modul tidak ditemukan</div>

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto">
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100">
        <button onClick={() => router.push('/siswa/koding')} className="text-gray-500">←</button>
        <h1 className="text-lg font-bold text-gray-800 flex-1">{konten.judul}</h1>
      </div>

      <div className="flex border-b border-gray-200 bg-white">
        {(['teori', 'latihan'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            {t === 'teori' ? '📖 Teori' : '💻 Latihan'}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'teori' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">{konten.teori}</p>
            </div>
            <div className="bg-gray-900 rounded-2xl p-4">
              <p className="text-xs text-gray-400 mb-2">Contoh kode:</p>
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">{konten.contoh}</pre>
            </div>
            <button onClick={() => setTab('latihan')}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold">
              Coba Latihan →
            </button>
          </div>
        )}

        {tab === 'latihan' && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-600 mb-1">🎯 TUGAS</p>
              <p className="text-sm text-gray-700">{konten.latihan.split('\n').filter(l => l.startsWith('#')).map(l => l.replace('# ', '')).join('\n')}</p>
            </div>

            <textarea
              value={kode}
              onChange={e => setKode(e.target.value)}
              className="w-full h-48 bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              spellCheck={false}
            />

            {output && (
              <div className={`rounded-xl p-3 text-sm font-mono ${output.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {output}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={jalankan} className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-semibold text-sm">
                ▶ Jalankan
              </button>
              <button onClick={() => setShowHint(!showHint)} className="px-4 bg-amber-100 text-amber-700 rounded-xl font-medium text-sm">
                💡 Hint
              </button>
            </div>

            {showHint && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                {konten.hint}
              </div>
            )}

            <button onClick={() => setShowSolusi(!showSolusi)} className="text-xs text-gray-400 underline w-full text-center">
              {showSolusi ? 'Sembunyikan' : 'Lihat Solusi'}
            </button>

            {showSolusi && (
              <div className="bg-gray-900 rounded-xl p-4">
                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">{konten.solusi}</pre>
              </div>
            )}

            {selesai && (
              <button onClick={tandaiSelesai} className="w-full bg-green-600 text-white rounded-xl py-3 font-bold">
                ✅ Tandai Selesai & Lanjut
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
