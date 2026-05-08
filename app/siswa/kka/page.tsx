'use client'
import { ArrowLeft } from 'lucide-react'

import { useRouter } from 'next/navigation'

const MODUL_KKA = [
  { id: '1', judul: 'Apa itu Kecerdasan Artifisial?', emoji: '🤖', deskripsi: 'Kenalan sama AI dan cara kerjanya', level: 'pemula' },
  { id: '2', judul: 'Machine Learning — Mesin yang Belajar', emoji: '🧠', deskripsi: 'Bagaimana komputer bisa belajar sendiri', level: 'pemula' },
  { id: '3', judul: 'AI di Kehidupan Sehari-hari', emoji: '📱', deskripsi: 'AI yang sudah kamu pakai tanpa sadar', level: 'pemula' },
  { id: '4', judul: 'Natural Language Processing', emoji: '💬', deskripsi: 'Bagaimana AI mengerti bahasa manusia', level: 'menengah' },
  { id: '5', judul: 'Computer Vision', emoji: '👁️', deskripsi: 'Bagaimana AI bisa "melihat" gambar', level: 'menengah' },
  { id: '6', judul: 'Etika AI & Masa Depan', emoji: '⚖️', deskripsi: 'Tantangan dan tanggung jawab penggunaan AI', level: 'menengah' },
]

export default function KKAPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Mapel KKA</h1>
          <p className="text-xs text-gray-400">Kecerdasan Artifisial — Kelas 10</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-5 mb-5 text-white">
        <p className="text-3xl mb-2">🤖</p>
        <h2 className="font-bold text-lg mb-1">Dunia AI Menunggumu!</h2>
        <p className="text-sm opacity-80">Pelajari teknologi yang mengubah dunia — dari ChatGPT sampai mobil self-driving</p>
      </div>

      <div className="space-y-3">
        {MODUL_KKA.map((modul, idx) => (
          <div key={modul.id}
            onClick={() => router.push(`/siswa/kka/${modul.id}`)}
            className="bg-white rounded-2xl p-4 border border-gray-100 cursor-pointer active:scale-98 hover:border-purple-200 transition">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-purple-50">
                {modul.emoji}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{modul.judul}</p>
                <p className="text-xs text-gray-400">{modul.deskripsi}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${modul.level === 'pemula' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                {modul.level}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
