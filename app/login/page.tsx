'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [nisNip, setNisNip] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(nisNip, password)

      if (user.role === 'admin') {
        router.replace('/admin')
      } else if (user.role === 'guru') {
        router.replace('/guru')
      } else {
        router.replace('/siswa')
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa username dan password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero kiri */}
      <div className="md:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
        <div className="relative z-10">
          {/* Ilustrasi perahu Sandeq */}
          <svg
            viewBox="0 0 200 200"
            className="w-32 h-32 md:w-40 md:h-40 mb-6"
            fill="none"
          >
            <line x1="100" y1="20" x2="100" y2="140" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" />
            <path d="M 100 30 L 100 130 L 160 130 Z" fill="rgba(255,255,255,0.95)" />
            <path d="M 100 30 L 100 130 L 50 130 Z" fill="rgba(255,255,255,0.70)" />
            <path d="M 30 145 Q 100 165 170 145 L 155 160 Q 100 175 45 160 Z" fill="rgba(255,255,255,0.95)" />
            <line x1="55" y1="158" x2="55" y2="168" stroke="rgba(255,255,255,0.88)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="70" y1="162" x2="70" y2="170" stroke="rgba(255,255,255,0.88)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="30" y1="169" x2="88" y2="169" stroke="rgba(255,255,255,0.90)" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="130" y1="162" x2="130" y2="170" stroke="rgba(255,255,255,0.88)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="145" y1="158" x2="145" y2="168" stroke="rgba(255,255,255,0.88)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="112" y1="169" x2="170" y2="169" stroke="rgba(255,255,255,0.90)" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 0 180 Q 50 175 100 180 T 200 180" stroke="rgba(255,255,255,0.40)" strokeWidth="2" fill="none" />
            <path d="M 0 190 Q 50 185 100 190 T 200 190" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" />
          </svg>

          <h1 className="text-5xl md:text-6xl font-bold mb-3">SANDEQ</h1>
          <p className="text-xl md:text-2xl italic font-light mb-8 opacity-95">
            Layarkan Ilmumu
          </p>

          <p className="text-base md:text-lg leading-relaxed opacity-90 max-w-md">
            Aplikasi belajar digital SMA Negeri 6 Pangkajene dan Kepulauan.
            Seperti perahu Sandeq yang tak pernah gentar menghadapi ombak,
            mari terus melaju meraih ilmu tanpa batas jarak dan sinyal.
          </p>
        </div>

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      {/* Form login kanan */}
      <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Masuk</h2>
          <p className="text-gray-500 mb-8">Silakan masuk dengan username Anda</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                value={nisNip}
                onChange={(e) => setNisNip(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Masukkan username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-medium transition disabled:bg-blue-400 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Memuat...'
              ) : (
                <>
                  <span>→</span>
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} SMA Negeri 6 Pangkajene dan Kepulauan
          </p>
        </div>
      </div>
    </div>
  )
}