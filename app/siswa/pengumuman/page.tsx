'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Pengumuman } from '@/lib/supabase'

interface PengumumanWithAuthor extends Pengumuman {
  author?: { nama: string; role: string }
}

const KATEGORI_CONFIG: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  umum:     { label: 'Umum',     icon: '📢', bg: 'bg-gray-100',  text: 'text-gray-700',  border: 'border-l-gray-300'  },
  akademik: { label: 'Akademik', icon: '📚', bg: 'bg-blue-100',  text: 'text-blue-700',  border: 'border-l-blue-400'  },
  kegiatan: { label: 'Kegiatan', icon: '🎯', bg: 'bg-green-100', text: 'text-green-700', border: 'border-l-green-400' },
  darurat:  { label: 'Darurat',  icon: '🚨', bg: 'bg-red-100',   text: 'text-red-700',   border: 'border-l-red-500'   },
}

export default function PengumumanSiswaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<PengumumanWithAuthor[]>([])
  const [filterKategori, setFilterKategori] = useState('')

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'siswa') { router.replace('/login'); return }
      const { data } = await supabase.from('pengumuman').select('*, author:created_by(nama, role)')
        .order('dipin', { ascending: false }).order('created_at', { ascending: false })
      setList((data as PengumumanWithAuthor[]) || [])
      setLoading(false)
    }
    init()
  }, [router])

  const filtered = filterKategori ? list.filter((p) => p.kategori === filterKategori) : list
  const pinned = filtered.filter((p) => p.dipin)
  const regular = filtered.filter((p) => !p.dipin)

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
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-gradient-to-r from-[#1A4A7A] to-[#2E86C1] shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          <button
            onClick={() => router.push('/siswa')}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Pengumuman</h1>
            <p className="text-white/80 text-sm">{list.length} pengumuman</p>
          </div>
        </div>

        {/* Filter kategori */}
        {list.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFilterKategori('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterKategori === '' ? 'bg-white text-rose-600' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Semua ({list.length})
              </button>
              {Object.entries(KATEGORI_CONFIG).map(([key, cfg]) => {
                const count = list.filter((p) => p.kategori === key).length
                if (count === 0) return null
                return (
                  <button
                    key={key}
                    onClick={() => setFilterKategori(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      filterKategori === key ? 'bg-white text-rose-600' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {cfg.icon} {cfg.label} ({count})
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-semibold text-gray-700">Belum ada pengumuman</p>
            <p className="text-sm text-gray-400 mt-1">Pengumuman dari sekolah akan muncul di sini</p>
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinned.length > 0 && (
              <div className="space-y-3">
                {pinned.map((p) => <PengumumanCard key={p.id} item={p} />)}
              </div>
            )}

            {/* Regular */}
            {regular.length > 0 && (
              <>
                {pinned.length > 0 && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Lainnya</p>
                )}
                <div className="space-y-3">
                  {regular.map((p) => <PengumumanCard key={p.id} item={p} />)}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function PengumumanCard({ item }: { item: PengumumanWithAuthor }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = KATEGORI_CONFIG[item.kategori] || KATEGORI_CONFIG.umum
  const isLong = item.konten.length > 200

  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${cfg.border} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center text-lg flex-shrink-0`}>
            {item.dipin ? '📌' : cfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {item.dipin && <span className="text-xs font-bold text-rose-500">Dipin</span>}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                {cfg.label}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h4 className="font-bold text-gray-800 mb-2">{item.judul}</h4>
            <p className={`text-sm text-gray-600 whitespace-pre-wrap leading-relaxed ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
              {item.konten}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-rose-500 hover:underline mt-1"
              >
                {expanded ? 'Tampilkan lebih sedikit' : 'Baca selengkapnya'}
              </button>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Oleh {item.author?.nama || 'Sekolah'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
