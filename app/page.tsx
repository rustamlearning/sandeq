'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import {
  BookOpen, Brain, Trophy, Users, Zap, Globe, Code2,
  ChevronRight, GraduationCap, BarChart3, MessageSquare, Star
} from 'lucide-react'

const FEATURES = [
  { icon: BookOpen,    title: 'Materi Interaktif',   desc: 'Modul HTML interaktif, video, dan teks terstruktur per mata pelajaran.',  color: 'bg-blue-50 text-blue-600' },
  { icon: Brain,       title: 'AI Tutor',             desc: 'Kak Sandi siap membantu belajar 24 jam dengan konteks mata pelajaran.',   color: 'bg-purple-50 text-purple-600' },
  { icon: Trophy,      title: 'Gamifikasi',           desc: 'Kumpulkan XP, naik level, raih badge, dan bersaing di leaderboard.',      color: 'bg-amber-50 text-amber-600' },
  { icon: BarChart3,   title: 'Analytics Pro',        desc: 'Guru memantau perkembangan siswa secara real-time dengan deteksi at-risk.',color: 'bg-green-50 text-green-600' },
  { icon: MessageSquare,title: 'Live Quiz',           desc: 'Kuis interaktif real-time ala Kahoot — seru dan kompetitif.',             color: 'bg-rose-50 text-rose-600' },
  { icon: Code2,       title: 'Mapel Koding & KKA',   desc: 'Python sandbox dan 6 modul Kecerdasan Artifisial eksklusif.',            color: 'bg-cyan-50 text-cyan-600' },
  { icon: Globe,       title: 'Muatan Lokal Pangkep', desc: 'Konten budaya, alam, dan ekonomi Pangkajene dan Kepulauan.',             color: 'bg-teal-50 text-teal-600' },
  { icon: GraduationCap,title: 'Portfolio Digital',  desc: 'Siswa mendokumentasikan karya dan prestasi dalam portfolio pribadi.',     color: 'bg-indigo-50 text-indigo-600' },
]

const STATS = [
  { value: '8', label: 'Dimensi Profil Lulusan' },
  { value: '12+', label: 'Sprint Fitur' },
  { value: '∞', label: 'Semangat Belajar' },
]

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser()
      if (user) {
        if (user.role === 'admin') router.replace('/admin')
        else if (user.role === 'guru') router.replace('/guru')
        else router.replace('/siswa')
      } else {
        setChecking(false)
      }
    }
    checkAuth()
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Zap size={24} className="text-white" />
          </div>
          <p className="text-gray-400 text-sm">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">SANDEQ</span>
          </div>
          <Link href="/login"
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            Masuk <ChevronRight size={15} />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-100 to-transparent rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border border-blue-100">
            <Star size={12} className="fill-blue-500 text-blue-500" />
            SMAN 6 Pangkajene dan Kepulauan
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-5 leading-tight">
            Belajar Lebih Cerdas<br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Bersama SANDEQ
            </span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Platform pembelajaran digital untuk siswa dan guru SMAN 6 Pangkep —
            lengkap dengan AI Tutor, gamifikasi, live quiz, dan konten muatan lokal Pangkajene.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200 hover:shadow-blue-300">
              Mulai Belajar <ChevronRight size={18} />
            </Link>
            <a href="#fitur"
              className="flex items-center gap-2 text-gray-600 px-6 py-3.5 rounded-2xl font-medium hover:bg-gray-50 transition border border-gray-200">
              Lihat Fitur
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12 pt-10 border-t border-gray-100">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="fitur" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Fitur Unggulan</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Dirancang khusus untuk kebutuhan pembelajaran di SMAN 6 Pangkep,
            dari kelas hingga olimpiade.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(f => (
            <div key={f.title}
              className="p-5 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all group bg-white">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1 text-sm">{f.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 mx-4 mb-16 rounded-3xl p-10 text-center text-white max-w-4xl lg:mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Siap Layarkan Ilmumu?</h2>
        <p className="text-blue-100 mb-6 text-sm">Masuk sekarang dan mulai perjalanan belajarmu bersama SANDEQ.</p>
        <Link href="/login"
          className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-2xl font-semibold hover:bg-blue-50 transition shadow-lg">
          Masuk ke SANDEQ <ChevronRight size={18} />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © 2026 SANDEQ · SMAN 6 Pangkajene dan Kepulauan · Layarkan Ilmumu 🌊
      </footer>
    </div>
  )
}
