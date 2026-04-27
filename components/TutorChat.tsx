'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';
import { Block } from '@/lib/blocks';
import { getStarterMessages } from '@/lib/aiTutor';

interface TutorChatProps {
  materi: any;
  blocks: Block[];
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  created_at?: string;
}

export default function TutorChat({ materi, blocks, user, isOpen, onClose }: TutorChatProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      initSession();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, materi?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const initSession = async () => {
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('tutor_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('materi_id', materi.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let sid = existing?.id;

      if (!sid) {
        const { data: newSession, error } = await supabase
          .from('tutor_sessions')
          .insert({ user_id: user.id, materi_id: materi.id })
          .select()
          .single();
        if (error) throw error;
        sid = newSession.id;
      }

      setSessionId(sid);

      const { data: history } = await supabase
        .from('tutor_messages')
        .select('*')
        .eq('session_id', sid)
        .order('created_at', { ascending: true });

      if (history && history.length > 0) {
        setMessages(
          history.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            created_at: m.created_at,
          }))
        );
      } else {
        // Greeting via Llama 4
        await callGroqAndRespond(sid, [], true);
      }
    } catch (e: any) {
      console.error('Init session error:', e);
    } finally {
      setLoading(false);
    }
  };

  const callGroqAndRespond = async (
    sid: string,
    currentMessages: Message[],
    isGreeting = false
  ) => {
    setThinking(true);
    try {
      const messagesToSend = isGreeting
        ? [{ role: 'user', content: `Sapa saya dan perkenalkan diri kamu sebagai Tutor SANDEQ. Materi yang akan kita pelajari: "${materi?.judul}". Berikan sambutan yang hangat dan singkat.` }]
        : currentMessages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSend,
          materi,
          blocks,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.text,
        suggestions: data.suggestions,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      await supabase.from('tutor_messages').insert({
        session_id: sid,
        user_id: user.id,
        role: 'assistant',
        content: data.text,
      });
    } catch (e) {
      const fallback: Message = {
        role: 'assistant',
        content: `Halo! Aku **Tutor SANDEQ** 🤖\n\nAda kendala koneksi sebentar. Coba tanya lagi ya — aku siap bantu kamu belajar **${materi?.judul || 'materi ini'}**!`,
        suggestions: ['Jelaskan materi', 'Kasih contoh', 'Buatkan soal'],
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setThinking(false);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || !sessionId || thinking) return;

    setInput('');
    const userMsg: Message = { role: 'user', content: messageText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    await supabase.from('tutor_messages').insert({
      session_id: sessionId,
      user_id: user.id,
      role: 'user',
      content: messageText,
    });

    await callGroqAndRespond(sessionId, updatedMessages);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearSession = async () => {
    if (!confirm('Hapus semua percakapan?')) return;
    if (!sessionId) return;
    await supabase.from('tutor_messages').delete().eq('session_id', sessionId);
    setMessages([]);
    await callGroqAndRespond(sessionId, [], true);
  };

  if (!isOpen) return null;

  const starters = getStarterMessages(materi);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/30 z-40 transition-opacity" />

      {/* Chat Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
              🤖
            </div>
            <div className="min-w-0">
              <h3 className="font-bold truncate">Tutor SANDEQ</h3>
              <p className="text-xs text-white/80 truncate">
                Llama 4 · {materi?.mapel || 'SANDEQ'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={clearSession}
              className="text-xs text-white/80 hover:text-white px-2 py-1 hover:bg-white/10 rounded"
              title="Hapus riwayat chat"
            >
              🗑
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {loading && (
            <div className="text-center text-gray-500 text-sm py-4">⏳ Memuat percakapan...</div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="tutor-markdown text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}

                {/* Suggestions — hanya di pesan assistant terakhir */}
                {msg.role === 'assistant' &&
                  idx === messages.length - 1 &&
                  msg.suggestions &&
                  msg.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(s)}
                          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-full transition border border-blue-100"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {thinking && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">Llama 4 sedang berpikir...</span>
              </div>
            </div>
          )}

          {/* Starter messages */}
          {!loading && messages.length === 1 && messages[0].role === 'assistant' && (
            <div className="space-y-2 mt-4">
              <p className="text-xs text-gray-500 text-center">💡 Atau pilih pertanyaan cepat:</p>
              <div className="grid grid-cols-1 gap-2">
                {starters.slice(0, 4).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="text-left text-sm bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 px-4 py-2 rounded-lg transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t p-3">
          <div className="flex gap-2 items-end">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tanya apa saja tentang materi ini..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
              disabled={thinking}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || thinking}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition flex-shrink-0"
            >
              ➤
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            🦙 Llama 4 Scout by Meta · Tutor SANDEQ
          </p>
        </div>
      </div>

      <style jsx global>{`
        .tutor-markdown p { margin: 0.4rem 0; }
        .tutor-markdown p:first-child { margin-top: 0; }
        .tutor-markdown p:last-child { margin-bottom: 0; }
        .tutor-markdown strong { font-weight: 600; color: #1f2937; }
        .tutor-markdown ul, .tutor-markdown ol { margin: 0.4rem 0; padding-left: 1.5rem; }
        .tutor-markdown li { margin: 0.2rem 0; }
        .tutor-markdown code { background: #f3f4f6; padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-size: 0.85em; font-family: ui-monospace, monospace; }
        .tutor-markdown h1, .tutor-markdown h2, .tutor-markdown h3 { font-weight: 600; margin: 0.5rem 0 0.3rem 0; }
        .tutor-markdown blockquote { border-left: 3px solid #d1d5db; padding-left: 0.75rem; margin: 0.4rem 0; color: #6b7280; font-style: italic; }
      `}</style>
    </>
  );
}
