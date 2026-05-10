import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { config } from 'dotenv'
import { randomUUID } from 'crypto'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const GURU_ID = '936dfc55-5db5-487f-b908-6fa69a9350a0'

const KELAS = [
  { id: '2abd6ec9-bc4d-412b-86fb-11973df866b3', nama: 'X Hatta' },
  { id: '1054ccf1-7892-46c1-beb6-93b83f0f4846', nama: 'X Pangeran Diponegoro' },
  { id: '9a9f3b3f-bc31-4477-866e-de1394d0f9de', nama: 'X Soeharto' },
]

// Unsplash images - bebas copyright, foto realistic
const BAB_LIST = [
  {
    bab: 'Bab 1', judul: 'Greetings & Self Introduction', tingkat_kesulitan: 'mudah', estimasi_menit: 45,
    video_url: 'https://www.youtube.com/watch?v=rZFCcBFsEHQ',
    images: [
      { url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800', caption: 'Konten kreator memperkenalkan diri di depan kamera', alt: 'Content creator introducing themselves' },
      { url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800', caption: 'Percakapan dalam Bahasa Inggris', alt: 'People having conversation' },
    ],
    situasi: 'Kamu baru mulai bikin konten di TikTok atau YouTube untuk audiens internasional. Gimana cara memperkenalkan diri dan channel-mu dalam Bahasa Inggris yang natural, bukan kaku?',
    topik: ['Formal vs informal greetings', 'Self introduction structure', 'Small talk expressions', 'Introducing others'],
  },
  {
    bab: 'Bab 2', judul: 'Descriptive Text', tingkat_kesulitan: 'mudah', estimasi_menit: 50,
    video_url: 'https://www.youtube.com/watch?v=9QiE-M1LrZk',
    images: [
      { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', caption: 'Tempat wisata alam Indonesia yang menakjubkan', alt: 'Beautiful Indonesian nature' },
      { url: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800', caption: 'Review tempat untuk platform digital', alt: 'Writing a review on phone' },
    ],
    situasi: 'Kamu mau review tempat wisata di daerahmu untuk diunggah di Google Maps atau TripAdvisor dalam Bahasa Inggris supaya turis mancanegara bisa baca.',
    topik: ['Structure of descriptive text', 'Adjectives & sensory language', 'Present tense usage', 'Describing people places things'],
  },
  {
    bab: 'Bab 6', judul: 'Explanation Text', tingkat_kesulitan: 'sedang', estimasi_menit: 55,
    video_url: 'https://www.youtube.com/watch?v=A77NQOT3-vk',
    images: [
      { url: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800', caption: 'Fenomena alam yang perlu dijelaskan secara ilmiah', alt: 'Natural phenomenon' },
      { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', caption: 'Presentasi ilmiah dalam Bahasa Inggris', alt: 'Scientific presentation' },
    ],
    situasi: 'Kamu diminta menjelaskan fenomena alam atau sosial yang terjadi di daerahmu dalam Bahasa Inggris untuk presentasi internasional.',
    topik: ['Structure of explanation text', 'Passive voice', 'Cause and effect language', 'Technical and scientific vocabulary'],
  },
  {
    bab: 'Bab 8', judul: 'News Item Text', tingkat_kesulitan: 'sedang', estimasi_menit: 50,
    video_url: 'https://www.youtube.com/watch?v=3G4OlFSHE4Y',
    images: [
      { url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800', caption: 'Jurnalis meliput berita terkini', alt: 'Journalist reporting news' },
      { url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800', caption: 'Berita digital di era modern', alt: 'Digital news media' },
    ],
    situasi: 'Ada kejadian penting di daerahmu. Kamu mau laporkan dalam format berita Bahasa Inggris seperti BBC atau CNN.',
    topik: ['Structure of news item', 'Newsworthy event', 'Background events', 'Passive voice in news'],
  },
  {
    bab: 'Bab 9', judul: 'Speaking & Conversation Skills', tingkat_kesulitan: 'sedang', estimasi_menit: 55,
    video_url: 'https://www.youtube.com/watch?v=p4E4fzBJJFg',
    images: [
      { url: 'https://images.unsplash.com/photo-1560439514-4e9645039924?w=800', caption: 'Interview online untuk program internasional', alt: 'Online interview' },
      { url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800', caption: 'Percakapan profesional dalam Bahasa Inggris', alt: 'Professional conversation' },
    ],
    situasi: 'Kamu akan interview online dalam Bahasa Inggris untuk program pertukaran pelajar internasional.',
    topik: ['Conversation strategies', 'Asking and giving opinion', 'Agreeing and disagreeing', 'Interview techniques'],
  },
]

function blkId() {
  return `blk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function sanitizeForJson(str) {
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

function safeParseJson(text) {
  // Strip code fences
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  
  // Find JSON array bounds
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('No JSON array found')
  text = text.slice(start, end + 1)

  // Sanitize control characters inside strings
  text = text.replace(/"((?:[^"\\]|\\.)*)"/g, (match, inner) => {
    const cleaned = inner
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/(?<!\\)\n/g, '\\n')
      .replace(/(?<!\\)\r/g, '\\r')
      .replace(/(?<!\\)\t/g, '\\t')
    return `"${cleaned}"`
  })

  return JSON.parse(text)
}

async function generateBlocks(bab) {
  const prompt = `Kamu adalah guru Bahasa Inggris SMA kelas X yang kreatif dan up-to-date. Buat konten materi pembelajaran lengkap untuk:

BAB: ${bab.judul}
SITUASI KONTEKSTUAL: ${bab.situasi}
TOPIK: ${bab.topik.join(', ')}

Buat array JSON blocks. Gunakan tipe block berikut secara maksimal:
- heading (level 1, 2, atau 3)
- paragraph (markdown supported: **bold**, *italic*, bullet list dengan -)
- callout (style: info/tip/warning/danger)
- table (headers array, rows array of arrays)
- quote (text dan source)
- check (question, options array 4 pilihan, correctIndex 0-3, explanation)

ATURAN PENTING untuk menghasilkan JSON yang valid:
- Jangan gunakan newline literal di dalam string JSON - ganti dengan spasi atau kalimat baru
- Jangan gunakan tab literal di dalam string
- Semua string harus dalam satu baris dalam JSON
- Gunakan tanda titik untuk mengakhiri kalimat, bukan newline

KONTEN:
- Original, bukan copy buku Kemdikbud
- Contoh dari kehidupan remaja Indonesia 2025-2026: TikTok, YouTube, AI, K-pop, gaming
- Minimal 20 blocks
- Minimal 5 check blocks tersebar merata
- Sertakan deep learning prompts di callout tip

Balas HANYA dengan JSON array, tidak ada teks lain sama sekali.`

  const res = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    max_tokens: 8000,
    temperature: 0.6,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = res.choices[0].message.content
  const blocks = safeParseJson(text)
  return blocks.map(b => ({ ...b, id: blkId() }))
}

async function main() {
  console.log('🚀 Generate ulang bab yang gagal + tambah gambar...\n')

  for (const bab of BAB_LIST) {
    console.log(`📖 Generating: ${bab.bab} — ${bab.judul}`)

    let blocks
    try {
      blocks = await generateBlocks(bab)
      console.log(`   ✅ ${blocks.length} blocks generated`)
    } catch (err) {
      console.error(`   ❌ Gagal: ${err.message}`)
      continue
    }

    // Sisipkan video setelah heading pertama
    const videoBlock = { id: blkId(), type: 'video', url: bab.video_url, caption: `Video: ${bab.judul}` }
    blocks.splice(1, 0, videoBlock)

    // Sisipkan gambar di posisi strategis
    if (bab.images?.length > 0) {
      // Gambar pertama setelah video
      const img1 = { id: blkId(), type: 'image', url: bab.images[0].url, caption: bab.images[0].caption, alt: bab.images[0].alt }
      blocks.splice(3, 0, img1)

      // Gambar kedua di tengah materi
      if (bab.images[1]) {
        const mid = Math.floor(blocks.length / 2)
        const img2 = { id: blkId(), type: 'image', url: bab.images[1].url, caption: bab.images[1].caption, alt: bab.images[1].alt }
        blocks.splice(mid, 0, img2)
      }
    }

    // Hapus materi lama untuk bab ini dulu (kalau ada)
    await sb.from('materi')
      .delete()
      .eq('guru_id', GURU_ID)
      .eq('bab', bab.bab)
      .eq('mapel', 'Bahasa Inggris')

    // Insert ke semua kelas X
    for (const kelas of KELAS) {
      const { error } = await sb.from('materi').insert({
        id: randomUUID(),
        judul: `${bab.bab}: ${bab.judul}`,
        mapel: 'Bahasa Inggris',
        bab: bab.bab,
        kelas_id: kelas.id,
        guru_id: GURU_ID,
        konten_blocks: blocks,
        konten: '',
        tujuan_pembelajaran: `Siswa mampu memahami dan menggunakan ${bab.judul} dalam konteks komunikasi digital dan kehidupan sehari-hari`,
        ringkasan: bab.situasi,
        estimasi_menit: bab.estimasi_menit,
        tingkat_kesulitan: bab.tingkat_kesulitan,
        dimensi: ['Bernalar Kritis', 'Kreatif', 'Berkebhinekaan Global'],
      })
      if (error) console.error(`   ❌ ${kelas.nama}: ${error.message}`)
      else console.log(`   ✅ Inserted ke ${kelas.nama}`)
    }

    console.log(`   ⏳ Tunggu 3 detik...\n`)
    await new Promise(r => setTimeout(r, 3000))
  }

  console.log('🎉 Selesai!')
}

main().catch(console.error)
