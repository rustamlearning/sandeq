import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { userId, newPassword, requesterToken } = await req.json()

    if (!userId || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'userId dan password (min 6 karakter) wajib diisi' }, { status: 400 })
    }

    // Verify requester is admin
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${requesterToken}` } } }
    )
    const { data: { user: requester } } = await supabaseClient.auth.getUser()
    if (!requester) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

    const { data: requesterProfile } = await supabaseAdmin.from('users').select('role').eq('id', requester.id).single()
    if (!requesterProfile || requesterProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya admin yang dapat mereset password' }, { status: 403 })
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
