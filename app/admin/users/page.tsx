'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, registerUser } from '@/lib/auth'
import { supabase, User, Kelas, UserRole } from '@/lib/supabase'

export default function KelolaUsersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all')

  const [nisNip, setNisNip] = useState('')
  const [nama, setNama] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('siswa')
  const [kelasId, setKelasId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      if (!user || user.role !== 'admin') {
        router.replace('/login')
        return
      }
      await Promise.all([loadUsers(), loadKelas()])
      setLoading(false)
    }
    init()
  }, [router])

  async function loadUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('role', { ascending: true })
      .order('nama', { ascending: true })
    setUsers(data || [])
  }

  async function loadKelas() {
    const { data } = await supabase
      .from('kelas')
      .select('*')
      .order('tingkat', { ascending: true })
    setKelasList(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await registerUser(nisNip, password, nama, role, role === 'siswa' ? kelasId : null)
      setNisNip('')
      setNama('')
      setPassword('')
      setKelasId('')
      setShowForm(false)
      await loadUsers()
    } catch (err: any) {
      setError(err.message || 'Gagal menambah pengguna')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredUsers = filterRole === 'all' ? users : users.filter((u) => u.role === filterRole)

  function getKelasNama(id: string | null) {
    if (!id) return '-'
    return kelasList.find((k) => k.id === id)?.nama || '-'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-gray-500 hover:text-gray-700">
              ← Kembali
            </button>
            <h1 className="text-xl font-bold text-gray-800">Kelola Pengguna</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'Tutup' : '+ Tambah Pengguna'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Tambah Pengguna Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="siswa">Siswa</option>
                  <option value="guru">Guru</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {role === 'siswa' ? 'NIS' : 'NIP'}
                </label>
                <input
                  type="text"
                  value={nisNip}
                  onChange={(e) => setNisNip(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password (min. 6 karakter)</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {role === 'siswa' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                  <select
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih kelas</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama} ({k.tahun_ajaran})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </form>
        )}

        <div className="flex gap-2 mb-4">
          {(['all', 'siswa', 'guru', 'admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                filterRole === r ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {r === 'all' ? 'Semua' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredUsers.length === 0 ? (
            <p className="p-8 text-center text-gray-500">Belum ada pengguna.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NIS/NIP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kelas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium text-gray-800">{u.nis_nip}</td>
                    <td className="px-4 py-3 text-gray-600">{u.nama}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          u.role === 'admin'
                            ? 'bg-red-100 text-red-700'
                            : u.role === 'guru'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{getKelasNama(u.kelas_id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}