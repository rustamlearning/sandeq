import { NextRequest, NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

function isKuisOpen(kuis: any) {
  const now = Date.now()
  if (kuis.tanggal_mulai && new Date(kuis.tanggal_mulai).getTime() > now) return false
  if (kuis.tanggal_selesai && new Date(kuis.tanggal_selesai).getTime() < now) return false
  return true
}

function sanitizeSoal(soal: any) {
  const {
    jawaban_benar,
    jawaban,
    kunci_jawaban_alt,
    matching_pairs,
    pembahasan,
    penjelasan,
    ...safeSoal
  } = soal

  return {
    ...safeSoal,
    pilihan: Array.isArray(safeSoal.pilihan)
      ? safeSoal.pilihan
      : safeSoal.pilihan
        ? Object.values(safeSoal.pilihan)
        : null,
    pembahasan: null,
    penjelasan: null,
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(req, ['siswa'])
  if ('response' in auth) return auth.response
  const { id } = await context.params

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
    .select('id, skor')
    .eq('siswa_id', auth.user.id)
    .eq('kuis_id', id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Kuis sudah dikerjakan' }, { status: 409 })
  }

  const { data: soal } = await supabaseAdmin
    .from('soal')
    .select('*')
    .eq('kuis_id', id)
    .order('urutan', { ascending: true })
    .order('id', { ascending: true })

  if (!soal?.length) {
    return NextResponse.json({ error: 'Soal tidak tersedia' }, { status: 404 })
  }

  return NextResponse.json({
    kuis,
    soal: soal.map(sanitizeSoal),
  })
}
