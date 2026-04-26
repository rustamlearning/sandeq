import { supabase, User, UserRole } from './supabase'

// Login dengan NIS/NIP + password
export async function login(nisNip: string, password: string) {
  const email = `${nisNip}@sandeq.local`

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (profileError) throw profileError

  return profile as User
}

// Register user baru (untuk admin) - via API route untuk bypass rate limit
export async function registerUser(
  nisNip: string,
  password: string,
  nama: string,
  role: UserRole,
  kelasId: string | null = null
) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Anda harus login terlebih dahulu')

  const response = await fetch('/api/admin/register-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nisNip,
      password,
      nama,
      role,
      kelasId,
      requesterToken: session.access_token,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Gagal menambah pengguna')
  }

  return result
}

// Logout
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Ambil user yang sedang login
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null
  return profile as User
}

// Listen perubahan auth state
export function onAuthChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      callback(profile as User || null)
    } else {
      callback(null)
    }
  })
}