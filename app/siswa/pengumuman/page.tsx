'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Pengumuman } from '@/lib/supabase'
import { ArrowLeft, BookOpen, Inbox, Megaphone, Pin, Target, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface PengumumanWithAuthor extends Pengumuman {
  author?: { nama: string; role: string }
}

const KATEGORI_CONFIG: Record<string, { label: string; icon: LucideIcon; bg: string; text: string; border: string }> = {
  umum:     { label: 'Umum',     icon: Megaphone, bg: 'bg-gray-100',  text: 'text-gray-700',  border: 'border-l-gray-300'  },
  akademik: { label: 'Akademik', icon: BookOpen,  bg: 'bg-blue-100',  text: 'text-blue-700',  border: 'border-l-blue-400'  },
  kegiatan: { label: 'Kegiatan', icon: Target,    bg: 'bg-green-100', text: 'text-green-700', border: 'border-l-green-400' },
  darurat:  { label: 'Darurat',  icon: TriangleAlert, bg: 'bg-red-100', text: 'text-red-700', border: 'border-l-red-500' },
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
          <Megaphone className="mx-auto mb-3 h-8 w-8 animate-pulse text-[#1A4A7A]" />
          <p className="text-gray-500">Memuat pengumuman...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-300" />
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
  const Icon = cfg.icon
  const isLong = item.konten.length > 200

  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${cfg.border} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center text-lg flex-shrink-0`}>
            {item.dipin ? <Pin size={17} /> : <Icon size={17} />}
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
