'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default function AbsensiRedirect() {
  const router = useRouter()
  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) { router.replace('/login'); return }
      if (u.role === 'guru') router.replace('/guru/absensi')
      else router.replace('/siswa/absensi')
    })
  }, [router])
  return null
}
