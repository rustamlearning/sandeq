'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'

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
    <main className="min-h-dvh bg-[#eef2ff] text-slate-900">
      <div className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex min-h-[21rem] overflow-hidden bg-[#0f172a] px-6 py-7 text-white sm:min-h-[34rem] sm:px-10 sm:py-8 lg:min-h-dvh lg:px-14 lg:py-10">
          <div className="absolute inset-0 opacity-35">
            <svg viewBox="0 0 900 700" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
              <path d="M-70 520 C130 420 240 610 440 510 C640 410 720 540 970 430" stroke="#f3b45a" strokeWidth="2" fill="none" opacity="0.75" />
              <path d="M-110 580 C130 470 260 650 490 545 C700 450 790 585 980 500" stroke="#d8edf7" strokeWidth="1.5" fill="none" opacity="0.55" />
              <path d="M-60 650 C150 545 330 700 560 595 C710 525 830 635 1000 575" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.35" />
            </svg>
          </div>

          <div className="relative z-10 flex w-full max-w-2xl flex-col justify-between">
            <div className="inline-flex w-fit items-center gap-3 border-l-2 border-[#f0b45b] pl-4 text-sm font-medium text-blue-50">
              SMA Negeri 6 Pangkajene dan Kepulauan
            </div>

            <div className="py-6 sm:py-12 lg:py-0">
              <svg
                viewBox="0 0 200 200"
                className="mb-5 h-20 w-20 text-white sm:mb-8 sm:h-32 sm:w-32 lg:h-40 lg:w-40"
                fill="none"
                aria-label="Ilustrasi perahu Sandeq"
              >
                <line x1="100" y1="20" x2="100" y2="140" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M 100 30 L 100 130 L 160 130 Z" fill="currentColor" />
                <path d="M 100 30 L 100 130 L 50 130 Z" fill="currentColor" opacity="0.72" />
                <path d="M 30 145 Q 100 165 170 145 L 155 160 Q 100 175 45 160 Z" fill="currentColor" />
                <line x1="55" y1="158" x2="55" y2="168" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.86" />
                <line x1="70" y1="162" x2="70" y2="170" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.86" />
                <line x1="30" y1="169" x2="88" y2="169" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
                <line x1="130" y1="162" x2="130" y2="170" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.86" />
                <line x1="145" y1="158" x2="145" y2="168" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.86" />
                <line x1="112" y1="169" x2="170" y2="169" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
                <path d="M 0 180 Q 50 175 100 180 T 200 180" stroke="#f0b45b" strokeWidth="2" fill="none" opacity="0.72" />
                <path d="M 0 190 Q 50 185 100 190 T 200 190" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.28" />
              </svg>

              <h1 className="max-w-xl text-balance text-4xl font-semibold leading-[0.95] sm:text-6xl lg:text-7xl">
                SANDEQ
              </h1>
              <p className="mt-3 text-xl font-medium italic text-[#f7c87d] sm:mt-4 sm:text-3xl">
                Layarkan Ilmumu
              </p>

              <p className="mt-6 hidden max-w-md text-pretty text-sm leading-7 text-blue-50/88 sm:mt-8 sm:block sm:text-lg sm:leading-8">
                Aplikasi belajar digital untuk sekolah kepulauan, dirancang agar belajar tetap bergerak meski jarak dan sinyal berubah-ubah.
              </p>
            </div>

            <p className="hidden max-w-sm text-sm leading-6 text-blue-50/70 sm:block">
              Sinkron saat terhubung. Tetap rapi saat digunakan harian oleh siswa, guru, dan admin.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[27rem] rounded-lg border border-white/80 bg-white/92 p-6 shadow-[0_24px_70px_rgba(79,70,229,0.10)] backdrop-blur sm:p-8">
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold text-[#4338ca]">Akses akun</p>
              <h2 className="text-3xl font-semibold tracking-[-0.01em] text-slate-950">Masuk</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Gunakan username sekolah untuk melanjutkan ke ruang belajar.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Username
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  value={nisNip}
                  onChange={(e) => setNisNip(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#4f46e5] focus:ring-4 focus:ring-[#4f46e5]/14"
                  placeholder="Masukkan username"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#4f46e5] focus:ring-4 focus:ring-[#4f46e5]/14"
                    placeholder="Masukkan password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition duration-200 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/14"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#4338ca] px-4 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(79,70,229,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#3730a3] active:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#c7d2fe] disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memeriksa akun</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              © {new Date().getFullYear()} SMA Negeri 6 Pangkajene dan Kepulauan
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
