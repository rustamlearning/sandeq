import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { UserRole } from '@/lib/supabase'

type AuthResult =
  | { user: { id: string; role: UserRole } }
  | { response: NextResponse }

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export async function requireApiUser(
  req: NextRequest,
  allowedRoles: UserRole[] = ['siswa', 'guru', 'admin']
): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return { response: NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 }) }
  }

  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error } = await supabaseClient.auth.getUser()
  if (error || !user) {
    return { response: NextResponse.json({ error: 'Session tidak valid' }, { status: 401 }) }
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('id, role, aktif')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.aktif) {
    return { response: NextResponse.json({ error: 'Akun tidak aktif' }, { status: 403 }) }
  }

  if (!allowedRoles.includes(profile.role as UserRole)) {
    return { response: NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 }) }
  }

  return { user: { id: user.id, role: profile.role as UserRole } }
}

export function rateLimitApiUser(
  userId: string,
  action: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now()
  const key = `${action}:${userId}`
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Terlalu banyak request. Coba lagi sebentar.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  entry.count += 1
  return null
}
