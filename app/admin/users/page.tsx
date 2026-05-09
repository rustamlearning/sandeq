'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Plus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { getCurrentUser, registerUser } from '@/lib/auth'
import { supabase, User, Kelas, UserRole } from '@/lib/supabase'

const ROLE_CONFIG: Record<UserRole, { label: string; bg: string; text: string }> = {
  siswa: { label: 'Siswa', bg: 'bg-blue-100', text: 'text-blue-700' },
  guru:  { label: 'Guru',  bg: 'bg-indigo-100', text: 'text-indigo-700' },
  admin: { label: 'Admin', bg: 'bg-red-100', text: 'text-red-700' },
}

export default function KelolaUsersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all')

  // Add user form
  const [nisNip, setNisNip] = useState('')
  const [nama, setNama] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('siswa')
  const [kelasId, setKelasId] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset password modal
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (!user || user.role !== 'admin') { router.replace('/login'); return }
      await Promise.all([loadUsers(), loadKelas()])
      setLoading(false)
    }
    init()
  }, [router])

  async function loadUsers() {
    const { data } = await supabase.from('users').select('*').order('role').order('nama')
    setUsers(data || [])
  }

  async function loadKelas() {
    const { data } = await supabase.from('kelas').select('*').order('tingkat')
    setKelasList(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      await registerUser(nisNip, password, nama, role, role === 'siswa' ? kelasId : null)
      setNisNip(''); setNama(''); setPassword(''); setKelasId('')
      setShowForm(false)
      await loadUsers()
    } catch (err: any) {
      setFormError(err.message || 'Gagal menambah pengguna')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetTarget) return
    if (resetPassword.length < 6) { setResetMsg({ type: 'error', text: 'Password minimal 6 karakter.' }); return }
    setResetting(true)
    setResetMsg(null)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: resetTarget.id, newPassword: resetPassword, requesterToken: session?.access_token }),
    })
    const result = await res.json()
    setResetting(false)
    if (!res.ok) { setResetMsg({ type: 'error', text: result.error }); return }
    setResetMsg({ type: 'success', text: `Password ${resetTarget.nama} berhasil direset!` })
    setResetPassword('')
  }

  function getKelasNama(id: string | null) {
    if (!id) return '–'
    return kelasList.find((k) => k.id === id)?.nama || '–'
  }

  const filteredUsers = filterRole === 'all' ? users : users.filter((u) => u.role === filterRole)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Loader2 className="animate-spin" size={24} />
          </div>
          <p className="text-gray-500">Memuat pengguna...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-3">
          <button onClick={() => router.push('/admin')} aria-label="Kembali" className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"><ArrowLeft size={18} /></button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Kelola Pengguna</h1>
            <p className="text-white/70 text-sm">{users.length} pengguna terdaftar</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl font-semibold text-sm shadow-sm transition"
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? 'Tutup' : 'Tambah'}
          </button>
        </div>

        {/* Filter chips */}
        <div className="max-w-4xl mx-auto px-4 pb-4 flex gap-2">
          {(['all', 'siswa', 'guru', 'admin'] as const).map((r) => {
            const count = r === 'all' ? users.length : users.filter((u) => u.role === r).length
            return (
              <button key={r} onClick={() => setFilterRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterRole === r ? 'bg-white text-slate-700' : 'bg-white/20 text-white hover:bg-white/30'
                }`}>
                {r === 'all' ? `Semua (${count})` : `${r.charAt(0).toUpperCase() + r.slice(1)} (${count})`}
              </button>
            )
          })}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {/* Add user form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-5 py-3">
              <h2 className="text-white font-bold">Tambah Pengguna Baru</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-400 outline-none">
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{role === 'siswa' ? 'NIS' : 'NIP'}</label>
                  <input type="text" value={nisNip} onChange={(e) => setNisNip(e.target.value)} required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Lengkap</label>
                  <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Password (min. 6 karakter)</label>
                  <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-400 outline-none" />
                </div>
                {role === 'siswa' && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Kelas</label>
                    <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} required
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-400 outline-none">
                      <option value="">Pilih kelas</option>
                      {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama} ({k.tahun_ajaran})</option>)}
                    </select>
                  </div>
                )}
              </div>
              {formError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={submitting}
                  className="inline-flex flex-1 items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-semibold text-sm hover:from-slate-700 hover:to-slate-800 transition disabled:opacity-50">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                  {submitting ? 'Menyimpan...' : 'Tambah Pengguna'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* User list */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Users size={26} />
            </div>
            <p className="font-semibold text-gray-700">Belum ada pengguna</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filteredUsers.map((u) => {
                const cfg = ROLE_CONFIG[u.role as UserRole] || ROLE_CONFIG.siswa
                return (
                  <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center font-bold text-sm flex-shrink-0 ${cfg.text}`}>
                      {u.nama?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{u.nama}</p>
                      <p className="text-xs text-gray-400">{u.nis_nip} · {getKelasNama(u.kelas_id)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} flex-shrink-0`}>
                      {cfg.label}
                    </span>
                    <button
                      onClick={() => { setResetTarget(u); setResetPassword(''); setResetMsg(null) }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition flex-shrink-0"
                    >
                      <span className="inline-flex items-center gap-1"><KeyRound size={12} /> Reset</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">Reset Password</h3>
                <p className="text-white/80 text-xs mt-0.5">{resetTarget.nama}</p>
              </div>
              <button onClick={() => setResetTarget(null)} className="text-white/80 hover:text-white text-xl"><X size={17} /></button>
            </div>
            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              {resetMsg && (
                <div className={`text-sm px-3 py-2.5 rounded-xl font-medium ${
                  resetMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <span className="inline-flex items-center gap-1.5">
                    {resetMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {resetMsg.text}
                  </span>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Password Baru</label>
                <input type="text" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)}
                  required minLength={6} placeholder="Min. 6 karakter"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={resetting}
                  className="inline-flex flex-1 items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-xl font-semibold text-sm hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50">
                  {resetting ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
                  {resetting ? 'Mereset...' : 'Reset Password'}
                </button>
                <button type="button" onClick={() => setResetTarget(null)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
