import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const MAX_MESSAGE_LENGTH = 2000
const AI_RATE_LIMIT = 20
const AI_RATE_WINDOW_MS = 60_000

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function buildSystemPrompt(
  materi: any,
  blocks: any[],
  siswaContext: {
    nama: string
    mood?: number
    niat?: string
    materiSelesai: number
    kuisStats: { total: number; avgNilai: number }
    streak: number
  }
): string {
  const judulMateri = materi?.judul || ''
  const mapel = materi?.mapel || ''
  const tujuan = materi?.tujuan_pembelajaran || ''
  const konten = blocks
    .filter((b: any) => ['paragraph', 'heading', 'callout'].includes(b.type))
    .map((b: any) => b.text || '')
    .filter(Boolean)
    .slice(0, 15)
    .join('\n')

  const moodLabel: Record<number, string> = {
    1: 'ngantuk/tidak semangat',
    2: 'kurang semangat',
    3: 'biasa saja',
    4: 'semangat',
    5: 'sangat semangat',
  }

  const siswaInfo = `
## PROFIL SISWA HARI INI
- Nama: ${siswaContext.nama}
- Mood hari ini: ${siswaContext.mood ? moodLabel[siswaContext.mood] : 'belum check-in'}
- Niat belajar hari ini: ${siswaContext.niat || 'belum diisi'}
- Materi selesai dipelajari: ${siswaContext.materiSelesai} materi
- Kuis dikerjakan: ${siswaContext.kuisStats.total} kuis (rata-rata nilai: ${siswaContext.kuisStats.avgNilai || '-'})
- Streak belajar: ${siswaContext.streak} hari berturut-turut
`

  const materiInfo = judulMateri ? `
## MATERI YANG SEDANG DIPELAJARI
- Judul: ${judulMateri}
- Mata Pelajaran: ${mapel}
- Tujuan Pembelajaran: ${tujuan}

## KONTEN MATERI
${konten || 'Konten belum tersedia.'}
` : ''

  return `Kamu adalah Tutor SANDEQ, asisten belajar AI untuk siswa SMAN 6 Pangkep, Sulawesi Selatan.

## IDENTITASMU
- Nama: Tutor SANDEQ
- Bahasa: Indonesia santai, gaul, tapi tetap edukatif  
- Persona: Kakak tutor yang sabar, supportif, dan seru
- Konteks lokal: Pangkep, Sulsel — gunakan analogi lokal bila relevan
${siswaInfo}${materiInfo}
## CARA MENYESUAIKAN RESPONS DENGAN MOOD
- Mood 1-2 (tidak semangat): Mulai dengan empati, motivasi ringan, jangan langsung materi berat
- Mood 3 (biasa): Normal, langsung ke pokok
- Mood 4-5 (semangat): Bisa langsung tantang dengan soal atau diskusi mendalam
- Jika ada niat belajar, kaitkan respons dengan niat tersebut

## ATURAN WAJIB
1. JANGAN langsung jawab soal kuis/ulangan — berikan hint/petunjuk saja
2. JANGAN kerjakan PR atau tugas siswa
3. Fokus pada pemahaman konsep, bukan hafalan
4. Jawaban maksimal 300 kata kecuali diminta panjang
5. Selalu akhiri dengan pertanyaan balik atau ajakan diskusi lanjut
6. Gunakan emoji secukupnya
7. Deteksi mapel dari konteks percakapan jika materi tidak tersedia. Jika siswa bertanya tentang English, grammar, reading, writing, vocabulary, atau menyebut "Bahasa Inggris": contoh soal, vocabulary, teks, dan dialog WAJIB dalam Bahasa Inggris — hanya penjelasan konsep yang boleh dalam Bahasa Indonesia

## YANG BOLEH DILAKUKAN
✅ Jelaskan konsep dengan bahasa sederhana
✅ Berikan contoh konkret dan analogi lokal
✅ Berikan hint untuk soal (bukan jawaban)
✅ Motivasi siswa yang frustasi atau tidak semangat
✅ Buat soal latihan BARU
✅ Jika mapel adalah Bahasa Inggris, gunakan Bahasa Inggris untuk contoh soal, vocabulary, dan materi — penjelasan tetap Indonesia
✅ Kaitkan materi dengan kehidupan nyata di Pangkep/Sulsel`
}

function generateSuggestions(messages: any[]): string[] {
  const last = messages[messages.length - 1]?.content?.toLowerCase() || ''
  if (last.includes('tidak mengerti') || last.includes('bingung') || last.includes('susah')) {
    return ['Coba jelaskan dengan analogi', 'Berikan contoh yang lebih sederhana', 'Pecah menjadi langkah kecil']
  }
  if (last.includes('soal') || last.includes('latihan')) {
    return ['Berikan soal yang lebih mudah', 'Berikan soal yang lebih sulit', 'Jelaskan cara penyelesaiannya']
  }
  return ['Berikan contoh soal', 'Kaitkan dengan kehidupan nyata', 'Apa yang perlu dipelajari selanjutnya?']
}

export async function POST(req: NextRequest) {
  try {
    const { messages, materi, blocks, userId } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }
    if (messages.some((m: any) => typeof m?.content !== 'string' || m.content.length > MAX_MESSAGE_LENGTH)) {
      return NextResponse.json({ error: 'Pesan tidak valid atau terlalu panjang' }, { status: 413 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
    }

    // Fetch siswa context
    let siswaContext = {
      nama: 'Siswa',
      mood: undefined as number | undefined,
      niat: undefined as string | undefined,
      materiSelesai: 0,
      kuisStats: { total: 0, avgNilai: 0 },
      streak: 0,
    }

    if (userId) {
      const today = new Date().toISOString().split('T')[0]
      const semingguLalu = new Date(Date.now() - 7 * 86400000).toISOString()

      const [userRes, checkinRes, progressRes, kuisRes] = await Promise.all([
        supabaseAdmin.from('users').select('nama, current_streak').eq('id', userId).single(),
        supabaseAdmin.from('daily_checkin').select('mood, niat').eq('user_id', userId).eq('tanggal', today).maybeSingle(),
        supabaseAdmin.from('progress_materi').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('selesai', true),
        supabaseAdmin.from('kuis_attempts').select('nilai_persen').eq('user_id', userId).eq('selesai', true).gte('submitted_at', semingguLalu),
      ])

      const kuisData = kuisRes.data || []
      const avgNilai = kuisData.length
        ? Math.round(kuisData.reduce((s: number, k: any) => s + (k.nilai_persen || 0), 0) / kuisData.length)
        : 0

      siswaContext = {
        nama: userRes.data?.nama || 'Siswa',
        mood: checkinRes.data?.mood,
        niat: checkinRes.data?.niat,
        materiSelesai: progressRes.count || 0,
        kuisStats: { total: kuisData.length, avgNilai },
        streak: userRes.data?.current_streak || 0,
      }
    }

    const systemPrompt = buildSystemPrompt(materi, blocks || [], siswaContext)

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
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
      return NextResponse.json({ error: 'Groq API error' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || 'Maaf, aku tidak bisa menjawab sekarang. Coba lagi ya!'
    const suggestions = generateSuggestions(messages)

    return NextResponse.json({ text, suggestions })
  } catch (error: any) {
    console.error('Tutor API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}