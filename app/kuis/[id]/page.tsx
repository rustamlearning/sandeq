'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function KuisDetailRedirect() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  useEffect(() => {
    if (id) router.replace(`/siswa/kuis/${id}`)
    else router.replace('/siswa/kuis')
  }, [router, id])
  return null
}
