import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { nisNip, password, nama, role, kelasId, requesterToken } = await req.json()

    // Verifikasi requester adalah admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${requesterToken}` } },
    })

    const { data: { user: requester } } = await supabaseClient.auth.getUser()
    if (!requester) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { data: requesterProfile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', requester.id)
      .single()

    if (!requesterProfile || requesterProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya admin yang dapat menambah pengguna' }, { status: 403 })
    }

    // Buat user pakai admin API (bypass rate limit)
    const email = `${nisNip}@sandeq.local`

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // langsung confirmed, no email sent
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 })
    }

    // Insert profil ke tabel users
    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      nis_nip: nisNip,
      nama,
      role,
      kelas_id: kelasId,
      aktif: true,
    })

    if (profileError) {
      // Rollback: hapus user auth kalau insert profil gagal
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}