'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default function BerandaRedirect() {
  const router = useRouter()
  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) { router.replace('/login'); return }
      if (u.role === 'guru') router.replace('/guru')
      else if (u.role === 'admin') router.replace('/admin')
      else router.replace('/siswa')
    })
  }, [router])
  return null
}
