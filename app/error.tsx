'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-8xl mb-4">⚓</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h1>
        <p className="text-gray-500 text-sm mb-2">
          Ada yang tidak beres. Coba muat ulang halaman.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono mb-6">ID: {error.digest}</p>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 transition shadow-md"
          >
            🔄 Coba Lagi
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition"
          >
            🏠 Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  )
}
