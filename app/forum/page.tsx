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

  // Form pertanyaan baru
  const [judul, setJudul] = useState('')
  const [konten, setKonten] = useState('')
  const [mapel, setMapel] = useState(MAPEL_LIST[0])
  const [submitting, setSubmitting] = useState(false)

  // Form reply
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u) {
        router.replace('/login')
        return
      }
      setUser(u)
      await load()
      setLoading(false)
    }
    init()
  }, [router])

  async function load() {
    const { data } = await supabase
      .from('forum')
      .select('*')
      .order('created_at', { ascending: false })

    const all = (data || []) as ForumPost[]
    // Group: parent_id null = pertanyaan utama, sisanya = reply
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

    const { error } = await supabase.from('forum').insert({
      mapel,
      judul,
      konten,
      author_id: user.id,
      author_nama: user.nama,
      parent_id: null,
    })

    setSubmitting(false)
    if (error) {
      alert('Gagal: ' + error.message)
      return
    }

    setJudul('')
    setKonten('')
    setMapel(MAPEL_LIST[0])
    setShowForm(false)
    await load()
  }

  async function handleSubmitReply(parentId: string, parentMapel: string) {
    if (!user || !replyText.trim()) return

    const { error } = await supabase.from('forum').insert({
      mapel: parentMapel,
      konten: replyText,
      author_id: user.id,
      author_nama: user.nama,
      parent_id: parentId,
    })

    if (error) {
      alert('Gagal: ' + error.message)
      return
    }

    setReplyText('')
    setReplyTo(null)
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus post ini? Semua balasan ikut terhapus.')) return
    // Hapus replies dulu
    await supabase.from('forum').delete().eq('parent_id', id)
    await supabase.from('forum').delete().eq('id', id)
    await load()
  }

  async function toggleLike(post: ForumPost) {
    await supabase.from('forum').update({ likes: post.likes + 1 }).eq('id', post.id)
    await load()
  }

  async function tandaiJawabanTerbaik(replyId: string, parentId: string) {
    // Reset semua reply lain ke false
    await supabase.from('forum').update({ is_jawaban_terbaik: false }).eq('parent_id', parentId)
    // Set yang ini ke true
    await supabase.from('forum').update({ is_jawaban_terbaik: true }).eq('id', replyId)
    await load()
  }

  function backToHome() {
    if (user?.role === 'guru') router.push('/guru')
    else if (user?.role === 'admin') router.push('/admin')
    else router.push('/siswa')
  }

  const filtered = filterMapel === 'Semua' ? posts : posts.filter((p) => p.mapel === filterMapel)

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={backToHome} className="text-gray-500 hover:text-gray-700">
              ← Kembali
            </button>
            <h1 className="text-xl font-bold text-gray-800">Forum Diskusi</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'Tutup' : '+ Tanya'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {showForm && (
          <form onSubmit={handleSubmitPertanyaan} className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Buat Pertanyaan Baru</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                <select
                  value={mapel}
                  onChange={(e) => setMapel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MAPEL_LIST.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  required
                  placeholder="Contoh: Bagaimana cara menyelesaikan persamaan kuadrat?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan</label>
                <textarea
                  value={konten}
                  onChange={(e) => setKonten(e.target.value)}
                  required
                  rows={5}
                  placeholder="Jelaskan pertanyaan kamu dengan detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {submitting ? 'Mengirim...' : 'Kirim Pertanyaan'}
            </button>
          </form>
        )}

        {/* Filter mapel */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['Semua', ...MAPEL_LIST].map((m) => (
            <button
              key={m}
              onClick={() => setFilterMapel(m)}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition ${
                filterMapel === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-500">Belum ada pertanyaan. Jadilah yang pertama!</p>
            </div>
          ) : (
            filtered.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Pertanyaan */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {post.mapel}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>
                  {post.judul && (
                    <h4 className="font-semibold text-gray-800 mb-2">{post.judul}</h4>
                  )}
                  <p className="text-gray-700 whitespace-pre-wrap mb-3">{post.konten}</p>
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-500">— {post.author_nama}</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleLike(post)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        👍 {post.likes}
                      </button>
                      <button
                        onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        💬 Balas ({post.replies?.length || 0})
                      </button>
                      {(user?.id === post.author_id || user?.role === 'admin' || user?.role === 'guru') && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {post.replies && post.replies.length > 0 && (
                  <div className="bg-gray-50 border-t divide-y divide-gray-100">
                    {post.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-4 pl-8 ${reply.is_jawaban_terbaik ? 'bg-green-50' : ''}`}
                      >
                        {reply.is_jawaban_terbaik && (
                          <span className="text-xs font-medium text-green-700 mb-1 inline-block">
                            ✓ Jawaban Terbaik
                          </span>
                        )}
                        <p className="text-gray-700 whitespace-pre-wrap text-sm mb-2">{reply.konten}</p>
                        <div className="flex items-center justify-between text-xs">
                          <p className="text-gray-500">— {reply.author_nama}</p>
                          <div className="flex items-center gap-3">
                            {user?.id === post.author_id && !reply.is_jawaban_terbaik && (
                              <button
                                onClick={() => tandaiJawabanTerbaik(reply.id, post.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                Tandai Terbaik
                              </button>
                            )}
                            {(user?.id === reply.author_id || user?.role === 'admin' || user?.role === 'guru') && (
                              <button
                                onClick={() => handleDelete(reply.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form reply */}
                {replyTo === post.id && (
                  <div className="p-4 bg-gray-50 border-t">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder="Tulis balasan kamu..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleSubmitReply(post.id, post.mapel)}
                        className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Kirim
                      </button>
                      <button
                        onClick={() => {
                          setReplyTo(null)
                          setReplyText('')
                        }}
                        className="px-4 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}