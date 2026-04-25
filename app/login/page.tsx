// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import SandeqLogo from '@/components/SandeqLogo';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [nisNip, setNisNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/beranda');
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(nisNip.trim(), password);
    setLoading(false);
    if (result.success) {
      router.replace('/beranda');
    } else {
      setError(result.message);
    }
  };


  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left branding */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#1A4A7A] via-[#2E86C1] to-[#1A4A7A] text-white p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <path
              d="M 0 300 Q 100 280 200 300 T 400 300 L 400 400 L 0 400 Z"
              fill="white"
            />
            <path
              d="M 0 340 Q 100 320 200 340 T 400 340 L 400 400 L 0 400 Z"
              fill="white"
              opacity="0.5"
            />
          </svg>
        </div>
        <div className="relative z-10 max-w-md mx-auto md:mx-0">
          <SandeqLogo className="w-20 h-20 md:w-24 md:h-24 mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-2">SANDEQ</h1>
          <p className="text-lg md:text-xl italic mb-6 opacity-90">Layarkan Ilmumu</p>
          <p className="text-sm md:text-base opacity-80 leading-relaxed mb-6">
            Aplikasi belajar digital SMA Negeri 6 Pangkajene dan Kepulauan.
            Seperti perahu Sandeq yang tak pernah gentar menghadapi ombak,
            mari terus melaju meraih ilmu tanpa batas jarak dan sinyal.
          </p>
          <div className="flex items-center gap-2 text-xs opacity-75">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Bekerja offline — sinkronisasi otomatis saat online
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#F4F9FF]">
        <div className="w-full max-w-md">
          <div className="md:hidden flex flex-col items-center mb-6">
            <SandeqLogo className="w-16 h-16 mb-2" />
            <h1 className="text-2xl font-bold text-[#1A4A7A]">SANDEQ</h1>
            <p className="text-sm text-gray-500 italic">Layarkan Ilmumu</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#1A4A7A] mb-1">Masuk</h2>
            <p className="text-sm text-gray-500 mb-6">Silakan masuk dengan NIS/NIP Anda</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  NIS / NIP
                </label>
                <input
                  type="text"
                  value={nisNip}
                  onChange={(e) => setNisNip(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent outline-none transition"
                  placeholder="Masukkan NIS atau NIP"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent outline-none transition"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                  {error}
                </div>
              )}

                className="w-full bg-[#1A4A7A] hover:bg-[#153c61] text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  'Memuat...'
                ) : (
                  <>
                    <LogIn size={18} />
                    Masuk
                  </>
                )}
              </button>
            </form>

          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            © 2025 SMA Negeri 6 Pangkajene dan Kepulauan
          </p>
        </div>
      </div>
    </div>
  );
}