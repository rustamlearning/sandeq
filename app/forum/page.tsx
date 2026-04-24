// app/forum/page.tsx
'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuthStore } from '@/lib/store/auth';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { db, ForumPost } from '@/lib/db/schema';
import { MessageSquare, Send, Heart, Award, Plus, X, CloudOff } from 'lucide-react';

export default function ForumPage() {
  const { user } = useAuthStore();
  const isOnline = useOnlineStatus();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMapel, setNewMapel] = useState('Fisika');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const loadPosts = async () => {
    const data = await db.forum.orderBy('createdAt').reverse().toArray();
    setPosts(data);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreate = async () => {
    if (!user || !newTitle.trim() || !newContent.trim()) return;
    const post: ForumPost = {
      id: `f-${Date.now()}`,
      mapel: newMapel,
      judul: newTitle.trim(),
      konten: newContent.trim(),
      authorId: user.id,
      authorNama: user.nama,
      likes: 0,
      createdAt: new Date().toISOString(),
      syncedAt: isOnline ? new Date().toISOString() : undefined,
    };
    await db.forum.put(post);
    if (!isOnline) {
      await db.syncQueue.add({
        type: 'forum',
        action: 'create',
        data: post,
        createdAt: new Date().toISOString(),
      });
    }
    setNewTitle('');
    setNewContent('');
    setShowForm(false);
    loadPosts();
  };

  const handleReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;
    const parent = await db.forum.get(parentId);
    if (!parent) return;
    const reply: ForumPost = {
      id: `f-${Date.now()}`,
      mapel: parent.mapel,
      judul: '',
      konten: replyContent.trim(),
      authorId: user.id,
      authorNama: user.nama,
      parentId,
      likes: 0,
      createdAt: new Date().toISOString(),
      syncedAt: isOnline ? new Date().toISOString() : undefined,
    };
    await db.forum.put(reply);
    if (!isOnline) {
      await db.syncQueue.add({
        type: 'forum',
        action: 'create',
        data: reply,
        createdAt: new Date().toISOString(),
      });
    }
    setReplyContent('');
    setReplyTo(null);
    loadPosts();
  };

  const handleLike = async (id: string) => {
    const post = await db.forum.get(id);
    if (!post) return;
    await db.forum.update(id, { likes: (post.likes || 0) + 1 });
    loadPosts();
  };

  const threads = posts.filter((p) => !p.parentId);
  const replies = (id: string) => posts.filter((p) => p.parentId === id);

  return (
    <AppShell title="Forum Diskusi">
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="md:hidden">
            <h1 className="text-2xl font-bold text-[#1A4A7A]">Forum Diskusi</h1>
            <p className="text-sm text-gray-500">Bertanya & berdiskusi bersama</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="ml-auto bg-[#1A4A7A] hover:bg-[#153c61] text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Batal' : 'Tanya'}
          </button>
        </div>

        {/* Form baru */}
        {showForm && (
          <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
            <h3 className="font-bold text-[#1A4A7A] mb-3">Mulai Diskusi Baru</h3>
            <div className="space-y-3">
              <select
                value={newMapel}
                onChange={(e) => setNewMapel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2E86C1]"
              >
                <option>Fisika</option>
                <option>Matematika</option>
                <option>Sejarah</option>
                <option>Biologi</option>
                <option>Kimia</option>
                <option>Umum</option>
              </select>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Judul pertanyaan..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2E86C1]"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Jelaskan pertanyaanmu..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2E86C1] resize-none"
              />
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || !newContent.trim()}
                className="w-full bg-[#1A4A7A] text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={14} />
                Kirim Pertanyaan
                {!isOnline && <CloudOff size={12} />}
              </button>
            </div>
          </div>
        )}

        {/* Thread */}
        {threads.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
            <MessageSquare className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-gray-500">Belum ada diskusi</p>
            <p className="text-xs text-gray-400 mt-1 italic">Jadilah nakhoda pertama yang bertanya!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((t) => {
              const r = replies(t.id);
              return (
                <div key={t.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#F4F9FF] text-[#2E86C1] rounded-full">
                        {t.mapel}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(t.createdAt).toLocaleDateString('id-ID')}
                      </span>
                      {!t.syncedAt && (
                        <CloudOff size={12} className="text-orange-400" />
                      )}
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">{t.judul}</h3>
                    <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{t.konten}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Oleh: <span className="font-medium text-gray-700">{t.authorNama}</span></span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLike(t.id)}
                          className="flex items-center gap-1 text-gray-500 hover:text-red-500"
                        >
                          <Heart size={14} /> {t.likes}
                        </button>
                        <button
                          onClick={() => setReplyTo(replyTo === t.id ? null : t.id)}
                          className="flex items-center gap-1 text-gray-500 hover:text-[#1A4A7A]"
                        >
                          <MessageSquare size={14} /> {r.length}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {r.length > 0 && (
                    <div className="bg-[#F4F9FF] p-3 space-y-2">
                      {r.map((reply) => (
                        <div key={reply.id} className="bg-white rounded-lg p-3 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-xs text-[#1A4A7A]">
                              {reply.authorNama}
                            </span>
                            {reply.isJawabanTerbaik && (
                              <span className="flex items-center gap-0.5 text-[10px] text-[#27AE60] font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                                <Award size={10} /> Jawaban Terbaik
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 ml-auto">
                              {new Date(reply.createdAt).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          <p className="text-gray-700 text-xs whitespace-pre-wrap">{reply.konten}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply form */}
                  {replyTo === t.id && (
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Tulis balasanmu..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2E86C1] resize-none"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleReply(t.id)}
                          disabled={!replyContent.trim()}
                          className="flex-1 bg-[#1A4A7A] text-white text-sm py-2 rounded-lg font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <Send size={12} /> Kirim
                        </button>
                        <button
                          onClick={() => { setReplyTo(null); setReplyContent(''); }}
                          className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}