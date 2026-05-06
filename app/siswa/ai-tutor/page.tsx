'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
  suggestions?: string[]
}

const QUICK_STARTERS = [
  'Bantu saya memahami konsep yang sulit',
  'Jelaskan dengan analogi sederhana',
  'Berikan contoh soal dan pembahasannya',
  'Apa bedanya ... dan ...?',
  'Bagaimana cara menghafal rumus?',
  'Tips belajar efektif untuk ujian',
]

export default function AITutorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [greeted, setGreeted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u || u.role !== 'siswa') { router.replace('/login'); return }
      setUser(u)
    })
  }, [router])

  useEffect(() => {
    if (user && !greeted) {
      setGreeted(true)
      sendToAPI([{ role: 'user', content: `Sapa saya (nama: ${user.nama}) dan perkenalkan diri kamu sebagai Tutor SANDEQ. Beritahu bahwa kamu bisa membantu belajar mata pelajaran apapun. Berikan sambutan hangat dan singkat.` }], true)
    }
  }, [user, greeted])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function sendToAPI(msgs: { role: string; content: string }[], isGreeting = false) {
    setThinking(true)
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, materi: null, blocks: [], userId: user?.id }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const msg: Message = { role: 'assistant', content: data.text, suggestions: data.suggestions }
      if (!isGreeting) {
        setMessages((prev) => [...prev, msg])
      } else {
        setMessages([msg])
      }
    } catch {
      const fallback: Message = {
        role: 'assistant',
        content: `Halo **${user?.nama?.split(' ')[0] || 'kamu'}**! 👋\n\nAku **Tutor SANDEQ** — siap bantu kamu belajar apapun! Ada koneksi sebentar, coba tanya ya.`,
        suggestions: QUICK_STARTERS.slice(0, 3),
      }
      setMessages((prev) => isGreeting ? [fallback] : [...prev, fallback])
    } finally {
      setThinking(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function handleSend(text?: string) {
    const q = (text ?? input).trim()
    if (!q || thinking) return
    setInput('')

    const userMsg: Message = { role: 'user', content: q }
    const updated = [...messages, userMsg]
    setMessages(updated)

    await sendToAPI(updated.map((m) => ({ role: m.role, content: m.content })))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🤖</div>
          <p className="text-gray-500">Memuat tutor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/siswa')}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
          >
            ←
          </button>
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white leading-tight">Tutor SANDEQ</h1>
            <p className="text-white/70 text-xs">AI · Siap bantu belajar 24/7</p>
          </div>
          {messages.length > 1 && (
            <button
              onClick={() => { setMessages([]); setGreeted(false) }}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs transition"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto max-w-2xl w-full mx-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !thinking && (
          <div className="mt-8 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <p className="text-gray-500 text-sm">Tutor sedang bersiap...</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-lg flex-shrink-0 mt-0.5">
                🤖
              </div>
            )}
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-sm'
                  : 'bg-white shadow-sm border border-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>

              {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {msg.suggestions.map((s, si) => (
                    <button
                      key={si}
                      onClick={() => handleSend(s)}
                      disabled={thinking}
                      className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs rounded-full hover:bg-purple-100 transition disabled:opacity-40"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-lg flex-shrink-0">🤖</div>
            <div className="bg-white shadow-sm border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Quick starters — only shown before first user message */}
      {messages.filter((m) => m.role === 'user').length === 0 && !thinking && (
        <div className="max-w-2xl w-full mx-auto px-4 pb-2">
          <p className="text-xs text-gray-400 mb-2 text-center">Atau coba salah satu pertanyaan ini:</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="px-3 py-2 bg-white border border-gray-200 text-gray-600 text-xs rounded-xl whitespace-nowrap hover:border-purple-300 hover:text-purple-600 transition shadow-sm flex-shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 max-w-2xl w-full mx-auto px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya apa saja... (Enter untuk kirim)"
            rows={1}
            disabled={thinking}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none disabled:bg-gray-50 max-h-32 overflow-y-auto"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || thinking}
            className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            ↑
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">Shift+Enter untuk baris baru</p>
      </div>
    </div>
  )
}
