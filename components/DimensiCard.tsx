'use client'

import { useEffect, useState } from 'react'
import { getDimensiSummary, DIMENSI, DimensiKey } from '@/lib/dimensi'

export default function DimensiCard({ userId }: { userId: string }) {
  const [counts, setCounts] = useState<Record<DimensiKey, number> | null>(null)

  useEffect(() => {
    getDimensiSummary(userId).then(setCounts)
  }, [userId])

  if (!counts) return null

  const total = Math.max(Object.values(counts).reduce((a, b) => a + b, 0), 1)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-700 mb-4">Profil Dimensi Belajar</h3>
      <div className="space-y-3">
        {(Object.keys(DIMENSI) as DimensiKey[]).map(key => {
          const d = DIMENSI[key]
          const pct = Math.round((counts[key] / total) * 100)
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span>{d.emoji} {d.label}</span>
                <span className="text-gray-400">{counts[key]}x</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-400 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
