import { NextRequest, NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

function normalizeAnswer(value: unknown) {
  return String(value ?? '').trim()
}

function isIsian(tipe: string) {
  return tipe === 'isian'
}

function isKuisOpen(kuis: any) {
  const now = Date.now()
  if (kuis.tanggal_mulai && new Date(kuis.tanggal_mulai).getTime() > now) return false
  if (kuis.tanggal_selesai && new Date(kuis.tanggal_selesai).getTime() < now) return false
  return true
}

function getAcceptedAnswers(soal: any) {
  const correct = normalizeAnswer(soal.jawaban_benar || soal.jawaban)
  const answers = [correct]

  if (!Array.isArray(soal.pilihan) && soal.pilihan && correct in soal.pilihan) {
    answers.push(normalizeAnswer(soal.pilihan[correct]))
  }

  if (isIsian(soal.tipe) && Array.isArray(soal.kunci_jawaban_alt)) {
    answers.push(...soal.kunci_jawaban_alt.map(normalizeAnswer))
  }

  return answers
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(req, ['siswa'])
  if ('response' in auth) return auth.response
  const { id } = await context.params

  const { jawaban } = await req.json()
  if (!jawaban || typeof jawaban !== 'object' || Array.isArray(jawaban)) {
    return NextResponse.json({ error: 'Jawaban tidak valid' }, { status: 400 })
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('id, kelas_id')
    .eq('id', auth.user.id)
    .single()

  if (!profile?.kelas_id) {
    return NextResponse.json({ error: 'Kelas siswa tidak ditemukan' }, { status: 403 })
  }

  const { data: kuis } = await supabaseAdmin
    .from('kuis')
    .select('*')
    .eq('id', id)
    .eq('kelas_id', profile.kelas_id)
    .single()

  if (!kuis || kuis.is_published !== true || !isKuisOpen(kuis)) {
    return NextResponse.json({ error: 'Kuis tidak tersedia' }, { status: 404 })
  }

  const { data: existing } = await supabaseAdmin
    .from('pengerjaan')
    .select('id')
    .eq('siswa_id', auth.user.id)
    .eq('kuis_id', id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Kuis sudah dikerjakan' }, { status: 409 })
  }

  const { data: soalList } = await supabaseAdmin
    .from('soal')
    .select('*')
    .eq('kuis_id', id)

  if (!soalList?.length) {
    return NextResponse.json({ error: 'Soal tidak tersedia' }, { status: 404 })
  }

  let benar = 0
  for (const soal of soalList) {
    const userJawab = normalizeAnswer(jawaban[soal.id])
    const acceptedAnswers = getAcceptedAnswers(soal)

    if (isIsian(soal.tipe)) {
      const accepted = acceptedAnswers.map((value) => value.toLowerCase())
      if (accepted.includes(userJawab.toLowerCase())) benar++
    } else if (acceptedAnswers.includes(userJawab)) {
      benar++
    }
  }

  const skor = Math.round((benar / soalList.length) * 100)
  const { error: pengerjaanError } = await supabaseAdmin.from('pengerjaan').insert({
    siswa_id: auth.user.id,
    kuis_id: id,
    jawaban_siswa: jawaban,
    skor,
  })

  if (pengerjaanError) {
    return NextResponse.json({ error: 'Gagal menyimpan jawaban' }, { status: 500 })
  }

  if (kuis.tipe === 'ulangan') {
    const { error: nilaiError } = await supabaseAdmin.from('nilai').insert({
      siswa_id: auth.user.id,
      mapel: kuis.mapel,
      komponen: kuis.judul,
      bobot: 1,
      nilai: skor,
      semester: 1,
      diinput_oleh: kuis.guru_id,
      catatan: 'Otomatis dari ulangan',
    })

    if (nilaiError) {
      return NextResponse.json({ error: 'Jawaban tersimpan, tetapi nilai gagal dicatat' }, { status: 500 })
    }
  }

  return NextResponse.json({
    hasil: {
      skor,
      benar,
      total: soalList.length,
    },
  })
}
