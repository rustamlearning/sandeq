'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db/schema';
import { hashPassword } from '@/lib/db/seed';
import { UserPlus, Trash2, Eye, EyeOff } from 'lucide-react';

interface User {
  id: string;
  nisNip: string;
  nama: string;
  role: 'guru' | 'siswa' | 'admin';
  aktif: boolean;
  createdAt: string;
  passwordHash: string;
  kelasId?: string;
}

export default function ManajemenPengguna() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    nisNip: '',
    nama: '',
    role: 'guru' as 'guru' | 'siswa',
    password: 'sandeq123',
  });
  const [pesan, setPesan] = useState('');

  const loadUsers = async () => {
    const all = await db.users.toArray();
    setUsers(all.filter(u => u.role !== 'admin') as User[]);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleTambah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nisNip || !form.nama) return;

    const existing = await db.users.where('nisNip').equals(form.nisNip).first();
    if (existing) {
      setPesan('❌ NIS/NIP sudah terdaftar!');
      return;
    }

    await db.users.add({
      id: `user-${Date.now()}`,
      nisNip: form.nisNip,
      nama: form.nama,
      role: form.role,
      passwordHash: hashPassword(form.password),
      aktif: true,
      createdAt: new Date().toISOString(),
    });

    setPesan('✅ Pengguna berhasil ditambahkan!');
    setForm({ nisNip: '', nama: '', role: 'guru', password: 'sandeq123' });
    setShowForm(false);
    loadUsers();
    setTimeout(() => setPesan(''), 3000);
  };

  const handleHapus = async (id: string, nama: string) => {
    if (!confirm(`Hapus ${nama}?`)) return;
    await db.users.delete(id);
    loadUsers();
  };

  const guru = users.filter(u => u.role === 'guru');
  const siswa = users.filter(u => u.role === 'siswa');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A4A7A]">Manajemen Pengguna</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#1A4A7A] text-white px-4 py-2 rounded-lg hover:bg-[#153c61] transition"
        >
          <UserPlus size={18} />
          Tambah Pengguna
        </button>
      </div>

      {pesan && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {pesan}
        </div>
      )}

      {showForm && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-[#1A4A7A] mb-4">Tambah Pengguna Baru</h2>
          <form onSubmit={handleTambah} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({...form, role: e.target.value as 'guru' | 'siswa'})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2E86C1] outline-none"
                >
                  <option value="guru">Guru</option>
                  <option value="siswa">Siswa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.role === 'guru' ? 'NIP' : 'NIS'}
                </label>
                <input
                  type="text"
                  value={form.nisNip}
                  onChange={e => setForm({...form, nisNip: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2E86C1] outline-none"
                  placeholder={form.role === 'guru' ? 'Contoh: 199001012015011001' : 'Contoh: 2024010'}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={form.nama}
                onChange={e => setForm({...form, nama: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2E86C1] outline-none"
                placeholder="Contoh: Bapak Hasan, S.Pd"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2E86C1] outline-none"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit"
                className="bg-[#1A4A7A] text-white px-6 py-2 rounded-lg hover:bg-[#153c61] transition">
                Simpan
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Daftar Guru */}
      <div className="mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Guru ({guru.length})</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <p className="p-4 text-gray-400 text-sm">Memuat...</p>
          ) : guru.length === 0 ? (
            <p className="p-4 text-gray-400 text-sm">Belum ada guru.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left">NIP</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {guru.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{u.nama}</td>
                    <td className="px-4 py-3 text-gray-500">{u.nisNip}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleHapus(u.id, u.nama)}
                        className="text-red-400 hover:text-red-600 transition">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Daftar Siswa */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">Siswa ({siswa.length})</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {siswa.length === 0 ? (
            <p className="p-4 text-gray-400 text-sm">Belum ada siswa.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left">NIS</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {siswa.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{u.nama}</td>
                    <td className="px-4 py-3 text-gray-500">{u.nisNip}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleHapus(u.id, u.nama)}
                        className="text-red-400 hover:text-red-600 transition">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
