'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const KONTEN_KKA: Record<string, { judul: string; emoji: string; isi: { tipe: string; teks?: string; fakta?: string; quiz?: { soal: string; pilihan: string[]; jawaban: number } }[] }> = {
  '1': {
    judul: 'Apa itu Kecerdasan Artifisial?',
    emoji: '🤖',
    isi: [
      { tipe: 'teks', teks: 'Kecerdasan Artifisial (AI) adalah kemampuan komputer untuk melakukan tugas-tugas yang biasanya butuh kecerdasan manusia — seperti mengenali gambar, memahami bahasa, atau membuat keputusan.' },
      { tipe: 'fakta', fakta: 'AI sudah ada sejak tahun 1950-an! Ilmuwan Alan Turing pertama kali mengajukan pertanyaan: "Bisakah mesin berpikir?"' },
      { tipe: 'teks', teks: 'Ada 3 jenis AI:\n\n1. ANI (Artificial Narrow Intelligence) — AI yang hebat di satu tugas spesifik. Contoh: AI catur, rekomendasi YouTube.\n\n2. AGI (Artificial General Intelligence) — AI yang bisa berpikir seperti manusia di semua bidang. Belum ada!\n\n3. ASI (Artificial Super Intelligence) — AI yang melampaui kecerdasan manusia. Masih fiksi ilmiah.' },
      { tipe: 'quiz', quiz: { soal: 'ChatGPT termasuk jenis AI apa?', pilihan: ['AGI — bisa semua hal', 'ANI — spesialis di teks', 'ASI — lebih pintar dari manusia', 'Bukan AI'], jawaban: 1 } },
    ]
  },
  '2': {
    judul: 'Machine Learning',
    emoji: '🧠',
    isi: [
      { tipe: 'teks', teks: 'Machine Learning (ML) adalah cara mengajar komputer bukan dengan aturan yang kita tulis manual, tapi dengan membiarkan komputer belajar dari data.' },
      { tipe: 'fakta', fakta: 'Netflix menggunakan ML untuk merekomendasikan film. Sistem ini menganalisis jutaan data tontonan untuk memprediksi apa yang kamu suka!' },
      { tipe: 'teks', teks: 'Cara kerja ML:\n\n1. Kumpulkan data (contoh: 10.000 foto kucing dan bukan kucing)\n2. Latih model dengan data tersebut\n3. Model belajar pola: "kucing punya telinga lancip, mata bulat"\n4. Test model dengan foto baru\n5. Model bisa prediksi: ini kucing atau bukan!' },
      { tipe: 'quiz', quiz: { soal: 'Apa yang dipelajari oleh model Machine Learning?', pilihan: ['Aturan yang kita program manual', 'Pola dari data yang diberikan', 'Internet seluruhnya', 'Kamus bahasa'], jawaban: 1 } },
    ]
  },
  '3': {
    judul: 'AI di Kehidupan Sehari-hari',
    emoji: '📱',
    isi: [
      { tipe: 'teks', teks: 'Tanpa sadar, kamu sudah pakai AI setiap hari! Mari kita lihat AI yang ada di sekitar kita di Pangkep.' },
      { tipe: 'fakta', fakta: 'Google Maps menggunakan AI untuk memprediksi kemacetan dan merekomendasikan rute tercepat — termasuk jalan-jalan di Pangkep!' },
      { tipe: 'teks', teks: 'AI yang kamu pakai sehari-hari:\n\n📱 Autocorrect di HP — AI yang prediksi kata selanjutnya\n🎵 Spotify/YouTube — AI rekomendasikan lagu/video\n📸 Face unlock HP — AI kenali wajahmu\n🛒 Tokopedia/Shopee — AI rekomendasikan produk\n💬 ChatGPT/Claude — AI yang bisa ngobrol\n🐟 Sensor tambak pintar — AI monitoring kualitas air (relevan untuk nelayan Pangkep!)' },
      { tipe: 'quiz', quiz: { soal: 'Fitur HP mana yang menggunakan AI?', pilihan: ['Kalkulator biasa', 'Face unlock (pengenalan wajah)', 'Alarm', 'Kabel charger'], jawaban: 1 } },
    ]
  },
  '4': {
    judul: 'Natural Language Processing',
    emoji: '💬',
    isi: [
      { tipe: 'teks', teks: 'NLP (Natural Language Processing) adalah cabang AI yang membuat komputer bisa memahami dan menghasilkan bahasa manusia — termasuk Bahasa Indonesia!' },
      { tipe: 'fakta', fakta: 'ChatGPT dilatih dengan teks sebanyak sekitar 570 GB — setara dengan jutaan buku! Itulah kenapa dia bisa menjawab hampir semua pertanyaan.' },
      { tipe: 'teks', teks: 'Contoh aplikasi NLP:\n\n🔍 Google Search — memahami maksud pencarianmu\n🌐 Google Translate — terjemahkan antar bahasa\n🎙️ Siri/Google Assistant — mengerti perintah suara\n💬 ChatGPT/Claude — percakapan natural\n📧 Filter spam email — deteksi email berbahaya' },
      { tipe: 'quiz', quiz: { soal: 'Apa yang dimaksud dengan NLP?', pilihan: ['Network Protocol Layer', 'AI yang memahami bahasa manusia', 'Bahasa pemrograman baru', 'Aplikasi chatting'], jawaban: 1 } },
    ]
  },
  '5': {
    judul: 'Computer Vision',
    emoji: '👁️',
    isi: [
      { tipe: 'teks', teks: 'Computer Vision adalah kemampuan AI untuk "melihat" dan memahami gambar atau video — seperti mata manusia, tapi lebih cepat dan tidak kenal lelah.' },
      { tipe: 'fakta', fakta: 'Kamera CCTV modern dengan AI bisa mendeteksi wajah dalam kerumunan ribuan orang hanya dalam hitungan detik!' },
      { tipe: 'teks', teks: 'Aplikasi Computer Vision:\n\n🏥 Deteksi penyakit dari foto X-ray/scan\n🚗 Mobil self-driving — lihat jalan, rambu, pejalan kaki\n🌾 Deteksi hama tanaman dari foto daun\n🐟 Monitor kesehatan ikan di tambak dari kamera (relevan untuk Pangkep!)\n📸 Filter Instagram/TikTok — deteksi wajah real-time' },
      { tipe: 'quiz', quiz: { soal: 'Computer Vision bisa digunakan untuk apa di dunia perikanan Pangkep?', pilihan: ['Mengetik laporan', 'Monitor kesehatan ikan dari kamera', 'Mengirim email', 'Membuat jadwal'], jawaban: 1 } },
    ]
  },
  '6': {
    judul: 'Etika AI & Masa Depan',
    emoji: '⚖️',
    isi: [
      { tipe: 'teks', teks: 'AI sangat powerful, tapi juga bisa berbahaya jika disalahgunakan. Kita perlu memahami etika penggunaan AI.' },
      { tipe: 'fakta', fakta: 'Sebuah studi menemukan bahwa beberapa AI untuk rekrutmen kerja cenderung bias terhadap perempuan — karena dilatih dari data historis yang didominasi laki-laki.' },
      { tipe: 'teks', teks: 'Tantangan etika AI:\n\n🔒 Privasi — AI bisa kumpulkan data pribadimu\n⚖️ Bias — AI bisa diskriminasi tanpa disengaja\n💼 Pekerjaan — AI bisa menggantikan beberapa profesi\n🎭 Deepfake — AI bisa buat video palsu yang meyakinkan\n🌍 Lingkungan — melatih AI butuh energi sangat besar\n\nTapi AI juga membuka peluang baru yang belum pernah ada sebelumnya!' },
      { tipe: 'quiz', quiz: { soal: 'Apa yang dimaksud dengan "bias" dalam AI?', pilihan: ['AI yang berjalan terlalu lambat', 'AI yang diskriminasi karena data latihannya tidak merata', 'AI yang tidak bisa berbahasa Indonesia', 'AI yang terlalu mahal'], jawaban: 1 } },
    ]
  },
}

export default function KKADetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [quizJawaban, setQuizJawaban] = useState<number | null>(null)
  const [selesai, setSelesai] = useState(false)

  const konten = KONTEN_KKA[id as string]
  if (!konten) return <div className="p-8 text-center">Modul tidak ditemukan</div>

  const quizItem = konten.isi.find(i => i.tipe === 'quiz')

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto">
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100">
        <button onClick={() => router.push('/siswa/kka')} className="text-gray-500">←</button>
        <span className="text-2xl">{konten.emoji}</span>
        <h1 className="text-lg font-bold text-gray-800 flex-1">{konten.judul}</h1>
      </div>

      <div className="p-4 space-y-4">
        {konten.isi.map((blok, i) => (
          <div key={i}>
            {blok.tipe === 'teks' && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">{blok.teks}</p>
              </div>
            )}
            {blok.tipe === 'fakta' && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-purple-600 mb-1">🤯 FAKTA MENARIK</p>
                <p className="text-sm text-gray-700">{blok.fakta}</p>
              </div>
            )}
            {blok.tipe === 'quiz' && blok.quiz && (
              <div className="bg-white rounded-2xl p-5 border-2 border-purple-200">
                <p className="text-xs font-bold text-purple-600 mb-2">❓ CEK PEMAHAMANMU</p>
                <p className="font-medium text-gray-800 mb-3 text-sm">{blok.quiz.soal}</p>
                <div className="space-y-2">
                  {blok.quiz.pilihan.map((p, idx) => (
                    <button key={idx} onClick={() => { setQuizJawaban(idx); if (idx === blok.quiz!.jawaban) setSelesai(true) }}
                      disabled={quizJawaban !== null}
                      className={`w-full text-left p-3 rounded-xl text-sm transition border-2 ${
                        quizJawaban === null ? 'border-gray-200 hover:border-purple-400 bg-gray-50'
                        : idx === blok.quiz!.jawaban ? 'border-green-500 bg-green-50 text-green-800'
                        : idx === quizJawaban ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
                {quizJawaban !== null && (
                  <p className={`mt-3 text-sm font-medium ${quizJawaban === blok.quiz.jawaban ? 'text-green-600' : 'text-red-600'}`}>
                    {quizJawaban === blok.quiz.jawaban ? '✅ Benar! Keren!' : `❌ Kurang tepat. Jawaban: ${blok.quiz.pilihan[blok.quiz.jawaban]}`}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {selesai && (
          <button onClick={() => router.push('/siswa/kka')}
            className="w-full bg-emerald-600 text-white rounded-2xl py-4 font-bold text-lg mt-4">
            ✅ Selesai — Modul Berikutnya →
          </button>
        )}
      </div>
    </div>
  )
}
