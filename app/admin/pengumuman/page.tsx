'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  Edit3,
  Inbox,
  Loader2,
  Megaphone,
  Pin,
  Plus,
  Save,
  Send,
  Target,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { supabase, Pengumuman } from '@/lib/supabase'

const KATEGORI = ['umum', 'akademik', 'kegiatan', 'darurat'] as const
type Kategori = (typeof KATEGORI)[number]

const KATEGORI_CONFIG: Record<Kategori, { label: string; icon: LucideIcon; bg: string; text: string; border: string }> = {
  umum:     { label: 'Umum',     icon: Megaphone,     bg: 'bg-gray-100',  text: 'text-gray-700',  border: 'border-l-gray-300'  },
  akademik: { label: 'Akademik', icon: BookOpen,      bg: 'bg-blue-100',  text: 'text-blue-700',  border: 'border-l-blue-400'  },
  kegiatan: { label: 'Kegiatan', icon: Target,        bg: 'bg-green-100', text: 'text-green-700', border: 'border-l-green-400' },
  darurat:  { label: 'Darurat',  icon: TriangleAlert, bg: 'bg-red-100',   text: 'text-red-700',   border: 'border-l-red-500'   },
}

interface PengumumanWithAuthor extends Pengumuman {
  author?: { nama: string; role: string }
}

export default function AdminPengumumanPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<PengumumanWithAuthor[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<PengumumanWithAuthor | null>(null)
  const [judul, setJudul] = useState('')
  const [konten, setKonten] = useState('')
  const [kategori, setKategori] = useState<Kategori>('umum')
  const [dipin, setDipin] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'admin') { router.replace('/login'); return }
      setUser(u)
      await load()
      setLoading(false)
    }
    init()
  }, [router])

  async function load() {
    const { data } = await supabase
      .from('pengumuman')
      .select('*, author:created_by(nama, role)')
      .order('dipin', { ascending: false })
      .order('created_at', { ascending: false })
    setList((data as PengumumanWithAuthor[]) || [])
  }

  function openEdit(p: PengumumanWithAuthor) {
    setEditItem(p)
    setJudul(p.judul)
    setKonten(p.konten)
    setKategori(p.kategori as Kategori)
    setDipin(p.dipin)
    setShowForm(true)
  }

  function resetForm() {
    setEditItem(null)
    setJudul(''); setKonten(''); setKategori('umum'); setDipin(false)
    setShowForm(false)
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
    setSubmitting(false)
    resetForm()
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus pengumuman ini?')) return
    await supabase.from('pengumuman').delete().eq('id', id)
    setList((prev) => prev.filter((p) => p.id !== id))
  }

  async function togglePin(item: PengumumanWithAuthor) {
    await supabase.from('pengumuman').update({ dipin: !item.dipin }).eq('id', item.id)
    await load()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Loader2 className="animate-spin" size={24} />
          </div>
          <p className="text-gray-500">Memuat pengumuman...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          <button onClick={() => router.push('/admin')} aria-label="Kembali" className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"><ArrowLeft size={18} /></button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Pengumuman</h1>
            <p className="text-white/80 text-sm">{list.length} pengumuman · semua guru</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="inline-flex items-center gap-2 bg-white text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl font-semibold text-sm shadow-sm transition"
          >
            {showForm && !editItem ? <X size={15} /> : <Plus size={15} />}
            {showForm && !editItem ? 'Tutup' : 'Buat'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3">
              <h2 className="text-white font-bold">{editItem ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Judul</label>
                <input type="text" value={judul} onChange={(e) => setJudul(e.target.value)} required
                  placeholder="Judul pengumuman..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Kategori</label>
                  <select value={kategori} onChange={(e) => setKategori(e.target.value as Kategori)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 outline-none">
                    {KATEGORI.map((k) => <option key={k} value={k}>{KATEGORI_CONFIG[k].label}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={dipin} onChange={(e) => setDipin(e.target.checked)} className="w-4 h-4 rounded accent-rose-500" />
                    <span className="inline-flex items-center gap-1.5"><Pin size={14} /> Pin di atas</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Isi Pengumuman</label>
                <textarea value={konten} onChange={(e) => setKonten(e.target.value)} required rows={5}
                  placeholder="Tulis isi pengumuman..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 outline-none resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={submitting}
                  className="inline-flex flex-1 items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-xl font-semibold text-sm hover:from-[#0d3562] hover:to-[#1A4A7A] transition disabled:opacity-50">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : editItem ? <Save size={16} /> : <Send size={16} />}
                  {submitting ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Publikasikan'}
                </button>
                <button type="button" onClick={resetForm}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {list.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Inbox size={26} />
            </div>
            <p className="font-semibold text-gray-700">Belum ada pengumuman</p>
            <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 transition">
              <Plus size={15} />
              Buat Pengumuman
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((p) => {
              const cfg = KATEGORI_CONFIG[p.kategori as Kategori] || KATEGORI_CONFIG.umum
              const Icon = p.dipin ? Pin : cfg.icon
              return (
                <div key={p.id} className={`bg-white rounded-xl shadow-sm border-l-4 ${cfg.border} overflow-hidden`}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {p.dipin && <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500"><Pin size={12} /> Dipin</span>}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-xs text-gray-400">· {p.author?.nama || 'Admin'}</span>
                        </div>
                        <h4 className="font-bold text-gray-800 mb-1">{p.judul}</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-2">{p.konten}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      <button onClick={() => togglePin(p)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition">
                        <Pin size={13} />
                        {p.dipin ? 'Unpin' : 'Pin'}
                      </button>
                      <button onClick={() => openEdit(p)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                        <Edit3 size={13} />
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        className="ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                        <Trash2 size={13} />
                        Hapus
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
