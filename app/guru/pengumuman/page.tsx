'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Pengumuman } from '@/lib/supabase'

const KATEGORI = ['umum', 'akademik', 'kegiatan', 'darurat'] as const
type Kategori = (typeof KATEGORI)[number]

const KATEGORI_CONFIG: Record<Kategori, { label: string; icon: string; bg: string; text: string; border: string }> = {
  umum:     { label: 'Umum',     icon: '📢', bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-200'   },
  akademik: { label: 'Akademik', icon: '📚', bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200'   },
  kegiatan: { label: 'Kegiatan', icon: '🎯', bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200'  },
  darurat:  { label: 'Darurat',  icon: '🚨', bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300'    },
}

export default function PengumumanGuruPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<Pengumuman[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Pengumuman | null>(null)
  const [judul, setJudul] = useState('')
  const [konten, setKonten] = useState('')
  const [kategori, setKategori] = useState<Kategori>('umum')
  const [dipin, setDipin] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'guru') { router.replace('/login'); return }
      setUser(u)
      await load(u.id)
      setLoading(false)
    }
    init()
  }, [router])

  async function load(guruId: string) {
    const { data } = await supabase.from('pengumuman').select('*').eq('created_by', guruId)
      .order('dipin', { ascending: false }).order('created_at', { ascending: false })
    setList(data || [])
  }

  function openEdit(item: Pengumuman) {
    setEditItem(item)
    setJudul(item.judul)
    setKonten(item.konten)
    setKategori(item.kategori as Kategori)
    setDipin(item.dipin)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditItem(null)
    setJudul(''); setKonten(''); setKategori('umum'); setDipin(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    if (editItem) {
      await supabase.from('pengumuman').update({ judul, konten, kategori, dipin }).eq('id', editItem.id)
    } else {
      await supabase.from('pengumuman').insert({ judul, konten, kategori, target: 'semua', dipin, created_by: user.id })
    }
    closeForm()
    setSubmitting(false)
    await load(user.id)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus pengumuman ini?')) return
    await supabase.from('pengumuman').delete().eq('id', id)
    setList((prev) => prev.filter((p) => p.id !== id))
  }

  async function togglePin(item: Pengumuman) {
    await supabase.from('pengumuman').update({ dipin: !item.dipin }).eq('id', item.id)
    await load(user!.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">📢</div>
          <p className="text-gray-500">Memuat pengumuman...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#0A2D52] to-[#1A4A7A] shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          <button
            onClick={() => router.push('/guru')}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Pengumuman</h1>
            <p className="text-white/80 text-sm">{list.length} pengumuman diterbitkan</p>
          </div>
          <button
            onClick={() => showForm ? closeForm() : setShowForm(true)}
            className="bg-white text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl font-semibold text-sm shadow-sm transition"
          >
            {showForm ? '✕ Tutup' : '+ Buat'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Form buat pengumuman */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 flex items-center justify-between">
              <h2 className="text-white font-bold">{editItem ? '✏️ Edit Pengumuman' : 'Buat Pengumuman Baru'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Judul</label>
                <input
                  type="text" value={judul} onChange={(e) => setJudul(e.target.value)} required
                  placeholder="Judul pengumuman..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Kategori</label>
                  <select
                    value={kategori} onChange={(e) => setKategori(e.target.value as Kategori)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 outline-none"
                  >
                    {KATEGORI.map((k) => (
                      <option key={k} value={k}>{KATEGORI_CONFIG[k].icon} {KATEGORI_CONFIG[k].label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox" checked={dipin} onChange={(e) => setDipin(e.target.checked)}
                      className="w-4 h-4 rounded accent-rose-500"
                    />
                    <span>📌 Pin di atas</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Isi Pengumuman</label>
                <textarea
                  value={konten} onChange={(e) => setKonten(e.target.value)} required rows={5}
                  placeholder="Tulis isi pengumuman di sini..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold text-sm hover:from-rose-600 hover:to-pink-600 transition disabled:opacity-50"
                >
                  {submitting ? '⏳ Menyimpan...' : editItem ? '💾 Simpan Perubahan' : '📤 Publikasikan'}
                </button>
                <button
                  type="button" onClick={closeForm}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List pengumuman */}
        {list.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-semibold text-gray-700">Belum ada pengumuman</p>
            <p className="text-sm text-gray-400 mt-1">Buat pengumuman pertama untuk siswa</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-5 py-2 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 transition"
            >
              + Buat Pengumuman
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((p) => {
              const cfg = KATEGORI_CONFIG[p.kategori as Kategori] || KATEGORI_CONFIG.umum
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-xl shadow-sm border-l-4 ${cfg.border} overflow-hidden`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {p.dipin && <span className="text-xs font-semibold text-rose-500">📌 Dipin</span>}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-800 mb-1">{p.judul}</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{p.konten}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => togglePin(p)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                      >
                        {p.dipin ? '📌 Unpin' : '📌 Pin'}
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition ml-auto"
                      >
                        🗑 Hapus
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
