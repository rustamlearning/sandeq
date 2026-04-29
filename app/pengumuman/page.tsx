'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default function PengumumanRedirect() {
  const router = useRouter()
  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) { router.replace('/login'); return }
      if (u.role === 'guru') router.replace('/guru/pengumuman')
      else if (u.role === 'admin') router.replace('/admin/pengumuman')
      else router.replace('/siswa/pengumuman')
    })
  }, [router])
  return null
}
