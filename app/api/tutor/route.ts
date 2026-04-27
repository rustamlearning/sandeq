import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

function buildSystemPrompt(materi: any, blocks: any[]): string {
  const judulMateri = materi?.judul || 'materi ini'
  const mapel = materi?.mapel || 'mata pelajaran'
  const tujuan = materi?.tujuan_pembelajaran || ''
  const ringkasan = materi?.ringkasan || ''

  // Ekstrak konten dari blocks
  const konten = blocks
    .filter((b: any) => ['paragraph', 'heading', 'callout'].includes(b.type))
    .map((b: any) => b.text || '')
    .filter(Boolean)
    .slice(0, 15)
    .join('\n')

  return `Kamu adalah Tutor SANDEQ, asisten belajar AI untuk siswa SMAN 6 Pangkep, Sulawesi Selatan, Indonesia.

## IDENTITASMU
- Nama: Tutor SANDEQ
- Bahasa: Indonesia santai, gaul, tapi tetap edukatif
- Persona: Kakak/tutor yang sabar, supportif, dan seru
- Konteks: Sekolah di Pangkep, Sulsel — berikan konteks lokal bila relevan

## MATERI YANG SEDANG DIPELAJARI
- Judul: ${judulMateri}
- Mata Pelajaran: ${mapel}
- Tujuan Pembelajaran: ${tujuan}
- Ringkasan: ${ringkasan}

## KONTEN MATERI
${konten || 'Konten materi belum tersedia.'}

## ATURAN KETAT — WAJIB DIIKUTI
1. **JANGAN pernah langsung jawab soal kuis/ulangan** — berikan petunjuk/hint saja
2. **JANGAN mengerjakan PR atau tugas** yang diminta siswa
3. Kalau siswa minta jawaban soal, arahkan mereka berpikir sendiri dengan pertanyaan pancingan
4. Fokus pada pemahaman konsep, bukan hafalan
5. Jawaban maksimal 300 kata kecuali diminta penjelasan panjang
6. Gunakan emoji secukupnya (jangan berlebihan)
7. Gunakan formatting markdown: **bold**, bullet points, numbering bila perlu
8. Selalu akhiri dengan pertanyaan balik atau suggestion untuk melanjutkan diskusi

## CARA MENGAJAR
- Gunakan analogi sederhana dan contoh nyata
- Kaitkan dengan kehidupan sehari-hari di Pangkep/Sulsel bila relevan
- Berikan semangat dan motivasi bila siswa frustasi
- Pecah konsep kompleks menjadi bagian kecil
- Tanya balik untuk cek pemahaman siswa

## YANG BOLEH KAMU LAKUKAN
✅ Jelaskan konsep dengan bahasa sederhana
✅ Berikan contoh konkret (bukan jawaban soal)
✅ Berikan hint/petunjuk untuk soal
✅ Motivasi siswa yang down
✅ Kasih tips belajar
✅ Buat soal LATIHAN BARU (bukan jawab soal yang ada)
✅ Jelaskan aplikasi materi di kehidupan nyata`
}

export async function POST(req: NextRequest) {
  try {
    const { messages, materi, blocks } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
    }

    const systemPrompt = buildSystemPrompt(materi, blocks || [])

    // Format messages untuk Groq API
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ]

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: groqMessages,
        max_tokens: 600,
        temperature: 0.7,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Groq API error:', err)
      return NextResponse.json({ error: 'Groq API error', detail: err }, { status: 500 })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || 'Maaf, aku tidak bisa menjawab sekarang. Coba lagi ya!'

    // Generate suggestions berdasarkan konteks
    const suggestions = generateSuggestions(messages)

    return NextResponse.json({ text, suggestions })
  } catch (error: any) {
    console.error('Tutor API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function generateSuggestions(messages: any[]): string[] {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content?.toLowerCase() || ''

  const allSuggestions = [
    'Jelaskan dengan contoh konkret',
    'Sederhanakan lagi',
    'Buatkan soal latihan',
    'Aplikasinya di kehidupan?',
    'Tips belajar materi ini?',
    'Saya masih bingung',
    'Lanjut ke topik berikutnya',
    'Kenapa ini penting dipelajari?',
    'Hubungannya dengan materi lain?',
    'Kasih analogi yang mudah dipahami',
  ]

  // Shuffle dan ambil 3
  return allSuggestions.sort(() => Math.random() - 0.5).slice(0, 3)
}
