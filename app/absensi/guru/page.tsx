'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AbsensiGuruRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/guru/absensi') }, [router])
  return null
}
