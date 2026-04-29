'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function MateriDetailRedirect() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  useEffect(() => {
    router.replace('/siswa/materi')
  }, [router, id])
  return null
}
