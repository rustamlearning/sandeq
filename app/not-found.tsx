'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'

export default function NotFound() {
  const router = useRouter()
  const [homePath, setHomePath] = useState('/')

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) setHomePath('/login')
      else if (u.role === 'guru') setHomePath('/guru')
      else if (u.role === 'admin') setHomePath('/admin')
      else setHomePath('/siswa')
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-8xl mb-4">🌊</div>
        <h1 className="text-6xl font-bold text-indigo-700 mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-500 text-sm mb-8">
          Seperti perahu Sandeq yang tersesat di lautan — halaman ini tidak ada.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push(homePath)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-md"
          >
            🏠 Kembali ke Beranda
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition"
          >
            ← Halaman Sebelumnya
          </button>
        </div>
      </div>
    </div>
  )
}
