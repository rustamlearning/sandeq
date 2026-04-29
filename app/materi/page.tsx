'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default function MateriRedirect() {
  const router = useRouter()
  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) { router.replace('/login'); return }
      if (u.role === 'guru') router.replace('/guru/materi')
      else router.replace('/siswa/materi')
    })
  }, [router])
  return null
}
