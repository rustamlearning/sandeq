import { NextRequest, NextResponse } from 'next/server'
import { rateLimitApiUser, requireApiUser } from '@/lib/api-auth'

const MAX_FIELD_LENGTH = 2000
const AI_RATE_LIMIT = 10
const AI_RATE_WINDOW_MS = 60_000

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req, ['guru', 'admin'])
    if ('response' in auth) return auth.response
    const limited = rateLimitApiUser(auth.user.id, 'generate-materi', AI_RATE_LIMIT, AI_RATE_WINDOW_MS)
    if (limited) return limited

    const { judul, mapel, tujuan, kelas } = await req.json()
    if (!judul || !mapel) return NextResponse.json({ error: 'judul dan mapel wajib diisi' }, { status: 400 })
    if ([judul, mapel, tujuan, kelas].some((value) => typeof value === 'string' && value.length > MAX_FIELD_LENGTH)) {
      return NextResponse.json({ error: 'Input terlalu panjang' }, { status: 413 })
    }

    const prompt = `Kamu adalah guru ${mapel} yang berpengalaman di Indonesia. Buat konten materi pembelajaran dalam Bahasa Indonesia yang lengkap dan jelas.

Judul Materi: ${judul}
Mata Pelajaran: ${mapel}
Kelas: ${kelas || 'SMA'}
Tujuan Pembelajaran: ${tujuan || 'Memahami konsep ' + judul}

Kembalikan HANYA array JSON (tanpa teks lain, tanpa markdown, tanpa komentar) berisi 6-10 block konten. Gunakan tipe block berikut:

- heading: { "type": "heading", "level": 2, "text": "..." }
- paragraph: { "type": "paragraph", "text": "Isi paragraf dalam **markdown**. Bisa pakai *italic*, **bold**, \`kode inline\`." }
- callout: { "type": "callout", "style": "info"|"tip"|"warning", "text": "..." }
- check: { "type": "check", "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..." }

Panduan:
- Mulai dengan heading tingkat 2 sebagai sub-judul pertama
- Buat 3-4 paragraf penjelasan yang padat dan informatif
- Sertakan 1-2 callout (info atau tip) yang berguna
- Akhiri dengan 1 mini-quiz (check) untuk cek pemahaman
- Total 6-10 block, urut secara logis
- Tulis dalam Bahasa Indonesia yang baku dan jelas

Output HANYA array JSON:`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.6,
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'AI request gagal' }, { status: 502 })
    }

    const data = await res.json()
    const text: string = data.choices?.[0]?.message?.content ?? '[]'

    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return NextResponse.json({ error: 'AI tidak menghasilkan blok valid' }, { status: 422 })

    const rawBlocks = JSON.parse(match[0]) as any[]

    // Attach IDs
    const blocks = rawBlocks.map((b) => ({
      ...b,
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    }))

    return NextResponse.json({ blocks })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
