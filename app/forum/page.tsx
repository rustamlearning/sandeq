'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'

const MAPEL_LIST = [
  'Umum', 'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Fisika', 'Kimia',
  'Biologi', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi',
  'PPKn', 'Pendidikan Agama', 'Seni Budaya', 'Penjaskes', 'Informatika',
]

interface ForumPost {
  id: string
  mapel: string
  judul: string | null
  konten: string
  author_id: string
  author_nama: string
  parent_id: string | null
  is_jawaban_terbaik: boolean
  likes: number
  created_at: string
  replies?: ForumPost[]
}

export default function ForumPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [filterMapel, setFilterMapel] = useState('Semua')
  const [showForm, setShowForm] = useState(false)
  const [judul, setJudul] = useState('')
  const [konten, setKonten] = useState('')
  const [mapel, setMapel] = useState(MAPEL_LIST[0])
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u) { router.replace('/login'); return }
      setUser(u)
      await load()
      setLoading(false)
    }
    init()
  }, [router])

  async function load() {
    const { data } = await supabase.from('forum').select('*').order('created_at', { ascending: false })
    const all = (data || []) as ForumPost[]
    const main = all.filter((p) => !p.parent_id)
    const replies = all.filter((p) => p.parent_id)
    main.forEach((m) => {
      m.replies = replies
        .filter((r) => r.parent_id === m.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    })
    setPosts(main)
  }

  async function handleSubmitPertanyaan(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    const { error } = await supabase.from('forum').insert({ mapel, judul, konten, author_id: user.id, author_nama: user.nama, parent_id: null })
    setSubmitting(false)
    if (error) { alert('Gagal: ' + error.message); return }
    setJudul(''); setKonten(''); setMapel(MAPEL_LIST[0]); setShowForm(false)
    await load()
  }

  async function handleSubmitReply(parentId: string, parentMapel: string) {
    if (!user || !replyText.trim()) return
    const { error } = await supabase.from('forum').insert({ mapel: parentMapel, konten: replyText, author_id: user.id, author_nama: user.nama, parent_id: parentId })
    if (error) { alert('Gagal: ' + error.message); return }
    setReplyText(''); setReplyTo(null)
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus post ini? Semua balasan ikut terhapus.')) return
    await supabase.from('forum').delete().eq('parent_id', id)
    await supabase.from('forum').delete().eq('id', id)
    await load()
  }

  async function toggleLike(post: ForumPost) {
    await supabase.from('forum').update({ likes: post.likes + 1 }).eq('id', post.id)
    await load()
  }

  async function tandaiJawabanTerbaik(replyId: string, parentId: string) {
    await supabase.from('forum').update({ is_jawaban_terbaik: false }).eq('parent_id', parentId)
    await supabase.from('forum').update({ is_jawaban_terbaik: true }).eq('id', replyId)
    await load()
  }

  function backToHome() {
    if (user?.role === 'guru') router.push('/guru')
    else if (user?.role === 'admin') router.push('/admin')
    else router.push('/siswa')
  }

  const filtered = filterMapel === 'Semua' ? posts : posts.filter((p) => p.mapel === filterMapel)
  const activeMapels = Array.from(new Set(posts.map((p) => p.mapel)))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">💬</div>
          <p className="text-gray-500">Memuat forum...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-gradient-to-r from-[#1A4A7A] to-[#2E86C1] shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          <button
            onClick={backToHome}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Forum Diskusi</h1>
            <p className="text-white/80 text-sm">{posts.length} pertanyaan</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-white text-sky-600 hover:bg-sky-50 px-4 py-2 rounded-xl font-semibold text-sm shadow-sm transition"
          >
            {showForm ? '✕ Tutup' : '+ Tanya'}
          </button>
        </div>

        {/* Filter mapel */}
        <div className="max-w-3xl mx-auto px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setFilterMapel('Semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterMapel === 'Semua' ? 'bg-white text-sky-600' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Semua ({posts.length})
            </button>
            {activeMapels.map((m) => {
              const count = posts.filter((p) => p.mapel === m).length
              return (
                <button
                  key={m}
                  onClick={() => setFilterMapel(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    filterMapel === m ? 'bg-white text-sky-600' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {m} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Form buat pertanyaan */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-sky-500 to-blue-500 px-5 py-3">
              <h2 className="text-white font-bold">Buat Pertanyaan Baru</h2>
            </div>
            <form onSubmit={handleSubmitPertanyaan} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Mata Pelajaran</label>
                <select
                  value={mapel} onChange={(e) => setMapel(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                >
                  {MAPEL_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Judul Pertanyaan</label>
                <input
                  type="text" value={judul} onChange={(e) => setJudul(e.target.value)} required
                  placeholder="Contoh: Bagaimana cara menyelesaikan persamaan kuadrat?"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Detail Pertanyaan</label>
                <textarea
                  value={konten} onChange={(e) => setKonten(e.target.value)} required rows={4}
                  placeholder="Jelaskan pertanyaanmu dengan detail..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#1A4A7A] to-[#2E86C1] text-white rounded-xl font-semibold text-sm hover:from-[#0d3562] hover:to-[#1A4A7A] transition disabled:opacity-50"
                >
                  {submitting ? '⏳ Mengirim...' : '📤 Kirim Pertanyaan'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List pertanyaan */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-3">💬</div>
            <p className="font-semibold text-gray-700">Belum ada pertanyaan</p>
            <p className="text-sm text-gray-400 mt-1">Jadilah yang pertama bertanya!</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-5 py-2 bg-sky-500 text-white rounded-xl text-sm font-semibold hover:bg-sky-600 transition">
              + Buat Pertanyaan
            </button>
          </div>
        ) : (
          filtered.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Pertanyaan */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm flex-shrink-0">
                    {post.author_nama?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">{post.mapel}</span>
                      <span className="text-xs text-gray-400">
                        {post.author_nama} · {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {post.judul && <h4 className="font-bold text-gray-800 mb-1">{post.judul}</h4>}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.konten}</p>

                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={() => toggleLike(post)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition">
                        👍 {post.likes}
                      </button>
                      <button
                        onClick={() => { setReplyTo(replyTo === post.id ? null : post.id); setReplyText('') }}
                        className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-medium transition"
                      >
                        💬 {post.replies?.length || 0} Balas
                      </button>
                      {(user?.id === post.author_id || user?.role === 'admin' || user?.role === 'guru') && (
                        <button onClick={() => handleDelete(post.id)} className="text-xs text-red-400 hover:text-red-600 ml-auto transition">
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {post.replies && post.replies.length > 0 && (
                <div className="bg-gray-50 border-t border-gray-100 divide-y divide-gray-100">
                  {post.replies.map((reply) => (
                    <div key={reply.id} className={`px-4 py-3 pl-8 ${reply.is_jawaban_terbaik ? 'bg-emerald-50' : ''}`}>
                      {reply.is_jawaban_terbaik && (
                        <span className="text-xs font-bold text-emerald-600 block mb-1">✅ Jawaban Terbaik</span>
                      )}
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                          {reply.author_nama?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-0.5">{reply.author_nama}</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.konten}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            {user?.id === post.author_id && !reply.is_jawaban_terbaik && (
                              <button
                                onClick={() => tandaiJawabanTerbaik(reply.id, post.id)}
                                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                              >
                                ✓ Tandai Terbaik
                              </button>
                            )}
                            {(user?.id === reply.author_id || user?.role === 'admin' || user?.role === 'guru') && (
                              <button onClick={() => handleDelete(reply.id)} className="text-xs text-red-400 hover:text-red-600 ml-auto">
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form reply */}
              {replyTo === post.id && (
                <div className="p-4 bg-blue-50 border-t border-blue-100">
                  <textarea
                    value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3}
                    placeholder="Tulis balasanmu..."
                    className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 outline-none resize-none bg-white"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSubmitReply(post.id, post.mapel)}
                      className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition"
                    >
                      Kirim
                    </button>
                    <button
                      onClick={() => { setReplyTo(null); setReplyText('') }}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  )
}
