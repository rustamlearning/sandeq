'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser()

      if (!user) {
        router.replace('/login')
        return
      }

      if (user.role === 'admin') {
        router.replace('/admin')
      } else if (user.role === 'guru') {
        router.replace('/guru')
      } else {
        router.replace('/siswa')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">SANDEQ</h1>
        <p className="text-gray-500 mt-2">Memuat...</p>
      </div>
    </div>
  )
}